# Adduco — local website

## Native media preparation approved — 18 September 2026

The owner approves replacing the rejected fetch-based warm-up with preparation in the persistent native video elements that actually play the movies. Preserve Gate 1 behavior, three-second films, captions, artwork and DESIGN.md. The opening-image-only slice was published separately as Sites version 20.

- Keep the first clip eager. After its first `canplaythrough`, prepare forward 2, reverse 1, forward 3, reverse 2 and reverse 3 in that exact order, sequentially, using each movie's own `<video preload="auto">`. Start only one background preparation at a time and retain those elements and their buffered media for playback. Do not use fetch, fetch preloads, Blob URLs or scroll seeking. Preserve observer-based preparation as fallback and immediate requested playback; skip background preparation under reduced motion or Data Saver.
- Verify native transfer in Chrome and WebKit against the sum of the six unchanged on-disk movie sizes for the selected orientation. Distinguish movie payload from HTTP headers/protocol overhead and count repeated payload honestly. Keep the complete-page 5 MB budget.
- Preparing all six movies before any gesture necessarily supersedes the historical 2 MB limit measured at opening network-idle. Report bytes after background preparation separately from first-paint/first-clip readiness; the complete-page 5 MB limit still applies.
- Investigate the prior portrait opening measurement of 2.276 s versus landscape 0.752 s. Verify the HTML preload media query, selected picture source/currentSrc, request order and document latency on the actual public URL. Target actual opening image paint within 1.0 s in both orientations on the previously specified cold 4G profile; retain the 2.5 s first-ready and 200 ms cached later-start targets.
- Publish the verified implementation to the same public Sites project and repeat the timing/transfer table on its live URL. Report lab conditions, uncertainty and any missed target honestly. No Batch 2 work or new media generation. The optional `?tempo=brzo` experiment is not approved in this pass; three-second playback remains unchanged.

## Cold-load ordering — 18 September 2026

The owner's physical-device test accepts cached Gate 1 playback and identifies initial loading as the remaining issue. Preserve every Gate 1 interaction, all films/stills, captions and DESIGN.md. Optimize discovery and preparation, with behavioral tests and measured cache reuse.

1. Preload the opening WebP in HTML before the deferred module bundle, with mutually exclusive orientation media queries and high fetch priority. Add an approximately20px blurred inline base64 derivative as the stage background so the first visual does not wait for hydration.
2. Start the first orientation-specific forward clip from a small head script before hydration. Compare fetch preload and explicit fetch-to-HTTP-cache in Chrome/WebKit; ship only a path proven not to download the clip twice. Respect reduced motion and Data Saver from the start.
3. After first-clip canplaythrough, sequentially prefetch forward2, reverse1, forward3, reverse2, reverse3 for that orientation with low fetch priority, skipping reduced motion/Data Saver. Preserve observer preparation as fallback. This expressly supersedes the previous restriction to one clip before the first gesture once the opening clip is ready; other stills remain lazy.
4. Measure cold navigation on the published Sites URL before changes and after publication, in both orientations: actual opening-image visibility≤1.0s (report the LQIP separately), first-clip canplaythrough≤2.5s, and each later cached gesture→playing≤200ms under explicitly documented Chrome DevTools4G throttling. Also report Fast3G/4G timelines and total actual transfer≤5,000,000bytes. Use a fresh cache at navigation while allowing cache reuse thereafter; disabling the cache throughout would invalidate the reuse test.
5. Publish only after the candidate meets the targets and byte budget in a production-equivalent validation, then verify on the actual published URL. If the constraints cannot be met, report the measured cause and stop without publication. Batch2 remains outside this work.

## Gate 1 encoding correction approved — 18 September 2026

This owner-approved correction supersedes the CRF and media-continuity constraints in the amendment below. The rest of Gate 1, the accepted scene interaction and the unchanged DESIGN.md remain binding. It does not authorize Batch 2 or publication.

- Keep all six accepted forward MP4s byte-for-byte unchanged. Re-encode all six reverse clips only from original source frames, using the accepted forward encoder settings: two-pass libx264 slow, 1500 kbps portrait / 1650 kbps landscape, 24 fps, 72 frames / three seconds, initial keyframe and fast-start. Portrait limit is 1,000,000 bytes; landscape limit is 1,200,000 bytes. The CRF ≤18 requirement is withdrawn.
- Regenerate all eight scene stills from decoded accepted forward clips, WebP quality ≥85, portrait ≤200,000 bytes. Scene 0 uses the first forward clip's first frame; scenes 1–3 use the respective forward clip's last frame. The shared scene still is also the following forward clip's origin; measure any difference between those independently encoded endpoints honestly without changing the forward films or adding scene assets.
- Report all 24 endpoint RMS measurements at 640px comparison size. Reverse first frames compare to the corresponding forward destination still; reverse last frames compare to the forward origin scene still. Target RMS ≤3.0; report actual forward values as well, including lossy WebP and shared-anchor differences.
- If a reverse join still exceeds RMS 3.0 after those changes, do not chase CRF further. Hold the video's decoded final frame while its destination still fades over it for 150 ms at settlement; report exactly which joins require this compensation and retain their raw RMS values. Keep early captions, immediate navigation, reduced-motion handling and the no-blank fallback.
- Repeat Gate 1 checks, byte/transfer measurements, waterfall and playback screenshots. Stop with a concrete local preview and report for owner approval before Batch 2. Do not publish.

## Transition polish and launch readiness — 18 September 2026

This owner-requested amendment takes precedence over earlier release authorization and loading behavior. Preserve the accepted interaction: one vertical gesture inside the stage starts one complete native three-second forward/reverse MP4 transition; never scrub `currentTime`, queue gestures or capture scrolling outside the stage. DESIGN.md is unchanged: artwork, dark direction, layout and caption wording remain the visual contract. Keep the accepted destination-caption entrance at 1.5 seconds of actual playback. No new video generation or services beyond the specified future webhook.

### Batch 1 — transition polish (authorized now)

- Re-encode all six reverse MP4s from original source frames, never compressed forward MP4s. Preserve dimensions, 24 fps and three-second duration; H.264 CRF ≤18, initial keyframe, fast-start, portrait files ≤1,000,000 bytes. Compare the first and last decoded frames of every forward/reverse clip with their origin/destination stills at 640-pixel comparison size. Every RMS must be ≤3.0; report all 24 measurements, method and exact byte sizes in QA.md.
- Retain the outgoing caption while the requested clip loads. Hide it only on `playing`. Show a thin progress indicator from the DESIGN.md palette after more than 300 ms of buffering. Preserve the 6.5-second stall fallback; destination still and caption appear together, with no blank frame.
- Every scene still except index 0 uses `loading="lazy"` and `fetchpriority="low"`. Before the first gesture, the network waterfall must contain only one scene still and one clip.
- Add browser behavior coverage for continuous trackpad momentum for 1.2 seconds (one transition), ignored two-finger/pinch input, touch starting inside and ending outside, ignored rapid reversal during playback, Space/PageDown and uncaptured overscroll at scene 0.
- Keep the header Razgovarajmo and scene-nav O nama exits visible and tappable with targets ≥44 px during playback at 390, 768 and 1440 px. Capture screenshots at those widths.
- **Gate 1 / HITL:** report sizes, the complete RMS table, network waterfall and screenshots; stop for approval before Batch 2. Typecheck, lint, unit tests and build must pass. Keep the result in local preview; no publication or deployment.

### Batch 2 — launch readiness (blocked by Gate 1 approval)

- Replace the mailto-only form with JSON POST to build-time `N8N_WEBHOOK_URL`: name, email, location, message, page, timestamp and honeypot. Apply a honeypot, one submission per 30 seconds, disabled pending button and explicit Croatian success/error states. Claim delivery only after HTTP 2xx; network errors offer the existing mailto draft. Add a privacy notice link under the form. Never hard-code the webhook.
- Legal footer: ADDUCO d.o.o. za građevinarstvo, trgovinu i usluge; Mlinska ulica 6, 20350 Metković; MBS 060354966; OIB 40912050957. Registration court, capital and paid-in statement, board members, bank and IBAN use owner-supplied values only; missing values remain visible `[TODO]` and are reported. Add `/privatnost` covering no cookies/analytics, inquiry data emailed to Adduco, retention and a data-request contact; do not invent missing details.
- Introduce build flag `PUBLIC_INDEXABLE`. Default remains the chatgpt.site URL with noindex. When true, remove noindex/nofollow, allow robots, emit sitemap.xml and use `FINAL_DOMAIN` for canonical/OG URLs. Extend JSON-LD with telephone, email, url, areaServed (Dubrovačko-neretvanska and Splitsko-dalmatinska) and the FINA record in sameAs. Preload latin-ext weights 400/800 alongside latin.
- Add `content/projects.json` with title, location, year, role, client, images[], caption and source URL. Render the two existing sourced projects with zero images and “Fotografije u pripremi”; no generated or stock portfolio images.
- Remove any remaining dead three manualChunks; correct package description/license/author from verified information; update README to current architecture; run Chromium Playwright in CI with workers=1.
- **Gate 2 / HITL:** report mobile Lighthouse as lab measurements, cold/complete transfers in both orientations, webhook 2xx and failure-path evidence, footer screenshot and every open `[TODO]`. Do not publish to Sites until the owner explicitly authorizes it.

Throughout both batches: use behavioral TDD, keep typecheck/lint/tests/build green at every commit, label estimates and lab numbers honestly, preserve visitor copy except explicitly requested launch additions, and do not modify secrets or production resources.

## Earlier caption entrance — 18 September 2026

The owner accepts the video animation but requests readable text before each movie ends. Reveal the destination caption from approximately 1.5 seconds into each three-second forward/reverse transition, using actual native playback progress and the existing brief fade. Hide the outgoing caption at transition start; never overlap captions. Keep the caption visible through the final frame without fading it again. Gesture locking remains active until the film ends; the newly visible action can immediately navigate to normal business content. The scene indicator and hash follow the revealed caption so Back returns to that reading position. Do not use elapsed wall-clock time for the early entrance when a movie stalls or buffers. Keep the existing bounded stall fallback, immediate error stills and direct/reduced-motion navigation. Preserve all artwork, caption wording, films, visual layout, lazy preparation and budgets. DESIGN.md stays unchanged. Publish the correction through the existing authorized public Sites release and synchronize GitHub.

## Completion approved — 18 September 2026

The owner accepted the first full transition ("To je to") and explicitly requested completing all remaining work. The first-transition review gate is satisfied. Complete all four established scenes with three forward and three reverse three-second native transitions per orientation, preserving the approved interaction and DESIGN.md. Direct scene navigation may jump to the selected still without chaining films. Prepare only adjacent media as the active scene intersects the viewport; entering the initial scene never autoplays. Keep ordinary business sections, existing hashes, fallback accessibility and the 2 MB first-portrait / 5 MB complete-page transfer limits. Verify every join, both directions, responsive layouts and failures. Complete the existing authorized public Sites release and synchronize its public GitHub source; no new service or contact integration is requested.

## Owner correction: scroll-triggered scene transitions — 18 September 2026

The owner clarified the intended experience after reviewing the chapter-1 checkpoint. The previous autoplay-on-entry interpretation below is rejected. The owner approved the reverse transition and gesture capture within the film; implementation follows this corrected behavior. DESIGN.md remains the visual contract.

- Opening the page shows the first film frame, stationary, with the opening scene's existing HTML caption. No video starts merely because the opening is visible.
- A deliberate downward scroll starts one complete 2.5–3-second native video transition from the current scene to the next. The film remains the full-screen setting during that transition. Scroll distance/speed must never scrub its media clock.
- When the transition ends, hold its last frame and reveal the next scene's existing caption as an overlay. Wait for a new deliberate scroll before the following transition. No automatic chain of clips.
- Keep four approved scene/caption anchors. This model connects them with three forward transitions; it replaces the earlier concept of four separate automatically playing chapter clips. Produce only the first transition for the corrected approval checkpoint, not the full set.
- The current 0–2.5-second opening trim is not the complete opening-to-detail transition. The corrected clip must end at the actual next scene's framing anchor, preserving the existing landscape and separately composed portrait imagery.
- Existing still fallbacks, readable content/contact, no touch play button and transfer budgets remain. O nama, Usluge, Projekti and Kontakt remain normal sections below the film unless the owner changes that separately. Direct business navigation must allow leaving the cinematic experience immediately.
- Return behavior approved by the owner: an upward scroll plays a short reverse transition back to the previous scene, then restores its caption. Prepare separate forward/reverse MP4s; do not seek backwards through individual frames or rely on negative playback rate.
- Input handling explicitly approved by the owner: capture vertical gestures only within the cinematic stage. One deliberate gesture starts one transition; ignore additional input and momentum until it completes and require a fresh gesture afterward. Do not queue transitions. This narrowly supersedes the earlier no-wheel-interception rule. Preserve horizontal/zoom gestures, native business-section scrolling, keyboard access and immediate exit through navigation.

This is a correction to the first-transition approval checkpoint, not approval to build all later transitions or publish.


## Native snap chapters amendment — 18 September 2026

This owner-requested amendment supersedes every earlier scroll-scrubbing, continuous-camera, modal-business-content and seek-recovery requirement below. **DESIGN.md remains the unchanged visual contract:** preserve the approved construction artwork, red emblem, Croatian captions, typography and dark direction. This amendment changes playback and document flow only.

### Playback and navigation
- Target four vertical chapters, each exactly `100svh`, with `scroll-snap-type: y mandatory` on the document scroller. Native vertical scrolling only; no horizontal gesture handling, wheel interception, scroll-driven `currentTime`, artificial easing or speed caps.
- Cut the existing accepted films into four independent H.264 MP4s per orientation, 2–3 seconds each: 720×1280 portrait, 1920×1080 landscape, silent, fast-start, first frame a keyframe. Every portrait segment must be at most 1,000,000 bytes. Preserve the separate portrait direction rather than crop landscape footage.
- Chapter 1 loads eagerly in the selected orientation. Chapters 2–4 will load lazily via IntersectionObserver after the approval gate. Entering a chapter starts its native segment once; completion holds its final frame and fades its existing HTML caption in. Re-entry, including an interrupted first visit, shows the extracted final frame without replaying or seeking. A visit is remembered for the mounted page session, not persisted across reloads.
- Videos are muted and playsInline, without playback controls. Reduced motion, Data Saver, rejected autoplay, missing media or a stalled decoder retain the existing chapter still and readable caption. Essential HTML, links, contact and the PDF never wait for media. A keyboard-focused caption action remains visible during playback.
- O nama, Usluge, Projekti and Kontakt are ordinary semantic sections below the chapters. Keep existing hash URLs, preparation/PDF content and honest unsent email-draft behavior. Business sections may exceed a viewport; snapping must not prevent reading their contents.
- Delete the frame sequence/store modules and public sequence packets, the old film scrubber, Blob seek recovery, easing/camera speed-cap code and tests specific to those retired behaviors.

### Transfer budget and acceptance
- Cold first portrait view: at most **2,000,000 transferred bytes**, including page, scripts, styles, fonts, logo, stills and chapter 1 media.
- Completed page in either orientation: at most **5,000,000 transferred bytes** after all four chapters and ordinary content have been visited. Measure actual browser transfers, including repeated requests, separately from on-disk sizes. Report PDF download separately; it is user-initiated.
- Report measured chapter MP4/still sizes, H.264 dimensions/duration/first-keyframe evidence, browser network totals and measurement conditions. Do not label an estimate for chapters 2–4 as a completed full-page measurement.
- Keep typecheck, lint, component tests and production build green. Browser checks cover native play/end/re-entry, no scroll seeks, failure/reduced motion/data saving, direct fragments, both scroll directions, 390/768/1440px, inquiry validation and PDF access.

### Explicit approval gate
Implement and show **chapter 1 only**, in both orientations, with the normal business-content foundation below it. No placeholder chapter animations and no chapter 2–4 production before owner approval. Report file sizes and measured current preview transfer; open the local preview and stop for approval. Publication is outside this checkpoint. The previous four chapter captions remain recorded in DESIGN.md for the next approved slice.


## Direct portrait response — 16 September 2026

The owner accepted the research-led next pass after persistent mobile judder. First isolate input response: prepared portrait frames follow the current native scroll position without the 100ms easing plus camera-speed cap, which reproduced continued forward camera motion after scroll reversal. Decode completion may schedule selection from the latest input, never present an obsolete request. Prioritize the next likely frame from gesture speed while retaining the same bounded image memory. React captions update only when their visibility, drift or active chapter changes. Preserve the opening pose during its fade, then follow current scroll; preserve all artwork, both compositions, contact access and reduced-motion behavior. The previous bounded-speed contract continues only for landscape/legacy movies. Validate this slice before considering Worker rendering, codecs or new interpolated media. Physical-phone confirmation is a separate HITL gate; draw timestamps are not compositor presentation evidence.

## Mobile frame sequence — 16 September 2026

The owner reports improvement but still sees judder. Bounded MP4 seeks reduce jump size but remain subject to variable media-decoder latency. Use independently prepared, cached WebP frames for portrait motion on capable browsers; retain video for landscape and browsers without ImageBitmap. Preserve the delivered 720×1280 footage, 24fps camera path, opening pose, logo, overlays, native scroll and public access. Generate derivatives through Higgsfield, load frame packets progressively and bound decoded-image memory. Latest scroll intent alone selects what is drawn; pending decoding may never repaint an obsolete frame. Verify cold/delayed loading, reverse scrubbing, both joins, orientation handoff, failure/reduced motion and business access. Report the additional compressed bytes and real-device limits honestly.

## Rapid direction changes — 16 September 2026

The owner still sees glitches during fast up/down scrolling. Reproduction in Chrome/WebKit shows large jumps between displayed movie frames, exacerbated by delayed media seeks. Keep native scrolling responsive, but bound camera speed and each decoded step; do not advance the camera clock while its requested image is pending. Always use the latest scroll destination and settle precisely after input stops. Preserve artwork, opening, shared joins, cached films, reduced motion and business access. Test rapid reversals with actual decoding and with delayed media seeks before publishing. The owner explicitly made the existing Site public on 16 September; preserve that public audience for this and future releases.

## Loading and return resilience — 16 September 2026

The owner approved a finish pass focused on the opening, resource use, returning from another app or a locked screen, and link-preview metadata. Preserve the accepted imagery, native scroll, private Sites audience and contact behavior.

- Recovery after the owner reported new scroll glitches: restore the complete playback implementation from the accepted interface-finish release. Withdraw the experimental image gate, background eviction, callback changes and session-wide Blob loading shortcut. Smoothness takes priority over speculative request/resource reductions.
- Keep text/contact available and retain already prepared movies in the selected orientation through brief interruptions. Forward/reverse movement through those prepared scenes must still work without another network download.
- Verify resource lifetimes, Blob recovery, delayed images, media errors and reduced motion through Chrome/WebKit behavior checks. Report device emulation and lab performance honestly.
- Supply Croatian Open Graph/Twitter title, description and a faithful derivative of the approved scene. Retain noindex and owner-only hosting; external messaging services cannot fetch a private page's preview until its audience permits it.

## Monumental construction journey — current accepted pass

The owner approved a cinematic passage through an already built construction frame after reviewing the seven-second film. The result communicates physical material detail and the scale of visokogradnja through a roughly 24-second native-scroll journey, with scene-specific Croatian HTML captions and a separately composed portrait version. The storyboard and exact visual constraints live only in DESIGN.md.

Additional acceptance criteria:
- As an investor, I encounter concrete/reinforcement detail and the building's height at distinct points in a spatially coherent journey.
- I can move forward and backward across film boundaries without flashing, jumps to the wrong scene or obsolete queued seeks.
- On portrait devices I see intentionally framed vertical artwork and a reachable action, without a large gap separating artwork from copy.
- Essential text, navigation, the inquiry draft and the preparation PDF remain usable while subsequent segments load or fail.
- Initial loading fetches the selected orientation and needed segment only; direct jumps, cached reverse movement and a host without seekable media byte ranges are tested through the page.

The owner replenished credits and explicitly authorized landscape and separately directed portrait production. Eight accepted framing anchors and six eight-second films now support the full journey. Existing private Sites publication remains authorized. Production provenance and limitations are recorded in scripts/cinema.json and QA.md.

## Cinematic realism amendment — 15 September 2026
The owner requested photorealistic video-quality construction graphics, suggesting Seedance 2.5 through Higgsfield. Replace the visible real-time render with a continuous generated film controlled by native scroll, retaining the accepted dark industrial direction, original logo, four caption waypoints, services including visokogradnja, and all detail/inquiry behavior. The initial seven-second proof established this direction; the funded 24-second landscape/portrait production above supersedes it. Preserve the existing private Sites audience. Reduced motion and data-saving access use selected film frames without downloading movies. Ordinary phone and tablet visits animate automatically with native scrolling, without a playback button.

## Hosting amendment — 15 September 2026
After accepting the local delivery, the user requested publication through Sites. Host this implementation with the default owner-private audience; preserve existing functionality and content limitations. This supersedes the original local-only delivery boundary for Sites publication, including its required source/version workflow. A public audience or other hosting provider still requires a separate user request.

## Problem statement
Private and commercial investors need to understand Adduco's construction offering, assess credible evidence, and begin a useful conversation. The initial local site works, but the user rejected its pale palette and abstract assets. The supplied red/black logo must guide a more realistic treatment. Approved project photography remains pending.

## Filmska šetnja amendment — 15 September 2026
The user selected continuous cinematic travel with all business content over the 3D scene. Remove editorial bands; preserve real copy and inquiry/PDF behavior. Detail panels support direct URLs, Escape/Back, focus return and unchanged camera position. Correct per-triangle logo shades. Deploy the accepted result through the existing owner-private Site.

## Solution
A Croatian-language business website connected to one original cinematic construction environment. Four caption moments accompany continuous camera travel, with direct business navigation and an accessible inquiry route. Deliver locally and through the authorized owner-private Site.

## User stories
1. As an investor, I can immediately understand the company and its offering.
2. I can go directly to services, projects, or contact without scrolling through the film.
3. I can explore Vizija, Betonski radovi, Visokogradnja, and Vaš projekt in either direction.
4. I can read every caption without artwork obscuring it.
5. I can see sourced services and project roles without invented claims.
6. I can learn what to prepare and discuss before commissioning work.
7. I can download the Croatian preparation checklist without an email gate.
8. I can validate and prepare a short inquiry, with an honest description of its delivery method.
9. I can use the site with a keyboard and screen reader.
10. I can use a complete page on mobile, with reduced motion, or if video cannot load.
11. I can access essential content before movie downloads and without client-side JavaScript.
12. I can pause animation or choose a simpler presentation.
13. As the owner, I can inspect the local implementation and its measured performance before publishing.

## Implementation decisions
- React, TypeScript and Vite. Pre-render essential React content into built HTML; hydrate controls independently of movie loading.
- One continuous dark construction world: a suspended tessellated red steel emblem, concrete portals, walls, slabs, reinforcement and wet reflections. No classical columns or planting. A generated film provides photographic materials and camera motion. Native document progress selects video frames without wheel interception.
- Generate a master through Higgsfield GPT Image 2.5 using the original logo and owner-approved dark reference, then animate it through Seedance 2.5. Generated stills are fallback artwork, never photographs of completed projects.
- Serialize seeks, smooth abrupt targets over a short interval and synchronize captions to decoded frames. Keep the previous prepared movie for reverse scrolling and prepare the next movie before crossing. Do no rendering work while idle or hidden. Phone and touch-tablet motion follows scrolling automatically with no play/pause control; desktop retains its control. Reduced motion, data saving and media failure use still imagery with complete content access.
- Contact begins with browser validation and a reviewable email draft. No message is sent during testing. An automatic form delivery service requires separate configuration and approval.
- No database, analytics, cookies requiring consent, migrations or external issue publishing. Deployment is authorized only through the existing private Site; no credential is stored in source.
- The user confirmed ADDUCO d.o.o., Metković, OIB 40912050957. Use sourced facts only; track uncertain brand assets and project images separately.

## Testing decisions
Use behavioral tests through the rendered page: direct navigation, form validation and email preparation, real PDF response, scrolling and chapter state, video seeking in both directions, reduced motion, automatic mobile motion without playback buttons and failed media fallback. Do not couple tests to component internals. TDD proceeds one runnable slice at a time. Browser QA at 390, 768, and 1440 pixels includes screenshots, keyboard use, page errors, overlap, overflow, and CTA visibility. Performance reports are local laboratory measurements, never field Core Web Vitals claims.

## Out of scope
Public deployment, sending test inquiries, made-up portfolio entries, business guarantees, invented testimonials, or unverified certifications. Automatic inquiry delivery is not configured in this local build.

## Further notes
The root DESIGN.md is the only visual specification. Sources and remaining content approvals belong in CONTENT-SOURCES.md. Implementation slices remain local because the user has not approved publishing issues.

## Confirmed construction direction — 15 September 2026
The user confirmed that Adduco also performs visokogradnja; include it in the hero, company introduction, service list and metadata. All classical columns and planted circular islands are replaced by contemporary concrete construction: structural frames, walls, beams, slabs, formwork details and reinforcement. Follow the supplied dark realistic industrial reference with detailed concrete/metal surfaces and wet reflections. The selected continuous camera journey and accessible overlays remain.
