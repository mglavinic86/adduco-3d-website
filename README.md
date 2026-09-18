# Adduco — Filmska šetnja

Croatian construction-company website built with React, TypeScript and Vite. Essential content is built into HTML before hydration. Three cinematic transitions connect four stationary scenes using separate native forward/reverse MP4s. One deliberate vertical gesture starts one complete three-second film, then holds the next caption. Business content follows in ordinary document sections. The owner accepted the first transition and authorized completing the public release.

**Live website:** [adduco-crveni-monolit.mglavinic.chatgpt.site](https://adduco-crveni-monolit.mglavinic.chatgpt.site/).

## Run

Requirements: Git, Node.js **22.22.0** (pinned in `.nvmrc`) and npm. With nvm, run `nvm install` and `nvm use` after cloning.

```sh
git clone https://github.com/mglavinic86/adduco-3d-website.git
cd adduco-3d-website
npm ci
npm run dev -- --port 5184 --strictPort
```

Open [localhost:5184](http://127.0.0.1:5184). No API key, `.env`, database, Higgsfield account or Git LFS is needed to run the website. Runtime media are included in Git; `npm ci` installs dependencies and bundled fonts from `package-lock.json`.

Production preview:

```sh
npm run build
npm run preview -- --port 5184 --strictPort
```

The build creates `dist/`, including pre-rendered HTML and static media. Serve it over HTTP at a domain root; asset paths start with `/`. Stop an existing development server before starting a preview on the same port.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs these checks on pushes to `main` and pull requests. It does not deploy the website.

For browser tests, install Playwright's Chrome and WebKit browsers:

```sh
npx playwright install --with-deps chrome webkit
```

Keep the production preview running on port 5184, then run in another terminal:

```sh
npm run test:e2e -- --workers=1
```

The suite covers navigation, contact, PDF download, stationary opening, full native forward/reverse playback, gesture bursts, both scroll directions, rotation, autoplay/media failures, reduced motion, data saving and transfer budgets. Run sequentially for media-timing checks. Browser emulation does not establish physical-phone smoothness; see `QA.md` for results and limitations.

## Files and assets

- `DESIGN.md`: unchanged visual contract; dark contemporary construction and original artwork/captions. The dated amendment in `PRD.md` governs the new interaction.
- `CONTENT-SOURCES.md`: business claims and pending owner material.
- `QA.md`: completed checks, local performance measurements and delivery limitations.
- `src/scenes.ts`: the four approved captions, hash anchors and canonical stills.
- `src/SceneJourney.tsx`: stationary scenes, complete native transitions, held endpoints and matching still fallbacks. No scroll-driven media clock.
- `src/sceneGestures.ts`: film-scoped wheel/touch/keyboard input; one transition per gesture, no queued input. Business sections scroll natively.
- `src/BusinessContent.tsx`: ordinary business sections, native hash targets and sourced copy.
- `src/InquiryForm.tsx`: validated, reviewable mailto draft. It never sends or stores data.
- `public/assets/`: production films, stills and logo derivatives.
- `public/assets/transition-{1,2,3}/`: three-second portrait/landscape films in both directions and exact endpoint stills. The rejected opening trims, all sequence packets and the old scrubber are deleted.
- `public/kontrolna-lista-adduco.pdf`: ready-to-serve investor checklist.
- `tests/` and `src/App.test.tsx`: browser and component behavior tests.
- `scripts/cinema.json`: exact Higgsfield generation prompts, references and web encoding settings. Use Higgsfield ffmpeg/Pillow to produce the videos and responsive chapter frames; keep working material outside the repository.
- `scripts/checklist.py`: regenerate the Croatian preparation PDF with ReportLab and a Unicode Arial font.

The construction environment is conceptual artwork, not project photography. The supplied original logo is preserved in `adduco logo/`; the public horizontal logo is a faithful crop/resizing of the supplied image, processed through Higgsfield. Movies and stills are served locally from the Site; no third-party generation service is contacted by visitors.

The complete journey connects Vizija, Betonski radovi, Visokogradnja and Vaš projekt: H.264 at 720×1280 portrait and 1920×1080 landscape, 24fps, three seconds, muted and inline. Initial display is stationary. A deliberate downward scroll/swipe plays the complete forward film; a fresh upward gesture plays its separately encoded reverse. Native completion holds the last frame and reveals the destination caption. Additional input during playback is ignored, including the remainder of that wheel/touch gesture. Header links and scene navigation remain accessible. After the last implemented scene, a fresh downward gesture enters the ordinary business content.

The opening forward film loads eagerly in the selected orientation. IntersectionObserver prepares only adjacent forward/reverse films at each newly active scene; loading never starts playback. Direct scene links can jump to a chosen still without chaining movies. Reduced motion/Data Saver use matching stills without movie requests. Rejected/failed playback falls back to the requested destination still; a 6.5-second deadline also releases stalled transitions. Visibility changes, rotation and direct business navigation cancel pending playback. There is no currentTime assignment, Blob recovery, frame store or animation loop. The owner explicitly approved film-scoped vertical gesture capture, superseding the earlier no-wheel-interception rule only there. Horizontal/zoom gestures and normal business scrolling stay native. Full cold-page transfer measurements are recorded in QA.md.

Regenerating the optional PDF script requires Python, ReportLab, Pillow and the local Arial font paths referenced in that script; the existing PDF needs no Python dependency.

## Publishing and maintenance

The website is public on Sites. GitHub hosts its source and collaboration history; pushing to GitHub does not update the live website. `.openai/hosting.json` identifies the existing Sites project and static build directory. The owner accepted the interaction and authorized completion of the existing public release. Publish a verified `dist/` build through the Sites workflow using that existing project and preserve its public audience. Keep credentials outside the repository; the hosting manifest contains configuration only.

Before changes, read `AGENTS.md`, `PRD.md`, `DESIGN.md`, `CONTENT-SOURCES.md` and `IMPLEMENTATION.md`. `DESIGN.md` is the only visual contract. `QA.md` records completed verification and remaining limits.

## Current limitations

- The inquiry form prepares a reviewable `mailto:` draft; it does not send messages automatically.
- Owner-approved project photography, final copy and recipient confirmation remain outstanding.
- The public website intentionally retains `noindex, nofollow`; public access and search indexing are separate settings.
- No analytics, database or automatic inquiry delivery is configured.
- Smoothness on the owner's physical phone still needs confirmation.

`node_modules/`, `dist/`, test results, local environment files and logs are generated locally and excluded from Git.
