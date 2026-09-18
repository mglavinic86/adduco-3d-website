# QA — mobile scroll smoothness

## Native video preparation — 18 September 2026

**Published successfully:** https://adduco-crveni-monolit.mglavinic.chatgpt.site/ — Sites version21, application source `3ff139cef9ae6451214734a781ddf06f8376e03c`, deployment `appgdep_6aad08c3bbe88191a0643f552d9824a3`. The measured public bundle is `index-C66FVxC3.js`, matching the tested local build. Native preparation and transfer acceptance pass. The opening-paint≤1s target is **not consistently met** because one of the three new portrait cold samples waited1.724s for the initial HTML response; this remaining delivery latency is disclosed below.

The owner approved preparing the persistent native video elements instead of the rejected fetch/cache bridge and explicitly authorized public publication. The opening-image slice below had already been published separately as Sites version20. DESIGN.md, captions, all accepted media and three-second playback remain unchanged. No tempo variant or Batch2 implementation is included.

After opening `canplaythrough`, the sequence is forward2, reverse1, forward3, reverse2, reverse3. Each element retains its own source and buffer and stays paused until requested. Only one background movie prepares at a time. The queue waits for the complete native buffered range before advancing: `canplaythrough` predicts uninterrupted playback, rather than proving that the response is complete. [HTML media readiness specification](https://html.spec.whatwg.org/multipage/media.html#dom-media-have_enough_data)

Reduced motion and Data Saver prevent preparation. Rotation resets the sequence for the selected orientation. Observer preparation remains a fallback and explicit user requests can immediately prepare their movie; background preparation does not block navigation. Gate1's caption timing, 300ms buffer indicator, 6.5s fallback, 150ms reverse settlement and stage-only gestures remain intact.

### Opening-image diagnosis

The original public measurements were **2,276ms portrait /752ms landscape**. The corresponding HTML-response times were **1,779ms /203ms**: a 1,576ms difference before the browser could discover page assets, versus the 1,524ms difference in image paint. From those responses to image paint, portrait took about497ms and landscape549ms. The portrait asset itself is smaller (115,480 versus167,214 bytes).

Actual browser checks at390×844 and1440×900 in both Chrome and WebKit confirm: the portrait media query matches only the portrait viewport, exactly one opening preload matches, picture `currentSrc` equals that preload, and no opposite-orientation opening image is requested. The correct selected source is `transition-1/portrait-start.webp` on portrait. No image/source change was needed.

Repeated public version20 4G sampling found portrait paint688/692ms after a slow first sample, and landscape744/756/748ms. Reversing the order produced a slow **landscape** first sample: paint3712ms, HTML response1801.8ms, with requestStart28.6ms and connection establishment ending28.5ms. Subsequent samples were portrait904/792ms and landscape748ms. Thus the slow response is not caused by portrait selection. It occurs before application execution in the document/asset delivery path; these observations do not identify its exact hosting-side cause. An HTML response arriving after1s prevents a1s full-resolution image target on that navigation, regardless of frontend preloading. Do not hide this outlier behind a median or claim the target always passes.

The earlier diagnostic could overwrite its image-paint value if Element Timing emitted another entry. The current script retains the first positive renderTime and every entry, plus full Navigation Timing and selected source/preload evidence. The landscape-first diagnostic recorded one entry, so its3712ms result is not an overwrite artifact.

### Pre-publication verification

Cold local Chrome DevTools4G lab profile: 1,012,500B/s down,168,750B/s up,165ms latency; no CPU throttle; fresh contexts with caching allowed after navigation. One sample/orientation. Localhost timing is not published-page acceptance evidence.

| Format | Opening image paint (ms) | First canplaythrough (ms) | Worst later gesture→playing (ms) | Complete journey transfer (bytes) |
| --- | ---: | ---: | ---: | ---: |
| portrait | 636 | 872.9 | 13.3 | 4,083,851 |
| landscape | 724 | 911.1 | 12.1 | 4,680,527 |

The independent local cache-disabled regression, including mobile menu and all business sections, records **3,722,023 prepared-opening /4,186,219 complete bytes portrait** and **4,158,274 /4,783,022 landscape**. The optional PDF is excluded. All-six-video preparation before any gesture intentionally supersedes the historical2MB network-idle opening limit; the complete-page5MB limit passes. Report first paint/readiness separately from a fully prepared idle opening.

TDD: delaying forward2 reproduced the absence of preparation in both engines, then verified the exact sequence with no third request while that response was held. Added tests cover orientation replacement, no autoplay, selected-image correctness and reuse without requests on playback. The final138-case inventory comprises **134 passing cases and four expected WebKit skips**, verified by a132-pass full run followed by a2-pass focused rerun after updating the old adjacent-only loading expectation to the owner's newly approved all-six preparation. Both logs are retained; the earlier obsolete assertions are not hidden. Typecheck, ESLint, four unit tests and production/SSR build pass. Screenshots at390/768/1440 were inspected; header/exit and original caption composition are preserved. Artifact audit passes with the existing optional CLAUDE.md warning.

Evidence directory: `/Users/mato/.codex/visualizations/2026/09/15/01a0a34a-e6c7-7e73-8127-ac8e619655f2/native-preparation-2026-09-18/`. It contains the complete live/local JSON waterfalls, initial-response studies, native-response payload audit, production build log, full regression log plus the focused rerun, and playback screenshots. The payload ceilings are **3,407,812 bytes portrait /3,792,329 bytes landscape**, the exact sums of the six unchanged MP4 files; HTTP/protocol overhead is reported separately from movie payload.

### Published Chrome 4G: before and after

These are **lab measurements on the live URL**, Chrome153.0.8010.48, no CPU throttling, the same documented DevTools4G profile. Browser cache is cleared at each navigation and allowed afterwards; the remote delivery/cache state is not controlled. Before is the original single-sample Gate1 baseline. After comprises three cold contexts per orientation, with no preload wait artificially inserted before the first gesture: start as soon as the first canplaythrough occurs, then request each next scene immediately after its predecessor ends. Use medians for opening/first-ready and the worst later latency over all three runs; retain ranges and every sample instead of discarding the slow response.

| Orientation | Opening before (ms) | Opening after median [min–max] (ms) | First ready before (ms) | First ready after median [min–max] (ms) | Worst later before → after (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| portrait | 2,276 | 700 [692–2,216] | 2,543.5 | 944.7 [938.6–2,481.8] | 562.3 →14.2 |
| landscape | 752 | 752 [748–756] | 965.4 | 965.2 [962.8–970.2] | 1,788.3 →14.3 |

All later movies in the4G samples were fully buffered at their gestures. Their request order is exactly forward1, forward2, reverse1, forward3, reverse2, reverse3 in both orientations. The waterfall confirms no overlap between these movie transfers: the smallest next-request start minus prior-response finish across the six runs is0.9ms. The first-ready≤2.5s and later-start≤200ms targets pass all six4G runs. All landscape opening samples and two of three portrait samples pass1s; the first portrait opening at2,216ms fails. Its initial document response is1,724.2ms, versus201.8ms for the first landscape run. The orientation query/currentSrc remains correct throughout. No claim is made that frontend changes fixed this initial-response delay or that the1s target passes every cold navigation.

| Public profile / sample | Orientation | Opening paint (ms) | First canplaythrough (ms) | Worst later start (ms) | Complete transfer (bytes) |
| --- | --- | ---: | ---: | ---: | ---: |
| 4G /1 | portrait | 2,216 | 2,481.8 | 11.7 | 4,094,966 |
| 4G /1 | landscape | 752 | 965.2 | 14.1 | 4,693,139 |
| 4G /2 | portrait | 700 | 944.7 | 14.2 | 4,094,772 |
| 4G /2 | landscape | 756 | 970.2 | 13.8 | 4,692,848 |
| 4G /3 | portrait | 692 | 938.6 | 14.1 | 4,095,069 |
| 4G /3 | landscape | 748 | 962.8 | 14.3 | 4,692,869 |
| Fast3G /1 | portrait | 2,844 | 4,000.5 | 2,797.5 | 4,095,059 |
| Fast3G /1 | landscape | 3,124 | 4,173.1 | 4,241.0 | 4,693,060 |

The current complete-transfer scope includes all six movies, mobile menu and every business section; optional PDF excluded. These are CDP encoded HTTP totals including repeated requests and platform-injected resources. The earlier baseline timing script omitted opening the mobile menu, so its transfer total is not an identical-scope comparator. **Every current sample remains below5,000,000 bytes.** Fast3G uses180,000B/s down,84,375B/s up,562.5ms latency. On that slower cold profile, forward2/3 and reverse3 were not cached at their gestures; preparation cannot guarantee200ms before the data arrives. Fast3G therefore still has visible waits, shown above, while already prepared reverse1/2 start within13ms. The1s/2.5s/200ms acceptance targets were specified for4G, not Fast3G.

### Published native video payload — Chrome and WebKit

Measured on the live version21 URL in fresh contexts, **without fetch, routes, cache prewarming, response substitution or a proxy**. Chrome153.0.8010.48 and WebKit26.6 (touch/mobile emulation), each orientation. Wait for all six native buffers, traverse all three forward and three reverse films, then replay forward1. Compare completed MP4 response-body lengths to actual on-disk file bytes. Read response bodies through browser instrumentation, which issues no extra HTTP request. Also retain Playwright's reported HTTP-size fields; those include overhead and cannot be compared as raw MP4 file sizes.

| Engine | Orientation | On-disk MP4 bytes | Received MP4 payload bytes | Reported HTTP bytes, incl. overhead | Initial responses | Playback/replay responses |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chrome | portrait | 3,407,812 | 3,407,812 | 3,412,127 | 6 | 0 |
| Chrome | landscape | 3,792,329 | 3,792,329 | 3,797,048 | 6 | 0 |
| WebKit | portrait | 3,407,812 | 3,407,812 | 3,412,133 | 6 | 0 |
| WebKit | landscape | 3,792,329 | 3,792,329 | 3,797,057 | 6 | 0 |

All24 responses are HTTP200 containing the complete corresponding file; no failed/aborted movie requests. Each context receives precisely its six selected-orientation clips once, with **zero duplicated MP4 payload**. The same six video DOM elements remain throughout playback/replay. This passes the on-disk payload ceiling in both engines. HTTP framing/headers add about4–5KB and are separately disclosed rather than falsely described as video duplication. These measurements cover a normal full journey plus replay, not all possible cache eviction, interrupted reload or orientation-switch scenarios on physical phones.

## Cold-load ordering — 18 September 2026 (stopped before publication)

**Release status: not published.** The requested fetch-based cache warming is not reusable by native media in the tested WebKit engine. Its measured video bodies alone exceed the 5,000,000-byte budget. Following the owner's explicit stop condition, only the safe opening-image slice is implemented locally. No head video fetch or five-clip fetch queue is shipped. All Gate 1 player/input/fallback behavior, accepted films/stills, captions and DESIGN.md remain unchanged. The existing public Gate 1 release (Sites version 19) remains live.

### Implemented opening slice

`index.html` now discovers the appropriate opening WebP before the deferred module, with two mutually exclusive orientation `media` queries and `fetchpriority="high"`. A small inline style supplies the stage's blurred, embedded WebP background before hydration. Higgsfield processed the actual accepted opening stills into 20×36 portrait (228 bytes) and 20×11 landscape (114 bytes) placeholders; base64 adds 304/152 characters respectively. No accepted film or still was re-encoded. Provenance and source hashes are in `scripts/cinema.json` → `openingLqip`.

Existing prerendering supplies the stage, captions and business content as HTML. The module remains `type="module"`, without `async` or a render-blocking flag. Browser tests abort the module entirely and verify the opening, caption and CSS artwork remain visible; a second test also aborts the full-resolution opening still. Those deliberate image-failure screenshots test the placeholder, not normal image quality. No render-critical content waits for hydration.

Local Chrome 4G waterfall, milliseconds from navigation:

| Orientation | Opening image request | JS bundle request | Opening image response complete | Opening image painted |
| --- | ---: | ---: | ---: | ---: |
| portrait | 181.1 | 182.1 | 628.3 | 652 |
| landscape | 180.2 | 180.4 | 696.2 | 728 |

The opening image starts before the bundle in both orientations. The no-hydration request-order tests also run in Chrome and WebKit. The placeholder is inline and needs no network request; the timing script's `lqipMs` field is a DOMContentLoaded-plus-frame presence check, **not** a measured placeholder first-paint timestamp.

### Published baseline and local opening-only study

These are **browser lab measurements**, not phone measurements or a performance guarantee. One cold navigation per profile/orientation, fresh browser context and cleared cache at navigation; caching stays enabled afterwards. Chrome 153, no CPU throttling. The real public URL is https://adduco-crveni-monolit.mglavinic.chatgpt.site/. Chrome DevTools Protocol applies the network profiles. “4G” means the current Fast 4G preset: 1,012,500 bytes/s download, 168,750 bytes/s upload and 165ms latency; “Fast3G” means the legacy Fast 3G/current Slow 4G preset: 180,000 bytes/s download, 84,375 bytes/s upload and 562.5ms latency. These effective settings include the DevTools preset adjustment factors. [DevTools preset source](https://chromium.googlesource.com/devtools/devtools-frontend/+/b2cbf557e71b23f634a169ca7bc782efeb29b6a5/front_end/core/sdk/NetworkManager.ts)

Opening visibility uses Chrome Element Timing for the actual opening image; first readiness uses that clip's first native `canplaythrough`. Gesture latency runs six moves, forward1/2/3 then reverse3/2/1, as soon as the previous move ends (or the retained stall fallback releases it). The timestamp is taken immediately before Playwright keyboard dispatch, so latency includes a few milliseconds of automation overhead. “Later max” is the worst of moves2–6; these are cold-journey measurements, **not a claim that later clips were already cached**. The JSON records each clip's readiness/buffer at its gesture.

| Origin / build | Profile | Orientation | Opening visible (ms) | First canplaythrough (ms) | Later max (ms) | Journey transfer (bytes) |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Public Gate 1, before | 4G | portrait | 2,276 | 2,543.5 | 562.3 | 4,065,898 |
| Public Gate 1, before | 4G | landscape | 752 | 965.4 | 1,788.3 | 4,691,921 |
| Public Gate 1, before | Fast3G | portrait | 3,892 | 4,775.1 | 2,549.5 | 4,065,642 |
| Public Gate 1, before | Fast3G | landscape | 3,144 | 4,742.3 | 5,388.6 | 4,691,924 |
| Local opening slice only | 4G | portrait | 652 | 882.5 | 551.3 | 4,054,400 |
| Local opening slice only | 4G | landscape | 728 | 911.8 | 820.1 | 4,680,059 |
| Local opening slice only | Fast3G | portrait | 2,824 | 3,733.3 | 2,542.0 | 4,054,400 |
| Local opening slice only | Fast3G | landscape | 3,112 | 3,899.6 | 5,286.9 | 4,680,059 |

**Published after: not available, because the candidate was withheld.** Localhost has different response latency and transport from Sites. The local opening-only numbers cannot establish a like-for-like published improvement or acceptance of the full task. The sampled public portrait 4G document response itself took 1,779ms; an HTML image hint cannot make a full-resolution image appear within 1,000ms on that particular response. Landscape's document response was 203ms. A repeated public sample would be required to characterize that origin/edge variability.

Journey transfer is actual CDP encoded traffic through all six movies and all normal business sections; it includes repeat transfers and headers. This diagnostic does not open the mobile menu or user-triggered PDF, and its totals must not replace the broader completed-page regression budget test below. On Fast3G, some cold moves reach the retained 6.5s stall fallback. No new prefetch is installed, so later-move latency still misses 200ms. The local study preceded HTML formatting cleanup; runtime behavior and bundle/media hashes are unchanged, but these byte counts describe that measured build.

### Cache reuse experiment — the blocking result

Both methods were tested on the **published Sites origin** in fresh Chrome and WebKit contexts, using the unused 553,486-byte `transition-3/portrait-reverse.mp4`: (a) `preload as="fetch" crossorigin="anonymous"`, awaiting load; (b) explicit fetch to completion, then attach a native muted/inline video with the same URL. The first request was fully consumed before native attachment, avoiding a concurrent-request race. Sites responds with `Cache-Control: public, max-age=0, must-revalidate` and an ETag.

| Engine / method | Initial response | Native media consumption | Body reused? |
| --- | ---: | ---: | --- |
| Chrome / fetch preload | 554,183 encoded HTTP bytes | 56 encoded HTTP bytes (revalidation) | Yes |
| Chrome / explicit fetch | 554,197 encoded HTTP bytes | 33 encoded HTTP bytes (revalidation) | Yes |
| WebKit / fetch preload | 554,116 reported response-body bytes | 554,116 reported response-body bytes again | No |
| WebKit / explicit fetch | 554,116 reported response-body bytes | 554,107 reported response-body bytes again | No |

Chrome values use CDP `loadingFinished.encodedDataLength`; Resource Timing alone misleadingly lists the cached full encoded-body size on media consumption. WebKit uses Playwright response-size reporting; the slight difference from the raw file size includes its transport reporting overhead. A separate local HTTP transport fixture confirmed the actual server-sent bodies: Chrome transfers the file then receives a zero-body 304; WebKit transfers the full file, probes bytes0–1, then transfers the full range again. The fixture supplies correct ETags and byte ranges. Repeating with fresh `max-age=3600`, default/no-CORS requests, credentials variants and an explicit Range fetch did not eliminate duplication in this WebKit build (reported Safari version26.6). This is evidence for the tested engines, not a universal statement about all Safari versions.

The same instrumented HTTP fixture then measured **all six clips in each orientation**, fetching in the requested order and consuming each through a native video. Exact server-sent movie bodies:

| WebKit orientation | Video bodies alone (bytes) | Requests | 5 MB complete-page budget |
| --- | ---: | ---: | --- |
| portrait | 6,815,636 | 18 | Exceeded before HTML, fonts or stills |
| landscape | 7,584,670 | 18 | Exceeded before HTML, fonts or stills |

These are measured transport-lab totals, not an estimate and not a deployed candidate. Each file produced a full fetch, a two-byte media probe and a full media range response. This lower bound already fails the budget. Therefore neither tested fetch strategy is shipped, and the sequential fetch queue is stopped at its dependency rather than knowingly introducing double downloads. The existing observer-based native preparation remains intact.

The preload documentation's fetch example consumes the resource through fetch/MediaSource; it does not prove native video-element cache reuse, which is why this task used measured native consumption. [Google web.dev preload guidance](https://web.dev/articles/fast-playback-with-preload)

**Recommended next implementation, not yet applied:** prepare the actual persistent native video elements early and sequentially, then play those same elements. Test native buffered-data reuse and memory in both engines before changing release status. This changes the requested fetch-based mechanism; it does not require new films, compressed artwork, Blob URLs, scroll seeking or different Gate 1 gestures. It also needs fresh published timing evidence, including document latency, before promising the three targets.

### Verification and evidence

The PRD amendment was added before changes. Opening discovery tests were first red without HTML preloads, then green after the opening slice. Typecheck, lint, four unit tests and production/SSR build pass. Final Chrome/WebKit regression: **126 passed, four expected skips, 130 cases total, workers=1, 7.3 minutes**. The four skips remain WebKit's wheel-only and CDP-transfer cases; their Chrome equivalents run. All four new opening/no-hydration cases pass. DESIGN.md, `src/`, the public media and the Git HEAD remain unchanged; no commit, push or deployment is part of this stopped pass.

The separate complete-page regression test, with CDP caching disabled throughout, measures the final local build at **885,047 initial /4,185,883 complete bytes portrait** and **966,221 initial /4,782,686 complete bytes landscape**. Its scope includes all six movies, mobile menu and all business sections; the optional PDF is excluded. This passes the existing local transfer gate without the rejected fetch-prefetch implementation. Cache-disabled results are a transfer stress check, not evidence of cache reuse. Both placeholder screenshots were visually inspected: readable original captions, header and exit over the blurred artwork. The design-artifact audit passes, with only the pre-existing optional CLAUDE.md warning; intentional new files are the two measurement scripts and the opening-loading test.

Evidence is archived outside the repository under `/Users/mato/.codex/visualizations/2026/09/15/01a0a34a-e6c7-7e73-8127-ac8e619655f2/cold-load-2026-09-18/`: public-before and local-opening timing/waterfall JSON, public cache probe, fresh-cache/ETag transport logs and reproducible fixture scripts, exact six-clip body totals, placeholder screenshots and build/browser-test logs. Reusable diagnostics are `scripts/measure-load.mjs` and `scripts/probe-media-cache.mjs`. Local preview: http://127.0.0.1:5184/.

## Gate 1 correction — 18 September 2026 (local review; not published)

The owner withdrew CRF≤18, retained portrait≤1,000,000 bytes, set landscape≤1,200,000 bytes, requested eight stills decoded from accepted forward clips at WebP quality≥85, and authorized a 150ms final-frame/still blend for reverse joins still above RMS3. The dated PRD correction was added before implementation. DESIGN.md and all six forward MP4s are byte-for-byte unchanged (SHA-256 verified against commit de65388bd8b2b7ae036b4a4f90b522bde3f25522). No new generation, copy edits, Batch 2 work, commits, pushes or publication.

### Delivered media and all 24 RMS values

Higgsfield processed six reverse films directly from the original Seedance source frames, never from compressed forward films. Encoder matches accepted forward settings: libx264 slow, two-pass 1500kbps portrait /1650kbps landscape; maxrate1800/1950k, bufsize3000/3300k; yuv420p, GOP72, keyint_min72, scenecut0, no audio. All are 72 frames, 24fps, 3.000s, initial I-frame at0.000s and fast-start, 720×1280 portrait /1920×1080 landscape. Exact files/probes/SHA-256/source URLs are in scripts/cinema.json → transitionPolishCorrection. Confirmed Higgsfield archive: c7b443a5-ca28-4af5-8ccb-0e3f2f352944.

Method: ffmpeg decodes first frame0 and last frame71 to RGB PNG; Pillow Lanczos resizes film endpoints and decoded WebP stills to **640px longest edge** (portrait360×640; landscape640×360); RMS=sqrt(mean squared error across all RGB samples), with no alignment, gain correction or masking. These are raw offline pixel measurements, not frame-rate/perceptual scores. First/last columns refer to playback direction: reverse first compares with forward destination, reverse last with forward origin. All byte sizes are exact decimal bytes.

| Clip | Bytes | First → origin RMS | Last → destination RMS | Treatment / result |
| --- | ---: | ---: | ---: | --- |
| portrait 1 forward | 572,882 | 2.045 | 1.824 | Both ≤3 |
| portrait 1 reverse | 564,200 | 6.044 | 6.311 | 150 ms settle fade |
| portrait 2 forward | 582,112 | 3.144 | 1.861 | Shared origin >3; unchanged forward |
| portrait 2 reverse | 567,324 | 4.933 | 6.750 | 150 ms settle fade |
| portrait 3 forward | 567,808 | 2.839 | 2.053 | Both ≤3 |
| portrait 3 reverse | 553,486 | 5.387 | 5.519 | 150 ms settle fade |
| landscape 1 forward | 602,322 | 1.532 | 1.487 | Both ≤3 |
| landscape 1 reverse | 645,107 | 5.472 | 5.637 | 150 ms settle fade |
| landscape 2 forward | 643,085 | 3.766 | 1.540 | Shared origin >3; unchanged forward |
| landscape 2 reverse | 631,822 | 8.104 | 7.720 | 150 ms settle fade |
| landscape 3 forward | 649,925 | 2.870 | 1.517 | Both ≤3 |
| landscape 3 reverse | 620,068 | 4.577 | 8.005 | 150 ms settle fade |

**Do not interpret the fade as a numeric RMS pass.** All six reverse files still exceed3 at both ends. Under the owner's correction, all six receive the 150ms settlement blend. The native last frame stays paused and visible underneath a decoded destination still fading from0→1; only the animation's completion hides the movie. Captions remain visible, and fresh input can cancel the handoff immediately without a stale completion hiding the next film. Reduced-motion/direct/error stills do not run this animation. The blend compensates the final handoff only; reverse entry differences remain reported above.

**Two shared forward origins remain above3:** portrait forward2=3.144 and landscape forward2=3.766. Four scene anchors mean the middle still is the preceding forward's decoded endpoint, also used as the next clip's origin. Those independently encoded forward endpoints already differ, even before WebP: RGB PNG-to-PNG RMS3.027 portrait /3.829 landscape. Re-extracting a still cannot make both source frames identical, and the owner explicitly forbids altering the forward movies. Same-frame WebP comparisons measure1.487–2.053 rather than mathematical zero because quality85 WebP is lossy. These residuals require owner review; no threshold was silently relaxed and no claim that all24 numbers pass is made.

### Eight regenerated scene stills

Decoded exclusively from accepted forward MP4s → RGB PNG → Pillow WebP quality85, method6. Scene0 is forward1 frame0; scenes1–3 are the respective forward frame71. All four portrait stills are below200,000 bytes. There are still exactly eight scene assets, not additional per-clip origin images.

| Still | Bytes | Encoded-forward source |
| --- | ---: | --- |
| transition-1/portrait-start.webp | 115,480 | 0 of transition-1/portrait-forward.mp4 |
| transition-1/portrait-end.webp | 107,034 | 71 of transition-1/portrait-forward.mp4 |
| transition-2/portrait-end.webp | 90,184 | 71 of transition-2/portrait-forward.mp4 |
| transition-3/portrait-end.webp | 133,676 | 71 of transition-3/portrait-forward.mp4 |
| transition-1/landscape-start.webp | 167,214 | 0 of transition-1/landscape-forward.mp4 |
| transition-1/landscape-end.webp | 163,918 | 71 of transition-1/landscape-forward.mp4 |
| transition-2/landscape-end.webp | 159,872 | 71 of transition-2/landscape-forward.mp4 |
| transition-3/landscape-end.webp | 196,510 | 71 of transition-3/landscape-forward.mp4 |

### Interaction, loading and browser evidence

The previous Gate1 interaction fixes below remain: outgoing caption until `playing`; 2px palette-red indicator only after300ms buffering; 6.5s watchdog with paired decoded still/caption fallback; only scene0 eager and other stills lazy/low with deferred sources; stage-only gesture capture, no scroll seeking or queue; document-level touch-end cleanup only; visible ≥44px header and scene exits. The destination caption still enters at1.5s of actual playback.

TDD first reproduced zero intermediate still-opacity samples at reverse settlement. The 150ms handoff then passed in Chrome and WebKit. Per-frame browser samples verify an ended, paused, visible movie below a fading still while its caption remains readable. Tests cover all three reverse moves in both orientations and an immediate fresh gesture during the handoff. The completed production-preview regression suite and updated network evidence below describe this corrected media version.

Final production-preview run: **122 passed, four expected skips**, 126 cases total, workers=1, Chrome + WebKit, 7.3 minutes. Skips are the two WebKit wheel-only cases and two WebKit CDP-transfer cases; their Chromium equivalents run. All four unit tests, TypeScript, ESLint, production/SSR build and git diff whitespace checks pass. No browser console warnings/errors in the in-app preview. The visual-artifact audit passes with only the existing optional CLAUDE.md warning. DESIGN.md has no diff. No software check remains failing.

Chrome/WebKit computed-style samples on requestAnimationFrame verify the 150ms opacity ramp and paused, visible final movie underneath for all six reverse transitions. A fresh gesture during that fade starts the next film without a stale completion hiding it. This is browser lab evidence, not a physical-phone FPS guarantee; physical macOS momentum and iOS overscroll are modeled input tests, not hardware measurements.

Cold-cache Chromium CDP actual encoded HTTP transfers, including repeated requests, all three forward/reverse movies, mobile menu and all business sections. **Local lab measurements**, decimal bytes; PDF is user-initiated and excluded. The initial portrait ≤2,000,000-byte and complete-page ≤5,000,000-byte budgets pass.

| Orientation | First view (bytes) | Complete page, both directions (bytes) |
| --- | ---: | ---: |
| portrait | 884,508 | 4,185,344 |
| landscape | 965,682 | 4,782,147 |

Initial scene-resource waterfall (milliseconds from navigation, native request events):

| Browser | Resource | Start ms | End ms |
| --- | --- | ---: | ---: |
| chrome | transition-1/landscape-start.webp | 27 | 44 |
| chrome | transition-1/landscape-forward.mp4 | 94 | 94 |
| webkit | transition-1/portrait-start.webp | 11 | 17 |
| webkit | transition-1/portrait-forward.mp4 | 90 | 94 |
| webkit | transition-1/portrait-forward.mp4 | 94 | 96 |

Exactly **one unique scene still and one unique clip** load before the first gesture in each engine. WebKit makes two native requests to the same opening MP4, not two different clips. Other HTML/CSS/JS/fonts/logo transfers remain included in the full byte totals. Tests also verify that inactive stills are lazy/low and acquire sources only when requested.

Both header Razgovarajmo and scene-nav O nama pass viewport containment, ≥44px target dimensions, center-point hit testing and actual clicks during native playback at390/768/1440px in both engines. All six screenshots were visually inspected: readable captions, no overlap, visible exits, preserved dark artwork.

Evidence directory: `/Users/mato/.codex/visualizations/2026/09/15/01a0a34a-e6c7-7e73-8127-ac8e619655f2/gate1-2026-09-18/correction/`. Files: `media-verification.json` (all24 values, sizes, probes/hashes), `waterfall.html`, `waterfall-{chrome,webkit}.json`, `transfer-{portrait,landscape}.json`, `settle-{chrome,webkit}-{1,2,3}.json`, `adduco-batch1-{chrome,webkit}-{390,768,1440}.png`, `browser-tests.log`, `build.log`. These artifacts remain outside tracked application source. Preview: http://127.0.0.1:5184/.


**Gate 1 remains the review stop.** The CRF/size conflict is resolved with the approved encoding and fade policy. Raw shared-forward-origin/entry differences above remain transparent for owner assessment. Batch2 and Sites publication require their separate explicit approval.

## Earlier Gate 1 study — superseded by owner correction above

Archived pre-correction measurements and decision request; the corrected delivery and current limitations are recorded above.

The latest PRD amendment was the first changed file and records both batches, their approval gates and the publication hold. DESIGN.md, visitor captions, accepted gestures and all delivered film/still assets are unchanged. Batch 2 has not started. No GitHub push, Sites version or deployment was made.

### Implemented interaction and loading

- The outgoing caption remains while native play is pending and hides only on `playing`. The destination caption enters at the accepted 1.5 seconds of actual playback; buffering/resume cannot hide that caption a second time. A 2px red indeterminate indicator appears after 300ms of buffering; it reports waiting, not a fabricated download percentage.
- The 6.5s movie watchdog is retained. A failed/stalled film pauses; its decoded destination still and caption are revealed together. If the still itself is delayed, the last visual/reading state stays until decoding completes. If both media and still fail, preserve the previous visual with accessible destination content. A later scene request invalidates a late fallback completion. A completed native film advances the logical scene immediately using its own decoded endpoint, even if the optional still is delayed; a reproduced regression verified that the next gesture starts the next film rather than replaying the previous one.
- Only still0 has initial sources. Other images carry lazy/low attributes and receive sources when explicitly requested, preventing four overlaid pictures from being fetched simply because their layout boxes share the viewport. Requested fallback decoding is prepared alongside playback.
- Touch completion/cancellation now clears gesture state on the document even if the release occurs outside the stage. Gesture capture remains attached only to the stage. There is no queue or scroll-driven media seeking.
- Header Razgovarajmo and scene-nav O nama keep ≥44px targets and remain hit-testable during playback; both are actually clicked in browser tests at 390/768/1440px. No layout redesign was needed.

TDD reproduced the premature caption removal, four initial still downloads, unloaded-image fallback and stale touch state after a modeled outside release before their fixes. Tests cover continuous 1.2s modeled macOS wheel momentum, two-finger/pinch input and releasing one finger, outside touch completion, rapid reverse input, Space/PageDown and uncaptured downward touch overscroll at scene0. These are controlled browser-event models, not physical macOS/iOS hardware measurements. Existing real Chromium touch and wheel coverage remains.

### Media continuity — all 24 current-preview RMS measurements

Method: ffmpeg decodes frames0/71; compare with origin/destination WebP decoded to RGB, using Pillow Lanczos at **640px longest edge** (portrait360×640; landscape640×360). Compute sqrt(mean squared error over every RGB sample), no exposure fit, geometry alignment or masking. Threshold ≤3.0 independently at both ends. Measurements are offline pixel comparisons, not frame-rate claims. The supplementary 640px-width baseline is in the JSON audit; this stricter portrait size also fails acceptance. Byte sizes below are exact, decimal bytes.

| Current clip | Bytes | First → origin RMS | Last → destination RMS | Acceptance |
| --- | ---: | ---: | ---: | --- |
| portrait 1 forward | 572,882 | 3.653 | 2.736 | FAIL |
| portrait 1 reverse | 565,340 | 6.371 | 6.855 | FAIL |
| portrait 2 forward | 582,112 | 3.887 | 2.256 | FAIL |
| portrait 2 reverse | 579,255 | 2.576 | 5.934 | FAIL |
| portrait 3 forward | 567,808 | 3.471 | 2.398 | FAIL |
| portrait 3 reverse | 569,045 | 2.660 | 4.796 | FAIL |
| landscape 1 forward | 602,322 | 2.956 | 2.488 | PASS |
| landscape 1 reverse | 642,922 | 5.910 | 5.974 | FAIL |
| landscape 2 forward | 643,085 | 4.365 | 1.969 | FAIL |
| landscape 2 reverse | 649,483 | 3.252 | 6.836 | FAIL |
| landscape 3 forward | 649,925 | 3.456 | 1.937 | FAIL |
| landscape 3 reverse | 642,731 | 2.263 | 6.133 | FAIL |

### Original-source reverse candidates — rejected, not shipped

All six requested reverse candidates were re-encoded through Higgsfield from original source frames, never from compressed forward MP4s. Each is silent H.264/yuv420p, 72frames/24fps/3.000s, same orientation dimensions, initial I-frame at0.000s, last frame at2.958333s and moov before mdat (fast-start). Encoding: libx264 veryslow, CRF18, explicit BT709 limited range. Uniform original-frame selection and the prior three-frame join blend are preserved, with the preceding ORIGINAL endpoint supplying the blend. Full source URLs/probes/hash provenance are in scripts/cinema.json.

| CRF18 reverse candidate | Bytes | First → origin RMS | Last → destination RMS | Acceptance |
| --- | ---: | ---: | ---: | --- |
| transition-1/portrait-reverse.mp4 | 2,474,484 | 6.571 | 5.022 | FAIL |
| transition-2/portrait-reverse.mp4 | 2,508,430 | 5.386 | 7.143 | FAIL |
| transition-3/portrait-reverse.mp4 | 2,117,578 | 5.649 | 5.747 | FAIL |
| transition-1/landscape-reverse.mp4 | 4,427,812 | 6.187 | 4.071 | FAIL |
| transition-2/landscape-reverse.mp4 | 5,704,203 | 8.408 | 6.874 | FAIL |
| transition-3/landscape-reverse.mp4 | 3,822,237 | 5.190 | 8.662 | FAIL |

**Media acceptance is not met.** Tested CRF18 portrait derivatives are 2.12–2.51MB each, exceeding 1,000,000bytes. Existing forward beginnings also fail the requested RMS threshold, so replacing only reverse encodes cannot make all24 numbers pass. The current stills derive from the low-bitrate delivered forward movies; returning to original frames alone does not reproduce those exact compressed endpoints. These trials establish failure of the tested encoding, not mathematical impossibility of every encoder configuration. Do not hide this by weakening thresholds or claiming a nominal CRF setting maintains quality while forcing a lower bitrate.

An owner decision is pending: retain 1MB and allow adjusted encoding plus common-source endpoint/still alignment (recommended for the transfer budget), or retain CRF≤18 and raise the media budget while aligning the common source derivatives. No noncompliant candidate has replaced an accepted production asset. Gate1 therefore is not approved for Batch2.

### Browser evidence and transfer

Final production-preview run: **114 browser tests passed; four expected skips** (two wheel-only and two CDP-transfer cases unsupported by mobile WebKit). The suite includes 28 new transition-polish cases across Chrome/WebKit. All four unit tests, TypeScript, ESLint and production/SSR build pass. The visual-artifact audit passes with the pre-existing optional CLAUDE.md warning. No console warnings/errors were observed in the in-app preview. DESIGN.md has no diff.

Cold-cache Chromium CDP totals include actual encoded HTTP transfers, all three forward/reverse movies, the mobile menu and every business section. Decimal bytes; **local lab measurements**, not hosted/physical-phone results. These totals describe retained accepted media, not the rejected CRF18 candidates.

| Orientation | First view (bytes) | Complete page, both directions (bytes) |
| --- | ---: | ---: |
| portrait | 879,458 | 4,202,672 |
| landscape | 962,900 | 4,806,354 |

Initial scene-resource waterfall (milliseconds from navigation, native request events):

| Browser | Resource | Start ms | End ms |
| --- | --- | ---: | ---: |
| chrome | transition-1/landscape-start.webp | 25 | 45 |
| chrome | transition-1/landscape-forward.mp4 | 91 | 91 |
| webkit | transition-1/portrait-start.webp | 11 | 18 |
| webkit | transition-1/portrait-forward.mp4 | 89 | 91 |
| webkit | transition-1/portrait-forward.mp4 | 91 | 94 |

Each browser loads exactly **one unique scene still and one unique clip** before the first gesture. WebKit makes two native requests to that same MP4; it does not fetch a second clip. Other page resources (HTML/CSS/JS/fonts/logo) are included in the complete transfer JSON, not hidden from the byte totals. Source-less inactive pictures carry lazy/low attributes until requested.

Evidence is saved outside tracked application source at `/Users/mato/.codex/visualizations/2026/09/15/01a0a34a-e6c7-7e73-8127-ac8e619655f2/gate1-2026-09-18/`: `waterfall.html`, the two waterfall JSON traces, transfer-portrait/landscape.json, baseline-rms.json, reverse-crf18-rms.json, browser-tests.log and build.log. Playback screenshots `adduco-batch1-{chrome,webkit}-{390,768,1440}.png` show visible header and scene exits. Their ≥44px sizes, viewport containment, center-point hit testing and actual navigation are browser assertions. Screenshots for 390/768/1440 were visually inspected. Local preview: http://127.0.0.1:5184/.

**Stop at Gate 1.** Software checks pass; media acceptance does not. Batch 2 and publication remain unstarted. An explicit owner decision is required before changing the specified CRF/size/endpoint constraints.


## Earlier caption entrance — 18 September 2026

The owner accepts the films and requests earlier text. Destination captions now begin their existing 260 ms fade after approximately 1.5 seconds of actual native playback, in all three transitions and both directions. The movie continues to its unchanged three-second ending. Only one caption is visible, its action is immediately usable, and the displayed scene indicator/hash follows it. Completion retains the text without restarting its fade; gesture locking still lasts until the film ends. Fallbacks and direct navigation remain immediate. No films, artwork, CSS, wording or DESIGN.md changed.

TDD first reproduced text appearing only after `ended`, then passed the early-reading assertions. A second regression reproduced Back returning to the previous caption after an early contact action; updating the current caption's hash fixed the return while leaving playback locked. A stalled-before-halfway check confirms that caption timing follows the movie, not a wall-clock delay. Existing tests now explicitly await native completion before requesting another transition.

Final complete browser run: **86 passed, four expected skips**, covering Chrome and mobile WebKit. The six new checks confirm early readable text, locked gestures, correct Back navigation after early actions and progress-based timing during a stall. TypeScript, ESLint, four component tests and the production/SSR build pass. Visual inspection of the early-caption frames confirms readable, non-overlapping text over moving landscape and portrait artwork. The visual-contract audit passes, with the existing optional CLAUDE.md warning.

Cold-cache production-preview transfer remains within budget, including all forward/reverse films and business sections:

| Orientation | First view (bytes) | Full page, both directions (bytes) |
| --- | ---: | ---: |
| Portrait | 1,204,417 | 4,202,181 |
| Landscape | 1,472,369 | 4,805,863 |

The media files, sizes and encoding remain exactly as recorded in the previous release below.

## Complete four-scene release — 18 September 2026

The owner accepted the first-transition preview and authorized completing the entire experience and its existing public Sites release. All four approved captions and the dark visual contract remain unchanged. Three native three-second moves connect the stationary scenes in either direction. Forward and reverse movies are separate H.264 assets in landscape and purpose-composed portrait versions. Only adjacent clips prepare when the active scene intersects the viewport; the initial frame stays paused. Direct scene links jump to the requested still without chaining playback. O nama, Usluge, Priprema, Projekti and Kontakt remain normal document sections.

### Media

The accepted first pair is unchanged. Higgsfield archive `6e92809b-181a-4578-ae46-cc5a3729cc89` supplies the remaining forward movies/stills; archive `e62c9c13-3e02-4019-b7cb-3afa07994767` supplies their final reverse movies. Every new movie is H.264/yuv420p, 72 frames at 24fps, exactly 3.000 seconds, silent, fast-start, starting with an I-frame. Forward starts share the preceding delivered endpoint; three opening frames join that pose to the existing motion. QA comparison sheets confirm aligned concrete, reinforcement and emblem geometry at both joins. Source URLs, selected frames, processing, and probes are in `scripts/cinema.json`.

| Transition | Portrait forward / reverse (bytes) | Landscape forward / reverse (bytes) |
| --- | ---: | ---: |
| Vizija → Betonski radovi | 572,882 / 565,340 | 602,322 / 642,922 |
| Betonski radovi → Visokogradnja | 582,112 / 579,255 | 643,085 / 649,483 |
| Visokogradnja → Vaš projekt | 567,808 / 569,045 | 649,925 / 642,731 |

New destination stills: height 89,516 portrait / 154,514 landscape bytes; final scene 131,716 portrait / 192,090 landscape bytes. Existing opening/detail stills are listed in the accepted checkpoint below. Seventeen unused older still variants have been removed; original supplied branding and source provenance remain.

### Verification

The complete-page transfer regression first failed: the original later reverse derivatives started at 0.125 seconds with only 69 frames. That offset triggered unnecessary reloads and omitted opening frames. A real-browser assertion reproduced the nonzero prepared start; the corrected derivatives explicitly normalize all 72 reversed presentation timestamps to start at zero. No artwork or forward timing changed.

- Final full run: **80 browser checks passed, four expected skips** (Chrome-only network measurements and wheel injection unavailable in mobile WebKit). Four component tests, TypeScript, ESLint and production/SSR build pass. No failing checks remain.
- Chrome and WebKit cover every forward/reverse transition, zero-based prepared reverse media, opening pause, held endings/captions, rapid opposing input, continuous gesture bursts, rejected/missing/stalled media, partial-playback recovery, rotation, direct scene and business hashes/Back, no-JavaScript content, mobile menu/focus, inquiry draft, PDF and sharing metadata.
- Visual QA covers 360×640, 390×844, 768×1024 and 1440×900, including the two new destination captions. No horizontal overflow or header/caption/navigation overlap; only the active caption paints. In-app forward/reverse inspection has no console warnings/errors. The contact flow has zero Axe violations. Strict design audit passes (one existing optional CLAUDE.md warning); DESIGN.md is unchanged.
- These checks use desktop engines, responsive viewports and injected touch events, not the owner's physical phone. No claim of guaranteed device frame rate is made. This exact build is ready for the authorized public Sites release; the deployment record identifies its published source.

Earlier checkpoints below are historical.

Cold-cache Chrome production-preview measurements sum actual `Network.loadingFinished.encodedDataLength`, including compressed HTML/JS/CSS, fonts, logo, four stills, media ranges and repeated requests. First view is measured at network idle with the opening paused. Full-page measurement visits every scene forward and backward (all six selected-orientation MP4s), opens the mobile menu and visits every business section. No opposite-orientation video is downloaded.

| Orientation | First view (bytes) | Full page, both directions (bytes) |
| --- | ---: | ---: |
| Portrait | 1,204,334 | 4,202,098 |
| Landscape | 1,472,286 | 4,805,780 |

Both orientations meet the complete-page 5,000,000-byte budget; portrait also meets the 2,000,000-byte opening budget. No reverse movie downloads twice. Optional, user-initiated PDF download is separate: 156,006 bytes on disk. These are controlled local browser measurements, not field-performance claims. Per-request reports are `/tmp/adduco-transfer-portrait.json` and `/tmp/adduco-transfer-landscape.json`.

## Corrected first-transition preview — 18 September 2026

**Scope:** the complete first transition only, connecting Vizija to Betonski radovi in both orientations and both directions. The owner approved film-scoped vertical gesture capture and native reverse playback. Later transitions and publication remain behind the explicit local-review gate. DESIGN.md is unchanged. Earlier reports below describe superseded implementations.

### Current behavior

- Opening is stationary with its original caption. A deliberate vertical scroll/swipe or PageDown starts one complete three-second native film. Completion holds its final frame and reveals the destination caption. A fresh upward gesture/PageUp plays the separate reverse movie.
- Additional gestures during playback, held keys and the remainder of a wheel/touch gesture are consumed inside the stage. No transition is queued. After the last implemented scene, a new downward gesture enters the ordinary business sections. Horizontal/zoom input remains native; header links exit immediately.
- Both scenes have direct hash/navigation links. Reduced motion and Data Saver request no MP4s. Policy rejection, failed or stalled playback reveal the destination still and caption; a 6.5-second deadline bounds a stalled request. Rotation and leaving the film cancel pending playback. A subsequent attempt after an interrupted/failed clip starts at its first frame.
- First-orientation forward media loads eagerly without playing. The reverse clip prepares on completion or IntersectionObserver entry at the detail scene. No video controls/play button, currentTime assignment, scroll clock, sequence packets, Blob recovery or media animation loop remains.
- TDD regressions first reproduced autoplay on initial display, missing full-scene transitions, scrolling over a caption link escaping the stage, partial failed playback restarting at 0.93 seconds, and both captions painting together during a direct scene change. Each then passed after its fix.

### Delivered media

Higgsfield archive `eab736e2-c6bb-4f7e-9d62-ddd4ec10ec1c`. Each film contains 72 frames, H.264/yuv420p, 24fps, 3.000 seconds, no audio, fast-start, first frame an I-keyframe. Full probes and uniformly selected source-frame indices are retained under `sceneTransition1` in `scripts/cinema.json`. Both endpoints of the entire approved eight-second source are included; its camera path is retimed, with no generated scenery or interpolated frames. Reverse playback uses separately encoded reversed footage. Stills are extracted from frames 0 and 71 of the delivered forward clip.

| Asset | Portrait bytes (720×1280) | Landscape bytes (1920×1080) |
| --- | ---: | ---: |
| Forward MP4 | 572,882 | 602,322 |
| Reverse MP4 | 565,340 | 642,922 |
| Opening WebP | 110,592 | 164,594 |
| Detail WebP | 103,410 | 162,546 |

### Validation and transfer

- TypeScript, ESLint, four component tests and the production/SSR build pass. The complete browser run passed 62 checks with four expected skips. After the final caption-visibility CSS fix, all affected page/visual/transfer tests were rerun: 32 passed, two expected CDP-only skips. The new caption-overlap regression passes in both engines.
- Chrome and WebKit checks cover initial pause, full forward/reverse playback, repeated and rapid opposite input, movie interruption/retry, rotation, reduced motion, Data Saver, failed/rejected/stalled media, direct hashes/Back, no-JavaScript business content, menu/focus, inquiry draft, PDF and sharing. Chrome also covers a continuous wheel burst across the film ending and browser-injected portrait touch swipes. Mobile WebKit gesture coverage uses modeled touch events and keyboard input because Playwright exposes neither swipe nor wheel there. No physical-phone smoothness claim is made.
- Visual review includes 390×844, 768×1024 and 1440×900 opening scenes, plus the detail scene at those sizes and 360×640. No horizontal overflow or header/caption/navigation overlap. Captions are never simultaneously painted. The in-app preview was inspected in both directions; its console has no warnings/errors. The contact flow has zero Axe violations. DESIGN.md is unchanged. Strict visual-contract audit passes (only the existing optional CLAUDE.md warning).

Cold-cache Chrome measurement on the production Vite preview sums `Network.loadingFinished.encodedDataLength`, including compressed document/scripts/styles, fonts, logo, stills, media ranges and repeated favicon requests. First view ends at network idle while the opening is **still paused**. The complete current-preview measurement then opens the mobile menu, plays forward and reverse, and visits all business sections. Only the selected orientation is fetched.

| Orientation | First view (bytes) | First transition in both directions + all business sections (bytes) |
| --- | ---: | ---: |
| Portrait | 982,020 | 1,611,104 |
| Landscape | 1,124,598 | 1,802,408 |

Both first-view and current-preview totals are within the 2 MB / 5 MB budgets. The eventual **four-scene page is not yet certified**: the remaining two scene transitions are behind the owner's approval gate and must be measured after implementation. Optional PDF download is separate: 156,006 bytes on disk. These are local browser transfers, not CDN or field-performance measurements. Per-request reports are in `/tmp/adduco-transfer-portrait.json` and `/tmp/adduco-transfer-landscape.json`.

Local preview: http://127.0.0.1:5184/. No commit, push or publication was performed. The public Site remains its previous release.

## Historical rejected autoplay checkpoint — 18 September 2026

**Scope:** chapter 1 only, with ordinary O nama, Usluge, Priprema, Projekti and Kontakt sections. Chapters 2–4 are deliberately unbuilt pending owner approval. Local preview: http://127.0.0.1:5184/. No push or publication in this checkpoint. DESIGN.md is unchanged; PRD.md contains the dated interaction amendment.

### Media proof

Higgsfield processing archive `a904e280-32da-47a3-8b01-471e6e7be456`, from the first 2.5 seconds of each accepted opening source. Both delivered MP4s are H.264/yuv420p, 24fps, 60 frames, silent, fast-start. ffprobe confirms frame zero is an I-frame with `key_frame: 1`. Full source/encoding/probe records live in `scripts/cinema.json`.

| File | Size (bytes) | Dimensions / duration |
| --- | ---: | --- |
| Portrait MP4 | 721,551 | 720×1280 / 2.500 s |
| Landscape MP4 | 1,031,070 | 1920×1080 / 2.500 s |
| Portrait existing opening still | 101,174 | 720×1280 |
| Portrait final-frame still | 79,724 | 720×1280 |
| Landscape existing opening still | 220,070 | 1600×900 |
| Landscape final-frame still | 151,968 | 1920×1080 |

### Behavior and checks

- TDD evidence: normal business sections initially failed because content was hidden in dialogs; native playback test initially failed because no video lived in the chapter; stalled-playback test initially left the caption hidden; rotation initially retained the wrong video composition; header contact initially left the mobile menu open. Each failed before its implementation/fix and then passed.
- Four component behavior tests, TypeScript, ESLint and production/SSR build pass.
- Browser suite: 40 passed, two intentionally skipped. Chrome and WebKit cover playback/end/hold/re-entry, interrupted visits and rapid reversal without seek events, rotation, rejected autoplay, missing media, reduced motion, Data Saver, bounded stalled playback, native direct hashes/Back, menu keyboard access, form validation, unsent draft, PDF, no-JavaScript access and sharing metadata. Two transfer tests run only in Chrome because measurement uses its network protocol, and are skipped in WebKit.
- Visual inspection at 390×844, 768×1024 and 1440×900: approved construction artwork, distinct red panels, readable captions, accessible header/action and dark normal business sections; no horizontal overflow. Mandatory vertical snap and exactly 100svh chapter height verified. No visible play button and no native video controls. No page errors; in-app preview console has no warnings/errors. Axe check on the contact flow reports zero violations.
- All frame packets, sequence/store modules, the old movie scrubber, scroll clock and seek-specific tests are deleted. Source contains no media-clock assignment, Blob seek recovery, wheel/touch interception or animation-frame playback loop. Original generated-source provenance remains for later authorized trims. The unchanged portrait opening was relocated before deleting its sequence directory.
- Re-entry uses the final-frame still, including when the first visit is interrupted. Only actual completion uses the browser-held video endpoint. Reduced motion/Data Saver avoid movie requests entirely. Autoplay failure retains the existing opening still. A six-second deadline prevents a stalled decoder from hiding copy indefinitely; header navigation and business HTML are available throughout. Seen state lasts for this page session and resets on reload.

### Transfer measurement

Measured in a fresh Chrome page with cache disabled, production Vite preview, using `Network.loadingFinished.encodedDataLength` summed across every HTTP response (headers, compressed scripts/styles/HTML, fonts, images, favicon and the complete MP4). Viewports: 390×844 portrait, 1440×900 landscape. Only the selected orientation's movie is requested. First view is measured after native playback ends and the network becomes idle; current complete-page measurement then opens/closes the mobile menu (including its additional fonts) and visits every business section. The test writes its resource breakdown to `/tmp/adduco-transfer-portrait.json` and `/tmp/adduco-transfer-landscape.json`.

| Orientation | First view (bytes) | Chapter 1 + all business sections (bytes) |
| --- | ---: | ---: |
| Portrait | 1,096,010 | 1,124,866 |
| Landscape | 1,596,675 | 1,596,675 |


The unchanged optional PDF is 156,006 bytes on disk, fetched only when requested. The measurements above exclude that separate download. The eventual four-chapter page's ≤5,000,000-byte transfer budget is **not yet certified**: chapters 2–4 and IntersectionObserver-based lazy loading are behind the explicit approval gate. Remaining budget is reserved for those segments, their stills and any additional font use, with a new cold/full-page measurement required after implementation.

These are local browser measurements, not a deployed CDN or physical-phone frame-rate claim. Desktop wheel and WebKit programmatic native scrolling are covered; Playwright's mobile WebKit cannot synthesize a wheel. A real phone review belongs to the owner's chapter-1 approval. Native video itself is no longer controlled by scroll speed.


## Direct portrait response — 16 September 2026

Research isolated a second clock in the portrait controller: a 100ms easing curve plus a 144-source-frame/second speed cap. A new browser regression moves native scroll at 4,000 CSSpx/s for 500ms and then reverses. Both Chrome and WebKit failed on the previous implementation: the drawn camera continued forward until approximately 750/741ms while the scroll target was already decreasing. This reproduces the mechanism in the browser, not just the earlier mathematical model. The exact cause of all judder on the owner's physical phone remains unmeasured.

Portrait now selects from the latest native scroll position directly. If the exact image is preparing, it can display the nearest prepared image between the previous pose and current target, never beyond it. Decode priority uses gesture speed/direction to prepare the likely next image before skipped adjacent frames. Decoded memory remains 17 nearby bitmaps plus transient decodes, with two decode slots. A direct jump need not download or decode every intermediate frame. The cache-resume regression explicitly visits the poses that must remain available before later downloads fail.

The new response regression checks actual scroll direction and source-position lag, allowing up to 32 source frames (about 81ms at this test speed) for decoding/browser scheduling. This is a bounded response check, not a 60fps assertion or a physical-screen measurement. The old maximum-four-frame-step and >120-draw requirements were retired because they rewarded prolonged catch-up after an abrupt destination change. Previous reports of no obsolete-direction frames compared movement against destination minus the displayed frame; that definition missed movement against a reversing gesture. Previous canvas-attribute timing reports measured draw updates, not compositor presentation.

The application no longer rerenders for every scroll/image sample: caption state changes only at existing reading/active-chapter boundaries, and the still-mode scroll listener is absent during animation. A React Profiler behavior test failed with six page commits across six positions inside one unchanged reading hold, then passed with zero, while verifying the next caption and active navigation become available at the boundary.

Focused validation: 28 sequence/interface cases pass in Chrome/WebKit, including opening image equality, both joins, delayed/failed packets, reduced motion, rotation, cache return, contact and caption alignment. Five component tests, typecheck and lint pass. Final validation: all 94 browser cases passed sequentially, including the unchanged landscape/legacy engine. Reviewed 390/768/1440px layouts and the in-app forward/reverse preview without console errors. The final controlled trace had maximum position lag of 1.16 source frames in Chrome and 26.52 in WebKit, with no forward draw samples after the reversal allowance; these are lab draw-state observations, not physical-phone frame-rate claims. Production build and strict design audit pass. The same artwork, scroll distances, frame count, media sizes and native movie fallback remain; source-density stepping at slow input and physical-phone decoding/presentation still require separate evaluation. Worker rendering, WebCodecs and motion interpolation were not added in this isolated response pass.

## Prepared mobile frames — 16 September 2026

The owner still noticed judder after the bounded-seek fix. Source-frame jump limits alone did not guarantee regular presentation: modeled 90ms media seeks produced 100–217ms visible gaps. Portrait now renders independent WebP images on one canvas, preserving the existing 720×1280 source, 24fps camera path and repaired joins. Landscape and browsers without ImageBitmap retain the movie engine.

TDD reproduced a concrete loading bug in the first sequence implementation: a delayed future packet occupied both decode slots, stopping cached reverse travel at frame 185 instead of returning to 165. Separating network waits from decode slots makes the regression pass in Chrome and WebKit; async completion only schedules a fresh decision from current scroll intent. Decoded images stay in a ±8-frame window with two active decode tasks; bitmap lifecycle tests cover long forward/reverse travel and release on reduced motion. Compressed packets remain cached through temporary visibility interruption.

A WebKit orientation handoff also failed once in the full sequence run, while three isolated repetitions passed. A deterministic compositor model then reproduced a completed seek whose presentation callback was withheld behind the retained canvas. The first landscape reveal now accepts its completed seek, with regular movie presentation continuing afterward; that model passes in both engines. This establishes robustness to the modeled condition, not the exact cause of the intermittent native WebKit failure.

The first portrait still now uses the exact first sequence WebP (101 KB), replacing the three old portrait/mobile opening variants. The original image comparison exposed a raw RGB RMS difference of 8.39 in Chrome; the common image reduces it below 1 without changing geometry or weakening the acceptance threshold. The opening still fades for 180ms at a fixed camera pose.

Cached rapid-reversal lab run, including both joins: Chrome median gap 16.7ms, p95 17ms, max 19.1ms; WebKit median 17ms, p95 26ms, max 40ms. Neither engine displayed obsolete-direction frames in that run; maximum step was 3/4 source frames respectively. Samples are in `/tmp/adduco-sequence-{chrome,webkit}-pacing.json`. These measurements cover active camera movement with compressed packets cached, excluding settled holds. They do not establish a device-independent frame rate.

Trade-off: 49 progressively fetched packets total 45.63 MB, compared with 30.08 MB for the portrait movies. The first packet is 1.20 MB; normal portrait visits do not also request MP4s. At most 17 nearby 720×1280 bitmaps are retained, approximately 63 MiB of raw RGBA pixels before transient decoder/compositor overhead. Slow new downloads can still hold the last good image. Physical Android/iPhone memory, radio and compositor behavior remains unverified. No guarantee of perfect smoothness on every phone is made.

Final validation: all 18 sequence cases passed across Chrome and WebKit in the full 92-case run; 91 of 92 total cases passed initially. The remaining direct-fragment test rejected Chromium's two-CSS-pixel restoration rounding (3222 versus 3220) even though the camera selected the correct chapter. The test now permits at most two document pixels and additionally demands the exact decoded anchor before and after delayed loading. All eight viewport checks then passed across both engines. Four component tests, typecheck, lint and production build pass. Default portrait tests exercise the new sequence; movie-specific tests explicitly disable ImageBitmap to retain legacy-engine coverage. Visually inspected 390/768/1440px layouts and the in-app preview without console errors. No temporary prototype code is retained.

## Rapid up/down correction — 16 September 2026

The owner reports rapid direction changes still glitch after restoring the accepted baseline. A new test repeatedly changes native scroll direction every 160ms, observing actually presented frame timestamps. Chrome/WebKit reproduce maximum camera jumps of 0.58/0.63 source seconds on the original implementation, and 1.46 seconds with a modeled 90ms delay before each real media seek. The delay wraps browser media APIs while retaining actual decoding and frame callbacks; it is a controlled stress model, not physical-phone evidence.

The camera clock now waits for its requested decoded frame, bounds travel speed to six source seconds per wall second and caps a requested step at four source frames relative to the last decoded scene. The latest native scroll destination remains authoritative; there is no gesture queue. Initial loading, retained movie cache, source films and opening handoff are unchanged. One seek already in progress can finish after a direction change; subsequent requests use the latest destination. A large fling deliberately settles more gradually instead of skipping most of the scene. The previous sharp-scroll test's requirement to cover 5.6 source seconds within 700ms is replaced by bounded catch-up with a three-second completion deadline; intermediate-frame and final-destination checks remain.

Initial corrected stress results: maximum observed step 0.125 source seconds in both engines, with and without the 90ms delay. Additional tests explicitly cross both movie joins while reversing repeatedly and confirm correct final position and no mobile playback button. The direction assertion allows one in-flight obsolete frame per gesture, not an impossible guarantee that no already-decoding image ever completes after a new gesture.

All 74 Chrome/WebKit browser checks passed sequentially, including eight new rapid-reversal scenarios, plus four component tests, typecheck, lint, production build and strict design-artifact audit. Inspected 390/768/1440px screenshots and the in-app browser during forward/reverse input, with no console errors. Detailed stress samples are in `/tmp/adduco-rapid-verified.json`. No physical Android/iPhone testing is claimed; these checks cannot guarantee every device's decode rate.

Public access was explicitly authorized on 16 September and verified without login. This release preserves that audience. The retained CSS, stills and movie assets remain unchanged; no new generation or processing was needed.

## Scroll regression recovery — 16 September 2026

The owner reported new glitches immediately after the loading/resource pass. The prior accepted release was redeployed first. The complete playback implementation is restored from commit 61a12c02b019b9632138162e569698fb1823e85f; interface polish and sharing metadata remain.

A new public-behavior regression prepares all three portrait movies, models a brief visibility interruption, then rejects subsequent movie downloads while scrolling backward and forward. The optimized implementation fails in both Chrome and WebKit; the exact accepted baseline passes in both. Discarded prepared movies must be fetched again, and scroll falls back or remains on the wrong move. This is a reproduced failure mechanism, not proof that it explains every physical-device glitch the owner saw. The earlier tests only checked resource removal and successful return on a fast connection, so they missed this continuity trade-off. Playwright's global offline switch also stalled Blob seeking on the accepted WebKit baseline; the regression therefore isolates failed subsequent downloads instead of changing the browser's global network state.

The image gate, hidden-page resource eviction, callback refactor and session-wide Blob shortcut are withdrawn together to recover the exact accepted playback baseline. Tests requiring those withdrawn optimizations are removed; image-failure/early-scroll and sharing checks remain. No new source videos, CSS, captions or artwork are introduced. Physical-device confirmation of the owner's exact symptom remains necessary.

Final local validation: all 66 Chrome/WebKit browser checks passed sequentially, plus four component tests, typecheck, lint, build and strict design-artifact audit. The restored CinematicFilm source matches the accepted commit exactly, and compiled `index-Cc8QJQ6L.js` is byte-identical to the accepted release archive (SHA-256 `8171f7752988459879a47a08383c4cc8a2fc8f9286a6167dc3c94b455afbad2c`). This includes opening, movie joins, forward/reverse scrolling, interrupted loading, viewport changes and business access. The previous accepted release was successfully restored on the hosted site during mitigation and its JavaScript identity verified there. The corrected source retains the independently tested sharing metadata.

## Loading and return resilience — superseded playback experiment

The evidence below describes the withdrawn optimization release. It is retained as historical context; the recovery section above is the current playback behavior.

- Delayed-opening regression reproduced movie requests competing with a held initial still in both Chrome and WebKit. The film now waits for that image's load/error while HTML navigation and contact remain usable. Opening intent is captured before the wait, retaining the original-pose handoff if a visitor scrolls early.
- A controlled hidden-page test initially retained all three movie elements. It now retains the displayed element and pose, disposes the other two decoders, aborts their pending fetches and revokes their Blob URLs. Forward/reverse movement works after resume. This verifies resource lifetimes, not a measured percentage reduction in device RAM.
- Visibility and persisted pagehide/pageshow events stop new work and resume from the retained pose. A frozen opening-animation event is explicitly tested so return cannot leave the first scroll stuck. One already queued frame callback can finish recording an in-flight seek; no new callback is scheduled while hidden. Lifecycle events are modeled in desktop Chrome/WebKit; physical screen-lock behavior remains unverified.
- A no-range-host regression observed a native media request followed by a full fetch for the next movie (plus a WebKit probe). The page now remembers the required Blob path for that film session, cancels an unused initial native request and fetches later segments once. Source quality, movie files and camera choreography are unchanged.
- Croatian Open Graph/Twitter tags ship in initial HTML with a 1200×630 JPEG derived through Higgsfield from the approved anchor. Metadata/image checks run without JavaScript. Private hosting/noindex remain; external sharing previews require a future authorized audience change.

Local mobile Lighthouse, same command and production preview, one run before and after:

| Metric | Before | After |
| --- | ---: | ---: |
| Performance | 95/100 | 95/100 |
| First contentful paint | 1.51 s | 1.51 s |
| Largest contentful paint | 2.93 s | 2.93 s |
| Total blocking time | 0 ms | 0 ms |
| Cumulative layout shift | 0 | 0 |

Reports: `/tmp/adduco-loading-before.json` and `/tmp/adduco-loading-after.json`. No measurable initial-load score improvement is claimed. The demonstrated gains are download ordering, fewer redundant movie requests and release of unused resources in the background. These local lab numbers do not measure hosted Blob-download latency or real phones.

Final local validation: 72 Chrome/WebKit browser tests passed with one worker, four component tests passed, and typecheck/lint/build passed. Inspected the 390/768/1440px screenshots and in-app preview with no visual change or console errors. Strict design-artifact audit passed; only the existing unrelated missing-CLAUDE.md warning remains.

15 September 2026. Continuation of the accepted dark, photoreal construction journey. The owner approved the diagnosed smoothness fixes and automatic mobile motion without a playback button.

## Behavior and regression evidence

- Mobile and touch-tablet motion follows native scrolling automatically. The film stays paused; scroll selects frames. No playback control is exposed on phone or touch viewports. Desktop keeps its explicit pause control.
- Abrupt input eases through intermediate frames with a 100 ms time constant. Time spent idle is excluded from the first gesture step. Seeking is serialized and quantized to the source's 24 fps.
- Adjacent moves prepare after 30% progress, including Blob recovery when HTTP media has no seekable ranges. Previously decoded movies remain available for reverse scrolling. The cache holds at most three movies per orientation; old composition resources are released after the new frame is available.
- `requestVideoFrameCallback` supplies the caption clock. Older browsers fall back to completed seeks. A stalled decoder keeps the caption associated with the last displayed image. Rotation does not expose a new movie's unrequested first frame.
- Meaningful regressions were observed failing before the respective fixes: mobile playback button/opt-in, late next-film preparation, abrupt seeking, caption advance during a decoder stall, first-frame flash on rotation, and the excessive first step after idle.
- 4 component behavior tests and 28 real Chrome browser checks cover these cases, both scroll directions, 390/768/1440px layouts, direct fragments, reduced motion, unavailable media, no-range hosting, no-JavaScript content, keyboard focus, contact validation and PDF download. The inquiry remains a reviewable email draft; no inquiry was sent.
- TypeScript, ESLint, production build and strict design-artifact audit are required before release. Only the existing DESIGN.md is the visual contract.

## Visual and motion inspection

The in-app browser was inspected at 390×844, 768×1024 and 1440×900. Mobile opening, reinforcement detail, height and contact compositions retain legible overlays and clear primary actions. Desktop retains the landscape film. No page errors or warnings were observed in the local visual review.

A six-second scripted forward/reverse native scroll at 390×844 produced 300 presented-frame callbacks in the Chrome lab: 148 during three seconds forward and 137 in the measured 2.7-second reverse window. Median callback interval was 16.7 ms, 95th percentile 33.4 ms; the longest 100 ms interval includes the slowing/settling part of the sequence. These are presented-frame observations at that scroll speed, not a claim of 60 fps or physical-phone performance. Report: `/tmp/adduco-smooth-timing-report.json`.

Physical iPhone/Safari and Android hardware have not been tested. Evidence uses Chrome viewport/touch emulation and the in-app browser. The source films still contain deliberate foreground rebar and concrete occlusions; they can darken or briefly obscure the scene. Those camera moves were retained, rather than generating a new visual direction.

## Mobile media preparation

Higgsfield ffmpeg re-encoded the three accepted native 1080p portrait movies at 720×1280, CRF 20, H.264/yuv420p, 24 fps, a keyframe every three frames, no B-frames, no audio and fast-start metadata. Files are versioned to avoid stale browser media. Native-source frames were compared with 720px and 864px alternatives at 390px display width. The chosen output preserves visible concrete, rebar, reflections and emblem detail; contact sheets of the complete second and third moves were also inspected.

New portrait bytes: 10,390,329 / 9,672,984 / 10,055,558. Previous portrait: 8,425,709 / 7,836,658 / 7,460,058, at 864×1536 with twelve-frame keyframes. The new output decodes 31% fewer pixels per frame and places seek entry points every 0.125 seconds instead of 0.5 seconds. The trade-off is a larger compressed download (about 30.1 MB across all three portrait moves). These figures do not imply proportional device speedups.

Desktop movies, all stills, logo, camera choreography and business copy are unchanged. No new image/video generation was required. Provenance and exact encoding parameters are in scripts/cinema.json. Source movies, comparison candidates, contact sheets and screenshots stay outside tracked source. The superseded portrait web files are removed.

## Initial loading measurement

Local Lighthouse mobile simulation, 15 September 2026 at 20:05:56 UTC, with automatic film loading enabled:

| Metric | Result |
| --- | ---: |
| Performance | 97/100 |
| First contentful paint | 1.51 s |
| Largest contentful paint | 2.56 s |
| Total blocking time | 0 ms |
| Cumulative layout shift | 0 |

Report: `/tmp/adduco-smooth-lighthouse.json`. This is a lab initial-load result, not field Core Web Vitals, sustained device decoding, or hosted Blob recovery. LCP remains slightly above the 2.5-second good threshold in this simulation. INP was not measured. Reduced-motion, data-saving and explicit fallback visits retain still imagery.

## Release boundary

Use the already authorized owner-private Sites project and preserve its current audience. Verify actual hosted portrait selection, automatic motion without playback controls, frame advance, reverse seeking and contact after publication. Public launch still depends on approved company/project material and launch configuration described in AGENTS.md. Conceptual cinematic artwork must not be presented as portfolio photography.

## Follow-up — localized frame and seam glitches

The owner still reported visible glitches after the smoothness pass. The earlier average-frame timing check did not test exact adjacent frame selection or compare the actual images on each side of a movie join.

- A new real-browser regression requested source frame 25 but consistently received frame 24 when seeking to the exact timestamp. Seeking to the middle of the intended frame interval fixes the tested forward/reverse sequence 25–30. This is independently observed behavior; HTML video seeking is generally best-effort, as described by [the Chrome team's frame-callback guide](https://web.dev/articles/requestvideoframecallback-rvfc).
- Frame extraction through Higgsfield confirmed small framing/exposure discontinuities at both portrait joins. Full-resolution endpoint RMS differences were 12.54 and 15.86, versus 3.88 and 3.45 between ordinary neighboring frames near the same endpoints. The actual source frames, not just playback timing, were inspected.
- Repaired portrait clips 1 and 2 begin with the preceding delivered clip's decoded endpoint and ease into the existing native footage over six frames (0.25s). The remainder, 193-frame duration, 24fps and portrait composition remain unchanged. Both the blending matrix and output color metadata explicitly use limited-range BT.709. The two blend inputs share a 1/24 timebase; the first candidate mixed PNG/movie timebases, skipping the intended correction, and was rejected by the exact-frame browser comparison. The repaired seam RMS values are 2.20 and 2.15; these measure pixel continuity, not a universal smoothness score. Ten early frames per repaired join were visually inspected for blur, doubled structural edges and composition.
- A new browser image regression compares the actual decoded scenes immediately before/after each join. The original first join failed at 9.83 RMS at 360×640; repaired joins pass the threshold of 8. Exact frame-selection and image-continuity tests were red before the corresponding fixes and green afterward.
- New media IDs/processing details are in scripts/cinema.json. Replaced portrait v2 clips 1/2 are removed; v2 clip 0 remains. Contact sheets and candidates remain outside tracked source. No new scene generation or credit purchase was needed.
- WebKit 26.6 phone-context verification passes automatic no-button motion, consecutive source frames, both movie boundaries, reverse return and contact. This is desktop WebKit emulation, not physical iOS hardware. The complete suite now contains 30 Chrome checks and one WebKit check, plus four component tests. Browser binaries are installed through the project Playwright version.

## Opening-only follow-up

The owner narrowed the remaining issue to the opening. Two new browser regressions failed before changes: the generated reference still differed from the decoded movie opening (raw image RMS 40.72 at 360×640), and scrolling 350px during initial loading exposed movie time 1.458s directly over that still.

- Five versioned initial poster variants now use the delivered portrait/landscape movie's actual decoded frame 0. Higgsfield extracted and encoded these stills; no movie or later scene changed.
- Hold the opening pose/caption while its movie prepares. A one-time 180ms opacity handoff happens at that same pose, then pending native scroll moves the camera. The handoff absorbs the smaller browser-specific image/video color conversion difference observed in WebKit. Later scene switches do not receive a fade.
- Reset the smoothing clock whenever the destination settles. The pre-existing sharp-scroll regression exposed a 2.229s first step when input followed the opening handoff within the old 80ms idle threshold; resetting at settlement prevents that idle interval from becoming camera motion.
- New tests cover 390/768/1440px poster geometry in Chrome and WebKit, opacity samples during the handoff with camera position fixed at zero, scrolling before download completes, both ordinary HTTP seeking and hosted no-range Blob recovery, and return to the opening. Geometry comparison fits a global offset/gain per color channel to account for engine color conversion; moved structural edges and reflections still fail. Color continuity is separately checked through the visible opacity transition.
- Full suite: 36 Chrome checks, seven WebKit checks, four component tests, TypeScript and ESLint. The browser engines run on desktop; no physical-phone claim. Existing mobile no-button motion, later joins, direct business navigation and inquiry/PDF access remain part of regression coverage.
