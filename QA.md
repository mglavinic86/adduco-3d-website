# QA — mobile scroll smoothness

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
