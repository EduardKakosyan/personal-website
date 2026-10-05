# Eduard website redesign plan

## Personal copy and commit breakdown — October 5, 2026

Rewrote the homepage introduction, biography, contact page, project summaries, search/social descriptions, and older project write-ups in a more conversational voice. The project notes now explain what was built and who worked on it, with awards and recorded test results kept in context. Guide notes stay in the third person so the guide does not speak as Eduard. Existing section IDs remain intact.

The accumulated website changes were committed in dependency order:

- `e6e273b`: Markdown formatting and heading anchors.
- `32db2ed`: Optional local inference worker and compatibility checks.
- `273b029`: Updated catalog, shared project knowledge, and retired ACDC content.
- `1b7b895`: Project guide, character, and responsive positioning.
- `25aee22`: Autonomy case study and project-page layout.
- `01b6da8`: Workshop homepage and site navigation.
- `2f0095e`: Homepage, contact, project index, and metadata copy.
- `31140ed`: Project notes and guide summaries.
- `aaa436a`: Plain-language explanations of the local agent builds.

Validation: ESLint, TypeScript, all 23 guide/layout/compatibility tests, and the production build passed. Generated HTML contains the updated homepage and contact copy, all 13 guide section destinations, and one main title on each of the 11 project pages. Browser automation reported no available browsers, so this pass has no new visual verification. Screenshots referenced elsewhere in this document are local review artifacts from earlier passes.

The user requested website changes only. Deleted Claude tooling, caches, and local screenshots remain uncommitted. No push or deployment was performed.

## Local model compatibility and replies — October 5, 2026

The guide now keeps its local-AI control visible while checking support and when unsupported, with a specific reason instead of silently hiding activation. The compatibility probe distinguishes insecure pages, absent WebGPU, unavailable adapters, insufficient storage-buffer limits, and failed checks. The installed runtime requires ten storage buffers per shader stage; the previously observed Firefox Metal adapter exposes nine. Compact mobile layouts retain the model controls.

Chrome on this Mac successfully downloaded/loaded the Light model and displayed “AI running on your device.” The user subsequently reported an unsupported-action error for “what is this about?”. The generation schema allowed action/target combinations that the execution validator rejected. Generation now pairs each action with its own targets, and ordinary questions use an answer-only schema. Introductory questions get portfolio notes when no specific project matches. Invalid, truncated, or unrequested model actions fall back to authored project notes without executing navigation.

Validation: TypeScript, ESLint, and 23 guide/layout/compatibility tests pass. Loading was verified in Chrome before the response changes. Native browser automation then failed to start its pipe, so the exact question has contract-test coverage but still needs a live generated-reply check. No browser settings changed; no deployment or push.

## Copy, Markdown, and project guide update — October 5, 2026

Replaced the homepage slogans with direct descriptions of Eduard’s work. Updated the project index, footer, dgx-autonomy headings, HUGO case study, and guide introduction to use the same plain style. The homepage now opens with “I build with local AI.”

Fixed the shared Markdown case-study layout: enabled the installed typography plugin, removed conflicting global heading overrides, centered the header and body in one column, and removed the duplicate leading Markdown title at the page boundary. Paragraphs, lists, links, code blocks, and tables now use consistent typography. Highlighted code spans survive the existing sanitizer. Markdown headings receive deterministic IDs for guide navigation.

The guide now offers three authored commands for each of its ten indexed projects. These replies work without inference. Eleven commands also move to a relevant section; all of those destinations were verified in the production HTML. Project-aware navigation keeps a request for tests on HUGO or Shoreline within that project, while an explicitly named project overrides the current page. The command registry still resolves through the existing validated action contract. The local model prompt now receives the current project and plain-language writing guidance.

EK—01 now has an articulated head, pointer attention, greeting waves, a listening expression while the visitor types, a thinking pose, smiling eyes and a nod for answers, and a puzzled expression for failures. Reduced motion and inference pauses use static poses. The non-WebGL fallback also changes its face with guide state.

Validation: TypeScript, ESLint, all 16 guide/layout tests, and the production build passed. Production HTML checks verified the eleven command section targets and single page titles on representative Markdown routes. In Chrome, HUGO’s voice-pipeline command returned its authored response and focused “How it works.” A final screenshot/animation inspection could not be completed after native browser automation reported no available window. No new browser-inference or device-performance benchmarks were run. No push or deployment.

## Workshop redesign — October 5, 2026

Reworked the homepage after visual review of the spatial-agent implementation. The current direction is a deep-teal local AI workshop with warm metal, a direct personal introduction (“Intelligence, put to work.”), and an uninterrupted route to selected projects. The hero now contains an authored React Three Fiber scene: a stylized DGX Spark enclosure, vent geometry, circular stage, and the existing EK—01 character. This is procedural illustrative geometry, not a manufacturer-supplied asset or a dimensionally accurate product model.

The hero scene responds subtly to the pointer. Animation pauses offscreen, in background tabs, during model initialization/generation, and with reduced motion. A CSS illustration provides a WebGL fallback. The compact guide appears when opened or after leaving the hero; explicit canvas dimensions replace the oversized floating hero canvas. The agent-capabilities tutorial has been removed so project evidence follows the introduction. Selected-work cards, biography, and contact now share the workshop palette and typography.

Validation: production build, TypeScript, ESLint, and all 12 existing guide/layout contract tests passed. Chrome visual checks covered the desktop page, the 400 × 844 phone viewport, loaded project/portrait images, and the WebGL fallback. The mobile “Meet the guide” action returned sourced project notes; “Local AI work” opened dgx-autonomy. Rounded the decorative HUGO waveform heights to eliminate a server/client hydration mismatch; a fresh load confirmed that warning was gone. Existing development-only analytics CSP warnings remain; security headers were not loosened. Browser model generation and real-device performance have not been newly benchmarked.

Review captures: `docs/screenshots/workshop-desktop.png` and `docs/screenshots/workshop-mobile.png`. Local preview at `http://localhost:3000`. No push or deployment performed.

## Spatial agent checkpoint — October 5, 2026

The visitor experience has been rebuilt around a persistent 3D guide. One React Three Fiber character is mounted outside route transitions. It has a chrome shell, dark visor, articulated arms, glowing eyes, and a small hover thruster. The hero is its landing spot; scroll and navigation move it into the page. Validated guide actions set a real DOM target. The character flies beside that heading or section and points toward the evidence. The speech bubble follows the character, with the latest answer, sources, an input, and optional conversation history. Closing the bubble leaves the agent pointing at its target.

The new visual system uses large editorial typography, charcoal and copper in the hero, an olive build-loop exhibit, expansive project layouts, and a larger portrait and contact invitation. The hero has a working question field, and the retrieve/explain/navigate controls are keyboard-accessible. ACDC remains absent from public content and navigation.

Layout calculations are shared with viewport tests covering desktop, narrow phones, offscreen targets, hero docking, and a keyboard-sized mobile viewport. The character and speech bubble occupy separate visible areas. Rendering respects reduced motion, is capped at 24fps, and pauses for background tabs, initialization, and model generation. Static fallback rendering remains available. Inference activation and action boundaries are unchanged.

TypeScript, ESLint, all 12 navigation and spatial-layout tests, and a source secret scan passed. Final visual QA in a separate Chrome window was requested because native Firefox automation repeatedly followed the user's active working window instead of retaining a dedicated preview window. Production build passed. Home, projects, dgx-autonomy, HUGO, Shoreline, and contact returned 200; the removed ACDC route and image returned 404. Production CSP, isolation, framing, MIME, permissions, and HSTS headers remain present. Separate-browser visual verification is awaiting permission. No push or deployment.

## Agent design checkpoint — October 5, 2026

The active visual direction is now a 3D local AI companion, EK—01. The DGX Spark hero has been replaced with a procedural ceramic character, dark visor, articulated arms, illuminated eyes, orbital halo, and projected pedestal. Pointer tracking, blinking, greeting and presenting gestures respond to actual guide state. A dark hero introduces Eduard's work; direct shortcuts lead to autonomous systems, HUGO, and Shoreline. The guide opens beside the desktop character and becomes a bottom panel on small screens.

Rendering is capped at 24 frames per second, stops offscreen and during model work, and respects reduced motion. WebGL loss has a static fallback. Inference remains opt-in and entirely visitor-local; no serving endpoint or security permissions were added. Generated inference still needs qualification in a browser meeting the WebLLM storage-buffer requirement described below.

At Eduard's request, ACDC Dashboard has been removed from both project registries, the case-study description, public screenshot, suggested prompts, navigation allowlist, and guide knowledge. The featured lineup is now dgx-autonomy, HUGO, and Shoreline. Earlier planning sections below record the superseded direction.

Validation: production build, TypeScript, ESLint, nine guide contract tests, and source secret scan passed. Production checks returned 200 for home, projects, the four current lead case studies, and contact; the removed project URL and screenshot return 404. Served pages contain no ACDC references. Existing CSP, cross-origin isolation, framing, MIME, permissions, and HSTS headers remain present. Desktop visual inspection confirmed the actual 3D mesh and guide state changes; narrow-screen inspection covered the project cards. The final mobile hero and real generated-model performance still need a dedicated device pass. No deployment or push was performed.

## First implementation checkpoint — October 5, 2026

The first visitor journey is implemented in the existing Next.js application. The home page now uses a warm workbench design with an original procedural DGX Spark, instanced vent geometry, materials, lighting, a static fallback, pointer response, and an emerging guide. Rendering pauses offscreen and during model work, with reduced-motion support. This is the first 3D asset; a compressed, production mesh and further authored character gestures remain future refinements.

The featured lineup is dgx-autonomy, HUGO, and ACDC Dashboard. Shoreline and Camp Yahtzee have portfolio entries, screenshots, live links, and attribution for the original autonomous releases. The dgx-autonomy case study includes a six-stage recorded-run reconstruction with play, pause, reset, stage selection, and source links. VoxCoach remains an archived route and is excluded from the featured home page and guide index.

The persistent guide reads a shared public content registry. Project notes and explicit navigation work without inference. Optional WebLLM runs in a worker after activation; no model initializes automatically and no DGX endpoint exists. Generated actions pass a strict Zod contract, use allowlisted IDs, and are validated again at execution. Loading and generation are bounded; conversation state stays in memory on the visitor's device.

Validation completed:

- Production build, TypeScript, and lint passed. Build required network access for the existing Google Fonts integration.
- All eight navigation/retrieval/security contract tests passed (`pnpm run test:guide`).
- Source secret scan found no leaks.
- Home, projects, dgx-autonomy, Shoreline, Camp Yahtzee, HUGO, and contact returned HTTP 200 under the production server.
- Existing CSP, isolation, framing, MIME, permissions, and production HSTS headers were verified. Header permissions were not expanded.
- Firefox visual checks covered the hero, vent rendering, emerging guide, conversation persistence across navigation, fallback project answers, and replay controls; responsive checks used a 402 × 874 viewport.

Firefox exposed a WebGPU adapter with nine storage buffers per shader stage; this installed WebLLM runtime requires ten. Model loading was attempted and this incompatibility reproduced. The provider now detects that limit before offering a download. End-to-end generated replies, model switching, cancellation during real generation, and simultaneous GPU performance still need validation in a compatible browser. The original model tiers remain configured pending those benchmarks; this milestone does not claim a newer model has been qualified.

Remaining planned work includes a complete recent LinkedIn/work inventory, additional case studies, richer guide gestures and tours, a genuine workflow demo against synthetic browser-local records, device/model benchmarks, and a narrower CSP based on measured dependencies. No deployment or push was performed.

## Planning baseline

Draft dated October 5, 2026. This plan proposes a portfolio for AI and engineering employers and collaborators, built around Eduard's work in local AI, agents, business systems, and education. The selected direction is an interactive local AI lab: a carefully modeled DGX Spark is the centerpiece, with an agent emerging from it to help visitors discover relevant work. The first milestone is one polished visitor journey that proves the visual quality, useful agent behavior, and performance together.

Eduard confirmed that all inference must run in visitors' browsers. He owns a DGX Spark, but it is heavily used and will not serve this website. The canonical website is `https://kakosyaneduard.ca` and LinkedIn is `https://www.linkedin.com/in/eduard-kakosyan`. VoxCoach is excluded from the proposed featured lineup. Eduard identified his newer autonomous agent loop system, now located as `dgx-autonomy`, as a project to include; it is the recommended lead case study. The remaining project order and the guide's exact appearance remain open decisions. No application changes or deployment are included in this planning phase.

## Current site and verified gaps

The app lives in `personal-website/`. It already uses Next.js 16, React 19, Three.js, React Three Fiber, Drei, Motion, and WebLLM. The latest local content commit is April 1, 2026. Existing project routes cover ACDC Dashboard, Claude Autonomous, VoxCoach, Dev Template, HUGO, HealthByte, Second Brain, CarGrep, and the Q-Learning Network Simulator.

The current 3D hero is a particle network. The shared WebLLM provider initializes automatically and chooses Qwen2.5 0.5B or 1.5B based on device classification; a Hermes 3B option is also configured. The assistant can navigate to mapped pages, projects, and sections. Its current runtime uses immediate keyword navigation followed by streamed replies and a legacy tool-tag fallback. JSON tool schemas exist but are not connected to that shared streaming path.

Content and assistant facts drift independently. Project descriptions, two chatbot prompts, tool maps, and guardrail keywords each embed project information. Consolidating these into a shared source is essential before adding more projects or behavior.

The public [HUGO repository](https://github.com/EduardKakosyan/hugo) now describes a DGX Spark and Reachy Mini with local speech recognition, reasoning, tool use, and speech synthesis. The website describes an earlier Go implementation. Treat this as a version mismatch to reconcile with Eduard, rather than combining both descriptions into one current stack.

The public [GitHub profile](https://github.com/EduardKakosyan) says 40+ clients, while the chatbot says 20+. Confirm the current number and what it measures before publishing it. Site metadata also references `eduardkakosyan.com`, while the public website and social links use [kakosyaneduard.ca](https://kakosyaneduard.ca/). Reconcile canonical URLs and LinkedIn identifiers.

Research covered the local repository, selected public repositories, and discoverable LinkedIn posts. Follow-up GitHub API research identified September 2026 work missing from the site: `dgx-autonomy`, Shoreline, and Camp Yahtzee. It did not establish a complete list of recent posts or private work. Visual inspection of the running site, deployed security headers, and build checks remain implementation prerequisites.

## Visual direction and visitor experience

The chosen concept combines the hardware and an emerging guide. The following alternatives explain the selection; future visual exploration should compare treatments within the combined direction:

| Direction | Experience | Main tradeoff |
| --- | --- | --- |
| Local AI lab | Realistic DGX Spark, deliberate lighting, hardware details, interactive workflow exhibits | Hardware can dominate the personal story |
| Personal guide | HUGO-inspired Reachy Mini welcomes visitors and highlights relevant case studies | Character quality needs excellent modeling and animation |
| Combined lab and guide | DGX Spark anchors the hero; the guide connects hardware, projects, and outcomes | Most distinctive, but requires coordinated assets and behavior |

Use editorial typography, generous space, real screenshots, and an accent color informed by Eduard's preferences. On activation, the agent emerges from the Spark through an authored animation; a compact persistent guide then accompanies exploration. A HUGO-inspired identity is a candidate, subject to Eduard's preference. Give the guide personality through restrained gestures, conversational copy, and responses to actual interaction. Personal details such as photography and life in Halifax can make the site feel authored by a person.

For visual exploration, compare a precision lab with restrained materials and close-up hardware detail; a personal workbench with warmer lighting, project artifacts, and photography; and a cinematic startup sequence that resolves into a clear portfolio. Each treatment must include the Spark, emerging guide, readable project evidence, and a responsive mobile version. Keep cinematic sequences skippable.

For employers and collaborators, the home page should quickly establish what Eduard can build and provide direct access to selected work, repositories, and contact. Case studies should show architectural judgment, ownership, difficult constraints, and measured outcomes. The primary journey is exploring relevant engineering work and starting a conversation about a role or collaboration.

Example journey: a visitor asks, "Show me where Eduard built an agent that actually does work." The guide retrieves a relevant case study, introduces it briefly, opens its page, and highlights the workflow section. It can then compare that project with another or lead a short tour. Ordinary links and project browsing remain available throughout.

Narration starts as text. Spoken narration is an optional later feature, with sound explicitly enabled by the visitor. Microphone interaction is a separate decision because the current Permissions Policy disables microphone access.

## Pages and content

The proposed site has a concise home page, selected work at `/projects`, individual case studies at existing project URLs, a local AI lab at `/lab`, and contact at `/contact`. Consider a resume download when a current resume is available. Add a writing or field-notes route only if there is enough material to maintain it. Keep old project URLs working; redirect any renamed routes.

Each case study should explain the problem, Eduard's contribution, implementation choices, outcome, limitations, and links to evidence. Use screenshots, diagrams, demos, and short clips where they make the work easier to understand. Metrics need a source and measurement context.

Initial content candidates are:

- dgx-autonomy as the lead case study: a local autonomous build environment with external verification, durable handoffs, and product review, with Shoreline and Camp Yahtzee as inspectable outputs.
- HUGO and local embodied AI, based on its current repository and confirmed deployment details.
- ACDC Dashboard and its MCP integration. Eduard's [operations post](https://www.linkedin.com/posts/eduard-kakosyan_ai-mcp-smallbusiness-activity-7439679741760090112-gORm) describes a transcript-to-CRM workflow and conversational reporting.
- Teaching, curriculum development, and workshops as a dedicated body of work, with confirmed dates and outcomes.
- Hackathon and research projects as supporting evidence, selected by relevance to the intended audience.

Claude Autonomous can provide historical context for the evolution toward dgx-autonomy if useful. VoxCoach is excluded from featured content at Eduard's request; its existing route remains part of the current-site inventory until an explicit route decision is made.

Create a content registry that feeds pages, assistant retrieval, suggested questions, route maps, and related-project links. Records should include stable IDs, dates, role, status, tags, public summary, evidence URLs, outcomes, and last verification date. Distinguish a project's original release from its current status.

For refreshes, collect GitHub repository and release changes plus LinkedIn posts or exports into proposed updates. Convert them into case-study changes and short field notes. Work material contributes public summaries with appropriate detail for a personal website. Publish reviewed content snapshots; the visitor assistant reads those snapshots. Automated collection and scheduled refreshes can follow once sources and ownership are settled.

## Lead case study for dgx autonomy

The public [dgx-autonomy README](https://github.com/EduardKakosyan/dgx-autonomy/blob/main/README.md), [model configuration](https://github.com/EduardKakosyan/dgx-autonomy/blob/main/config/models.yaml), and recent commits were read directly through the GitHub API on October 5, 2026. The latest returned commit is dated September 29. The proposed case-study narrative is: Eduard built the environment that lets a local model keep working, recover across conversations, and prove its output against criteria outside its control.

The system uses an OpenHands builder on one DGX Spark with Qwen3.8-Flash-Next. The repository supports llama.cpp and SGLang; the documented recent app runs use SGLang with an NVFP4 checkpoint and multi-token prediction. A qualified Qwen3.6-35B-A3B fallback is also configured. Explain backend choices through their effect on sustained long-context work, using measurements labeled with their workload and context size.

The architecture exhibit should walk through planning, frozen brief and acceptance checks, sandboxed build actions, context handoffs, independent evaluation, product review, and final acceptance. Distinguish the builder claiming completion from the environment verifying checks and the operator accepting the product. The controller pins a snapshot, tests it in disposable evaluator containers, and rejects mutation during evaluation. The builder has no Docker socket, host or LAN access, API keys, or ability to modify the frozen checks, according to the documented boundary.

Use two outputs as evidence:

| Output | Documented evidence | Attribution and timing |
| --- | --- | --- |
| [Shoreline](https://github.com/EduardKakosyan/shoreline) and [live app](https://eduardkakosyan.github.io/shoreline/) | Weather-to-coastal companion across three runs; final run passed 19/19 checks. The framework README reports 78 tests under those checks. | September 24–28, 2026. The app README describes the builder history and a separate final documentation commit. Briefs and product feedback came from the operator and a supervising Claude session. |
| [Camp Yahtzee](https://github.com/EduardKakosyan/yahtzee) and [live app](https://eduardkakosyan.github.io/yahtzee/) | Original release passed 24/24 frozen acceptance tests; its own rules audit covered all 7,776 possible rolls. | Original loop ran September 28–29 over about 24 hours of wall-clock time and four conversations. Later undo/reset and game-management controls were added separately through CodeLayer. |

The 40-hour figure is the environment's configured maximum run budget, not a claim that every app needed or completed 40 uninterrupted hours. Claims about app authorship should refer to the recorded original release, with later maintenance identified separately. Published check counts and timings are repository-reported evidence; this planning phase has not rerun those tests.

Keeper, a self-hosted meeting memory, is listed as in progress in the framework README. Confirm its current state before treating it as a completed project.

For the website, propose an interactive replay built from recorded run milestones. The Spark lights up as the visitor follows build actions, handoffs, failed claims, evaluator results, and product feedback; completion exposes the resulting app and its evidence links. Label this as a recorded run replay. The portfolio guide still uses a small model in the visitor's browser and can explain the architecture, compare outputs, or jump to a source. It does not execute the DGX build system or connect to Eduard's machine.

## 3D production and animation

Model the DGX Spark from reference views and verified dimensions. Evaluate any available asset for reuse rights and quality; otherwise build an original asset. Use a mesh asset workflow for accurate bevels, vents, ports, materials, and lighting. Prototype geometry can establish interaction, but final asset quality needs visual review from several angles.

Produce a compressed GLB, optimized textures, a simpler rendering tier, and a static poster. Model the guide after HUGO's embodied identity if that direction is selected. Deliver intentional states for idle, listening, retrieving, presenting, navigating, completion, and failure. Animation follows application state; the model chooses permitted actions and the renderer executes authored gestures.

Use one persistent scene where practical, defer asset loading, pause offscreen rendering, respect reduced motion, and provide adaptive quality. React Three Fiber documents [on-demand rendering and resource reuse](https://r3f.docs.pmnd.rs/advanced/scaling-performance). Benchmark rendering while inference is running; a worker reduces UI blocking but does not eliminate competition for GPU resources.

## Agent behavior and inference

The guide should perform a bounded workflow: understand the request, retrieve evidence, select a permitted action, execute it, observe completion, and explain the result. Useful tools include `search_work`, `open_project`, `highlight_section`, `compare_projects`, and `start_tour`. Arguments use stable registry IDs rather than generated URLs, CSS selectors, or code.

Validate structured actions before execution. Limit steps, generation time, and repeated actions; support cancellation and recovery. Complete navigation before highlighting and move focus appropriately. Direct commands should work without waiting for a model. Suggested tours also provide a useful fallback when inference is unavailable.

All inference runs in the visitor's browser using on-demand WebLLM and models benchmarked for the actual tasks. Use a shared application controller and a worker-backed engine, with one active generation at a time. Retrieval reads a compact public content index; start with lexical and tag-based retrieval, and add local embeddings only if evaluation demonstrates a useful gain. Handle cancellation, retries, context limits, model switching, and unsupported devices.

The 3D Spark represents Eduard's own hardware and local AI work. The interface should clearly state that the website assistant runs on the visitor's device. There is no DGX inference endpoint, cloud inference fallback, or dependency on Eduard's machine. Model weights still need an initial download, and website analytics are separate from inference privacy.

Use WebLLM's supported worker integration to separate computation from the UI; its [official documentation](https://webllm.mlc.ai/docs/) describes browser inference and worker support. Download models after a visitor activates the assistant, show progress and retry controls, and keep chat state consistent across pages. Benchmark retrieval and tool accuracy before selecting a newer or larger model.

An optional second demo can execute a genuine business workflow against synthetic records stored in the browser, with visible intermediate steps and results. It should have its own restricted tools and data, and demonstrate actual local state changes rather than a prerecorded animation. The public portfolio guide should not receive access to Eduard's production CRM, inbox, private repositories, or operating systems.

## Security controls to preserve and strengthen

Preserve input validation, DOMPurify and SecureContent rendering, allowlisted navigation, anti-framing headers, MIME protections, production HSTS, secret scanning, git hooks, and CI checks. Keep cross-origin isolation working wherever the inference runtime requires it.

The current CSP allows `unsafe-inline`, `unsafe-eval`, broad HTTPS/WebSocket connections, and images from arbitrary HTTPS hosts. Record the actual model, worker, asset, and analytics dependencies, then narrow permissions with compatibility checks. Evaluate narrower WebAssembly permissions against the selected runtime rather than assuming the existing broad exception is unavoidable.

Regex topic filters can support conversational scope; they are not the authorization boundary for tools. Treat imported content and model output as untrusted data. Validate action names and arguments independently of replies, reject unknown targets, and prevent external navigation or code execution through model output.

Enforce browser-side generation deadlines, step limits, and cancellation for resource use and user experience. They do not authorize access to external systems. The existing rate-limit schema alone does not implement enforcement. If a real contact submission service is selected later, its endpoint will need server-side validation and abuse controls; today the contact form prepares an email in the visitor's mail client.

Keep assistant messages out of analytics. Review search-query tracking and other free-text events so the site's privacy claims describe the actual data flow.

## Delivery sequence and acceptance criteria

1. **Complete discovery.** Confirm featured projects, personal style references, guide identity, and content sources. Use the confirmed employer/collaborator audience, hybrid concept, canonical domain, and browser-only inference. Record the current production behavior, headers, and performance.
2. **Compare visual treatments.** Create focused treatments of the DGX Spark and emerging-agent concept with the same headline, featured project, and guide interaction. Use the same brief and acceptance criteria for the Claude and GPT experiments; keep implementations isolated for a fair comparison. Compare visual craft, factual accuracy, useful behavior, accessibility, performance, and security preservation.
3. **Prove one complete journey.** Build the home hero, one verified case study, and request-to-retrieval-to-navigation-to-highlight behavior. Include loading, unsupported-device, reduced-motion, and error states.
4. **Build the content foundation.** Introduce the shared registry, refresh selected work, remove duplicated assistant facts, and reconcile metadata and routes.
5. **Finish assets and expand the guide.** Add the final 3D assets, authored animation states, comparisons, tours, and measured inference choices.
6. **Validate release readiness.** Run lint, type checking, production build, and secret scanning. Add targeted tests for action validation, retrieval grounding, navigation timing, cancellation, malicious content, and fallbacks. Check keyboard access, mobile layouts, WebGPU failures, context loss, deployed headers, and rendering during inference.
7. **Prepare deployment.** Review the completed preview, finalize content, and deploy when the implementation phase includes publishing. Add refresh automation after the editorial flow works.

Proposed quality targets are a usable page before any model download, LCP at or below 2.5 seconds, INP at or below 200 ms, and CLS at or below 0.1 on agreed representative devices and networks. Target 60 fps on the selected desktop baseline with adaptive quality elsewhere. Measure both first-load and warm-cache assistant behavior; set response latency targets after benchmarking the selected hardware and models.

The core acceptance journey is: "Show me Eduard's local AI work" returns sourced information, reaches the correct case study, highlights the right evidence, and remains cancellable. Every published claim should trace to a verified record. Unknown facts should produce an honest response. Invalid actions should never execute. All core content should be reachable without a model or 3D scene.

## Shared brief for the model experiments

Give each implementation experiment the following brief and the same content snapshot:

> Design a personalized portfolio for Eduard Kakosyan aimed at AI and engineering employers and collaborators. Center the home page on a high-quality 3D DGX Spark. A distinctive agent emerges from it and helps visitors explore real work. Demonstrate one complete journey from a question about local AI to a sourced case study and a highlighted section. Use the existing Next.js, React Three Fiber, Motion, and WebLLM foundation. Run all inference in visitors' browsers, after activation. Preserve validation, sanitization, navigation allowlists, security headers, and CI. Provide functional browsing without inference, reduced-motion behavior, and an adaptive mobile layout. Explain asset provenance and distinguish prototype assets from final production assets.

Compare the same pages and prompts under identical conditions: initial page load, model loading, warm-cache inference, inference while the scene animates, unsupported WebGPU, reduced motion, and keyboard navigation. A beautiful screenshot alone does not satisfy the brief. Review the interaction, asset detail, implementation quality, source grounding, and recovery behavior as well.

The planning phase does not run either model experiment or assume which external model versions are available. The shared brief makes later experiments comparable across separate sessions or worktrees.

## Decisions still needed

- Personal style references and whether the emerging agent should resemble HUGO or have a different identity.
- The remaining featured projects and their order around dgx-autonomy; VoxCoach is excluded.
- Authoritative LinkedIn material, additional repositories, and work summaries to reconcile.
- Whether voice, an interactive workflow demo, and automated content refresh belong in the first release or later work.
