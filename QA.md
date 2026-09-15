# Local acceptance report

Verified 15 September 2026 against the production preview at http://127.0.0.1:5184/. Selected direction: Crveni monolit. Public launch is outside this delivery.

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 3 behavior tests passed |
| `npm run typecheck` | Passed; also included in production build |
| `npm run lint` | Passed |
| `npm run build` | Passed; essential content pre-rendered |
| `npm run test:e2e` | 9 Chrome tests passed, final run 18.8 seconds |
| Responsive browser review | 390, 768 and 1440px; no horizontal overflow |
| Automated accessibility | Axe WCAG 2 A/AA and 2.1 AA: no violations at all three widths |
| Browser diagnostics | No recorded JavaScript or console errors |
| Design artifact audit | Passed; sole contract is DESIGN.md |

Behavioral coverage includes direct navigation, mobile menu/Escape, keyboard skip link, all four chapters forward/backward, native wheel scrolling, reduced motion, unavailable WebGL, repeated still/3D mode changes, inline form errors, reviewable email draft, CTA destinations and real PDF download. Tablet defaults to stills without requesting the GLB. Without JavaScript, essential text/navigation/contact remain available and the interactive form is hidden.

Visual review covers the four desktop sculpture compositions, mobile/tablet first folds, contact layouts and the one-page Croatian PDF. The header uses the refined horizontal logo; mobile uses a compact visible contact action. Original supplied artwork remains untouched. Screenshots and rejected generation drafts are outside the repository, under `/tmp/adduco-qa/`.

## Performance

Local Lighthouse 13.4.1 / Chrome 153 laboratory measurements, not field Core Web Vitals. Mobile uses a 412×823 emulated screen, 4× CPU slowdown, 150ms RTT and 1.64Mbps throughput. Desktop uses 1350×940, 1× CPU, 40ms RTT and 10.24Mbps. Real devices, servers and networks will differ.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 96/100 | 100/100 |
| Accessibility | 100/100 | 100/100 |
| Best practices | 100/100 | 100/100 |
| First contentful paint | 1.81s | 0.45s |
| Largest contentful paint | 2.56s | 0.55s |
| Total blocking time | 0ms | 16.5ms |
| Cumulative layout shift | 0 | 0.000024 |

Mobile LCP is slightly above the 2.5-second good threshold in this run; no claim of passing field CWV is made. INP requires interaction/field measurement and was not measured by Lighthouse. SEO is 66/100 because local review deliberately blocks indexing with robots directives; this must be changed with production metadata when launch is approved.

The desktop startup baseline was 72/100 with 1,032ms blocking time. Yielding between model preparation batches and texture uploads, followed by asynchronous shader compilation, reduced that stall without changing scene geometry. The original 10.6MB GLB is delivered as a 1.56MB WebP/Meshopt derivative. Still images range from 39–80KB. Three.js remains a deferred 647KB raw / 163KB gzip chunk, producing Vite's size warning; narrow/reduced-motion visitors do not load it by default.

Raw reports: `/tmp/adduco-qa/lighthouse-mobile-final.json` (05:03:50 UTC), `/tmp/adduco-qa/lighthouse-desktop-optimized.json` (05:08:37 UTC). Mobile was measured before the final scene-only scheduling optimization; its default still path is unchanged. Responsive accessibility/console evidence is in `/tmp/adduco-qa/final-checks.json`; final reviewed screenshots use `release-*.png`.

## Delivery boundaries

- Local preview is running on port 5184. No public deployment, push or commit was performed.
- Approved real project photography and final owner review of project captions/creative copy remain pending.
- The form validates and prepares a mailto draft. It does not send or store submissions. Automatic delivery, recipient confirmation and production privacy/domain configuration remain pending.
- Higgsfield revision 4 is the editable geometric source. The garden is conceptual artwork and is not presented as completed-project photography.
- Intentional repository files: source, behavior tests, configuration/lockfile, one design contract, project/content/QA documentation, editable asset/PDF generators, optimized public assets and the supplied original logo. Build output, test output and dependencies are ignored; generated drafts and screenshots are not shipped.
