// What the guide can say about how a project was worked out, one short note per topic.
export type CaseTopic =
  | 'problem'
  | 'discovery'
  | 'evidence'
  | 'findings'
  | 'decisions'
  | 'testing'
  | 'architecture'
  | 'ai'
  | 'team'
  | 'hard'
  | 'status'

export interface Project {
  slug: string
  title: string
  tier: 'case-study' | 'archive'
  beat?: 'systems' | 'private-local' | 'adoption' | 'design'
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
    slug: 'keeper',
    title: 'Keeper',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'described-only',
    description:
      'Meeting notes and dictation for the AI-First team, running on hardware the company owns. It replaced two paid subscriptions.',
    detail:
      'Keeper for Mac records Teams calls without a bot and transcribes them on the Mac. A server on the company’s DGX Spark stores every meeting in SQLite, summarises it with an open-weights model and makes it searchable from a web page and from Claude or ChatGPT over MCP. Eduard designed and built it; a local model in his dgx-autonomy loop wrote the first version.',
    aliases: ['keeper', 'meeting', 'notetaker', 'archive', 'dictation', 'fireflies', 'transcript'],
    outcome: 'It is our team’s notetaker now, and we switched off both subscriptions it replaced.',
    casebook: {
      problem:
        'AI-First’s team recorded calls with Fireflies, a bot that joins each meeting and keeps the transcripts on its own servers, and dictated with Wispr Flow. Eduard wanted both jobs done on hardware the company owns. Turning speech into text and tidying a paragraph are small jobs that small open models handle without a frontier model, a bill per seat or a rate limit.',
      decisions:
        'Recording starts by itself when a Teams call begins, and a small floating indicator shows it with a Stop button. A meeting belongs to the person who recorded it: admins cannot open it, sharing is read-only, and a meeting that is not yours looks the same as one that does not exist. Each person connects Claude or ChatGPT with their own sign-in. Tasks, reminders, calendar changes and voiceprints were left out; an action item is a record of what was said.',
      testing:
        'The server has about 1,300 Python tests and the Mac and iPhone code about 1,600 Swift tests. They cover who can see a meeting on every surface, repeat uploads, paging, recovery and MCP over a real server connection.',
      architecture:
        'The Mac app records the microphone and the Mac’s own audio as two channels, writes a live transcript with a streaming speech model and transcribes again after the call with a slower, more accurate one. The server is one Python (FastAPI) process with one SQLite file and full-text search, on a DGX Spark. New meetings join a summary queue, so a busy GPU only delays a summary. The web page, the REST API and the MCP tools read through one access rule.',
      ai: 'Models do the jobs that need one: speech to text, telling speakers apart, summaries and tidying long dictations. Rules format spoken numbers and lists and protect web addresses, search is a keyword index that needs no model, and each person’s vocabulary is learned by counting spellings in their own meetings. A model’s cleanup replaces the rule-based text only if it passes a check: it cannot add a greeting or change a number. Ask Keeper answers a question only from lines a search found, and refuses an answer that cites a meeting the model was not shown.',
      team: 'A local model in Eduard’s dgx-autonomy loop wrote the first server and Mac app. Eduard took it over on October 13, 2026 and has built it since with Claude Code, on branches reviewed and merged through pull requests.',
      hard: 'Building it took weeks; getting a whole team to use all of it takes longer. That is why recording starts by itself, and why Keeper has an adoption page that shows where people have stopped using it and what would help.',
      status:
        'Keeper is the team’s notetaker and dictation app. Fireflies and Wispr Flow were switched off in November 2026. The Mac app updates itself. The code is private.',
    },
    facts: {
      role: 'Design and development',
      when: 'September 2026 – present',
      team: 'Eduard, with Claude Code; first version by a local model in dgx-autonomy',
      stack: [
        'Swift',
        'Python',
        'FastAPI',
        'SQLite FTS5',
        'MCP',
        'Parakeet',
        'Nemotron',
        'Sortformer',
        'Qwen',
      ],
      links: [],
    },
  },
  {
    slug: 'keystone',
    title: 'Keystone',
    tier: 'case-study',
    beat: 'systems',
    visibility: 'described-only',
    description:
      'Internal operations software for AI-First. Staff and Claude use one registry of operations, under the same permissions.',
    detail:
      'Eduard leads a four-person development team and designed Keystone’s architecture. Every operation is declared once in a registry; the web app calls it and the Claude tools are generated from it, so staff and Claude do the same things under the same permissions. It links the company’s records across SharePoint, Linear, QuickBooks and Outlook.',
    aliases: ['keystone', 'gtm', 'scorecard', 'revenue', 'operations'],
    outcome:
      'I designed the architecture and lead the build. It is deployed, and we are rolling it out, switching features on one at a time.',
    casebook: {
      problem:
        'AI-First runs on SharePoint, Linear, QuickBooks and Outlook, and none of them can answer a question that crosses two of them, such as whether a project made money. Eduard mostly built the company’s first dashboard on his own, without asking the people who would use it. It collected more than anyone read, people stopped trusting its numbers, and its Claude tools were written by hand beside the app, so the two drifted apart.',
      discovery:
        'Keystone started with the people. Eduard interviewed AI-First’s leadership team, the founder, the head of operations and the head of delivery, about the questions they need answered to do their jobs, and answered his own set as head of tech. A business analyst, a Master of Digital Innovation student, turned the answers into a scorecard prototype.',
      evidence:
        'People describe a tidier version of how they work, so Eduard checked the interviews against behaviour. Agents measured which features of the old dashboard were being used, read-only, in the production database.',
      findings:
        'Every number already had a home: plans in Linear, time in Outlook, money in QuickBooks and signed work in SharePoint. What was missing was the link between them and agreed definitions. The founder said he would rather ask Claude for a number than open a page of charts.',
      decisions:
        'Keystone keeps the join, not the files: SharePoint keeps files, Linear keeps tasks and QuickBooks keeps the ledger, and QuickBooks is read-only for good. Every metric names the role that owns it, the question it answers, its source and how often it updates, and a metric waiting for data says so instead of showing zero. Targets and status colours on anyone’s capacity, and views that no meeting uses, were left out.',
      testing:
        'The scorecard was tested as a prototype first: 25 measures across eight views with sample data. In the code, about 4,500 test cases run on every pull request, and about 1,500 of them check the row-level access rules against a real database.',
      architecture:
        'Each operation is declared once in a registry with its input, its permission and its code; there are about 150. The web app calls them and the MCP tools Claude uses are generated from the same entries, so a tool cannot exist without the operation behind it. Claude signs in as the person, every request runs under the database’s row-level rules, and no request carries an admin key.',
      ai: 'There is no model inside Keystone. The numbers are SQL, the sentence explaining each metric comes from a template a person wrote, and alerts are rules such as an opportunity untouched for fourteen days. The AI is the Claude each person already uses, which comes in through the same registry with the same permissions.',
      team: 'Eduard wrote the requirements and the technical design and built the first phase himself: sign-in, the registry and the generated Claude tools. Developers on his team have built most of what followed from tickets cut from the design. He reviews the Linear issues and what merges to main, and still builds some parts himself.',
      hard: 'The hard parts are not code. A metric means nothing until someone owns it and its definition is agreed, and people have to change how they work for the numbers to be right. Eduard said in the first brainstorm that change management would matter more than the software.',
      status:
        'Keystone is deployed and the team is rolling it out, switching features on one at a time. The old dashboard stays in charge until one planned switch-over. The code is private.',
    },
    facts: {
      role: 'Architect and engineering lead',
      when: 'August 2026 – present',
      team: 'Eduard, three developers on his team and a business analyst',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Postgres RLS', 'MCP', 'Zod', 'Vercel'],
      links: [],
    },
  },
  {
    slug: 'lyfe',
    title: 'lyfe',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'public-repo',
    description:
      'A private iPhone app for one person’s routines and goals: the gym, breath training, study, food and money.',
    detail:
      'Eduard built lyfe for himself: an iPhone app in Swift and a Rust backend on a DGX Spark, reachable only over a private network. The backend alone decides what counts and whether a streak is alive. Two open-weights models have narrow jobs, estimating a meal from a photo and drawing meals and food icons; everything else is rules.',
    aliases: ['lyfe', 'routines', 'streak', 'breath training', 'food log'],
    outcome: 'It runs on my own phone, and I built it one working step at a time.',
    casebook: {
      problem:
        'Eduard only buys software he can’t build himself. He can’t build a bank or a brokerage, but he can build an app for his own routines and goals that shows exactly what he needs, the way he wants it. lyfe keeps the gym, breath-hold training, study and food logging going, holds them to a few goals, and shows where his money goes and how far he is from financial independence. The data sits in lyfe’s own database on a machine he runs, not in a budgeting app’s cloud, next to a model he can later point at it; today no model touches money. An earlier attempt covered every part of his life at once and he stopped using it, so lyfe started with one routine.',
      decisions:
        'The backend is the single authority and the phone only captures, because with one user two-way sync risks the two disagreeing about a streak. The app is Swift because notification replies, a timer under the lock screen and the barcode scanner need Apple’s frameworks; the backend is Rust. Nothing outside can call in: the backend asks Garmin and the bank bridge for new data.',
      testing:
        'The backend has about 320 tests, about 110 of them against a real database, and the Swift package about 350. Each step of the build plan worked end to end, from capture to a screen, before the next one started.',
      architecture:
        'An iPhone app in Swift talks to a Rust backend with PostgreSQL on a DGX Spark, over a private Tailscale network. lyfe has its own sign-in, a token per device and a database with no network port, and a nightly backup leaves the machine encrypted. The phone records offline and sends records later, each with an id made on the phone so a retry counts once.',
      ai: 'Two models have three narrow jobs. A photo of a meal goes to an open-weights vision model on the Spark; its numbers are marked as an estimate with a range, kept apart from measured ones, and discarded if they cannot be true. A second model redraws the photo as an illustration, drew an icon for each catalogue food, and never touches a number. Streaks, what counts as a session, goals, reminders and spending categories are plain rules.',
      team: 'Eduard is the only user and the only author. He built it with a coding agent from a written glossary, decision records and a fifteen-step plan.',
      status:
        'Started in November 2026. The gym, breath, study, food, goals and money parts are installed on his phone, and the code is public.',
    },
    facts: {
      role: 'Design and development',
      when: 'November 2026 – present',
      team: 'Solo, with a coding agent',
      stack: ['Swift', 'Rust', 'PostgreSQL', 'Tailscale', 'Ollama', 'FLUX.2', 'DGX Spark'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/lyfe' }],
    },
  },
  {
    slug: 'dgx-autonomy',
    title: 'dgx-autonomy',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'public-repo',
    description:
      'A setup that lets a local open-weights model build software unattended on one DGX Spark, graded by tests it cannot edit.',
    detail:
      'Eduard designed the controller around OpenHands and built it with Claude Code. It freezes the brief and the tests, replaces a full conversation with a fresh one that reads a handoff note, checks every claim of completion in separate containers and holds passing builds for review. Recent builds ran Qwen3.8-Flash-Next through SGLang with NVFP4 weights. It built Shoreline, the original Camp Yahtzee release and the first version of Keeper.',
    aliases: ['dgx', 'autonomy', 'autonomous loops', 'local ai', 'qwen', 'spark'],
    outcome:
      'It built Shoreline, Camp Yahtzee and the first version of Keeper. The local model wrote the code, and I set the direction.',
    casebook: {
      problem:
        'Eduard wanted to know how far an open-weights model could get on a desk-sized machine if he gave up speed and let it work for up to about 40 hours. A DGX Spark writes roughly 20 tokens a second, so the bet was patience over speed: the model had to stay on track, recover from its own mistakes and be judged by something other than itself.',
      discovery:
        'Before writing code Eduard worked through research questions, a research document, requirements, a technical design and a phased outline. The research inspected the machine directly and kept verified facts apart from estimates.',
      evidence:
        'Every model used first qualified on the machine with the whole workload running: tool-call probes, a prompt that fills most of the context with a word to recall from its start, a real build that must pass, and memory sampled throughout. On one build llama.cpp fell from about 25 tokens a second to 8 as the context filled; after SGLang qualified on the machine, the next build held 21 to 25.',
      findings:
        'Local models claim success early and with confidence, so finishing became a claim that frozen tests have to confirm. Tests are not taste: every product review found something the tests could not see, such as number keys drawn so that a 4 read as a 3.',
      decisions:
        'OpenHands runs the agent loop and Eduard’s controller owns everything around it. Memory is a structured handoff note the next conversation reads, and anything marked done has to cite a file or a test run. He moved from llama.cpp to SGLang after qualifying it on the machine.',
      testing:
        'About 390 tests run without a GPU or a model, and a separate set on the machine covers killed controllers and crashed stacks, a forced conversation reset, the network rules and the protected tests.',
      architecture:
        'A controller outside the sandbox freezes the brief and the tests with a fingerprint, keeps the deadline, and starts a fresh conversation from a handoff note when the context fills or the builder gets stuck. When the builder says it is done, the controller saves a snapshot, runs each frozen check in its own disposable container against the running demo, and throws the result out and reruns it if the code changed during the check.',
      ai: 'The model writes all of the code, plain code decides whether it is finished, and a person decides whether it is good. A Claude session supervised: it wrote the briefs and tests for two of the apps and reviewed the demos with Eduard.',
      team: 'Eduard designed the controller and built it with Claude Code. The local model wrote all the code in each build. A supervising Claude session wrote the Shoreline and Camp Yahtzee briefs and tests and reviewed the demos, and Eduard made the requests and decided what to accept.',
      hard: 'Handoffs needed enforcing. One builder ignored a request to hand off for 43 minutes while its context filled; a reminder after every three unrelated actions got a handoff within a minute.',
      status:
        'Built in a week in September 2026 and public on GitHub. It built Shoreline, the original Camp Yahtzee release and the first version of Keeper, which Eduard took over in October.',
    },
    facts: {
      role: 'Controller design',
      when: 'September–October 2026',
      team: 'Eduard, with Claude Code; a local model as builder; a Claude session as supervisor',
      stack: ['DGX Spark', 'Qwen3.8', 'OpenHands', 'SGLang', 'Python', 'Docker'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/dgx-autonomy' }],
    },
  },
  {
    slug: 'personal-website',
    title: 'This website',
    tier: 'case-study',
    beat: 'design',
    visibility: 'public-repo',
    description:
      'A small game set at Eduard’s cabin in Nova Scotia: walk around, meet his dog, and find his résumé and projects in the place.',
    detail:
      'Eduard rebuilt his site as a walkable 3D scene of his cabin, drawn with React Three Fiber in a pixel look. He directed every decision and a coding agent built it: each choice is logged, and every change is checked in a real browser before he reviews it. The guide, HUGO, only gives answers written ahead of time and approved by Eduard; a small model in the browser picks which one fits a typed question.',
    aliases: ['personal website', 'this site', 'this website', 'portfolio site', 'cabin'],
    outcome:
      'Live: the cabin, the woodshed, the brook and the fire, with every line approved by me.',
    casebook: {
      problem:
        'Eduard’s previous redesign was generated by a coding agent with almost no input from him. It looked like every other portfolio, and he rejected it. He wanted a site designed on purpose, where he decides the place, the story, each interaction and each line.',
      discovery:
        'The work started with a design brief, not code: the experience first, then art direction from reference boards and his own photos of the property, then a storyboard, then one small scene to test the feel before building more.',
      decisions:
        'Eduard directs and the agent builds: for every decision the agent offers options and one recommendation, then waits, and each decision is logged with his words. The work is in the place, with the résumé on the table in the cabin and past projects in boxes on the workbench, and a bar in the corner gives a direct route to his work, the résumé and his contact details.',
      testing:
        'Tests run the simulation directly: a guest can reach every spot the game walks them to, Rusty’s fetch and the fishing rules behave, the split wood lands where it should, and HUGO’s answers never speak as Eduard. Other tests keep the résumé and profile in step with the facts file and keep client names out of every tracked file.',
      architecture:
        'Next.js and React Three Fiber draw the scene; the pixel look comes from rendering at low resolution and scaling up, with toon shading and an outline pass. The world is a simulation in plain TypeScript with no 3D code, so ordinary tests can run it. Python scripts build every model in Blender, and one file holds the facts the site, the résumé PDF and his GitHub profile are built from.',
      ai: 'HUGO never writes a sentence. A small model running in the visitor’s browser only picks which prepared answer fits a typed question, and a keyword match does the same job on devices that cannot run it. Eduard’s answers at the fire are fixed too. When the model was allowed to answer freely it spoke as Eduard and invented hobbies, so that was removed.',
      team: 'Eduard gives the direction, the photos, the picks and the wording of key lines, and tests each build himself. Coding agents write the code and the Blender scripts.',
      status:
        'Live since November 2026. The cabin, the woodshed, the brook and the fire are open; the game has no sound yet.',
    },
    facts: {
      role: 'Direction and design',
      when: 'October 2026 – present',
      team: 'Eduard, with coding agents',
      stack: ['Next.js', 'React Three Fiber', 'three.js', 'Blender', 'WebLLM', 'TypeScript'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/personal-website' }],
    },
  },
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
      team: 'The local model, Qwen3.8-Flash-Next, wrote all 42 commits of the app on a DGX Spark. A supervising Claude session, acting as product lead for Eduard, wrote the Shoreline brief and checks, reviewed each claim and drafted feedback; it never commented on code. Eduard made the requests, decided to move the model to SGLang and accepted the result.',
      hard: 'A visual glitch above the weather icon took two rounds of feedback to remove. The first fix turned a sliver into a grey smudge, so the builder wrote a check that screenshots every sky and compares the pixels around the icon with the card’s CSS gradient.',
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
        'Development ran from October 2024 to April 2025. The site is no longer online and the code is private.',
    },
    facts: {
      role: 'Co-founder and builder',
      when: '2024–2025',
      team: 'Eduard and Huy Huynh',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'n8n', 'OpenAI', 'Python'],
      links: [],
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
