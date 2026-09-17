# Adduco — Filmska šetnja

Croatian construction-company website built with React, TypeScript and Vite. Essential content is built into HTML before hydration. A Higgsfield construction film follows native scrolling, with business content overlaid on the scene.

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

The suite covers navigation, contact, PDF download, both scroll directions, camera joins, rotation, loading failures and reduced motion. Run sequentially for media-timing checks. Browser emulation does not establish physical-phone smoothness; see `QA.md` for results and limitations.

## Files and assets

- `DESIGN.md`: sole visual contract; dark contemporary construction and a continuous cinematic journey.
- `CONTENT-SOURCES.md`: business claims and pending owner material.
- `QA.md`: completed checks, local performance measurements and delivery limitations.
- `src/CinematicFilm.tsx`: responsive movie loading, serialized native-scroll seeking and teardown; no continuous render loop.
- `src/frameSequence.ts` and `src/frameStore.ts`: portrait canvas, direct frame selection and bounded decoded-image cache.
- `src/BusinessContent.tsx`: business copy and detail panels.
- `src/InquiryForm.tsx`: validated, reviewable mailto draft. It never sends or stores data.
- `public/assets/`: production films, stills and logo derivatives.
- `public/assets/sequence/portrait-v1/`: 49 packets containing 577 portrait frames, manifest and opening image. These are normal Git files, not LFS pointers.
- `public/kontrolna-lista-adduco.pdf`: ready-to-serve investor checklist.
- `tests/` and `src/App.test.tsx`: browser and component behavior tests.
- `scripts/cinema.json`: exact Higgsfield generation prompts, references and web encoding settings. Use Higgsfield ffmpeg/Pillow to produce the videos and responsive chapter frames; keep working material outside the repository.
- `scripts/checklist.py`: regenerate the Croatian preparation PDF with ReportLab and a Unicode Arial font.

The construction environment is conceptual artwork, not project photography. The supplied original logo is preserved in `adduco logo/`; the public horizontal logo is a faithful crop/resizing of the supplied image, processed through Higgsfield. Movies and stills are served locally from the Site; no third-party generation service is contacted by visitors.

The journey uses three eight-second Seedance 2.5 moves per orientation: desktop at 1920×1080 and a separately composed portrait version at 720×1280. Portrait motion uses prepared frames selected directly from native scroll, with preparation prioritized by gesture speed and direction. Landscape and browsers without ImageBitmap retain the video engine. Captions follow the displayed image. Phone and touch layouts have no play/pause button. Reduced-motion and data-saving preferences use composed stills. All runtime assets are included; no manual Higgsfield download is required. Regenerating the optional PDF script requires Python, ReportLab, Pillow and the local Arial font paths referenced in that script; the existing PDF needs no Python dependency.

## Publishing and maintenance

The website is public on Sites. GitHub hosts its source and collaboration history; pushing to GitHub does not update the live website. `.openai/hosting.json` identifies the existing Sites project and static build directory. Publish a verified `dist/` build through the Sites workflow using that existing project. Keep credentials outside the repository; the hosting manifest contains configuration only.

Before changes, read `AGENTS.md`, `PRD.md`, `DESIGN.md`, `CONTENT-SOURCES.md` and `IMPLEMENTATION.md`. `DESIGN.md` is the only visual contract. `QA.md` records completed verification and remaining limits.

## Current limitations

- The inquiry form prepares a reviewable `mailto:` draft; it does not send messages automatically.
- Owner-approved project photography, final copy and recipient confirmation remain outstanding.
- The public website intentionally retains `noindex, nofollow`; public access and search indexing are separate settings.
- No analytics, database or automatic inquiry delivery is configured.
- Smoothness on the owner's physical phone still needs confirmation.

`node_modules/`, `dist/`, test results, local environment files and logs are generated locally and excluded from Git.
