Aktualno odobrenje 28.9.2026.: korisnik izričito traži javnu objavu monumentalne verzije putem Sites i push na GitHub. Koristiti postojeći project_id iz .openai/hosting.json uz javni pristup. GitHub grana: codex/monumental-scroll. Ovo nadjačava povijesno ograničenje na here.now i zabrane pusha niže. Izvorni filmski checkout ostaje sačuvan.

Aktualna objava 20.9.2026.: ispravak kontinuiranog skrola objavljen na https://mossy-nutmeg-r9v6.here.now/ i provjeren javnim paketom (46 prolazi / 4 očekivana preskakanja). Završna mjerenja i ograničenja na vrhu QA.md.

# Ispravak kontinuiranog skrola — 20.9.2026.

Aktualna implementacija zamjenjuje ponovno otvaranje svakog MP4 dijela jednim trajnim MediaSource/ManagedMediaSource prikazom. Jedan video/dekoder i canvas ostaju otvoreni kroz cijelu priču. HEVC 1080p (libx265 CRF23, zatvoreni GOP12 u portretu / GOP6 vodoravno, B2) odabire se provjerom podrške; H.264 koristi postojeće HD kadrove bez ponovnog kodiranja, samo drugi spremnik. Preglednici bez MediaSource zadržavaju prethodni native način kao kompatibilni fallback. Poslovni sadržaj, originalni logo, kompozicija, 4,5H i izvorni filmovi ostaju isti.

Najviše dva preuzimanja; prioritet se računa iz aktualnog položaja i smjera, bez reda starih gesti. Pripremljeni dijelovi ostaju u istom dekoderu. Tijekom aktivnog skrola smije se pokazati dovršen kadar koji napreduje prema najnovijem cilju; pri promjeni smjera zastarjeli rezultat ne smije pomaknuti sliku u krivom smjeru. Nakon prestanka skrola nema odigravanja međukadrova: završava se na posljednjem cilju. Native buffer nakon izbacivanja obnavlja se iz ograničenog komprimiranog cachea. Kontinuirani test sada mjeri promjene slike bez čekanja svakog kadra, odvojeno za cold i warm.

HEVC zadržava 1080×1920 / 1920×1080 i 481 kadar; SSIM prema produkcijskom masteru 0,986533 / 0,983539 (prag ≥0,98). Komprimirani fragmenti 13.512.036 B / 20.269.040 B. AVC fragmenti 19.812.347 B / 24.532.435 B, pikselno identični prethodnom HD izvozu. Početni 2 MB i puni 26 MB cilj i dalje se provjeravaju odvojeno. Stari 5 MB cilj nije vraćen kao navodni prolaz. Nema nove AI produkcije ni troška kredita. Testovi i status objave nalaze se na vrhu QA.md; stare brojke niže su povijesne.

# Ispravak kvalitete slike — 20.9.2026.

Korisnik je nakon objave odbacio kvalitetu prikaza. Usporedba istih izvornih i web kadrova pokazala je jak gubitak zakovica, bridova i teksture kroz 720p kodiranje ograničeno na 1,5–1,7 Mb/s. Nije pokrenuto novo plaćeno generiranje. Izvoz sada čuva nativnih 1920×1080 i 1080×1920 piksela: H.264 CRF20, GOP24, B2. Obje kompozicije imaju 20 samostalnih dijelova po jednu sekundu (zadnji 25 kadrova), jedan dekoder i canvas.

Odluka implementacije, javno objašnjena korisniku: nakon njegova odbijanja kvalitete, prednost ima očuvanje detalja. Potpuni mediji sada imaju približno 20 MB za portret i 25 MB za desktop. **Prethodni ukupni cilj 5 MB više ne prolazi i nije prikazan kao prolaz.** Početni cilj 2 MB ostaje zasebno mjeren; susjedni dio priprema se tek kada korisnik počne skrolati. Granica zaštite od ponovljenih preuzimanja za ovu HD izvedbu je 26 MB po orijentaciji. Ovo nije korisnikova zasebna potvrda brojke 26 MB, nego transparentno dokumentirana tehnička odluka unutar odobrenog ispravka kvalitete.

Izvornici i filmska režija ostaju isti. Bolji izvoz ispravlja gubitak detalja; ne predstavlja novo jamstvo fizičkog realizma AI gradnje. Stara štedljiva izvedba sačuvana je izvan public direktorija. Ranija mjerenja niže pripadaju toj izvedbi i više nisu aktualne brojke HD runtimea.

# Aktivno odobrenje i nastavak — 20.9.2026.

Korisnik je izričito naložio: „Nastavi sa svime. Ne pitaj me za odobrenja već sam ti sve odobrio.” Ovime je odobrena puna integracija, portretna fotografska produkcija i javni pregled nove odvojene web verzije. Ne ponavljati prethodne gateove. Originalni checkout i izvorna Sites stranica ostaju sačuvani; nova verzija ima odvojeni here.now URL. Push/PR nisu potrebni ni zatraženi. Ranije zabrane AI generiranja/uploada/objave niže povijesne su, nadjačane odobrenjima u razgovoru.

Aktualni runtime: React/Vite, prirodan skrol kroz 4,5H; deset kratko-GOP H.264 dijelova po orijentaciji → ograničen Blob cache → jedan dekoder → canvas. Caption pripada nacrtanom kadru. Mediji su Seedance 2.5 fotografski filmovi, Blender služi samo kao referenca. TDD na dokumentnom skrolu, prikazanim pikselima, rotaciji i pristupu sadržaju. Nema novih poslovnih tvrdnji, webhooka, migracija ili promjena tajni.

# Nova odvojena verzija — 20. rujna 2026.

Ovaj worktree `codex/monumental-scroll` nastaje iz `b263a1eda0627b9b3abc64ca087968fbbd26b680`. Izvorni projekt i javna stranica ostaju referentna verzija. Najnoviji korisnikov zahtjev ima prednost pred svim povijesnim uputama niže.

- Korisnik je nakon pregleda rekao „super izgleda. nastavi” i odobrio cijelu Blender priču kao buduću referencu za Higgsfield. Odobrena je lokalna produkcija pune priče i oba kadriranja; nema odobrenja plaćenog Higgsfield joba, uploada ili objave.
- Novo ponašanje: prirodan skrol dokumenta izravno određuje stanje gradnje i kameru; promjena smjera odmah mijenja cilj, mirovanje zaustavlja napredak. Nema trosekundnih filmova po gesti, gutanja ulaza, reda gesti ni dugog sustizanja.
- Jedan izvorni simbol kroz armaturu, oplatu/beton i crvenu metalnu oblogu; krupni detalj prelazi u povlačenje/podizanje i otkrivanje cjeline. Obje orijentacije obvezne.
- DESIGN.md je jedini vizualni ugovor. Razrada A i nastavak pune lokalne Blender priče odobreni su; izvorni pilot ostaje sačuvan za usporedbu.
- Nema plaćenog generiranja, kupnje, uploada novih materijala, pusha, PR-a, objave ni deploya bez novog izričitog odobrenja. Sva ranija odobrenja objave u nižim dokumentima povijesna su i NE vrijede za ovu verziju.
- Ne vraćati stari WebGL. Tehnologiju prikaza odabrati iz mjerenja iste probe. Lokalni Blender render predložen je kao izrada medija, ne kao povratak WebGL-a u preglednik.
- Zadržati izvorni logo, provjeren sadržaj, pristupačnost, obične poslovne sekcije i pošteni mailto nacrt. Stari Batch 2, webhook i pravni/produkcijski zahvati nisu dio ovog opsega.
- TDD po funkcionalnim cjelinama za buduće promjene koda. Test/typecheck/lint/build te ciljane browser provjere prije predaje implementacije. Testirati ponašanje preko dokumentnog skrola, stvarno prikazanih kadrova, navigacije i upravljanja greškama.

## Povijesne upute referentne verzije (niži prioritet)

---

# Adduco project

Read PRD.md, DESIGN.md, CONTENT-SOURCES.md and IMPLEMENTATION.md before changes. DESIGN.md is the only visual contract. The user selected Gallery Journey, then a cinematic continuous journey with dark realistic contemporary construction, and confirmed ADDUCO d.o.o., Metković, OIB 40912050957.

## Stack and checks
React, TypeScript and Vite. Higgsfield-generated artwork supplies stationary scenes connected by native three-second films. The owner correction at the top of PRD.md supersedes autoplay-on-entry and authorizes film-scoped gesture capture and separate reverse clips. The owner accepted the first transition on 18 September and authorized finishing all four scenes and the existing public Sites release. Preserve the accepted gesture behavior, artwork, captions and transfer budgets. Package versions in package.json are authoritative.
- `npm test`: investor behavior tests.
- `npm run typecheck`: TypeScript.
- `npm run lint`: ESLint.
- `npm run build`: production bundle plus pre-rendered essential HTML.
- `npm run test:e2e`: real Chrome and WebKit native-playback/responsive regressions; expects a server on 127.0.0.1:5184. Install its WebKit binary once with `npx playwright install webkit`.
- `npm run preview -- --port 5184 --strictPort`: serve the completed build locally.

Use TDD for behavioral code changes and keep each slice runnable. Browser QA must cover 390, 768, and 1440px, direct navigation, both scroll directions, reduced motion, unavailable video, inquiry validation and the PDF.

## Content and assets
All visitor text is Croatian. Do not invent projects, service capabilities, credentials, metrics, or testimonials. The supplied original logo is `adduco logo/adduco logo.png`; preserve it. Public WebP assets are optimized presentation derivatives. Approved real project photography is pending; the user authorized sourced text descriptions for local review.

The cinematic environment is original conceptual artwork generated through Higgsfield GPT Image 2.5 and Seedance 2.5. It is not portfolio photography. Generation provenance and encoding settings are in scripts/cinema.json. Use Higgsfield media processing for movie conversions and frame extraction. Static fallback images must contain only artwork, without UI overlays. The horizontal logos are faithful crops/resizes of the original PNG processed through Higgsfield; the supplied original remains untouched. Do not reintroduce the retired low-detail WebGL environment or its unused dependencies/assets.

## Boundaries
The user authorized publication through Sites on 15 September 2026. Preserve the Site's current audience; new Sites start owner-private. Sites publication includes the source push and version required by its hosting workflow. Do not publish to other providers, create remote issues, send inquiries or change the audience without explicit permission. The form creates a reviewable mailto draft; do not replace that behavior with a false success message. Broader public launch still needs confirmed recipient, approved project photos/copy, production metadata and privacy/integration configuration.

On 16 September 2026 the owner explicitly requested public access. The existing Site is now public, verified without authentication. Preserve that public audience on future releases; use the public-capable Sites deployment operation. The remaining content/integration items above do not block the owner's authorized public publication. Search indexing remains separately configured in the page/robots metadata.
