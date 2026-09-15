# Adduco — Filmska šetnja

Croatian construction-company website. React, TypeScript and Vite; essential content is built into HTML before hydration. A photoreal Higgsfield film follows native scrolling, with business content overlaid on the scene. The user authorized private publication through Sites on 15 September 2026; its project is recorded in `.openai/hosting.json`.

## Run

```sh
npm ci
npm run dev -- --port 5184 --strictPort
```

Production preview:

```sh
npm run build
npm run preview -- --port 5184 --strictPort
```

Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e` (server on port 5184, local Chrome installed). Install the additional Safari-engine test browser once with `npx playwright install webkit`. The suite runs the Chrome checks plus a WebKit phone regression.

## Files and assets

- `DESIGN.md`: sole visual contract; dark contemporary construction and a continuous cinematic journey.
- `CONTENT-SOURCES.md`: business claims and pending owner material.
- `QA.md`: completed checks, local performance measurements and delivery limitations.
- `src/CinematicFilm.tsx`: responsive movie loading, serialized native-scroll seeking and teardown; no continuous render loop.
- `src/InquiryForm.tsx`: validated, reviewable mailto draft. It never sends or stores data.
- `scripts/cinema.json`: exact Higgsfield generation prompts, references and web encoding settings. Use Higgsfield ffmpeg/Pillow to produce the videos and responsive chapter frames; keep working material outside the repository.
- `scripts/checklist.py`: regenerate the Croatian preparation PDF with ReportLab and a Unicode Arial font.

The construction environment is conceptual artwork, not project photography. The supplied original logo is preserved in `adduco logo/`; the public horizontal logo is a faithful crop/resizing of the supplied image, processed through Higgsfield. Movies and stills are served locally from the Site; no third-party generation service is contacted by visitors. The journey uses three eight-second Seedance 2.5 moves per orientation: desktop at 1920×1080 and a separately composed portrait version at 720×1280 with a keyframe every three frames. Native scroll controls the film automatically with short smoothing; captions follow decoded frames. Adjacent movies prepare early and previously decoded moves remain cached for reverse travel. Phone and touch layouts have no play/pause button. Reduced-motion and data-saving preferences use composed stills.

## Before public launch

Owner-approved project photography, final copy and recipient confirmation remain outstanding. Automatic inquiry delivery and production privacy/domain metadata need configuration. The local and owner-private Sites previews intentionally carry `noindex, nofollow`. No analytics or database is configured. Do not store Sites source credentials in this repository.
