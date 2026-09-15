# Cinematic acceptance report

Verified 15 September 2026 at http://127.0.0.1:5184/. Current direction: a photoreal construction film generated through Higgsfield, native scrolling and HTML overlays. The owner authorized the existing private Sites update.

## Checks

- 4 component tests and 15 Chrome behavior tests passed; the 5 responsive/opt-in checks passed again after the final portrait framing adjustment.
- TypeScript, ESLint, production build and the design artifact audit passed.
- Reviewed 390, 768, 1440px and the actual 1013px in-app window. No horizontal overflow. Axe WCAG 2/2.1 A/AA found no violations in entry/contact at all three widths.
- Video time advances with native scrolling and returns near zero in reverse; readyState 4 was observed in the in-app browser. The first regression failed against the old video-free page, then passed after implementation.
- Mobile/tablet initially requests one still and no movie. Explicit start, final frame, reverse navigation, pause/restart, resize and return from contact preserve expected behavior.
- Reduced motion, failed movie requests, JavaScript-disabled essential content, direct fragments, Escape, browser Back, focus return, inquiry validation and PDF response/download passed. No inquiry was sent.
- The scroll regression waits for preceding smooth anchor navigation to finish before a wheel input; the earlier test could otherwise race Chrome's pending navigation.

## Visual and asset evidence

Higgsfield GPT Image 2.5 Flare generated a 3840×2160 master from the original logo and owner's dark reference. Seedance 2.5 generated the silent 1920×1080 move at 24fps, duration 7.042 seconds. Eight sampled frames and actual forward/reverse website interaction were inspected. The A retains triangular plates and different reds; concrete portals, slabs, reinforcement and wet reflections remain coherent through the camera move. The film is conceptual artwork, not project photography or a pixel-exact replacement logo.

A 24-second request was rejected before submission for insufficient credits. A seven-second film was successfully generated for 63 credits. This release uses that continuous shot across four caption moments; it does not contain four new locations or 24 seconds of footage. A longer journey needs additional source footage and generation credits. No purchase was made.

Higgsfield ffmpeg produced H.264/yuv420p, no audio, six-frame keyframe intervals, no B-frames and fast-start metadata. Desktop 1920×1080: 13,240,209 bytes. Narrow-screen 1280×720: 5,405,535 bytes. Twelve film-derived WebP stills are 46–147KB each; the initial phone image is 53,882 bytes. Frequent keyframes favor reverse seeking and surface detail at the cost of larger movies. Stills/content appear before decoding; mobile and reduced-motion defaults do not download video until requested. No permanent render loop or third-party visitor request remains.

Portrait framing fits the full emblem below the header even at the final close view, with a gradual lower fade for captions. Actual iPhone/Safari hardware decoding has not been tested: mobile evidence uses Chrome viewport/touch emulation and the in-app browser. Retired WebGL code, meshes, maps and unused Three.js/GSAP dependencies were removed; their source remains in Git history and the editable Higgsfield project.

## Performance

Local Lighthouse 13.4.1 / Chrome 153 lab measurements, not field Core Web Vitals. Mobile: 412×823, 4× CPU, 150ms RTT, 1.64Mbps. Desktop: 1350×940, 1× CPU, 40ms RTT, 10.24Mbps.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 98/100 | 100/100 |
| Accessibility | 100/100 | 100/100 |
| Best practices | 100/100 | 100/100 |
| First contentful paint | 1.51s | 0.37s |
| Largest contentful paint | 2.18s | 0.55s |
| Total blocking time | 0ms | 0ms |
| Cumulative layout shift | 0 | 0.0000023 |

These measure initial presentation, not full movie download or sustained decoding on every device. INP was not measured. SEO is 69 because the private preview intentionally blocks indexing. Reports: /tmp/adduco-qa/lighthouse-cinema-mobile-final.json (18:36:16 UTC), /tmp/adduco-qa/lighthouse-cinema-desktop-final.json (18:36:26 UTC). Screenshots, contact sheets and raw media remain outside the repository.

## Delivery boundaries

The original logo and faithful header/PDF derivatives remain unchanged. Visokogradnja is included. Approved project photos, final public-launch copy, recipient confirmation and privacy/domain setup remain pending. Preserve owner-private access and the reviewable mailto behavior.

Intentional files: application source, tests, build/hosting configuration, one DESIGN.md, project/content/QA documentation, generation provenance, PDF generator, optimized movies/stills, the PDF and supplied logo. No drafts or unused render assets remain.
