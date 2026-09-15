# QA — mobile scroll smoothness

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
