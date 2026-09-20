# Adduco — Filmska šetnja

Croatian construction-company website built with React, TypeScript and Vite. Pre-rendered essential HTML, four cinematic scenes with native vertical scroll controlling three high-quality films, readable caption holds, and ordinary business sections below the journey. Scroll forward, stop, or reverse without a three-second gesture lock. The approved artwork, captions and original logo are unchanged.

**Public website:** [Adduco](https://adduco-crveni-monolit.mglavinic.chatgpt.site/).

## Run

Use Node22.22.0 (see .nvmrc), npm and Git. No runtime API keys or Higgsfield account are required.

```sh
npm ci
npm run dev -- --port 5184 --strictPort
```

For the built preview, stop the development server and run:

```sh
npm run build
npm run preview -- --port 5184 --strictPort
```

The build emits dist/ with pre-rendered HTML and static media. Serve at a domain root.

## Architecture and media

- src/scroll/ScrollJourney.tsx: native document scrolling, sticky stage, readable holds, latest-request coalescing and one pending seek per movie. Actual presented frames control visible captions. No wheel interception, artificial scroll easing, Blob bridge, or permanent idle render loop.
- src/scroll/mediaDelivery.ts and public/media-delivery-worker.js: Sites-only progressive byte-range adapter for the host’s HTTP200 media delivery. One upstream fetch per requested movie; only cinematic MP4s are intercepted, no HTML/form/navigation caching and no Blob URLs. Local range-capable previews retain direct native requests. A no-range browser fixture verifies both engines and exact upstream bytes.
- src/scroll/selectMedia.ts: bounded capability predictions select AV1 only when supported, smooth and power-efficient; WebKit uses qualifying HEVC after measured AV1 paused-seek failures. H.264 is the default and explicit codec-error retry. One format/orientation is loaded, never all alternatives. Predictions do not guarantee physical-device performance.
- Opening image is preloaded before deferred JavaScript with orientation-specific picture selection and inline blurred fallback. The first film prepares eagerly; IntersectionObserver prepares later films near their transitions. Native video elements retain buffers for reversal. A direct jump prepares its requested movie immediately and exposes its caption/still without waiting for playback.
- 300ms subtle loading indicator, 6.5s nearest-scene fallback, reduced motion/Data Saver stills, passive single-touch priming, normalized rotation position, and permanently accessible business/contact links.
- src/scenes.ts holds approved Croatian captions. BusinessContent and InquiryForm retain sourced projects and a reviewable mailto draft; no false delivery confirmation or new service.
- public/assets/scroll contains original-source 24fps derivatives: native1920×1080 landscape and900×1600 portrait. AV1 GOP12, HEVC/H.264 GOP24; no new AI generation, upscaling or invented portfolio photography. The runtime never downloads both orientations at initial view. A later device rotation requests the new orientation.
- Manifests record hashes, exact sizes, SSIM and endpoint RMS. scripts/scroll-media.py and scripts/scroll-continuation.py reproduce encodes in Higgsfield; use its upload/export workflow. Never put signed upload URLs or credentials in source. scripts/cinema.json preserves historical provenance.
- Adjacent source movies have different endpoint pixels; the incoming decoded frame fades over the held outgoing frame for150ms. Raw differences remain disclosed in QA.md.

The owner explicitly lifted the historical5MB ceiling for quality on20September. Initial and complete transfers, codec fallbacks and cold-seek limitations are reported in QA.md. Desktop source is1080p, not4K. All runtime formats are stored in Git, but a visitor downloads one compatible format only. The unselected comparison and the superseded native gesture controller are retired; rollback is available in Git history.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install --with-deps chrome webkit
npm run test:e2e -- --workers=1
```

Browser tests require the built preview at5184. Set PLAYWRIGHT_BASE_URL to test another built preview or the public URL. Tests cover four-scene scrolling and reversal, cold/error recovery, orientation, real-frame reveal, codecs, first-image discovery, Data Saver/reduced motion,390/768/1440 layouts, no-JS business content, accessibility, inquiry validation and PDF. No actual inquiry is sent.

Opt-in measurements, run separately from other browser work:

```sh
SCROLL_PERFORMANCE=1 npx playwright test tests/scroll-performance.spec.ts --workers=1
MOTION_COLD=1 npx playwright test tests/motion-cold.spec.ts --workers=1
```

The direct-native performance suite reports initial/complete Chrome transfer and actual warm frame latency across all movies on a range-capable preview; its contiguous-buffer assumptions are not a public Sites delivery test. tests/media-delivery.spec.ts separately reproduces the Sites transport and verifies real frames plus exact upstream bytes in both engines. Current public timings and their limitations are in QA.md. WebKit payload measurements include its native two-byte range probes. Chrome4G uses9Mbps down,1.5Mbps up,85ms latency, CPU4×; WebKit is unthrottled. Cold arbitrary jumps can wait for an unbuffered range and are measured separately. Lab emulation is not physical-phone acceptance.

## Content and publishing

Read AGENTS.md, PRD.md, DESIGN.md, CONTENT-SOURCES.md, IMPLEMENTATION.md and QA.md before changes. DESIGN.md is the unchanged visual contract. Artwork illustrates the cinematic environment and is never used as project photography. Approved real photos are still pending.

Sites configuration is .openai/hosting.json. Preserve the existing public audience and noindex metadata; publish the exact verified source/build through Sites and sync the public GitHub repository. GitHub Actions performs source checks but does not deploy. Launch-readiness Batch2 (webhook/legal/privacy/indexability) is outside this motion pass.
