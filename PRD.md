# Adduco — local website

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
