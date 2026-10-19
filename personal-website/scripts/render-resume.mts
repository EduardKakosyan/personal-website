// profile.ts (facts) + resume/content.ts (copy) + resume/template.tex → resume/resume.tex.
// With --pdf it also runs latexmk, copies the PDF into public/ and records the sha256 of the
// .tex it was built from in resume/resume.sha, so CI can tell when the PDF is stale.
//
//   pnpm resume                                    (= node scripts/render-resume.mts --pdf)
//   node scripts/render-resume.mts                 (resume.tex only; no TeX needed)
//
// TeX: TinyTeX lives outside PATH on this machine, so run with
//   PATH=$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH pnpm resume
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { profile, resumePdfPath } from '../src/content/profile.ts'
import type { Profile, Role } from '../src/content/profile.ts'
import { resumeContent } from '../resume/content.ts'
import type { ResumeContent, ResumeProject, ResumeRole } from '../resume/content.ts'
import { findHiddenTerms, localHiddenTerms } from './lib/hidden-terms.mts'
import { tex, texCopy, texUrl } from './lib/tex.mts'

const root = fileURLToPath(new URL('..', import.meta.url))

export const resumePaths = {
  template: join(root, 'resume/template.tex'),
  tex: join(root, 'resume/resume.tex'),
  sha: join(root, 'resume/resume.sha'),
  pdf: join(root, 'public', resumePdfPath),
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const month = (yearMonth: string) => {
  const [year, monthNumber] = yearMonth.split('-')
  return `${months[Number(monthNumber) - 1]} ${year}`
}

/** 'https://www.linkedin.com/in/x' → 'linkedin.com/in/x' */
const displayUrl = (url: string) => url.replace(/^https:\/\//, '').replace(/^www\./, '')

const link = (href: string, text: string) => `\\href{${texUrl(href)}}{\\underline{${tex(text)}}}`

function itemList(items: string[], indent: string, data: Profile): string {
  const metrics = data.metrics
  return [
    `${indent}\\resumeItemListStart`,
    ...items.map((item) => `${indent}  \\resumeItem{${texCopy(item, metrics, 'resume')}}`),
    `${indent}\\resumeItemListEnd`,
  ].join('\n')
}

function header(data: Profile): string {
  const { identity } = data
  const links = [
    link(`mailto:${identity.email}`, identity.email),
    link(identity.website, displayUrl(identity.website)),
    link(identity.linkedin, displayUrl(identity.linkedin)),
    link(identity.github, displayUrl(identity.github)),
  ].join(' $|$\n    ')
  return [
    `\\hypersetup{pdftitle={${tex(identity.name)}: R\\'esum\\'e}, pdfauthor={${tex(identity.name)}}}`,
    '\\begin{center}',
    `    \\textbf{\\Huge \\scshape ${tex(identity.name)}} \\\\ \\vspace{1pt}`,
    `    \\small ${tex(`${identity.location}, ${identity.country} · ${identity.citizenship}`)} \\\\`,
    `    \\small ${links}`,
    '\\end{center}',
  ].join('\n')
}

function role(copy: ResumeRole, data: Profile): string {
  const facts: Role | undefined = data.roles.find((candidate) => candidate.id === copy.roleId)
  if (!facts) throw new Error(`resume/content.ts names an unknown role "${copy.roleId}"`)
  if (!copy.bullets?.length && !copy.groups?.length) {
    throw new Error(`Role "${copy.roleId}" has no résumé bullets`)
  }
  const title = facts.scope
    ? `${tex(facts.title)} \\textmd{(${tex(facts.scope)})}`
    : tex(facts.title)
  const org = facts.orgUrl
    ? `${tex(facts.org)} $|$ \\emph{${link(facts.orgUrl, displayUrl(facts.orgUrl))}}`
    : tex(facts.org)
  const dates = `${month(facts.start)} -- ${facts.end ? month(facts.end) : 'Present'}`
  const lines = [
    `    %--- ${facts.org} ---`,
    '    \\resumeSubheading',
    `      {${title}}{${dates}}`,
    `      {${org}}{${tex(facts.location)}}`,
  ]
  if (copy.bullets?.length) lines.push(itemList(copy.bullets, '      ', data))
  for (const group of copy.groups ?? []) {
    lines.push(`    \\resumeSubSubheading{${texCopy(group.label, data.metrics, 'resume')}}{}`)
    lines.push(itemList(group.bullets, '      ', data))
  }
  return lines.join('\n')
}

function project(copy: ResumeProject, data: Profile): string {
  const award = copy.award ? ` $|$ \\textbf{${tex(copy.award)}}` : ''
  const description = texCopy(copy.description, data.metrics, 'resume')
  return [
    '      \\resumeProjectHeading',
    `        {\\textbf{${tex(copy.name)}} --- ${description}${award}}{${tex(copy.when)}}`,
  ].join('\n')
}

function skills(data: Profile, content: ResumeContent): string {
  const lines = content.skills.map((pick) => {
    const group = data.skills.find((candidate) => candidate.label === pick.label)
    if (!group) throw new Error(`resume/content.ts names an unknown skill group "${pick.label}"`)
    const unknown = pick.items.filter((item) => !group.items.includes(item))
    if (unknown.length) {
      throw new Error(`"${unknown.join('", "')}" is not in profile.ts skills › ${pick.label}`)
    }
    return [pick.label, pick.items.join(', ')]
  })
  if (data.certificates.length) lines.push(['Certificates', data.certificates.join(', ')])
  return lines
    .map(([label, items]) => `    \\textbf{${tex(label)}}{: ${tex(items)}} \\\\`)
    .join('\n')
}

function education(data: Profile): string {
  return data.education
    .map((entry) => {
      const school = entry.gpa ? `${entry.school} | CGPA ${entry.gpa}` : entry.school
      const lines = [
        '    \\resumeSubheading',
        `      {${tex(school)}}{${tex(entry.location)}}`,
        `      {${tex(entry.degree)}}{Graduated ${month(entry.end)}}`,
      ]
      if (entry.awards.length) {
        lines.push(
          '      \\resumeItemListStart',
          `        \\resumeItem{${tex(entry.awards.join(' · '))}}`,
          '      \\resumeItemListEnd',
        )
      }
      return lines.join('\n')
    })
    .join('\n')
}

/** Pure: the same facts, copy and template always produce the same .tex. */
export function renderResume(
  data: Profile = profile,
  content: ResumeContent = resumeContent,
  template: string = readFileSync(resumePaths.template, 'utf8'),
): string {
  const slots: Record<string, string> = {
    header: header(data),
    summary: texCopy(content.summary, data.metrics, 'resume'),
    experience: content.experience.map((copy) => role(copy, data)).join('\n\n'),
    projects: content.projects.map((copy) => project(copy, data)).join('\n\n'),
    skills: skills(data, content),
    education: education(data),
  }
  const filled = template.replace(/«(\w+)»/g, (_, name: string) => {
    const value = slots[name]
    if (value === undefined) throw new Error(`template.tex has an unknown slot «${name}»`)
    return value
  })
  for (const name of Object.keys(slots)) {
    if (!template.includes(`«${name}»`)) throw new Error(`template.tex is missing «${name}»`)
  }
  return filled
}

export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

function buildPdf(texPath: string): void {
  const outdir = mkdtempSync(join(tmpdir(), 'resume-'))
  try {
    execFileSync(
      'latexmk',
      ['-pdf', '-interaction=nonstopmode', '-halt-on-error', `-outdir=${outdir}`, texPath],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    )
    const log = readFileSync(join(outdir, 'resume.log'), 'latin1')
    const pages = /Output written on .*?\((\d+) pages?,/s.exec(log)?.[1]
    if (pages !== '1') throw new Error(`The résumé must be one page; LaTeX wrote ${pages ?? '?'}`)
    // Headings are tabulars that never wrap, so a long line runs into the date column.
    const overfull = [...log.matchAll(/Overfull \\hbox \(([\d.]+)pt too wide\)/g)]
      .map((match) => Number(match[1]))
      .filter((points) => points > 1)
    if (overfull.length) {
      throw new Error(
        `A line is too wide by ${Math.max(...overfull)}pt; shorten it (see the LaTeX log)`,
      )
    }
    copyFileSync(join(outdir, 'resume.pdf'), resumePaths.pdf)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        'latexmk was not found. Put TinyTeX on PATH, e.g.\n' +
          '  PATH=$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH pnpm resume',
      )
    }
    throw error
  } finally {
    rmSync(outdir, { recursive: true, force: true })
  }
}

function main(args: string[]): void {
  const source = renderResume()
  const leaks = findHiddenTerms(source, [...profile.hidden, ...localHiddenTerms()])
  if (leaks.length) throw new Error(`resume.tex would contain hidden terms: ${leaks.join(', ')}`)
  writeFileSync(resumePaths.tex, source)
  console.log(`wrote ${resumePaths.tex}`)
  if (!args.includes('--pdf')) {
    console.log('skipped the PDF (pass --pdf); resume.sha now marks the PDF as stale')
    return
  }
  buildPdf(resumePaths.tex)
  writeFileSync(resumePaths.sha, `${sha256(source)}  resume.tex\n`)
  console.log(`wrote ${resumePaths.pdf}`)
  console.log(`wrote ${resumePaths.sha}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
