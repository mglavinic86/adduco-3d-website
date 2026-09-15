# Adduco project

Read PRD.md, DESIGN.md, CONTENT-SOURCES.md and IMPLEMENTATION.md before changes. DESIGN.md is the only visual contract. The user selected Gallery Journey, then a cinematic continuous journey with dark realistic contemporary construction, and confirmed ADDUCO d.o.o., Metković, OIB 40912050957.

## Stack and checks
React, TypeScript, Vite, Three.js, GSAP. Package versions in package.json are authoritative.
- `npm test`: investor behavior tests.
- `npm run typecheck`: TypeScript.
- `npm run lint`: ESLint.
- `npm run build`: production bundle plus pre-rendered essential HTML.
- `npm run test:e2e`: real Chrome checks; expects a server on 127.0.0.1:5184.
- `npm run preview -- --port 5184 --strictPort`: serve the completed build locally.

Use TDD for behavioral code changes and keep each slice runnable. Browser QA must cover 390, 768, and 1440px, direct navigation, both scroll directions, reduced motion, unavailable WebGL, inquiry validation and the PDF.

## Content and assets
All visitor text is Croatian. Do not invent projects, service capabilities, credentials, metrics, or testimonials. The supplied original logo is `adduco logo/adduco logo.png`; preserve it. Public WebP assets are optimized presentation derivatives. Approved real project photography is pending; the user authorized sourced text descriptions for local review.

The sculpture garden is original conceptual artwork authored through Higgsfield 3D Jutsu. It is not portfolio photography. Keep the editable generation source in scripts/garden.py. Preserve embedded material maps and UVs when batching the GLB. Set Blender image color space before writing pixels. Static fallback images must contain only artwork, without UI overlays. The horizontal logos are faithful crops/resizes of the original PNG processed through Higgsfield; the supplied original remains untouched.

## Boundaries
The user authorized publication through Sites on 15 September 2026. Preserve the Site's current audience; new Sites start owner-private. Sites publication includes the source push and version required by its hosting workflow. Do not publish to other providers, create remote issues, send inquiries or change the audience without explicit permission. The form creates a reviewable mailto draft; do not replace that behavior with a false success message. Broader public launch still needs confirmed recipient, approved project photos/copy, production metadata and privacy/integration configuration.
