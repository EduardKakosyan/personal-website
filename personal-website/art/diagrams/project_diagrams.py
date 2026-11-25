"""Draws the five "how it works" diagrams for the project pages.

One visual rule across all of them: a filled box is a model, an outlined box is
plain code, a dashed box is a person, and a thin grey box is someone else's
system. Run from personal-website/: python3 art/diagrams/project_diagrams.py public/images/projects
"""
import sys
from html import escape

# The cabin's paper and ink, so the diagrams sit on the site's paper sheets.
BG, INK, LINE, ACCENT, MUTED = '#fbf6ea', '#3b2a1e', '#6b5a45', '#f2b880', '#8a7a5a'
FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"


class D:
    def __init__(self, w, h, title, desc):
        self.w, self.h, self.title, self.desc = w, h, title, desc
        self.out, self.nodes = [], {}

    def frame(self, x, y, w, h, label):
        self.out.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="none" stroke="{MUTED}" '
            f'stroke-width="1.2" stroke-dasharray="2 5"/>'
            f'<text x="{x + 14}" y="{y + 22}" fill="{MUTED}" font-size="13" letter-spacing="1">'
            f'{escape(label.upper())}</text>'
        )

    def node(self, key, x, y, w, h, lines, kind='code'):
        self.nodes[key] = (x, y, w, h)
        if kind == 'model':
            box = f'fill="{ACCENT}" stroke="{ACCENT}" stroke-width="2"'
            ink = INK
        elif kind == 'person':
            box = f'fill="none" stroke="{INK}" stroke-width="2" stroke-dasharray="7 5"'
            ink = INK
        elif kind == 'ext':
            box = f'fill="none" stroke="{MUTED}" stroke-width="1.5"'
            ink = LINE
        else:
            box = f'fill="none" stroke="{LINE}" stroke-width="2"'
            ink = INK
        self.out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" {box}/>')
        lh = 19
        top = y + h / 2 - (len(lines) - 1) * lh / 2 + 5
        for i, line in enumerate(lines):
            weight = ' font-weight="700"' if i == 0 else ''
            size = 15 if i == 0 else 13.5
            self.out.append(
                f'<text x="{x + w / 2}" y="{top + i * lh:.1f}" fill="{ink}" font-size="{size}"'
                f'{weight} text-anchor="middle">{escape(line)}</text>'
            )

    def side(self, key, where):
        x, y, w, h = self.nodes[key]
        return {
            'l': (x, y + h / 2), 'r': (x + w, y + h / 2),
            't': (x + w / 2, y), 'b': (x + w / 2, y + h),
        }[where]

    def arrow(self, pts, label=None, lpos=None, dashed=False):
        """A line through the points with an arrowhead at the end."""
        d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
        dash = ' stroke-dasharray="6 5"' if dashed else ''
        self.out.append(
            f'<path d="{d}" fill="none" stroke="{LINE}" stroke-width="2"{dash} '
            f'marker-end="url(#a)"/>'
        )
        if label:
            (x1, y1), (x2, y2) = pts[0], pts[1]
            lx, ly = lpos if lpos else ((x1 + x2) / 2, (y1 + y2) / 2 - 8)
            self.out.append(
                f'<text x="{lx:.1f}" y="{ly:.1f}" fill="{LINE}" font-size="12.5" '
                f'text-anchor="middle">{escape(label)}</text>'
            )

    def link(self, a, b, sa='r', sb='l', **kw):
        self.arrow([self.side(a, sa), self.side(b, sb)], **kw)

    def legend(self, y=None, people=True):
        y = y or self.h - 26
        items = [('model', 'a model'), ('code', 'plain code')]
        if people:
            items.append(('person', 'a person'))
        x = 24
        for kind, text in items:
            if kind == 'model':
                box = f'fill="{ACCENT}" stroke="{ACCENT}"'
            elif kind == 'person':
                box = f'fill="none" stroke="{INK}" stroke-dasharray="4 3"'
            else:
                box = f'fill="none" stroke="{LINE}"'
            self.out.append(f'<rect x="{x}" y="{y - 11}" width="18" height="13" rx="3" stroke-width="1.6" {box}/>')
            self.out.append(f'<text x="{x + 26}" y="{y}" fill="{LINE}" font-size="13">{escape(text)}</text>')
            x += 44 + len(text) * 7.4

    def svg(self):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img" '
            f'aria-labelledby="title desc" font-family="{FONT}">\n'
            f'<title id="title">{escape(self.title)}</title><desc id="desc">{escape(self.desc)}</desc>\n'
            f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            f'markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="{LINE}"/>'
            f'</marker></defs>\n'
            f'<rect width="{self.w}" height="{self.h}" rx="12" fill="{BG}"/>\n'
            + '\n'.join(self.out) + '\n</svg>\n'
        )


def keeper():
    d = D(880, 470, 'How a meeting moves through Keeper',
          'On the Mac: record the call, transcribe it live with a speech model, transcribe it again '
          'after the call. On the server: store and index it, summarise it with an open-weights '
          'model, and serve it through one access rule to the web page, the API and MCP.')
    d.frame(24, 24, 392, 380, 'On each Mac')
    d.frame(444, 24, 412, 380, 'On our own server (DGX Spark)')
    d.node('rec', 60, 62, 320, 62, ['Record the call', 'microphone + what the Mac plays, no bot'])
    d.node('live', 60, 164, 320, 62, ['Live transcript', 'streaming speech model, speakers numbered'], 'model')
    d.node('again', 60, 266, 320, 62, ['Transcribe again after the call', 'slower, more accurate model'], 'model')
    d.link('rec', 'live', 'b', 't')
    d.link('live', 'again', 'b', 't')
    d.node('store', 480, 62, 340, 62, ['Store and index', 'one SQLite file, full-text search'])
    d.node('sum', 480, 164, 340, 62, ['Summarise', 'open-weights model, from a queue'], 'model')
    d.node('rule', 480, 266, 340, 62, ['One access rule', 'a meeting belongs to who recorded it'])
    d.link('store', 'sum', 'b', 't')
    d.link('sum', 'rule', 'b', 't')
    ax, ay = d.side('again', 'r')
    sx, sy = d.side('store', 'l')
    d.arrow([(ax, ay), (430, ay), (430, sy), (sx, sy)], 'upload', (430, sy - 12))
    d.node('out', 480, 346, 340, 50, ['Web page · REST API · MCP', 'for people, and for Claude or ChatGPT'], 'ext')
    d.link('rule', 'out', 'b', 't')
    d.legend(people=False)
    return d


def keystone():
    d = D(880, 470, 'How Keystone serves people and Claude',
          'Staff in the browser and Claude, signed in as the person, both call the same registry of '
          'operations. Every call passes the same checks and runs under the database row-level '
          'rules. Scheduled jobs read from QuickBooks, Linear, SharePoint and Outlook.')
    d.node('staff', 24, 66, 196, 66, ['Staff', 'in the browser'], 'person')
    d.node('claude', 24, 196, 196, 66, ['Claude', 'signed in as the person'], 'model')
    d.frame(278, 24, 578, 284, 'Keystone')
    d.node('reg', 290, 66, 250, 196, ['One registry', 'about 150 operations,', 'each declared once:', 'input · permission · code'])
    d.node('checks', 580, 66, 250, 86, ['The same checks', 'input → permission →', 'run as the person → audit'])
    d.node('db', 580, 176, 250, 86, ['Postgres', 'row-level rules decide', 'which rows each person sees'])
    d.arrow([d.side('staff', 'r'), (290, 99)], 'web app', (249, 88))
    d.arrow([d.side('claude', 'r'), (290, 229)], 'MCP tools,', (249, 204))
    d.out.append(f'<text x="249" y="219" fill="{LINE}" font-size="12.5" text-anchor="middle">generated</text>')
    d.arrow([(540, 109), (580, 109)])
    d.link('checks', 'db', 'b', 't')
    d.node('jobs', 580, 338, 250, 62, ['Scheduled jobs', 'read-only, with the time fetched'])
    d.node('ext', 24, 338, 516, 62, ['QuickBooks · Linear · SharePoint · Outlook', 'each keeps its own records'], 'ext')
    d.link('ext', 'jobs', 'r', 'l')
    d.link('jobs', 'db', 't', 'b')
    d.legend()
    return d


def lyfe():
    d = D(880, 470, 'How lyfe is put together',
          'The phone records what happened, even offline. A backend on a private network decides '
          'what counts with plain rules. Two models have narrow jobs: one estimates a meal from a '
          'photo and one draws meals and food icons.')
    d.node('watch', 24, 66, 210, 62, ['Watch → Garmin', 'workouts'], 'ext')
    d.node('phone', 24, 178, 210, 84, ['iPhone app', 'records what happened,', 'even offline'])
    d.node('bank', 24, 312, 210, 62, ['Bank bridge', 'read-only'], 'ext')
    d.frame(282, 24, 574, 380, 'Backend on a DGX Spark · private network only')
    d.node('rules', 310, 66, 250, 196, ['The rules', 'what counts as a session,', 'streaks and recovery,', 'the next breath session,', 'when to remind'])
    d.node('pg', 310, 312, 250, 62, ['PostgreSQL', 'no network port'])
    d.node('vision', 600, 66, 230, 84, ['Vision model', 'estimates a meal from a photo,', 'always marked as an estimate'], 'model')
    d.node('draw', 600, 178, 230, 84, ['Image model', 'draws meals and icons,', 'never touches a number'], 'model')
    d.arrow([d.side('watch', 'r'), (310, 97)], 'checked every 15 min', (129, 148))
    d.arrow([d.side('phone', 'r'), (310, 220)])
    d.arrow([(310, 236), (234, 236)])
    d.arrow([d.side('bank', 'r'), (310, 343)], 'four times a day', (129, 394))
    d.arrow([(560, 108), (600, 108)])
    d.arrow([(560, 220), (600, 220)])
    d.link('rules', 'pg', 'b', 't')
    d.legend(people=False)
    return d


def dgx():
    d = D(880, 470, 'One run of dgx-autonomy',
          'The brief and tests are frozen. A local model builds in a sandbox and hands off to a fresh '
          'conversation when it fills up. When it says it is done, a controller runs the frozen tests '
          'from outside. A passing build waits for a person to accept it or send feedback.')
    d.node('freeze', 24, 70, 216, 84, ['Brief and tests', 'frozen and fingerprinted', 'before the build starts'])
    d.node('build', 286, 70, 250, 84, ['The builder', 'a local model in a sandbox:', 'plans, codes, serves a demo'], 'model')
    d.node('check', 640, 70, 216, 84, ['The controller', 'snapshot, then every frozen', 'test in its own container'])
    d.link('freeze', 'build')
    d.arrow([d.side('build', 'r'), d.side('check', 'l')], 'says "done"', (588, 102))
    # handoff loop above the builder
    d.arrow([(366, 70), (366, 36), (456, 36), (456, 70)], 'handoff note → fresh conversation', (411, 26))
    d.node('review', 640, 250, 216, 84, ['Review', 'a person opens the demo', 'and decides'], 'person')
    d.arrow([d.side('check', 'b'), d.side('review', 't')], 'pass', (776, 208))
    d.node('done', 286, 250, 250, 84, ['Accepted', 'the demo stays up, with', 'a record of every claim'])
    d.arrow([d.side('review', 'l'), d.side('done', 'r')], 'accept', (588, 282))
    # fail: back to the builder
    d.arrow([(680, 154), (680, 200), (476, 200), (476, 154)], 'fail: back with the failures', (578, 192))
    # feedback: back to the builder
    d.arrow([(700, 334), (700, 374), (140, 374), (140, 200), (346, 200), (346, 154)],
            'feedback: what a user sees, never how to code it', (420, 366))
    d.legend()
    return d


def website():
    d = D(880, 470, 'How the website is built',
          'Python scripts build the 3D models, a plain TypeScript simulation runs the world and is '
          'covered by ordinary tests, and one file of facts feeds the site, the résumé PDF and the '
          'GitHub profile. A small model in the browser only picks from answers written ahead of time.')
    d.frame(24, 24, 832, 132, 'The world')
    d.node('blender', 48, 62, 180, 70, ['Blender scripts', 'Python builds every model'])
    d.node('scene', 268, 62, 200, 70, ['The scene', 'React Three Fiber, pixel look'])
    d.node('sim', 508, 62, 180, 70, ['The simulation', 'plain TypeScript, no 3D'])
    d.node('tests', 728, 62, 104, 70, ['Tests', 'run it'])
    d.link('blender', 'scene')
    d.link('sim', 'scene', 'l', 'r')
    d.link('tests', 'sim', 'l', 'r')
    d.frame(24, 172, 832, 106, 'The facts')
    d.node('facts', 48, 208, 180, 50, ['One facts file'])
    d.node('site', 268, 208, 170, 50, ['Site pages'])
    d.node('pdf', 478, 208, 170, 50, ['Résumé PDF'])
    d.node('gh', 688, 208, 144, 50, ['GitHub profile'])
    d.link('facts', 'site')
    d.arrow([(228, 244), (248, 244), (248, 268), (563, 268), (563, 258)])
    d.arrow([(563, 268), (760, 268), (760, 258)])
    d.frame(24, 294, 832, 112, 'A question for HUGO')
    d.node('q', 48, 330, 180, 56, ['A typed question'], 'person')
    d.node('pick', 268, 330, 250, 56, ['Small model in the browser', 'only picks which answer fits'], 'model')
    d.node('ans', 558, 330, 274, 56, ['Answers written ahead of time', 'a keyword match if no model runs'])
    d.link('q', 'pick')
    d.link('pick', 'ans')
    d.legend()
    return d


if __name__ == '__main__':
    out = sys.argv[1]
    for name, make in [('keeper', keeper), ('keystone', keystone), ('lyfe', lyfe),
                       ('dgx-autonomy', dgx), ('personal-website', website)]:
        with open(f'{out}/{name}.svg', 'w') as f:
            f.write(make().svg())
        print('wrote', name)
