# Vertical implementation slices

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
