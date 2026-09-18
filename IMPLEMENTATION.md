# Vertical implementation slices

## Native preparation — 18 September 2026

- NP1 — implemented and focused browser tests pass: retain the six native video elements; after the first canplaythrough, fully buffer one movie at a time in the approved order. Reuse those elements for playback. No fetch/preload bridge or media changes.
- NP2 — verified: matching HTML preload and picture selection in both orientations and engines; only the correct opening image is requested. Reversing measurement order moves the slow first response to landscape as well. The prior portrait timing difference is not an orientation-selection failure; response latency before frontend execution remains separately reported.
- NP3 — local verification complete: all134 applicable browser cases pass across the full run and updated-expectation rerun; four expected skips. Local4G later starts13.3ms portrait /12.1ms landscape; complete transfers under5MB. Live movie-payload and timing measurement follows publication. Gate 1 gestures, early captions, still fallbacks and navigation are preserved.
- NP4 — authorized: publish through the existing public Sites project, then measure on the actual live URL. Report slow initial responses honestly. The optional tempo experiment and Batch 2 are outside this pass.

## Cold-load ordering — 18 September 2026

- CL1 — complete locally: orientation-specific high-priority HTML opening preloads; tiny inline blurred artwork; no-hydration browser coverage. The image request precedes the module. Gate 1 runtime, accepted media, captions and DESIGN.md are unchanged.
- CL2 — investigation complete, implementation stopped: published Chrome reuses both tested fetch approaches; WebKit downloads the movie body again. ETag/range and fresh-cache transport fixtures corroborate the finding. See QA.md and archived measurements.
- CL3 — blocked by CL2: do not install a sequential fetch queue that duplicates transfers. All-six-clip WebKit transport tests send 6,815,636 portrait /7,584,670 landscape bytes in movie bodies alone, over the 5 MB complete-page budget. Existing observer preparation remains.
- CL4 — stopped by the owner's explicit budget condition: no publication; no published-after claims. Public-before and local-opening-only Fast3G/4G timelines are reported separately. Next proposed approach is preparing and reusing actual native video elements, subject to verification and agreement on the changed mechanism. Batch 2 remains untouched.

The prior corrected Gate 1 build was explicitly published separately on 18 September as public Sites version19. The historical TP3 publication hold below refers to that earlier review, not the current live state.

## Gated transition polish and launch readiness — 18 September 2026

- TP1 — media correction complete locally under the owner's revised constraints: six original-source reverse clips at accepted two-pass bitrates; eight decoded-forward WebP85 stills; six forward SHA-256 hashes unchanged. Size limits pass. Report all24 raw RMS values, including two shared forward origins still >3; apply the explicitly approved150ms settle fade to all six reverse clips. See QA.md.
- TP2 — AFK, complete locally; 122 browser tests passed / four expected skips, four unit tests, typecheck/lint/build green: prior loading/input/exit fixes retained; add behavioral TDD for reverse settlement and fresh input during the handoff. No new visitor copy or visual direction.
- TP3 — HITL, awaiting corrected Gate1 review: exact sizes/RMS, fresh waterfall/transfers, playback screenshots and local preview; raw residuals disclosed. Stop before Batch2 and publication.
- LR4 — AFK, blocked by TP3 approval: webhook form, supplied legal identity/privacy, indexability flag, honest project content structure and repository/CI cleanup as specified in the latest PRD amendment.
- LR5 — HITL, blocked by LR4: Gate 2 lab performance/transfer/form evidence, footer screenshot and open TODO list. No Sites publication until explicitly authorized again.

## Earlier caption entrance — 18 September 2026

- EC1 — AFK, verified; release prepared: decouple caption visibility from film completion, reveal during actual playback, verify forward/reverse timing, non-overlap, gesture locking, early business actions and stalled playback. Publish the verified correction to the existing public Site.

## Complete four-scene journey — 18 September 2026

- CJ1 — HITL, complete: owner accepted ST3 and approved completing the full experience.
- CJ2 — AFK, complete; blocked by CJ1 (satisfied): prepare exact-join transitions 2–3 in both orientations and directions, extend the accepted native player and verify full forward/reverse travel.
- CJ3 — AFK, complete; CJ2 satisfied: validate interruption, loading, all hash destinations, responsive captions, accessibility and cold/full transfer budgets.
- CJ4 — AFK, complete; public release and published-page checks passed: publish the exact verified source through the existing public Sites project and synchronize the public GitHub repository. Verify the published page.

## Corrected scene-transition checkpoint — 18 September 2026

The owner rejected autoplay-on-entry and clarified a stationary opening, one scroll-triggered complete transition, and a held destination scene with its caption. The rejected NC1 component and short opening trims have been replaced; archive provenance remains in scripts/cinema.json.
- ST1 — HITL, complete: owner approved native reverse playback and gesture capture limited to the film, ignoring additional input during a transition. Forward behavior and the first-transition-only approval scope are explicit in PRD.md.
- ST2 — AFK, complete locally; ST1 satisfied: stationary opening, one complete native three-second transition per gesture, separate reverse clips, held destination/caption, failure stills and ordinary business access. Browser/visual QA and transfer measurements are recorded in QA.md.
- ST3 — HITL, complete; owner accepted the preview and authorized completion: owner reviews this corrected first-transition checkpoint before any remaining transitions or publication.


## Native snap chapters — 18 September 2026

These NC slices and all older scrolling/frame-sequence slices below are historical. The corrected ST checkpoint above supersedes NC autoplay and its pending approval.
- NC1 — AFK, complete locally: one 100svh chapter; two 2.5-second native MP4s derived through Higgsfield; held final frame, no replay, accessible fallback and ordinary business sections. Remove all scrubber runtime/assets/tests. Test behavior, measure actual transfer, show local preview.
- NC2 — HITL, pending; blocked by NC1: owner approves chapter 1 on the local preview. Stop here before producing chapters 2–4 or publishing.
- NC3 — AFK, blocked by NC2: produce chapters 2–4 in both orientations with IntersectionObserver loading and unchanged captions; verify complete-page portrait transfer ≤5MB.
- NC4 — HITL, blocked by NC3: review full four-chapter result and authorize publication.


## Direct portrait response — current

- DR1 — AFK, complete: reproduce camera movement against the actual scroll direction, remove the portrait catch-up clock, prioritize likely next images with the existing memory bound, verify final settling and loading/reversal behavior.
- DR2 — AFK, complete; depends on DR1: keep caption state discrete and eliminate the competing animation-path scroll listener; verify unchanged caption/contact behavior and reduced-motion fallback.
- DR3 — HITL, pending; depends on DR1/DR2: review the isolated improved response on the owner's physical phone. Worker/OffscreenCanvas and interpolation remain later experiments if measurements justify them; no promise of perfect device frame rate.

## Prepared portrait frames — current

- SQ1 — AFK, complete: independent 720px WebP frame decode and cached reverse presentation measured before implementation. First vertical slice: portrait opening, automatic scroll and contact without MP4 requests.
- SQ2 — AFK, complete; SQ1 satisfied: complete frame packets, bounded bitmap cache, delayed/missing packets, latest-intent drawing, both joins and retained compressed reverse access.
- SQ3 — AFK, local QA complete; SQ2 satisfied: portrait/landscape handoff, opening image continuity, reduced motion and legacy-engine coverage; full responsive/browser QA complete (92-case coverage plus the passing eight-case viewport rerun), ready to publish to the existing public Site.

## Rapid reversal correction — current

- RC1 — AFK, complete: rapid up/down input reproduced 0.58–0.63s camera jumps in Chrome/WebKit; modeled 90ms media delay produced 1.46s jumps. Bounded camera steps and advancement synchronized with decoded frames pass the regression in both engines.
- RC2 — AFK, complete; RC1 satisfied: verified repeated direction changes around both joins, correct final settling, opening, no media controls on phone, reduced motion, prepared-scene continuity and contact. Accepted films and cache behavior remain.
- RC3 — AFK, local QA complete; RC2 satisfied: 74 Chrome/WebKit checks, four component tests, typecheck/lint/build and strict design audit pass. Visually checked mobile/tablet/desktop and rapid reversals in the local browser without errors. Ready for publication through the existing Sites project with its explicitly authorized public audience. Physical-device confirmation remains outstanding.

## Scroll regression recovery — current

- RR1 — AFK, mitigation complete: immediately redeploy the accepted interface-finish version after the owner reports new scroll glitches.
- RR2 — AFK, complete; RR1 satisfied: reproduced loss of prepared-scene scrolling after a brief hidden interval with subsequent movie downloads failing. Both Chrome/WebKit failed on the optimized implementation and passed on the restored accepted CinematicFilm implementation. Keep sharing metadata/image and interface finish.
- RR3 — AFK, local QA complete; RR2 satisfied: all 66 Chrome/WebKit browser checks, four component tests, typecheck, lint and build pass. Source and compiled JavaScript match the accepted playback exactly. Ready to publish the corrected source to the existing private Site. The previous resource-count/request-count tests are retired because their optimization requirements are withdrawn; prepared-scene continuity replaces them.

## Loading and return resilience — playback changes withdrawn

The following records the attempted pass, not the current playback contract. The user subsequently reported regression; RR1–RR3 above supersede LR1/LR2. Sharing metadata from LR3 is retained.

- LR1 — AFK, complete: delayed-artwork test failed with movie requests before the still finished, then passed with image load/error gating. Contact remains available, including failed-image and cached-complete paths. Opening intent is captured before the wait.
- LR2 — AFK, complete; LR1 satisfied: hidden-page regression failed with three retained movies, then passed with one displayed pose and revoked unused Blob URLs. Added persisted page-event/frozen-opening and reverse-scroll checks. No-range-host test reproduced redundant native requests; later movies now use the known Blob path directly, with no change to source films.
- LR3 — AFK, local QA complete; LR2 satisfied: complete Croatian sharing metadata and approved-scene JPEG. All 72 Chrome/WebKit checks and four component tests pass, alongside typecheck/lint/build. Visually inspected 390/768/1440px and the in-app preview, with no console errors. Local Lighthouse stays at 95/100, LCP 2.93s, TBT/CLS zero; no speedup is inferred from this unchanged lab score. Ready for the existing owner-private Sites publication. Real phone screen-lock behavior and external social previews remain subject to device/public-access verification respectively.

## Overlay and interface finish

- UI1 — AFK, complete: captions settle at full opacity with a 160ms transition and at most 10px of movement. Chrome and WebKit regressions reproduced stalled partial opacity and initial overlapping titles before the fixes. Keep layout centering separate from the animated translation to avoid an initial vertical jump. Decoded-film progress remains the caption source; movies and camera seeking are unchanged.
- UI2 — AFK, complete; depends on UI1: localized caption contrast preserves visible concrete and reflections, with compact 360×640 composition and safe-area spacing. The numbered mobile menu focuses its first link, dismisses on Escape/outside click and restores focus after details. Chrome and WebKit behavior checks pass; native scrolling and stable viewport sizing are preserved.
- UI3 — AFK, local QA complete; depends on UI2: adaptive contact columns, readable 16px inputs, clearer focus/error states and brief panel/control feedback. The inquiry remains an unsent, reviewable email draft. All 59 Chrome/WebKit browser checks pass with one worker, alongside four component tests, typecheck and lint. Five concurrent workers caused a movie-image comparison timeout and undersampled a 180ms blend; both passed twice independently, followed by the complete sequential suite. Visual review covers 360×640 and 390/768/1440px layouts, with direct navigation, reduced motion and focus/scene return. Ready for the existing owner-private Sites publication; physical Android verification remains a device check.

## Mobile toolbar and late-load correction

- VP1 — AFK, complete locally: reproduce `#vizija` rewinding from 950px to 0 when a delayed image finishes loading. Restore the initial fragment in a layout effect only after the enhanced layout commits. Chrome and WebKit regression failed before removal of the late-load restoration and passed afterward. Direct-chapter testing also exposed a startup frame running before enhanced heights existed (1400px instead of 3220px); all eight repeated Chrome checks passed after tying restoration to the committed layout.
- VP2 — AFK, complete locally; depends on VP1: keep film, stills and wash on one top-anchored `100lvh` surface. A controlled small/large viewport model reproduced cover-crop resizing at 700→729px before the change, then verified stable 758px artwork through address-bar expansion/retraction. Actual Android compositor behavior still requires device confirmation; desktop emulation cannot reproduce native browser chrome.
- VP3 — AFK, local QA complete; depends on VP2: all 51 browser checks and four component tests passed, along with typecheck, lint and production build. Verified direct chapter loading, opening and reverse scroll, reduced motion, rotation, 390/768/1440px layouts, contact and PDF. Compared the phone toolbar-model screenshots with stable artwork and complete bottom coverage. Ready for the existing owner-private Sites publication; physical Android confirmation remains outstanding.

## Opening handoff follow-up

- OP1 — AFK, complete: reproduce the opening still/video discontinuity and replace all opening poster variants with the matching delivered movie's decoded first frame. Regression through browser image comparison.
- OP2 — AFK, implementation and local QA complete; depends on OP1: reproduce scrolling before initial loading completes, keep the opening pose until decoded, then ease toward the pending destination. Validate no-range recovery, direct navigation, both scroll directions and no mobile playback control before the existing private Sites publication.

## Mobile smoothness pass — approved 15 September 2026

- SM1 — AFK, complete. Automatic native-scroll motion on phone/touch tablet, no mobile play/pause control, reduced-motion and failure access retained. Browser regression failed before the change, then passed.
- SM2 — AFK, complete; depends on SM1. Early adjacent preparation, proactive no-range Blob recovery and retained previous movie for reverse movement. Observable media/network regression verified.
- SM3 — AFK, complete; depends on SM2. Short smoothing with a fresh clock after idle; captions follow decoded frames; rotation waits for the requested frame. Regression tests verified red then green.
- SM4 — AFK, complete local production; depends on SM3. Re-encode native portrait footage through Higgsfield for rapid seeking, compare detail visually, verify 390/768/1440px, old-browser/reduced-motion paths, contact and PDF. Publish through the already authorized owner-private Site and verify hosted forward/reverse frames. No new scene generation.

Earlier production phases below record the accepted history. Their mobile opt-in behavior is superseded by SM1.

## Current pass — monumental construction journey

### M0 — Resolve generation resources and inspect framing anchors
Type: AFK. Complete: owner funded and authorized both formats; eight accepted anchors inspected, including two corrections. No purchases or credit transfers.

### M1 — Explore the first connected landscape transition
Type: AFK. Production and behavior checks complete. Dependency satisfied: [M0](#m0--resolve-generation-resources-and-inspect-framing-anchors).
Acceptance: validated eight-second film from entry to reinforcement detail, scene-specific HTML caption and still, retained working navigation and reduced-motion view. Test forward and reverse chapter behavior through the page before connecting the new media. Keep the local build runnable.

### M2 — Reach height and final contact across film boundaries
Type: AFK. Production and behavior checks complete. Dependency satisfied: [M1](#m1--explore-the-first-connected-landscape-transition).
Acceptance: complete 24-second landscape path; current and adjacent segments load without fetching the portrait variant; no flash or stale-frame seek on fast jumps/reversal; failed segment retains composed still and usable content; modal preserves camera position. Start with a failing public browser test for crossing a segment boundary and returning, then implement and extend failure/no-range coverage one behavior at a time.

### M3 — Explore the same journey in portrait
Type: AFK. Production and behavior checks complete. Dependencies satisfied: [M0](#m0--resolve-generation-resources-and-inspect-framing-anchors), [M2](#m2--reach-height-and-final-contact-across-film-boundaries).
Acceptance: purpose-composed portrait film and stills, complete emblem, building height and readable overlay within phone framing, motion opt-in and touch behavior preserved. Verify mobile requests the portrait source only and contact remains reachable.

### M4 — Verify and publish the complete pass
Type: AFK. Implementation and local QA complete. Release uses the authorized owner-private Site. Dependencies satisfied: [M2](#m2--reach-height-and-final-contact-across-film-boundaries), [M3](#m3--explore-the-same-journey-in-portrait).
Acceptance: tests/typecheck/lint/build; real-browser visual and interaction evidence at 390/768/1440, network/media-failure and reduced-motion checks; inspect every film transition, logo geometry and service text. Publish through the already authorized existing owner-private Sites project, then verify actual hosted forward/reverse video progress. Remove unused temporary production assets after acceptance.

## Cinematic realism slices
- C1 — Complete. AFK: photographic master and seven-second Seedance 2.5 film generated and visually inspected from the supplied logo and approved reference.
- C2 — Complete. AFK, C1 satisfied: native-scroll film seeking in both directions, captions and detail overlays; regression verified red then green.
- C3 — Complete. AFK, C2 satisfied: responsive frames, motion controls, media failure/reduced motion, opt-in and complete emblem in portrait.
- C4 — Implementation and QA complete. AFK, C3 satisfied: 4 component tests, 16 browser checks, responsive/accessibility review and Lighthouse. Publish through the authorized private Sites workflow.
- Superseded by the funded M0–M4 production above.

## Filmska šetnja slices
- F1 — Complete. AFK, no blockers: accessible business panels, direct URLs and return to the same scene. Test opening/closing before implementation.
- F2 — Complete. AFK, F1 satisfied: continuous camera/overlay timeline, native scroll, reverse navigation, mobile/reduced-motion treatment. Browser behavior tests first.
- F3 — Complete. AFK, no blockers: Higgsfield face-specific reds, faithful supplied logo and same-camera fallback images. Visual asset proof.
- F4 — Implementation and QA complete. AFK, F1–F3 satisfied: responsive/browser/keyboard checks and build validation. Publish through the existing owner-private Sites release workflow.

## Current redesign — Crveni monolit
User selected the Higgsfield concept on 15 September 2026. Existing behavior criteria below remain in force.
- R1 — Complete. AFK, no blockers: Higgsfield horizontal logo, red/black/white hero, textured sculpture and direct contact.
- R2 — Complete. AFK, dependency R1 satisfied: four regenerated sculptures, reversible camera and desktop/tablet/mobile still compositions.
- R3 — Complete. AFK, dependency R1 satisfied: identity through services, projects, PDF and contact; verified copy and draft behavior preserved.
- R4 — Complete. AFK, dependencies R2/R3 satisfied: 3 unit behavior tests, 9 browser tests, responsive/accessibility checks and production performance measurement. See QA.md. Local preview remains on port 5184.
- HITL: approved project photos and public launch remain owner decisions.

Original slices S1–S6 below are complete for the authorized local-preview scope. S3 photography and S6 public launch remain explicitly excluded owner decisions.

## S1 — Read the company introduction and reach contact
Type: AFK. Blocked by: none. Stories: 1, 2, 9, 11.
Acceptance: Croatian pre-rendered page; responsive header; direct links; readable first fold; visible keyboard focus. Test direct contact navigation before implementing it.

## S2 — Explore the four sculpture chapters
Type: AFK. Blocked by: [S1](#s1--read-the-company-introduction-and-reach-contact). Stories: 3, 4, 10, 12.
Acceptance: original Higgsfield GLB assets, continuous environment, reversible native scroll, chapter controls, responsive fallback, reduced motion, pause control. Verify public chapter behavior before connecting the scene.

## S3 — Inspect services, projects, and preparation process
Type: AFK for sourced text; HITL for owner-supplied identity and approved photos. Blocked by: [S1](#s1--read-the-company-introduction-and-reach-contact). Stories: 5, 6.
Acceptance: traceable facts, accurate role/status, readable details, no synthetic project photography or unsupported claims.

## S4 — Download the preparation checklist
Type: AFK. Blocked by: [S1](#s1--read-the-company-introduction-and-reach-contact). Story: 7.
Acceptance: a real Croatian PDF, selectable text, diacritics, location/use/documents/budget/timeline/questions, no email gate; download tested through HTTP.

## S5 — Prepare a useful inquiry
Type: AFK. Blocked by: [S1](#s1--read-the-company-introduction-and-reach-contact). Story: 8.
Acceptance: accessible short form, inline Croatian errors, valid inquiry creates a reviewable email draft, no false sent confirmation, direct contact alternative.

## S6 — Verify and deliver localhost
Type: AFK. Blocked by: S2, S3 text, S4, S5. Story: 13.
Acceptance: tests/typecheck/lint/build; desktop/tablet/mobile browser review; navigation both ways, reduced motion, no WebGL, PDF, form and all CTAs; local performance report; unused localhost port remains running. Public launch and final photography are HITL requirements.

## Localized continuity follow-up

- LC1 — AFK, complete. Reproduce skipped/duplicated frame selection at exact timestamps, then seek inside the selected frame interval. Public rendered-frame regression verifies adjacent positions in both directions.
- LC2 — AFK, complete; depends on LC1. Inspect actual portrait movie endpoints, repair both small discontinuities through Higgsfield using the previous decoded endpoint, and validate image continuity through the browser.
- LC3 — AFK, local verification complete; depends on LC1/LC2. Verify the new frame/transition behavior in Chrome and WebKit phone contexts, retain no-button automatic scrolling and business access, then publish to the existing owner-private Site.
