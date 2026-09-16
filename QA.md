# QA — mobile scroll smoothness

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
