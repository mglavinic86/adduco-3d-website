# Lokalna završna dorada — 21.9.2026.

Postojeći PRD i korisnikova potvrda nastavka određuju opseg; nema nove arhitekture ili vizualnog koncepta. Provjere koriste postojeće granice: interakcije posjetitelja kroz App/InquiryForm te browser navigaciju, prikaz i fallbackove. Svaki popravak ide red → green, uz postojeće regresije.

| Cjelina | Ovisnost | Način | Prihvat |
| --- | --- | --- | --- |
| P1 Navigacija tipkovnicom i niski mobilni ekran | Postojeći dizajn | AFK | Dovršeno: fokus, izlaz, 320 px zaglavlje i 640×360 izbornik provjereni u oba enginea |
| P2 Kopiranje nacrta i oporavak od zabrane | Postojeći nacrt upita | AFK | Dovršeno: točan tekst, uspjeh/ručni fallback, reset nakon izmjene |
| P3 Ispravak pogrešaka i čitljivost obrasca | P2 | AFK | Dovršeno: ispravljena polja, veće oznake/upute i nacrt |
| P4 Završna provjera i upute za materijale | P1–P3 | AFK | Dovršeno: 7 unit + 62 browser prolaza, 4 očekivana preskakanja, typecheck/lint/build i vizualni pregled; QA.md/README ažurirani |
| P5 Fotografije, potvrde sadržaja i konačno lansiranje | Korisnikovi materijali i odobrenje objave | HITL | Čeka potrebne ulaze |

Posljednja javna objava ostaje ona od 20.9.2026. na https://mossy-nutmeg-r9v6.here.now/; ovaj nastavak je lokalna dorada.

Aktualna objava 20.9.2026.: ispravak kontinuiranog skrola objavljen na https://mossy-nutmeg-r9v6.here.now/ i provjeren javnim paketom (46 prolazi / 4 očekivana preskakanja). Završna mjerenja i ograničenja na vrhu QA.md.

# Ispravak kontinuiranog skrola — 20.9.2026.

Aktualna implementacija zamjenjuje ponovno otvaranje svakog MP4 dijela jednim trajnim MediaSource/ManagedMediaSource prikazom. Jedan video/dekoder i canvas ostaju otvoreni kroz cijelu priču. HEVC 1080p (libx265 CRF23, zatvoreni GOP12 u portretu / GOP6 vodoravno, B2) odabire se provjerom podrške; H.264 koristi postojeće HD kadrove bez ponovnog kodiranja, samo drugi spremnik. Preglednici bez MediaSource zadržavaju prethodni native način kao kompatibilni fallback. Poslovni sadržaj, originalni logo, kompozicija, 4,5H i izvorni filmovi ostaju isti.

Najviše dva preuzimanja; prioritet se računa iz aktualnog položaja i smjera, bez reda starih gesti. Pripremljeni dijelovi ostaju u istom dekoderu. Tijekom aktivnog skrola smije se pokazati dovršen kadar koji napreduje prema najnovijem cilju; pri promjeni smjera zastarjeli rezultat ne smije pomaknuti sliku u krivom smjeru. Nakon prestanka skrola nema odigravanja međukadrova: završava se na posljednjem cilju. Native buffer nakon izbacivanja obnavlja se iz ograničenog komprimiranog cachea. Kontinuirani test sada mjeri promjene slike bez čekanja svakog kadra, odvojeno za cold i warm.

HEVC zadržava 1080×1920 / 1920×1080 i 481 kadar; SSIM prema produkcijskom masteru 0,986533 / 0,983539 (prag ≥0,98). Komprimirani fragmenti 13.512.036 B / 20.269.040 B. AVC fragmenti 19.812.347 B / 24.532.435 B, pikselno identični prethodnom HD izvozu. Početni 2 MB i puni 26 MB cilj i dalje se provjeravaju odvojeno. Stari 5 MB cilj nije vraćen kao navodni prolaz. Nema nove AI produkcije ni troška kredita. Testovi i status objave nalaze se na vrhu QA.md; stare brojke niže su povijesne.

# Ispravak kvalitete slike — 20.9.2026.

Korisnik je nakon objave odbacio kvalitetu prikaza. Usporedba istih izvornih i web kadrova pokazala je jak gubitak zakovica, bridova i teksture kroz 720p kodiranje ograničeno na 1,5–1,7 Mb/s. Nije pokrenuto novo plaćeno generiranje. Izvoz sada čuva nativnih 1920×1080 i 1080×1920 piksela: H.264 CRF20, GOP24, B2. Obje kompozicije imaju 20 samostalnih dijelova po jednu sekundu (zadnji 25 kadrova), jedan dekoder i canvas.

Odluka implementacije, javno objašnjena korisniku: nakon njegova odbijanja kvalitete, prednost ima očuvanje detalja. Potpuni mediji sada imaju približno 20 MB za portret i 25 MB za desktop. **Prethodni ukupni cilj 5 MB više ne prolazi i nije prikazan kao prolaz.** Početni cilj 2 MB ostaje zasebno mjeren; susjedni dio priprema se tek kada korisnik počne skrolati. Granica zaštite od ponovljenih preuzimanja za ovu HD izvedbu je 26 MB po orijentaciji. Ovo nije korisnikova zasebna potvrda brojke 26 MB, nego transparentno dokumentirana tehnička odluka unutar odobrenog ispravka kvalitete.

Izvornici i filmska režija ostaju isti. Bolji izvoz ispravlja gubitak detalja; ne predstavlja novo jamstvo fizičkog realizma AI gradnje. Stara štedljiva izvedba sačuvana je izvan public direktorija. Ranija mjerenja niže pripadaju toj izvedbi i više nisu aktualne brojke HD runtimea.

# Integracija pune fotografske priče — 20.9.2026.

| Cjelina | Ovisnost | Način | Stanje |
| --- | --- | --- | --- |
| W1 Puni desktop film, 4,5H skrol i šest poruka | Odobreni desktop master | AFK | Implementirano; oba enginea i neovisno dekodirani pikseli prolaze |
| W2 Posebna 9:16 kamera, isti napredak pri rotaciji | W1 i generirani portret | AFK | Dovršeno; 1080×1920 master i 720×1280 web izvedenica |
| W3 Hladno/toplo učitavanje, memorijski inventar, fallback i sadržaj | W1/W2 | AFK | Prolazi funkcionalno; izmjerena hladna kašnjenja navedena u QA.md |
| W4 Odvojeni javni web preview i provjera objavljenog URL-a | W3 | AFK | Objavljeno: https://mossy-nutmeg-r9v6.here.now/ ; 35 javnih browser provjera prolazi; CDP-specifična provjera preskočena u WebKitu |

Format dostave: H.264/yuv420p, 24 fps, GOP4, bez B-kadrova i zvuka, faststart. Desktop 1280×720 uz ciljanih 1700 kb/s. Jedan skriveni video služi dekodiranju, canvas prihvaća samo najnoviji traženi kadar nakon završenog seeka. Kod novog dijela čeka loadeddata prije seeka (WebKit inače povremeno odgađa seeked oko jedne sekunde); nakon seeked crta odmah bez dodatnog animation framea. Nema interpolacije, autonomnog play() ili reda zaostalih skrol gesti. Svaka kompozicija ima deset približno dvosekundnih MP4 dijelova, razdvojenih bez ponovnog kodiranja. Potreban dio dohvaća se jednom kao Blob; priprema se jedan susjedni dio. Cache ima najviše dvadeset poznatih URL-ova, jedan aktivan object URL i jedan dekoder. Pri promjeni dijela ili disposeu object URL se opoziva. Hladni javni test reproducirao je 10.572.855 B s monolitnim videom zbog preklopljenih native Range zahtjeva; segmentirani cache uklanja to ponavljanje. Limit 5 MB ostaje nepromijenjen; preciznost potvrđuju usporedbe stvarnih piksela s ffmpeg dekodom. Mjeri se canvas draw submission, ne fizički panel telefona.

Izravni poslovni fragmenti najprije se poravnaju nakon promjene visine filmskog dijela. Dekoder se stvara tek pri ulasku filmske sekcije u viewport. Rotacija drži prethodni canvas dok nova kompozicija istog napretka nije dekodirana. Sadržaj/forma/PDF ostaju postojeći.

# Odobreni nastavak: puna Blender referenca — 20.9.2026.

Korisnik je nakon pregleda prihvatio izgled i zatražio cijelu priču u Blenderu za kasniju Higgsfield referencu. Time je lokalna faza P5 odobrena; ne pretpostavlja se fizički uređajski test niti odobrenje AI troška ili objave.

- Jedna 20-sekundna koreografija, 480 uzoraka po kameri, 24 fps. Izvorni pilot ostaje sačuvan.
- `story_timeline.py` određuje redoslijed zatvaranja oplate, skrivene vremenske elipse betona, odmicanja i krute montaže. Kamera ima kontinuirane tangente pri povlačenju/podizanju.
- `build_story.py` izrađuje armaturu, dvodijelnu oplatu, točno trasirane plohe, skriveni potporni sklop, tračnice/dizalice, pumpu i radnu okolinu. Sve je lokalna autorska geometrija.
- Cycles kontrolni kadrovi služe provjeri izgleda; puni referentni film koristi Eevee s ray tracingom, 32 samples, 960×540 i 540×960. Oba enginea dijele isti master i geometriju. Razlika sjenčanja nije skrivena kao isti pikselni izlaz.
- `render_story.py` zahtijeva isti hash mastera i postavke pri nastavljanju rendera. `package_story.py` provjerava svih 480 PNG-ova, broj kodiranih kadrova i trajanje; zatim izrađuje MP4, pet preklopljenih segmenata po orijentaciji, šest stvarnih graničnih PNG/WebP kadrova, putanje i ZIP.
- Referentni pregled i izvori su u `deliverables/adduco-story`, izvan javnog web payload-a. Lokalni viewer na 5276; postojeća skrol proba na 5275.
- Sljedeća moguća faza: preflight tada dostupnog Higgsfield modela i cijene za jedan segment. Trenutačno nema uploada, joba ni potrošnje kredita. Puna AI produkcija nije pokrenuta.

# Procjena i plan probe — 20. rujna 2026.

## Status
Druga isporuka: odobrena lokalna šestsekundna proba i novi scroll engine; rezultati i ograničenja opisani su u QA.md. Worktree: `/Users/mato/Documents/ChatGPT/Adduco 3D v2/adduco`, grana `codex/monumental-scroll`, početni commit `b263a1eda0627b9b3abc64ca087968fbbd26b680`. Izvorni projekt ostaje na main. Postojeća stranica pregledana je u pregledniku. Nijedno ranije odobrenje objave ne vrijedi za ovu verziju.

Nisu pronađeni projektni CONTEXT.md ni docs/adr. Pročitani su projektni AGENTS, PRD, DESIGN, CONTENT-SOURCES, IMPLEMENTATION, relevantni aktualni i povijesni QA zapisi te App, BusinessContent, SceneJourney, sceneGestures, scenes i paketni manifest. Vizualna razrada postoji samo u DESIGN.md.

## Procjena postojećeg projekta

| Zadržati | Razlog / mjesto |
| --- | --- |
| React 19.3 / TypeScript 6 / Vite 8.3 i postojeći lockfile | Nema dokaza za migraciju frameworka; SSR osnovnog sadržaja već postoji. Brojke su deklarirani rasponi iz package.json. |
| Originalni PNG i vjerne header izvedenice, Manrope, paleta, navigacija i mobilni izbornik | Prepoznatljivost i dostupnost poslovnih radnji. |
| BusinessContent, InquiryForm, PDF, provjereni izvori | Sačuvati portfolio kao tekst potkrijepljen izvorima; upit je nacrt emaila, ne poslana poruka. |
| Testna infrastruktura i korisne provjere pristupačnosti, grešaka medija, fragmenata, rotacije | Novi engine treba isti dokaz dostupnosti; stare testove zaključavanja gesti zamijeniti novim ponašanjem. |
| Izvorni masteri i scripts/cinema.json | Povijest produkcije i referenca atmosfere. Postojeći gotovi znak nije točan geometrijski master. |

Zamijeniti SceneJourney/sceneGestures i preload raspored koji podrazumijeva šest forward/reverse filmova. Novi renderer može ostati izoliran iza postojeće poslovne ljuske. Ne vraćati povijesni Jutsu/WebGL kod. Novo modeliranje nije isto što i povratak starog enginea.

Aktualni prizor na desktopu i 390×844 ima uvjerljivu tamnu atmosferu, mokre površine i čitljiv kontakt. Međutim, cijeli znak vidi se odmah i prikazan je obješen; traženi novi luk počinje neprepoznatljivim detaljem i završava oslonjenim simbolom. Kod eksplicitno koristi preventDefault i isBusy za gutanje ulaza tijekom filma. To izravno proturječi novom ugovoru.

Povijesni dokazi, ne nova mjerenja: QA od 18.9. bilježi približno 4,095 MB portrait / 4,693 MB landscape ukupnog prijenosa trenutne stranice; jedan hladni portretni uzorak sliku je prikazao tek na 2,216 s. QA od 16.9. bilježi 45,63 MB za 577 mobilnih WebP kadrova, 17 bitmapa (~63 MiB sirovih piksela prije overheada) i do 26,52 kadra zaostatka u jednom WebKit testu. Zato „sekvenca je uvijek glatka” i „video je uvijek štedljiv” nisu prihvatljivi zaključci.

## Preporuka: izrada kadrova odvojena od prikaza

**Preporučujem novi lokalni Blender/Cycles master sa zaključanom geometrijom loga i jednu šestsekundnu probu u dvije kamere.** Jedan objekt, armatura, oplata, betonska jezgra i obloga dijele koordinate i eksplicitne nosače. Materijali dobivaju stvarnu geometrijsku debljinu, hrapavost, spojeve i kontroliranu rasvjetu. Cycles može proizvesti fizički utemeljeno osvjetljenje i refleksije, ali realizam ostaje predmet vizualnog odobrenja.

Blender i ffmpeg već su lokalno dostupni; Computer/browser alati dostupni su za pregled. Higgsfield MCP i CLI također postoje, uključujući katalog, read-only procjene troška i alate 3D Jutsu. Ne koristiti postojeći udaljeni 3D projekt kao zamjenu za novi master niti pokretati udaljeno renderiranje bez jasnog troška. Za nove lokalne Blender mastere predlaže se lokalno kodiranje; naslijeđeni Higgsfield mediji ostaju neizmijenjeni. Nema uploadanja u ovoj fazi.

**Prvi kandidat prikaza u probi je ograničena sekvenca kadrova**, jer bira poznati kadar u oba smjera bez video seek reda. To je hipoteza za probu, ne produkcijski izbor: povijesna sekvenca je bila prevelika i imala zaostatak. Istih 144 kadra po orijentaciji usporediti s kratko-GOP H.264 prije izbora. Video se ne preporučuje za konačnu verziju dok traženje i stvarno predstavljanje kadra ne prođu ciljne uređaje. Ako nijedan format ne zadovolji odziv i postojeći prijenosni budžet, zaustaviti širenje i odlučiti o kompromisu, ne tiho povećati budžet.

| Pristup | Realizam i stabilnost | Brzi obrat skrola | Hladno učitavanje | Mobitel / memorija | Produkcija i održavanje |
| --- | --- | --- | --- | --- | --- |
| Unaprijed renderirani video | Vrlo visok uz isti deterministički master; format sam ne jamči točnu geometriju AI videa. | Best-effort seek, ovisi o GOP-u, dekoderu i dostavi; rVFC + slika moraju potvrditi kadar. | Najizgledniji kandidat za manji prijenos; početni poster i mali segment. Provjeriti HTTP Range, ne pretpostaviti. | Hardverski decoder može pomoći, ali kratki GOP/all-intra povećavaju bytes, više elemenata zadržava buffere. | Dobra kompresija i jednostavniji asseti; promjena scene traži rerender. Bez zasebnih reverse filmova. |
| Unaprijed renderirane slike | Isti realizam i ista geometrija kao video master; svaki indeks je poznat. | Prednost za pripremljene kadrove i skokove; mreža/decode i dalje mogu kasniti. | Više zahtjeva i bytes; male skupine i poster, ne download cijele priče. | Strogo ograničen bitmap cache i eksplicitno zatvaranje; canvas/GPU kopije nisu uključene u sirovi račun. | Kontrola kadra, ali više datoteka, prioriteta i cache logike. Povijesnih 45,63 MB ne ponavljati bez odobrenja. |
| Stvarni WebGL/3D | Stabilna modelirana geometrija. Realizam zahtijeva kvalitetne modele, PBR materijale, baked svjetlo, sjene i uvjerljive mokre refleksije. | Izravan pristup vremenskoj osi bez seeka, samo dok GPU ispunjava frame budget. | Modeli/teksture/shaderi i kompilacija prije punog prikaza. | GPU memorija, termalno usporavanje i gubitak konteksta; path tracing na telefonu nije pretpostavka. | Najviše tehničkog rada i optimizacije; iskustvo starog low-detail pokušaja ne dokazuje da će nova izvedba doseći cilj. Ne preporučuje se kao početni produkcijski put. |

Sva tri renderer modela koriste prirodan skrol dokumenta; bez wheel/touch zaključavanja. Za frames: indeks = round(p × (N−1)), gdje je p normaliziran položaj pozornice. Samo najnoviji cilj smije biti predstavljen; zastarjeli async rezultat odbaciti. Pri promašaju zadržati zadnji valjan kadar i tražiti najnoviji, bez odigravanja reda propuštenih stanja. Dekodersko kašnjenje prijaviti kao kašnjenje, ne sakriti ga easingom.

Početni bitmap kandidat: 9 zadržanih + 2 aktivna dekodiranja. Na 720×1280 to je najviše ~38,7 MiB sirovih RGBA piksela; dvije dodatne canvas/GPU kopije dodaju ~7 MiB. To **nije izmjerena ukupna memorija procesa**. Za desktop 1920×1080 isti broj je ~87 MiB prije kopija; broj kadrova ograničiti bajtovima, ne jednim fiksnim brojem za sve rezolucije. Na rotaciji kratko preklapanje dodatno povećava vrh.

## Probna scena i postupak

1. Trasirati izvorni logo, usporediti siluetu i svaki panel u frontalnom preklopu; modelirati novu jezgru/oblogu, oslonce i samo okolinu vidljivu u probi. Ne generirati zamjenski znak.
2. Složiti radnju iz DESIGN.md: panel oplate odlazi, otkriva se beton, dizalica dovodi crvenu ploču na nosače dok se kamera povlači/podiže. Jedan master, odvojeni desktop i portrait pogled.
3. Najprije 3 lokalna kontrolna rendera po kameri; provjera geometrije, montaže, materijala i čitljivosti. Ako to ne prolazi, ne renderirati animaciju. Zatim 6 s × 24 fps = 144 kadra po kameri (288 ukupno). Vremenska os završava na zadnjem uzorku; ne dodavati neplanirani interpolirani završetak.
4. Iz istih mastera napraviti WebP sekvencu i H.264 kandidate GOP 1/4/8. Namjena je usporedba, ne unaprijed izabrati najveću ili najmanju datoteku. Izmjeriti rubove armature, šum/refleksije, bytes i odziv.
5. TDD vertikalna cjelina: prirodan skrol + prvi kandidat + postojeći sadržaj/kontakt; crveni test za obrat i mirovanje, potom engine. Sljedeća cjelina: cold/decode greške, ograničenja cachea, rotacija i reducirano kretanje.
6. Lokalni produkcijski preview i QA protokol ispod. Telefon mora imati pristup lokalnom previewu; mobilna emulacija nije telefon. Otvaranje lokalnog LAN previewa ne podrazumijeva javni tunel ili objavu.
7. Prikazati korisniku oba kadriranja i izvještaj te stati. Nema pune animacije prije korisnikove procjene na telefonu.

## Aktualni trošak, provjeren 20.9.2026.

**Preporučena lokalna proba:** Blender je besplatan/open-source i već instaliran. Dodatni računi za generiranje/render servis: **0 € / 0 Higgsfield kredita**, ako se koristi lokalna oprema i vlastiti proceduralni materijali. To ne znači da su rad, električna energija ili postojeća Codex pretplata besplatni. Nema kupnje asseta ili cloud GPU-a u predloženom opsegu.

Planerska procjena rada (nije ponuda ni jamstvo trajanja): 6–10 h geometrija/oslonci, 6–12 h materijali/rasvjeta/kamera, 4–8 h kontrolni renderi i korekcije, 6–10 h implementacija/QA: ukupno **22–40 h**, plus pasivno renderiranje. Satnica nije zadana pa ne izmišljamo novčanu cijenu rada. Ako uzorak pokaže 45–120 s po finalnom kadru, 288 kadrova znači 3,6–9,6 h renderiranja; s jednom punom ponovnom izvedbom 7,2–19,2 h. Ovo je scenarij računanja, ne benchmark ovog Maca; mjeriti prvi reprezentativni kadar prije prognoze. Nakon dvije vizualne iteracije bez dovoljne kvalitete stati i preispitati postupak.

**Alternativna AI proba, samo uz zasebno odobrenje kredita:** Higgsfield katalog upravo potvrđuje GPT Image 2.5 Flare (`quality=high`, `resolution=4k`) i Seedance 2.5 (`mode=omni_reference`, `duration=6`, `resolution=1080p`, `generate_audio=false`, `bitrate_mode=high`). Dostupne su obje orijentacije i start/end/reference uloge. To je podrška ulazima, ne jamstvo točne geometrije između njih.

| Stavka | Jedinična read-only procjena | Broj | Ukupno |
| --- | ---: | ---: | ---: |
| Početni i završni ključni kadar, dvije orijentacije | 4,5 kredita | 4 | 18 |
| Jedna scena, dva kadriranja | 72 kredita | 2 | 144 |
| Osnovna AI proba | | | **162 kredita** |
| Rezerva: ponoviti sve četiri slike i oba videa jednom | | | **162 kredita** |
| Strogi maksimalni plan AI probe | | | **324 kredita** |

Provjereno stanje računa: 1.064 kredita, plan Max; unlimited nije dostupan. AI proba s rezervom potrošila bi oko 30,5% sadašnjeg stanja. **Potrošnja ove isporuke: 0 kredita.** Brojke su svježi odgovori estimate_image_cost / estimate_video_cost, odvojeno provjereni za 16:9 i 9:16, ne stari cjenik iz skilla. Bez ulaznih medija ovo je preflight parametara; procjenu ponoviti s konačnim referencama prije odobrene prijave i ne prekoračiti cap.

[Higgsfield cjenik](https://higgsfield.ai/mcp-pricing) u dohvaćenom javnom tekstu ne prikazuje pouzdan EUR/USD iznos paketa. Stoga kredite ne pretvaramo u izmišljeni novčani iznos niti tražimo novu pretplatu. [Higgsfield MCP/API objašnjenje](https://higgsfield.ai/creator-hub/help-center/integrations/what-is-the-higgsfield-api) razlikuje potrošnju postojećih plan kredita od zasebne API naplate. Obrada/upscale i cloud render nisu uključeni ni odobreni.

AI put je brži kandidat za atmosferu, ali ima veći rizik deformacije loga i „čarobne” montaže. Za zadani zahtjev preporuka ostaje deterministički lokalni master. Ako se odabere AI, odbaciti probu čim oblik/spojevi variraju; ne potrošiti rezervu automatski na puni film.

## Slijed odluka (bez otvaranja udaljenih issuea)

| Cjelina | Ovisnost | Vrsta | Status |
| --- | --- | --- | --- |
| P0 procjena, storyboard, tehnički/troškovni plan | — | AFK | Dokumentirano u ovoj isporuci |
| P1 odobrenje postupka i jedne probe | P0 | HITL | Odobreno 20.9.2026.; lokalno, 0 € vanjske potrošnje |
| P2 model, kontrolni renderi, jedna probna scena u dva kadriranja | P1 | AFK | Lokalna tehnička proba; vizualni prihvat nije postignut |
| P3 TDD skrol prikaz, usporedba formata, desktop/mobile QA i lokalni preview | P2 | AFK | Lokalni lab; fizički telefon ostaje neprovjeren |
| P4 procjena izgleda i osjećaja na fizičkom telefonu | P3 | HITL | Blokira svu punu produkciju |
| P5 proizvodnja ostalih faza i integracija cijele priče | P4 | AFK | Izvan sadašnjeg odobrenja |
| P6 završna validacija i posebna odluka o objavi | P5 | HITL | Nema odobrenja za objavu/push/PR |

Tehnički izvori: [Blender rendering](https://www.blender.org/features/rendering/), [Blender features/licenca](https://www.blender.org/features/), [MDN requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback). rVFC izvještava o kadru poslanom compositoru i može kasniti jedan v-sync; nije neovisan dokaz fizičkog prikaza na panelu telefona.

## Povijesna implementacija referentne verzije

---

# Vertical implementation slices

## Native preparation — 18 September 2026

- NP1 — implemented and focused browser tests pass: retain the six native video elements; after the first canplaythrough, fully buffer one movie at a time in the approved order. Reuse those elements for playback. No fetch/preload bridge or media changes.
- NP2 — verified: matching HTML preload and picture selection in both orientations and engines; only the correct opening image is requested. Reversing measurement order moves the slow first response to landscape as well. The prior portrait timing difference is not an orientation-selection failure; response latency before frontend execution remains separately reported.
- NP3 — verified: all134 applicable browser cases pass across the full run and updated-expectation rerun; four expected skips. Typecheck/lint/unit/build pass. Public Chrome and WebKit each receive exactly3,407,812 portrait /3,792,329 landscape MP4 payload bytes, with no playback/replay requests. Complete public transfers stay under5MB. Gate 1 gestures, early captions, still fallbacks and navigation are preserved.
- NP4 — published and measured: public Sites version21, source3ff139cef9ae6451214734a781ddf06f8376e03c. Live4G later starts≤14.3ms; first-ready≤2.5s in all six samples. Opening paint median700ms portrait /752ms landscape, but one portrait sample is2,216ms after a1,724ms initial HTML response. The≤1s opening target is not consistently met; this delivery limitation and slower Fast3G waits remain explicit in QA.md. The optional tempo experiment and Batch 2 remain outside this pass.

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
