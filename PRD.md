# Adduco — local website

## Hosting amendment — 15 September 2026
After accepting the local delivery, the user requested publication through Sites. Host this implementation with the default owner-private audience; preserve existing functionality and content limitations. This supersedes the original local-only delivery boundary for Sites publication, including its required source/version workflow. A public audience or other hosting provider still requires a separate user request.

## Problem statement
Private and commercial investors need to understand Adduco's construction offering, assess credible evidence, and begin a useful conversation. The initial local site works, but the user rejected its pale palette and abstract assets. The supplied red/black logo must guide a more realistic treatment. Approved project photography remains pending.

## Filmska šetnja amendment — 15 September 2026
The user selected continuous cinematic travel with all business content over the 3D scene. Remove editorial bands; preserve real copy and inquiry/PDF behavior. Detail panels support direct URLs, Escape/Back, focus return and unchanged camera position. Correct per-triangle logo shades. Deploy the accepted result through the existing owner-private Site.

## Solution
A Croatian-language business website connected to one original four-chapter sculpture garden. The user selected Gallery Journey: expansive architectural scenes with compact readable content, direct navigation, and an accessible inquiry route. Delivery is localhost only.

## User stories
1. As an investor, I can immediately understand the company and its offering.
2. I can go directly to services, projects, or contact without scrolling through the garden.
3. I can explore Vizija, Temelji povjerenja, Preciznost izvedbe, and Vaš sljedeći projekt in either direction.
4. I can read every caption without artwork obscuring it.
5. I can see sourced services and project roles without invented claims.
6. I can learn what to prepare and discuss before commissioning work.
7. I can download the Croatian preparation checklist without an email gate.
8. I can validate and prepare a short inquiry, with an honest description of its delivery method.
9. I can use the site with a keyboard and screen reader.
10. I can use a complete page on mobile, with reduced motion, or without WebGL.
11. I can access essential content before 3D downloads and without client-side JavaScript.
12. I can pause animation or choose a simpler presentation.
13. As the owner, I can inspect the local implementation and its measured performance before publishing.

## Implementation decisions
- React, TypeScript, Vite, Three.js, and GSAP. Pre-render essential React content into the built HTML; hydrate interactive controls independently of lazy-loaded 3D.
- One continuous world in the selected Crveni monolit direction: four red/neutral-concrete sculptures based on the supplied triangular logo, textured fluted pillars, restrained planting, shallow water and neutral daylight. Scroll remains native. A measured path maps document scroll to camera progress; no wheel interception.
- Use Higgsfield MCP's editable Blender scene builder and GLB export for actual geometric assets. Generated stills are fallback artwork, never photographs of completed projects. Shared geometry and named semantic sculpture parts support consistency and portal assembly.
- Cap pixel ratio, throttle frames when idle, suspend hidden scenes, and choose a simpler mode for narrow viewports, reduced motion, resource-constrained devices, or context failure.
- Contact begins with browser validation and a reviewable email draft. No message is sent during testing. An automatic form delivery service requires separate configuration and approval.
- No database, credentials, analytics, cookies requiring consent, migrations, deployment, or external issue publishing.
- The user confirmed ADDUCO d.o.o., Metković, OIB 40912050957. Use sourced facts only; track uncertain brand assets and project images separately.

## Testing decisions
Use behavioral tests through the rendered page: direct navigation, form validation and email preparation, real PDF response, scrolling and chapter state, reduced motion, mobile and WebGL fallback. Do not couple tests to mesh counts or component internals. TDD proceeds one runnable slice at a time. Browser QA at 390, 768, and 1440 pixels includes screenshots, keyboard use, page errors, overlap, overflow, and CTA visibility. Performance reports are local laboratory measurements, never field Core Web Vitals claims.

## Out of scope
Public deployment, sending test inquiries, made-up portfolio entries, business guarantees, invented testimonials, or unverified certifications. Automatic inquiry delivery is not configured in this local build.

## Further notes
The root DESIGN.md is the only visual specification. Sources and remaining content approvals belong in CONTENT-SOURCES.md. Implementation slices remain local because the user has not approved publishing issues.

## Confirmed construction direction — 15 September 2026
The user confirmed that Adduco also performs visokogradnja; include it in the hero, company introduction, service list and metadata. All classical columns and planted circular islands are replaced by contemporary concrete construction: structural frames, walls, beams, slabs, formwork details and reinforcement. Follow the supplied dark realistic industrial reference with detailed concrete/metal surfaces and wet reflections. The selected continuous camera journey and accessible overlays remain.
