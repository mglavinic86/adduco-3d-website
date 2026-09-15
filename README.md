# Adduco — Filmska šetnja

Croatian construction-company website. React, TypeScript, Three.js and GSAP; Vite builds essential content into HTML before hydration. The user authorized private publication through Sites on 15 September 2026; its project is recorded in `.openai/hosting.json`.

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

Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e` (server on port 5184, local Chrome installed).

## Files and assets

- `DESIGN.md`: sole visual contract; dark contemporary construction and a continuous cinematic journey.
- `CONTENT-SOURCES.md`: business claims and pending owner material.
- `QA.md`: completed checks, local performance measurements and delivery limitations.
- `src/scene.ts`: lazy renderer, native scroll camera, adaptive quality and teardown.
- `src/InquiryForm.tsx`: validated, reviewable mailto draft. It never sends or stores data.
- `scripts/garden.py`: original editable Higgsfield 3D Jutsu scene generator with embedded material maps. Set image color spaces before populating pixels.
- `scripts/capture-stills.mjs`: capture all four chapters at desktop/tablet/mobile sizes from the same live scene, with UI hidden. Keep intermediate PNGs in `/tmp`; ship optimized WebP derivatives.
- `scripts/checklist.py`: regenerate the Croatian preparation PDF with ReportLab and a Unicode Arial font.

Higgsfield scene: https://higgsfield.ai/3d-jutsu/4b8b4f3c-d1ea-4cec-aa5c-402de6054dd6

The sculpture garden is conceptual artwork, not project photography. The supplied original logo is preserved in `adduco logo/`; the public horizontal logo is a faithful crop/resizing of the supplied image, processed through Higgsfield. Portable GLB textures and geometry are compressed with glTF Transform (WebP and Meshopt), decoded locally without third-party runtime requests.

## Before public launch

Owner-approved project photography, final copy and recipient confirmation remain outstanding. Automatic inquiry delivery and production privacy/domain metadata need configuration. The local and owner-private Sites previews intentionally carry `noindex, nofollow`. No analytics or database is configured. Do not store Sites source credentials in this repository.
