// What the guide can say about how a project was worked out, one short note per topic.
export type CaseTopic =
  | 'problem'
  | 'discovery'
  | 'evidence'
  | 'findings'
  | 'decisions'
  | 'testing'
  | 'architecture'
  | 'team'
  | 'hard'
  | 'status'

export interface Project {
  slug: string
  title: string
  tier: 'case-study' | 'archive'
  beat?: 'systems' | 'private-local' | 'adoption'
  visibility: 'public-repo' | 'described-only'
  description: string
  detail: string
  aliases: string[]
  outcome?: string
  casebook?: Partial<Record<CaseTopic, string>>
  facts: {
    role: string
    when: string
    team: string
    stack: string[]
    links: { label: string; href: string }[]
  }
}

export const projects: Project[] = [
  {
    slug: 'volta-sep26',
    title: 'Is the Beach Open',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A map of the 35 Nova Scotia beaches where a government tests the water, with the official notice behind each status.',
    detail:
      'Eduard built it with Harshil-varia (GitHub) as a competition entry at the Halifax Claude Hackathon at Volta on September 12, 2026, then took it to production over the following two days. It reads municipal beach results, provincial park notices and the algae feed every hour, and is live at nsbeaches.ca.',
    aliases: ['beach open', 'new volta', 'volta-sep26', 'nsbeaches', 'ns beaches'],
    casebook: {
      problem:
        'At the Halifax Claude Hackathon at Volta on September 12, 2026, city staff presented five problems they hear the most complaints about. One was beach safety: Halifax tests its supervised beaches for bacteria and blue-green algae but posts the results in one text table, while provincial park notices and algae reports sit on separate pages with no map.',
      discovery:
        'The judging sheet weighted day-one impact ("could they use it Monday?"), usability, a real insight and a clear three-minute demo, with about four hours to build. Eduard told Claude to find out whether solutions already existed and what the real problem was rather than the team’s presumption. The research found one existing aggregator, Swim Guide, which showed historical pass rates for most provincial beaches and had no public feed.',
      evidence:
        'The research read the source pages directly. The city table is a server-rendered page of 18 beaches that turns away some automated requests, park advisories are undated cards with no feed, and the algae list is an Atom feed that names lakes, not beaches. To rebuild summer 2026 for the replay, Eduard used archived captures of the city table, city news releases, the algae feed and local news coverage.',
      findings:
        'Only 35 beaches in Nova Scotia have a government testing the water, 18 municipal and 17 provincial, so only those got pins. By September every beach was off-season, so a clearly labelled replay of past days became the only way to show the app working. Each source spells beach names its own way, so every beach stores each source’s exact names and matches them exactly or not at all.',
      decisions:
        'Algae means closed, and a provincial beach with no advisory gets a hollow ring, because "no advisory posted" is weaker than "tested today". The team left out unmonitored beaches, accounts and a native app, and never let crowd reports change a pin’s colour. When Eduard finished the app he replaced the satellite map with a flat paper-style map, chose Web Push over email alerts, and showed water temperature only where the harbour buoy measures it.',
      testing:
        'At the end of the hackathon day 377 unit tests passed and the end-to-end suite was still being brought up. Eduard then set up Playwright across five browser and device projects and CI that must pass before anything merges. At the final merge 742 unit and component tests passed.',
      architecture:
        'A Next.js app on Vercel with MapLibre and Supabase. An hourly job reads the city table, park advisories and algae feed on the server, settles each beach on one of four states and stores the official wording and link. A failed read keeps the last confirmed status, and replayed days are labelled verified, inferred or calendar so a reconstruction cannot pass as live status.',
      team: 'Eduard wrote the research and design documents, split the build into five phases planned by parallel Claude sessions, and built the data, ingest and backend phases. @Harshil-varia built the beach directory, the theme and the component tests, and handled the afternoon merges. Eduard took it to production over September 13 and 14.',
      hard: 'Building five phases in parallel was fast but meant merge conflicts, and at the end of the day features such as locate-me, directions and share still needed wiring. Eduard spent the next two days on the phone experience and production setup. After launch the hourly refresh hit database gateway timeouts at the top of the hour, so he moved the job to seven minutes past and added retries.',
      status:
        'Live at nsbeaches.ca with the hourly refresh running. Outside the swimming season every beach shows as off-season until supervision resumes in July. The code is public.',
    },
    facts: {
      role: 'Research, data pipeline and post-hackathon build',
      when: 'September 2026',
      team: 'Eduard and @Harshil-varia',
      stack: ['Next.js', 'MapLibre', 'Supabase', 'Vercel', 'Vitest', 'Playwright'],
      links: [
        { label: 'Live site', href: 'https://www.nsbeaches.ca' },
        {
          label: 'Source code',
          href: 'https://github.com/EduardKakosyan/claude-hackathon-volta-sep26',
        },
      ],
    },
  },
  {
    slug: 'exosky',
    title: 'Sky Painters',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'An educational sky explorer that changes the viewpoint from Earth to an exoplanet and lets visitors draw constellations.',
    detail:
      'Built by a team of five for the Exosky challenge at NASA Space Apps Challenge 2024, October 5–6, with Huy Huynh, Hao Tang and quangphucthan (GitHub). Eduard built the Gaia star pipeline and the rendering from each planet’s viewpoint, and deployed the app afterwards.',
    aliases: ['exosky', 'sky painters', 'nasa'],
    casebook: {
      problem:
        'Sky Painters was the team’s entry for the Exosky challenge at NASA Space Apps Challenge 2024, held October 5–6: let students see how the night sky would look from other planets and draw their own constellations on it.',
      findings:
        'Eduard first mapped stars by querying Gaia’s online service, then overnight moved the mapping to a local database copy, which was far faster. His pipeline reads in batches of 100,000 rows on one thread and writes in batches of 10,000 on another; its notes record 50,000,000 rows processed in 5 hours on a machine with 16 GB of RAM and 4 cores.',
      architecture:
        'Star positions come from Gaia DR3. A Python pipeline turned each star into x, y, z coordinates with Astropy and stored them in a local PostgreSQL database; for each planet, a script moves the origin to the planet, converts the stars back to sky coordinates, adjusts each star’s brightness for its new distance and saves the whole sky as one image. The React and Three.js front end wraps that image around the viewer as a sphere, and right-clicking draws a constellation.',
      team: 'Eduard set up the repository and built the data side: the Gaia-to-PostgreSQL pipeline, the rendering from each planet’s viewpoint and the brightness adjustment. Hao Tang wrote the coordinate transformations, Huy Huynh built most of the front end, and teammates including @quangphucthan built the constellation drawing. In the week after the event Eduard reworked the drawing, fixed the Docker image and deployed the app to Fly.io.',
      hard: 'Coordinating five people across separate front-end and back-end branches in one weekend took several merges, and the rendered sky images were large enough that the viewer needed a loading state. After the event Eduard fixed the Docker build and deployed the app.',
      status:
        'Built October 5–6, 2024, then cleaned up and deployed to Fly.io by October 12. The demo is still online.',
    },
    facts: {
      role: 'Data pipeline and rendering',
      when: 'NASA Space Apps Challenge, October 2024',
      team: 'Five-person team with Huy Huynh, Hao Tang and @quangphucthan',
      stack: ['Python', 'Astropy', 'PostgreSQL', 'React', 'Three.js', 'FastAPI', 'Fly.io'],
      links: [
        { label: 'Live demo', href: 'https://skypainter.fly.dev/' },
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/exosky_nasa' },
      ],
    },
  },
  {
    slug: 'keystone',
    title: 'Keystone',
    tier: 'case-study',
    beat: 'systems',
    visibility: 'described-only',
    description:
      'Internal operations software built after interviewing the team about what they needed. Staff and Claude share one registry of operations.',
    detail:
      'Eduard leads a team of five developers and designed Keystone’s architecture. The team had stopped using the old scorecard, so Eduard and a UX researcher interviewed leadership, measured actual usage and settled metric definitions before rebuilding. Staff and Claude use the same registry of operations, through the app and through MCP.',
    aliases: ['keystone', 'gtm', 'scorecard', 'revenue', 'operations'],
    outcome: 'I lead the architecture and development. We’re rolling it out now.',
    casebook: {
      problem:
        'Eduard built most of AI-First’s first internal dashboard, and by mid-2026 the team skipped its scorecard in the weekly meeting. Each of its four stages, attract, convert, deliver and collect, squeezed a lot of work into one percentage nobody could act on. His audit also found wrong numbers: the weekly snapshot job had stopped in January, two stages were calculated two different ways, and a finance sync had failed while still logging "completed".',
      discovery:
        'Eduard brought in a UX researcher. She reviewed the old dashboard and comparable firms, then wrote an interview guide for each leadership seat that tested specific options instead of asking for wishes. She wrote the questions and Eduard ran the interviews: a 77-minute one-on-one with the CEO on a 16-question guide, and a 30-question set for the operations and finance lead. Eduard answered his own set on custom development, adoption and reusable IP. The delivery lead’s input comes next, so some pipeline definitions are still open.',
      findings:
        'Every number already had a home: plans in Linear, time in Outlook, money in QuickBooks and signed statements of work in SharePoint. Nobody had written down what makes a lead qualified, what counts as a productized offer or what reusable IP is, and the CEO and the operations lead disagreed on who the company view is for; the decision register logged 13 conflicts like these. There were no recorded project plans to measure against. Time data had to stay system-level, never ranking individuals. The CEO wanted to ask Claude for data rather than browse prebuilt views.',
      evidence:
        'Because people describe a tidier version of how they work, Eduard checked the interviews against behaviour. Eight AI agents measured feature usage read-only in the production database, and he read months of Monday-meeting transcripts to see how project risk was discussed.',
      decisions:
        'The team chose not to build file storage or task lists (SharePoint and Linear keep those), a new time-tracking routine, a copy of the cash forecast (QuickBooks stays the source, read-only), red-amber-green colours without an approved threshold, any view without a meeting that uses it, or an off-the-shelf CRM. Each remaining metric got a contract: an owner, the question it answers, its source, its cadence, and whether it is live or waiting for data. Missing data reads "Data missing", never zero.',
      testing:
        'The researcher turned the findings into a prototype with 25 measures across eight views: leadership, strategy, capacity, delivery, finance, people, tech adoption and reusable IP. She built it in Figma, then in HTML with sample data. After Eduard’s review they widened the definition of reusable IP, gave plans an optimistic, expected and pessimistic range, and tied capacity targets to job roles. Usability sessions with staff on the live build have not happened yet.',
      architecture:
        'Keystone owns no data; it holds SharePoint, Linear, QuickBooks and Outlook together, hence the name. The old dashboard’s MCP tools were hand-written, untested and drifting from the app. In Keystone, each operation is declared once in a capability registry with its input schema and permission, and the Claude tools are generated from it. Claude signs in as the person, so it reaches only what they can, and a parity test checks that the same action from the app and from Claude writes the same record.',
      team: 'Eduard designed the architecture and built the first phase himself: sign-in, the capability registry and the generated Claude tools. Developers on his team built most of what followed, and he reviews and merges their work. The UX researcher owned the research, interview guides, metric register and prototype.',
      hard: 'Definitions are owed by people, not code: several metrics wait for someone to agree a definition or accept ownership, and a metric is cut if its proposed owner declines. Consistent naming of files and projects was a constant fight, and only about half of the old opportunities migrated cleanly. Eduard said in the first brainstorm that change management mattered more than the software.',
      status:
        'Keystone is rolling out in phases. The first scorecard is due at the end of October 2026. The QuickBooks, Linear and SharePoint connectors come in later phases, and the old dashboard runs until cutover, so there are no adoption numbers yet. The code is private.',
    },
    facts: {
      role: 'Engineering lead and architect',
      when: '2026 / rolling out',
      team: 'Eduard with developers from his team, and a UX researcher',
      stack: ['Capability registry', 'MCP', 'Supabase', 'SharePoint', 'Linear', 'QuickBooks'],
      links: [],
    },
  },
  {
    slug: 'keeper',
    title: 'Keeper',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'described-only',
    description:
      'A private meeting archive meant to replace the team’s cloud notetaker, with search, summaries and access from AI tools, plus a Mac app for recording and dictation.',
    detail:
      'Keeper stores transcripts and summary versions in SQLite on a DGX Spark, serves a web UI, a REST API and MCP tools, and summarizes with a local model. A local model in Eduard’s dgx-autonomy loop wrote the first version; Eduard has developed it with Claude Code since October 13, 2026, and teammates began testing it on October 20.',
    aliases: ['keeper', 'meeting', 'archive', 'dictation', 'fireflies'],
    outcome:
      'Teammates are testing it now; a week-long pilot decides whether it replaces our notetaker.',
    casebook: {
      problem:
        'AI-First’s team recorded calls with Fireflies, a bot that joins each meeting and keeps transcripts on the vendor’s servers. Eduard set out to replace it with a meeting memory on hardware the company owns: every transcript, summary and action item, searchable from a web page and from Claude or ChatGPT over MCP, with local dictation in the same Mac app.',
      discovery:
        'The requirements were written as a brief and acceptance checks before the code existed. On October 14 and 15, 2026 Eduard turned them into release issues with explicit product decisions: automatic recording like Fireflies, an archive kept for good, one admin, and 16 GB Macs as the pilot hardware. From October 20 he gave teammates builds and asked them to compare Keeper with Fireflies and their dictation app.',
      evidence:
        'Eduard tested the Mac app on his own Mac, where a 75-second recording of a three-person panel produced both audio files, a live transcript and three detected speakers. Search and paging were checked against synthetic archives of 600 and 2,007 meetings. The first teammate recordings surfaced a case no test covered, calls that uploaded with no audio, and both the Mac app and the web page now explain it.',
      findings:
        'Real machines changed the plan. A Teams chat window left open once produced a recording of someone in no call, so a window alone never starts a recording. Apple’s built-in recogniser could not transcribe two channels live, so meetings use Nemotron live and Parakeet afterwards.',
      decisions:
        'Keeper records meetings automatically, shows a Stop and Skip indicator and posts a notice in the Teams chat. Dictated text never leaves the Mac, and a meeting is visible only to its owner and the colleagues they share it with. Eduard ruled out task tracking, reminders, calendar writes, cross-person voiceprints and pooled training data, and the admin token can never be used to connect an AI assistant.',
      testing:
        'At the October 20 merge the server had 934 Python tests and the Mac core had 1,135 Swift tests. They cover account isolation on every surface, repeat imports, paging, recovery and MCP over a real server, alongside 16 frozen acceptance checks the builder could not edit.',
      architecture:
        'The server is one Python (FastAPI) process with one SQLite database, FTS5 search, a web UI, a REST API and MCP tools, running on a DGX Spark that teammates reach over a private network. Summaries go through a queue, so a busy model only delays them. The Mac app detects a Teams call, records the microphone and the Mac’s audio, transcribes and labels speakers on the Mac, and uploads when the call ends.',
      team: 'A local model in Eduard’s dgx-autonomy loop wrote the first server and Mac app between late September and October 12, 2026. Eduard reviewed its builds, sent feedback and made the first Mac build compile. Since October 13 he has developed Keeper with Claude Code.',
      hard: 'The builder wrote the first Mac app in a Linux sandbox with no Apple compiler, so Eduard handled the first native build on a Mac and had it recording after 15 fixes. Search once ranked results worst-first because SQLite’s BM25 score is a cost and the code read it as relevance; paging tests passed regardless, so he added a test on the score itself.',
      status:
        'Keeper for Mac reached version 0.3.1 on October 21, 2026, the first update delivered through its own update feed. Teammates began testing on October 20. The week-long pilot that decides whether the team can cancel Fireflies has not run yet. The code is private.',
    },
    facts: {
      role: 'Lead developer; operated the builder loop for the first version',
      when: 'September–October 2026 / in pilot',
      team: 'AI-First team tool; first version written by a local model in dgx-autonomy',
      stack: ['Python', 'FastAPI', 'SQLite FTS5', 'MCP', 'Swift', 'Parakeet', 'Nemotron'],
      links: [],
    },
  },
  {
    slug: 'dgx-autonomy',
    title: 'dgx-autonomy',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'public-repo',
    description:
      'A setup for running a coding agent on a DGX Spark. It saves progress between conversations and submits its code to tests it cannot edit.',
    detail:
      'Eduard designed the controller around OpenHands and built it with Claude Code: it saves progress, recovers interrupted runs, tests code in separate containers and pauses for review. Recent app runs use SGLang and NVFP4; llama.cpp and a Qwen3.6 fallback are also supported. Shoreline and the original Camp Yahtzee release are documented outputs, with a supervising Claude session acting as product lead on Eduard’s instructions.',
    aliases: ['dgx', 'autonomy', 'autonomous loops', 'local ai', 'qwen', 'spark'],
    outcome:
      'Shoreline and the first Camp Yahtzee release were built with this setup; a supervising Claude session reviewed them as product lead, and I set the direction.',
    casebook: {
      problem:
        'Eduard wanted to know whether an open-weights model on hardware the company controls could take a request like "build me a weather app", work unattended for up to about 40 hours and come back with a working app. The box decodes at roughly 20 tokens a second, so the bet was patience over speed: the model had to stay on track, recover from its own mistakes and be graded by tests it could not edit.',
      discovery:
        'Before writing code, Eduard worked through research questions, a research document, a PRD, a technical design and a structure outline. The research inspected the DGX directly and checked model repositories, llama.cpp and the OpenHands SDK against their sources, keeping verified facts apart from estimates. It found separate inference, agent and test pieces but no harness that connected them.',
      evidence:
        'A model is only used after qualification on the machine with the whole workload running: five tool-call probes, a prompt filling 75% of the context with a word to recall from its start, a real build that must pass, and memory sampled throughout. Logs from a real run showed llama.cpp decode falling from 24.9 tokens a second near an empty context to 8.0 at 225–250K, while SGLang held 21–25 up to 180K.',
      findings:
        'Local models claim success early and confidently, so finishing became a claim that frozen tests have to confirm. One builder ignored a handoff request for 43 minutes while its context filled; a reminder after every three unrelated actions got a handoff within a minute. SGLang, unlike llama.cpp, refuses a request whose prompt plus maximum output exceeds the context, so the rollover point now leaves room for a full response.',
      decisions:
        'OpenHands runs the agent loop and Eduard’s controller owns everything around it; a custom agent loop was out of scope. Memory is structured handoff notes rather than a graph service, which the design records as simpler to inspect, not proven better. The first version left out a web dashboard, public hosting, several models in one run and automatic stronger-model review. He moved from llama.cpp to SGLang only after measuring it on the box.',
      testing:
        'About 390 tests run without a GPU, Docker or a model, and a separate suite on the DGX covers controller kills, forced resets, network rules, protected evaluation and reboots. Every set of acceptance checks is dry-run first: each check must fail with no app and pass against a throwaway reference app. That once caught a check that matched two labels on any page.',
      architecture:
        'A controller outside the sandbox freezes the brief and checks with a digest, keeps the deadline, and starts a fresh conversation from a validated handoff when the context fills, the builder loops or errors, or three claims fail in a row. When the builder says it is done, the controller pins a snapshot, runs each frozen check in its own disposable container against the live demo, and rejects the result if the code changed mid-test.',
      team: 'Eduard designed the controller and built it with Claude Code. The local model wrote all the app code. During runs a supervising Claude session reviewed live demos as product lead on Eduard’s instructions and drafted the feedback, while Eduard made the requests and decided when to stop, switch backends and publish.',
      hard: 'Runs held for review depend on someone watching: when the supervising session ended, its monitor stopped and held runs waited, so review notifications became part of the design. An uncapped response once spent 20 minutes on more than 10,000 tokens of thinking, so response length, thinking budget and timeouts are now set per model.',
      status:
        'Built between September 22 and 29, 2026, and public on GitHub since September 28. It produced Shoreline and the original Camp Yahtzee release, and wrote the first version of Keeper.',
    },
    facts: {
      role: 'Controller design and tests',
      when: 'September 2026',
      team: 'Eduard (with Claude Code); local model as builder; a supervising Claude session as product lead',
      stack: ['Qwen3.8', 'DGX Spark', 'OpenHands', 'SGLang', 'Python', 'Docker'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/dgx-autonomy' }],
    },
  },
  {
    slug: 'shoreline',
    title: 'Shoreline',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'Beach and fishing verdicts, tides and sea conditions for a day at the water, built by a local coding agent.',
    detail:
      'Built September 24–28, 2026 over three runs by a local Qwen model in dgx-autonomy. The final run passed 19/19 frozen acceptance checks (78 Playwright tests). A supervising Claude session wrote the brief and reviewed it as product lead; Eduard set the direction. Data comes from Open-Meteo.',
    aliases: ['shoreline', 'beach', 'fishing', 'tides'],
    casebook: {
      problem:
        'Shoreline answers the question a beach-goer, swimmer, angler or surfer has for a coastal place: is today good for the beach, and is it a good time to fish? It began as a weather app the local model built and polished in two earlier runs; Eduard then asked for tides, sea and fishing conditions.',
      discovery:
        'There was no user research. The direction came from Eduard’s requests, and the supervising Claude session wrote them into a brief with exact Good, Fair and Poor rules and a test: the app should help someone at the car park deciding whether to unload the surfboard or the fishing rods. Each review tried the app on live data for real places such as Cascais, Newquay, Honolulu, Sydney, Cape Town, Halifax and Madrid.',
      findings:
        'Reviewing on live data showed the brief itself was wrong. Its tide-turn rule, an hour higher or lower than both neighbours, missed flat tops and bottoms that are common in real hourly data: Sydney held −0.63 m at 14:00 and 15:00, so the chart showed a low the list left out. The rule was amended to count a flat run as one turn.',
      decisions:
        'The browser calls the free Open-Meteo geocoding, forecast and marine APIs directly, with no backend and no keys. A place counts as coastal only when the marine API returns a wave height, and inland places show nothing about the sea rather than an empty panel. Both verdicts fit on the first phone screen.',
      testing:
        'The final run passed 19 of 19 automated acceptance checks (78 Playwright tests) in three evaluations, and both human-judgment criteria passed on review. Before launch, the reference app passed all 78 tests and 234 of 234 over three repeats, while the existing app failed every new test.',
      architecture:
        'Shoreline is a static HTML, CSS and JavaScript site with no build step. Weather and marine requests go out together, tides come from Open-Meteo’s hourly sea-level series with an "approximate" note, and the acceptance checks swap the API hosts for fixtures so they run without a network.',
      team: 'The local model, Qwen3.8-Flash-Next, wrote all 42 commits of the app on a DGX Spark. A supervising Claude session, acting as product lead for Eduard, wrote the Shoreline brief and checks, reviewed each claim and drafted feedback; it never commented on code. Eduard made the requests, moved the model to SGLang, accepted the result and published it.',
      hard: 'A visual glitch above the weather icon took three review rounds to remove; each fix left a sliver or smudge, until the builder wrote a pixel detector that compared the sky around the icon with its CSS gradient.',
      status:
        'Built over three runs from September 24 to 28, 2026, and accepted on review on September 28. It is live on GitHub Pages with the briefs, checks and every message to the builder in the repository.',
    },
    facts: {
      role: 'Product direction (loop and builder: dgx-autonomy)',
      when: 'September 2026',
      team: 'Local coding agent; a supervising Claude session as product lead',
      stack: ['Local AI', 'JavaScript', 'Open-Meteo', 'Playwright'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/shoreline' },
        { label: 'Live app', href: 'https://eduardkakosyan.github.io/shoreline/' },
      ],
    },
  },
  {
    slug: 'yahtzee',
    title: 'Camp Yahtzee',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'An offline game for one phone passed around a camp table, with real or on-screen dice.',
    detail:
      'The original local-agent build crossed four conversations and two rounds of product feedback, and both completion claims passed 24/24 frozen acceptance tests. Its rules audit covered all 7,776 rolls. Multi-step undo, restart turn, reset game and change players were added later through CodeLayer.',
    aliases: ['yahtzee', 'dice', 'camp'],
    casebook: {
      problem:
        'Eduard wanted Yahtzee for a camp trip with no signal: one iPhone passed around a table, the official rules, more players than a paper pad handles easily, several games in a row, and a better feel than a scoresheet.',
      discovery:
        'The first brief assumed the dice were on the phone. About five hours into the build, Eduard clarified that at camp they roll real dice on the table and the phone’s main job is to keep score. That became the first round of feedback, and real-dice mode became the main path in the app.',
      findings:
        'The review found a bug no check could see: an empty count badge drew a disc over a pip on each keypad key, so the 4, 5 and 6 keys read as 3, 4 and 5. At the table that would have caused wrong scores, so it became the second round of feedback.',
      decisions:
        'The brief kept the official rules fixed, including the forced Joker and the 100-point Yahtzee bonus, and asked for 1 to 8 players, a session tally with a rotating first player, offline play and recovery after Safari reloads. Tapping a box records at once, with no pass-the-phone screen.',
      testing:
        'Both of the builder’s completion claims passed all 24 frozen acceptance tests. The builder wrote its own rules tests, including all 7,776 possible rolls checked against a second scorer written differently on purpose. A scripted review played two real-dice games with 3 and 8 players, 143 turns, checking every box against an independent rules implementation, with no discrepancies.',
      architecture:
        'Camp Yahtzee is a static web app: a pure rules engine and a UI bundled into one script, a service worker for offline play, and a manifest so it installs to the home screen. Game state lives in the phone’s local storage, so a reload resumes the turn exactly.',
      team: 'Qwen3.8-Flash-Next, running locally on a DGX Spark in Eduard’s dgx-autonomy loop, wrote the 18 commits of the original release, including a single-step Undo. Eduard made the request and the real-dice clarification; a supervising Claude session wrote the brief and checks and reviewed the builds. Multi-step undo, restart turn, reset game and change players were added later through CodeLayer, without the DGX model.',
      hard: 'The checks reached the demo over plain HTTP, where browsers do not allow service workers, so the offline check had to go through a localhost proxy inside the test; that was found and fixed before launch.',
      status:
        'The original release was built on September 28–29, 2026, across four conversations in about 24 hours. The game controls were added on October 1, and the app is live on GitHub Pages.',
    },
    facts: {
      role: 'Product direction (loop and builder: dgx-autonomy)',
      when: 'September 2026',
      team: 'Local coding agent; a supervising Claude session as product lead; later edits through CodeLayer',
      stack: ['Local AI', 'Offline', 'Service worker', 'Playwright'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/yahtzee' },
        { label: 'Live app', href: 'https://eduardkakosyan.github.io/yahtzee/' },
      ],
    },
  },
  {
    slug: 'hugo',
    title: 'HUGO',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A voice assistant for a Reachy Mini robot, with speech recognition, the language model and speech synthesis running on a shared DGX Spark.',
    detail:
      'HUGO uses Nemotron through vLLM, Parakeet, Qwen3-TTS, openWakeWord and Silero VAD. The current Python version for the DGX, from July 2026, is the fifth after versions on Gemini, local models on a Mac and a Go agent. It is a working prototype.',
    aliases: ['hugo', 'reachy', 'robot', 'voice'],
    casebook: {
      problem:
        'Eduard wanted a desk assistant he could talk to, with a Reachy Mini robot as its body and every model running on hardware the team owns. By July 2026 the DGX version worked but did not feel like a conversation: "What can you do?" got more than 40 seconds of silence and then a reply that recited its own instructions.',
      discovery:
        'Eduard was the user. He ran live sessions at the robot, wrote down complaints in plain words such as "I can’t understand what it’s saying" and "it keeps cutting me off", and traced each one through session logs to a cause before changing code. The Python rewrite started from a planning session that produced five architecture decision records.',
      evidence:
        'Session logs showed about 16 tokens a second and roughly 55 seconds of model time before the first audio, most of it spent on 800 to 1,000 tokens of hidden reasoning. For startup he measured the disk at 4.6 GB/s while vLLM’s default loader read the 74.8 GB checkpoint at about 120 MB/s.',
      findings:
        'One setting explained both the slowness and the odd replies: Nemotron’s reasoning was on by default and vLLM had no reasoning parser, so the private reasoning was spoken aloud. Interrupting on any speech failed without echo cancellation, because HUGO heard its own voice. Silero’s default 100 ms of silence ended a turn at every mid-sentence "uh".',
      decisions:
        'Eduard committed to Python because the Reachy Mini SDK is Python-only. Because teammates share the DGX, HUGO loads every model on start and frees all memory on sleep, even after a crash, accepting a cold start of minutes. Until echo cancellation exists only the wake word interrupts HUGO, and 800 ms of silence ends a turn, trading response time for not cutting people off.',
      testing:
        'Unit tests fake the robot and every model at defined interfaces: 150 after the motion work, with strict type checks and linting in CI. On July 23, 2026 all six integration tests passed on the DGX, and "What can you do?" got its first sentence in 1.44 seconds. In the live session on July 28, first audio measured about 5.3 seconds; the target is 3 seconds.',
      architecture:
        'openWakeWord and Silero listen in the main process, Parakeet transcribes each utterance once, Nemotron on vLLM answers through a tool loop with web search, and Qwen3-TTS streams speech back to the robot. Replies are split into sentences and spoken while the model is still generating. Each model server runs as its own process with its own Python environment.',
      team: 'HUGO is Eduard’s solo project. Much of the code was written with Claude coding agents; Eduard planned the work, made the decisions and ran the live sessions at the robot.',
      hard: 'On the DGX’s shared memory, the 74.8 GB checkpoint filled the page cache and starved other model loads; parallel weight streaming and staged startup cut cold start from about 11.5 minutes to 4 minutes 43 seconds. A robot daemon that started without motor power silenced input while every service reported healthy, which is why automatic recovery is on the backlog.',
      status:
        'HUGO is a working prototype, last updated July 28, 2026. Next on the backlog are echo cancellation, the camera and automatic recovery from a stuck robot daemon.',
    },
    facts: {
      role: 'Builder',
      when: 'July 2025 – July 2026',
      team: 'Solo, using Claude Code',
      stack: ['Python', 'DGX Spark', 'Reachy Mini', 'vLLM', 'Parakeet', 'Qwen3-TTS'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/hugo' }],
    },
  },
  {
    slug: 'dev-template',
    title: 'Dev Template',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'Agent commands, checks and Git hooks for starting projects at AI-First Solutions.',
    detail:
      'A GitHub template with commit hooks, local CI through act and narrowly scoped agent commands, built in January 2026 after coding agents made and pushed bad commits. The research agents and most commands are adapted from HumanLayer’s open-source Claude Code setup. Seven company repositories were created from it.',
    aliases: ['dev template', 'template'],
    casebook: {
      problem:
        'In January 2026 Eduard was starting several internal projects with Claude Code, and agents sometimes made a bad commit and pushed it without being asked. He wanted every new repository to start with the same guardrails and agent setup instead of rebuilding them.',
      discovery:
        'The need came from his own daily work with coding agents. Before building, he listed what the existing starter lacked: ESLint, TypeScript configuration, tests, CI, a pull request template, decision records and agent instructions with clear boundaries.',
      decisions:
        'The template stays tooling-only, with no app, end-to-end tests, preview deployments or Storybook. Each agent command has its own narrow permissions, replacing his earlier advice to run Claude with permission checks skipped. The pre-push hook runs CI locally but lets the push through with a warning when Docker is missing.',
      testing:
        'The template ships one example test so CI has something to run. On January 26, 2026 Eduard walked a colleague through creating a new project from the template, planning with the agents and running the local CI container before a push.',
      architecture:
        'Husky runs Gitleaks and lint-staged before each commit and commitlint on each message, and act runs the GitHub Actions job in Docker before each push. Pull requests run lint, type checks, Vitest and Gitleaks, Changesets handle versions and docs/adr holds decision records. The research agents and most commands come from HumanLayer’s open-source Claude Code setup; Eduard added a command that turns a feature request into a GitHub issue and one that implements an issue.',
      team: 'Eduard wrote the template; the agents and most commands are adapted from HumanLayer.',
      hard: 'The Gitleaks GitHub action cannot run under act, so the workflow detects act and runs the Gitleaks binary instead. CI’s shallow clone broke the secret scan until the workflow fetched the full history, and placeholder tokens in the example secrets file caused false positives until they were allowlisted.',
      status:
        'Dev Template is a GitHub template repository, last changed in February 2026. Between January 26 and June 8, 2026, seven company repositories were created from it and two more copied its hooks and commands; teammates started several of them. An early version of HUGO and this site use the same setup.',
    },
    facts: {
      role: 'Builder',
      when: 'January 2026',
      team: 'Solo; agents adapted from HumanLayer',
      stack: ['TypeScript', 'Claude Code', 'Vitest', 'Husky', 'Gitleaks', 'act'],
      links: [
        { label: 'Source code', href: 'https://github.com/AI-First-Consulting/dev-template' },
      ],
    },
  },
  {
    slug: 'healthbyte',
    title: 'HealthByte',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A hackathon prototype where one agent reacts to a health article as a fictional person and another reframes the article for them.',
    detail:
      'Eduard built it with Huy Huynh, Hao Tang and Tobi Onibudo for the AI in Healthcare Challenge at the Atlantic AI Summit 2025, where their team took first place. Eduard wrote the persona and editor loop.',
    aliases: ['healthbyte', 'health', 'hackathon'],
    casebook: {
      problem:
        'The AI in Healthcare Challenge at the Atlantic AI Summit 2025 brought together twenty university student teams from across Atlantic Canada. It asked teams to use LLM agents to model how people with different backgrounds respond to real and fabricated healthcare articles, and how messaging could counter misinformation. Eduard’s team took COVID-19 vaccine news as the case.',
      discovery:
        'The team started from a planning report on agent-based modelling of vaccine acceptance, covering personas built from census and survey data, real and fake news datasets, and ways to check that a persona stays in character. Eduard turned that into a short written spec for the loop, and Hao Tang wrote the personas as structured profiles with demographics, trust levels, concerns and a starting vaccine stance.',
      decisions:
        'The editor agent was told to keep the facts and change only the framing, to suit the persona’s concerns and trusted sources. The loop stops when the persona’s rating reaches 3.4 of 4 or after 10 rounds. The spec ruled out tests and a web server so the time went into the simulation; the planning report assumed n8n on Azure, and Eduard wrote the loop as a plain Python script on the OpenAI API instead.',
      testing:
        'With about 60 hours, the team put its time into the simulation rather than automated tests. For the demo, the charts used sample data generated from templates to show the analysis views. Scores from the loop describe model responses, not real readers.',
      architecture:
        'A persona agent reads the article with its profile and recent reactions, and answers with a 1–4 rating, a positive or negative reaction and its reasoning. An editor agent then rewrites the article, and every round is logged to Supabase, or to CSV as a fallback. A Next.js front end charts rating trajectories across real, fake and mixed news.',
      team: 'Eduard wrote the two-agent loop, the logging, the data generator and the README. Huy Huynh built most of the front end and the persona chat, Hao Tang wrote the personas and article data, and Tobi Onibudo built the persona pages.',
      hard: 'Everything was built in about 60 hours, with front-end commits running through the night before judging. The models changed late: both agents ran on o4-mini during the build and were switched to gpt-4o-mini in the final commit.',
      status:
        'The team took first place at the Atlantic AI Summit 2025 hackathon in May 2025. The repository is public and the demo is still online.',
    },
    facts: {
      role: 'Agent loop and data',
      when: 'May 2025',
      team: 'Four-person hackathon team',
      stack: ['Python', 'OpenAI API', 'Supabase', 'Next.js'],
      links: [
        {
          label: 'Source code',
          href: 'https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon',
        },
        { label: 'Live demo', href: 'https://healthbyte-dashboard.vercel.app/' },
      ],
    },
  },
  {
    slug: 'second-brain',
    title: 'Second Brain',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A hackathon study assistant connecting course files in Google Drive with chat, a calendar and email summaries.',
    detail:
      'Eduard built it with Huy Huynh and Hao Tang at the Volta Agentic AI Hackathon in Halifax in November 2024, where their team took second place.',
    aliases: ['second brain', 'volta'],
    casebook: {
      problem:
        'At the Volta Agentic AI Hackathon in Halifax in November 2024, Eduard, Huy Huynh and Hao Tang picked a time-management and learning assistant for students: one place for their course documents that also helps them plan around deadlines and exams.',
      decisions:
        'The team used a Google Drive folder as the store, so students could drop in assignments, slides and notes without a new upload screen. Each action (reading the calendar, creating events, summarising email) was its own n8n workflow with a written description of its inputs and outputs, so the agent would choose tools more accurately. The prompt told the agent to check availability before booking and to create each exam date as a separate event.',
      architecture:
        'One n8n flow watches the Drive folder, splits new files into chunks and stores OpenAI embeddings in Pinecone. The chat flow checks whether the student attached a file; if so, it adds the file and passes its text to the agent, and if not, the agent answers from Pinecone. The agent keeps a short conversation memory and can call three tools: get calendar events, set calendar events, and summarise today’s Gmail.',
      team: 'The README credits Eduard, Huy Huynh and Hao Tang. Eduard published the workflow export and wrote the README.',
      status:
        'The team took second place at the Volta Agentic AI Hackathon in November 2024. The repository keeps the README and workflow screenshots.',
    },
    facts: {
      role: 'Team contributor',
      when: 'November 2024',
      team: 'Three-person hackathon team',
      stack: ['n8n', 'OpenAI', 'Pinecone', 'Google Drive API', 'Google Calendar', 'Gmail'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/volta_hackathon' }],
    },
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    tier: 'archive',
    visibility: 'described-only',
    description:
      'A used-car search app built around a conversation about your budget and what you need.',
    detail:
      'Co-founded with Huy Huynh as a ShiftKey Labs build at Dalhousie. A chat turned a request into a query over scraped listings with clean Carfax reports and returned up to five matches. It was pitched at the ImpactX conference in November 2024.',
    aliases: ['cargrep', 'cars'],
    casebook: {
      problem:
        'CarGrep set out to make used-car shopping less work. Its landing page names three pains: too many sites to switch between, good deals going to whoever checks first, and not knowing what to compare. The idea was to let people describe what they need in plain words and get a short list back.',
      discovery:
        'Discovery ran through the product itself. After sign-up, a six-question survey asked about weekends, road trips, buying priorities, storage, a dream vehicle and fuel economy, a feedback form collected ratings and messages, and the landing page gathered a waitlist. Eduard and Huy Huynh pitched an early version at the ImpactX conference in November 2024.',
      decisions:
        'Every chat message spent one token from a per-user balance, and the chat refused when tokens ran out, which kept model costs bounded while testing. The query step could only return five cars, and a request outside that scope got an apology rather than a guess. The listings job dropped cars without a price or a clean Carfax report.',
      testing:
        'The app had Jest tests for the chat, the survey, sign-up and login, and GitHub Actions ran the tests and a build on every push. In February 2025 the front end was rebuilt on Next.js 15 and the tests moved to Vitest.',
      architecture:
        'The first version was a Next.js app on Supabase. The chat went through the app’s API to an n8n workflow, where GPT-4o-mini turned the request into a query on the listings table and GPT-4o summarised each match with price, mileage, transmission and Carfax status. A Python job run from GitHub Actions pulled listings through a scraper service.',
      team: 'Eduard co-founded CarGrep with Huy Huynh as a ShiftKey Labs build at Dalhousie, and they split the commits about evenly. Eduard built the n8n chat agent, the chat page and its tests, the CI pipeline, the survey, the token system and the listings job; Huy built the landing pages, sign-up and login, the chat interface and the car-data loaders.',
      hard: 'Getting listing data was the hard part. In April 2025 Eduard and Huy tried an agent on Azure OpenAI that crawled dealership inventory pages directly; one dealer’s site loaded its inventory with JavaScript, so the crawler only saw a fallback page, and the two model calls in each search were slow.',
      status:
        'Development ran from October 2024 to April 2025, and cargrep.com now hosts a waitlist.',
    },
    facts: {
      role: 'Co-founder and builder',
      when: '2024–2025',
      team: 'Eduard and Huy Huynh',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'n8n', 'OpenAI', 'Python'],
      links: [{ label: 'Website', href: 'https://www.cargrep.com' }],
    },
  },
  {
    slug: 'network-sim',
    title: 'Q-Learning Network Simulator',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A network simulation comparing learning-based routing with shortest-path and congestion-aware routing.',
    detail:
      'A CSCI 4179 group research project at Dalhousie in early 2025 with Ethan Rozee and Jack Whitmer, built with Python, SimPy and NetworkX. It compares Q-routing with fixed shortest-path tables and a simplified OSPF-style router.',
    aliases: ['network', 'routing', 'q-learning'],
    casebook: {
      problem:
        'For a CSCI 4179 group project at Dalhousie in winter 2025, Eduard, Ethan Rozee and Jack Whitmer set out to test whether Q-learning can make good routing decisions without a full model of the network. The papers they reviewed reported Q-learning routing beating traditional schemes, and they wanted to check that in simulation.',
      discovery:
        'Their February proposal reviewed three papers and planned Q-learning load balancing across three wireless access points in GNS3 with Gymnasium, measured by throughput, delay and packet loss. The team ended up writing its own simulator with SimPy and NetworkX and studying hop-by-hop routing instead.',
      evidence:
        'An AI-assisted test run on March 21, 2025, before OSPF replaced a simpler least-cost baseline, put Q-routing close to Dijkstra. On a 12-node network its average delay was 0.0838 s against Dijkstra’s 0.0625 s with no packet loss; on a 12-node ring with cross-links it delivered 9,338 packets to Dijkstra’s 9,336.',
      findings:
        'Results depended on the network. Q-routing sees only its neighbours’ buffers while the other routers see the whole network, and after Ethan reworked the OSPF router’s link costs, OSPF was the best router in every test they ran.',
      testing:
        'To keep comparisons fair, a shared random number generator gave every router the same traffic, and the simulation was reworked so a router is blocked only while deciding. Q-learning settings were tuned with a grid search and Optuna; the demo uses a learning rate of 0.5, a discount factor of 0.99 and an exploration rate of 0.1.',
      architecture:
        'SimPy runs discrete events and NetworkX holds the topology, and each node has a queue and a router. Dijkstra uses fixed shortest-path tables, the OSPF-style router recomputes paths from queueing, transmission and propagation time, and Q-routing picks a neighbour from a table keyed on the destination and neighbour buffer levels.',
      team: 'Eduard set up the first simulator environment and the package structure, ran the topology comparisons and wrote the README. Ethan Rozee built most of the routing, the OSPF router and the demo; Jack Whitmer added the simulator hooks, the Q-learning rewards, two-way links and the burst traffic generator.',
      hard: 'Results were sensitive to topology, traffic and random seed, so a fair comparison needed shared traffic and careful tuning of the learning parameters.',
      status:
        'The code was finished on April 8, 2025, ahead of the final report deadline, and is public.',
    },
    facts: {
      role: 'Research contributor',
      when: 'February–April 2025',
      team: 'Three-person team',
      stack: ['Python', 'SimPy', 'NetworkX', 'Q-Learning', 'Optuna'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/q-learning-network-sim' },
      ],
    },
  },
]

export const caseStudies = projects.filter((project) => project.tier === 'case-study')
export const archiveProjects = projects.filter((project) => project.tier === 'archive')
export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
export default projects
