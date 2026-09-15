# Cinematic acceptance report

Verified 15 September 2026 at http://127.0.0.1:5184/. Current direction: Od temelja do stvarnosti, with separately directed desktop and portrait footage. The owner funded production and authorized the existing private Sites update.

## Behavior and accessibility

- 4 component tests and 21 Chrome behavior checks passed across the full 19-test run and two additional loading/failure/rotation cases. The phone composition check passed again after AVIF optimization.
- TypeScript, ESLint, production build and the strict design artifact audit passed. The focused five-test film suite passed after the final movie-promotion adjustment.
- Real-browser visual review at 390×844, 768×1024, 1440×900 and the actual 1013×941 in-app window. Entry, reinforcement, height and final contact compositions inspected. No horizontal overflow; Axe WCAG 2/2.1 A/AA found no violations in entry/contact at 390, 768 and 1440px.
- Native scroll changes video time in both directions across all three segments. Direct jumps and reverse movement settle on the correct segment. No wheel interception or permanent animation loop. Incoming decoded movies become visible in one paint to avoid exposing a poster between segments.
- Initial desktop request loads only landscape segment 0. Phone/touch tablet requests one composed still and no movie until explicit start. Portrait uses its own film and still artwork; rotation changes orientation and releases the old movie. An explicit pause survives resize.
- A delayed later move keeps a decoded frame visible. A failed current move returns to composed stills and keeps contact usable. No-byte-range hosting recovery is covered through the page, using a same-origin Blob per segment.
- Reduced motion, unavailable video, no-JavaScript essential content, direct detail fragments, Escape, browser Back, focus return, inquiry validation and PDF HTTP/download passed. Services retains a preparation link. The inquiry creates a reviewable email draft; no message was sent.

## Film and visual evidence

Eight accepted 4K framing anchors were generated using Higgsfield GPT Image 2.5 Flare: four 3840×2160 landscape and four 2160×3840 portrait. Six accepted silent Seedance 2.5 movies provide three connected eight-second moves per orientation. Each native file is 8.042 seconds at 24fps; displayed timeline covers roughly 24 seconds. The camera moves from the suspended A to reinforcement detail, rises alongside several supported floors, then reveals the entire forecourt and structure.

All eight accepted framing images and nine sampled frames per movie were inspected, along with actual website motion. Two initial images were rejected for a duplicate emblem and wrong final camera height. Two final-transition movies were replaced because they blended viewpoints. Accepted final moves use an opaque foreground concrete upright to conceal the viewpoint change; this is intentional cinematic construction, not a literal surveyed camera trajectory. Generated geometry can vary; these assets are conceptual brand artwork and do not document an Adduco project. The sculptural A preserves differentiated red plates; the header uses the faithful supplied logo.

Generation used 736 credits: ten images at 16 credits and eight movies at 72 credits, including rejected variants. Higgsfield reported 1,064 credits afterward. No purchase or credit transfer was made. Exact prompts, accepted/rejected IDs and media provenance are in scripts/cinema.json.

## Delivery and loading

Higgsfield ffmpeg produced H.264/yuv420p, CRF 20, 24fps, 12-frame keyframes, no B-frames, no audio and fast-start metadata. Desktop 1920×1080 segments: 11,218,814 / 12,239,532 / 10,493,213 bytes. Portrait 864×1536: 8,425,709 / 7,836,658 / 7,460,058 bytes. Current and adjacent movies load progressively, without downloading the other orientation; obsolete movies and Blob URLs are released.

Sixteen WebP images come from accepted framing anchors. Four phone AVIF alternatives retain the 780×1387 composition with smaller transfers: 115,369 / 143,367 / 131,268 / 171,160 bytes. WebP remains a compatibility fallback. The original phone poster was 252,466 bytes before AVIF optimization. Images and content appear before movie decoding; constrained-device defaults do not request movies until the visitor starts motion.

Hosts without byte ranges require the selected movie to finish downloading before seeking becomes available. The prior frame or poster remains visible during that work. These movies prioritize surface detail and backward seeking over minimal transfer. Physical iPhone/Safari hardware decoding has not been tested; mobile evidence uses Chrome viewport/touch emulation and the in-app browser.

## Performance

Local Lighthouse 13.4.1 / Chrome 153 lab measurements, not field Core Web Vitals. Phone: 412×823, 4× CPU, 150ms RTT, 1.64Mbps. Desktop: 1350×940, 1× CPU, 40ms RTT, 10.24Mbps.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 96/100 | 100/100 |
| Accessibility | 100/100 | 100/100 |
| Best practices | 100/100 | 100/100 |
| First contentful paint | 1.51s | 0.37s |
| Largest contentful paint | 2.63s | 0.67s |
| Total blocking time | 0ms | 0ms |
| Cumulative layout shift | 0 | 0.0000023 |

Phone LCP improved from 3.15s to 2.63s after image optimization; it remains above the 2.5s good threshold under this simulated slow connection. These checks measure initial presentation, not full movie download, hosted Blob recovery or sustained decoding on every device. INP was not measured. SEO is 69 because the private preview intentionally blocks indexing. Reports: /tmp/adduco-monumental/lighthouse-mobile-final.json (19:32:07 UTC) and lighthouse-desktop.json (19:30:07 UTC).

## Release and cleanup

The owner-private Site update is authorized; keep its existing audience. Actual hosted forward/reverse motion and portrait selection must be verified after publication. The old seven-second web movies are removed. Source footage, contact sheets, screenshots, compression previews and rejected variants remain outside the repository. Intentional deliverables are the app, behavior tests, configuration, single DESIGN.md, project/content/QA documentation, generation provenance, optimized media, PDF and supplied logo.

Approved real project photos, final public-launch copy, recipient confirmation and privacy/domain setup remain pending. Those do not block the authorized owner-private preview.
