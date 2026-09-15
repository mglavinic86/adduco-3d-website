# Vertical implementation slices

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
