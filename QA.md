# Local acceptance report

Verified 15 September 2026 against the production preview at http://127.0.0.1:5184/. Selected direction: a continuous cinematic journey through dark contemporary construction. The user authorized updating the existing owner-private Sites deployment.

## Checks

| Check | Result |
| --- | --- |
| Component behavior | 4 tests passed |
| Chrome behavior | 13 tests passed, including a regression for deferred still loading and reverse navigation |
| TypeScript, ESLint and production build | Passed |
| Responsive browser review | 390, 768 and 1440px; no horizontal overflow |
| Accessibility | Axe WCAG 2 A/AA and 2.1 AA: no violations in the entry and contact views at all three widths |
| Rendering | Actual canvas changes through forward/reverse camera travel; no console or JavaScript errors in the journey regression |
| No JavaScript / unavailable WebGL / reduced motion | Essential content and direct contact remain usable |
| PDF | Real one-page Croatian PDF; updated faithful logo, selectable text and visible diacritics |
| Design artifact audit | Passed; DESIGN.md is the sole visual contract |

The four former white content bands have been replaced by fixed captions that fade during camera travel. About, services, preparation, sourced projects and contact open in a native modal over the scene. Escape, the close action, browser Back, direct fragments and return to the same camera position are covered. Focus returns to the opener, or the mobile menu button when its link has been hidden. The underlying captions disappear while reading so they do not show through the form.

The inquiry validates Croatian inline errors and prepares a reviewable mailto draft; it never sends or stores a message. All internal targets and the ungated PDF download are checked. Without JavaScript the semantic business content is visible and the interactive form is hidden.

## Asset evidence

Higgsfield 3D Jutsu project `4b8b4f3c-d1ea-4cec-aa5c-402de6054dd6`, final committed revision **9**, operation `adduco-lifting-camera-finish-01`. Its rendered camera and exported geometry were inspected. The export contains **183 construction parts**, **13 semantic portal fragments**, and **zero classical/fluted columns**. Concrete frames, walls, slabs, casting details, rebar and lifting hardware replace antique architecture and planted circular islands.

The original 6,239,560-byte export is delivered as a 658,396-byte WebP/Meshopt GLB. Seven source-sampled red materials map to the thirteen original emblem triangles. Original supplied logo remains untouched; header and PDF derivatives preserve its actual shapes and shade differences. The web renderer adds the Higgsfield-generated concrete albedo, derived surface maps, evening sky, and textured wet reflections. Generator/source links are in CONTENT-SOURCES.md.

Twelve UI-free desktop/tablet/mobile stills use the same final geometry and website camera. Only the first still loads initially; later images load on demand and the previous image remains while a new one loads. Returning to an already loaded frame is tested. Stills are approximately 64–102KB each. Screenshots and working renders remain outside the repository under `/tmp/adduco-qa/`.

## Performance

Local Lighthouse 13.4.1 / Chrome 153 lab measurements, not field Core Web Vitals. Mobile: 412×823, 4× CPU, 150ms RTT, 1.64Mbps. Desktop: 1350×940, 1× CPU, 40ms RTT, 10.24Mbps. Devices, GPUs, hosting and networks will differ.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 98/100 | 100/100 |
| Accessibility | 100/100 | 100/100 |
| Best practices | 100/100 | 100/100 |
| First contentful paint | 1.51s | 0.37s |
| Largest contentful paint | 2.26s | 0.51s |
| Total blocking time | 0ms | 16.5ms |
| Cumulative layout shift | 0 | 0.0000015 |

The initial construction pass measured 92 mobile / 75 desktop. Deferred still loading reduced mobile LCP from 3.23s to 2.26s. An unlit sky dome and asynchronous preparation of the reflection shader variants removed the first-frame compilation stall, reducing desktop blocking time from 644ms to 16.5ms. GPU uploads and geometry batches still yield between tasks; DPR is capped, quality adapts, and idle/hidden views stop rendering. Three.js remains a deferred 652KB raw / 165KB gzip chunk, causing Vite's normal chunk-size advisory.

Raw reports: `/tmp/adduco-qa/lighthouse-construction-mobile-final.json` (08:58:32 UTC), `/tmp/adduco-qa/lighthouse-construction-desktop-final.json` (08:59:51 UTC). The later cache-return behavior fix does not alter initial loading. Fallback captures were refreshed after sky preparation changed. INP was not measured. SEO is 69 because this owner-private preview intentionally blocks indexing; no public-launch SEO claim is made.

## Delivery boundaries

- Desktop windows from 768px start 3D automatically. Phones, coarse-pointer tablets below 1024px, reduced-motion/save-data and limited-memory devices use the lighter still presentation, with an explicit “Pokreni 3D” control.
- Business scope now includes user-confirmed visokogradnja. Project photography and final public-launch copy/recipient approval remain pending.
- The environment is conceptual artwork, not photography of completed Adduco projects. Generated surface textures are not measured material scans.
- Source, tests, configuration, project/content/QA documentation, editable asset/PDF generators, optimized assets and the supplied logo are intentional repository files. Build output, dependencies, test output and drafts are not shipped as source.
