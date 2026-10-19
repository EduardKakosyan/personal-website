# Personal website

## What

My portfolio site: engineering case studies, a web resume and an on-demand project guide.

## Why

The resume makes the claim, the site explains the decisions, and GitHub exposes the code. Shared facts keep those surfaces consistent without repeating the same copy.

## Demo

[Visit the site](https://kakosyaneduard.ca). The public deployment may lag this branch.

## Run it

The Next.js app is in the nested `personal-website/` directory. Use Node 24 (the CI version) and pnpm. Run these commands from that app directory:

```sh
pnpm install
pnpm dev
```

Open localhost:3000. On the maintainer's Mac, prefix commands with `PATH=/opt/homebrew/bin:$PATH` if the nvm shim is broken. No model download is required to browse the site.

## How it's tested

```sh
pnpm test
pnpm lint
pnpm type-check
pnpm build
```

Node tests cover shared facts, artifact freshness, project links, guide actions and route import weight. Hidden-term guards read a gitignored local list or `HIDDEN_TERMS`; client identities never belong in tracked fixtures. Browser, accessibility and voice review remain separate manual checks.

## How it works

Next.js App Router renders case studies from a typed registry and sanitized Markdown. React, Tailwind tokens and OS dark mode provide the shared shell. The guide loads on demand; browser-model inference requires a separate opt-in. The existing homepage retains its earlier 3D implementation while the story redesign is in progress.

`src/content/profile.ts` owns identity and approved metrics. `pnpm readme` renders the GitHub profile. `pnpm resume` needs a local TeX installation and rebuilds the committed PDF; ordinary development does not require TeX. `repo-readmes/` holds reviewed publishing drafts, not an automatic deployment pipeline.

## Status

Redesign in progress. The narrated story homepage and DGX narration are not yet implemented. Package scripts and source in this repository are the evidence for these instructions. All external GitHub publishing remains manual.

## More

[Portfolio and contact](https://kakosyaneduard.ca).
