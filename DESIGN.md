# Završna dorada korištenja — 21.9.2026.

Zadržava se odabrani smjer A, film, kompozicija, paleta i Manrope. Referenca za dorade je postojeći pregled: kontakt i poslovni sadržaj moraju ostati izravno dostupni, bez čekanja animacije. Nema širokog redizajna ili novog koncepta.

Interna navigacija prenosi fokus na odabranu semantički imenovanu sekciju; ne dodaje sekcije u redoslijed Tab tipke. Mobilni izbornik zatvara se pri izlasku fokusa iz zaglavlja, a na niskim ekranima ima ograničenu visinu i vlastiti skrol. Ispod 360 px logo u zaglavlju ima širinu 96 px i razmak kontrola 8 px, kako bi cijeli gumb izbornika i kontakt ostali vidljivi uz dodirne mete ≥44 px. Nacrt upita dobiva dvije jasne radnje, otvaranje e-pošte i kopiranje teksta, s dodirnim metama ≥44 px. Zabrana kopiranja otvara označivo polje za ručni prijenos. Pomoćni tekst obrasca najmanje 13 px, nacrt 14 px, oznake 12 px. Vidljivi fokus i reduced motion ostaju obvezni.

# Optimizacija prikaza odobrenog smjera — 20.9.2026.

Bez nove vizualne koncepcije ili promjene layouta. Zadržani su puni HD, posebno portretno kadriranje, isti filmski sadržaj, natpisi i 4,5H prirodnog skrola. Promijenjena je priprema/dekodiranje filma kako se izvor ne bi ponovno otvarao na svakom prijelazu. HEVC izvedenica odabire se samo uz podršku preglednika i provjerenu vjernost masteru; H.264 ostaje alternativni format. Tehničke provjere i preostala ograničenja hladne veze vode se u QA.md.

# Korekcija kvalitete prihvaćenog smjera — 20.9.2026.

Nema nove vizualne koncepcije. Nakon korisnikova odbijanja mutne objavljene slike, prioritet je očuvanje izvornih zakovica, rubova, skela i mokrog tla. Nativni 1080p film i početni poster zamjenjuju prekomprimirani 720p izvoz. Layout, kadriranje, skrol i poslovni sadržaj ostaju isti. Puna usporedba kompresije i transparentna razlika prometa dokumentiraju se u QA.md.

# Aktivna web integracija — fotografska priča 20.9.2026.

Zadržana odabrana razrada A, originalni logo, Manrope, paleta i poslovni raspored. Izvorne Blender snimke služe produkcijskoj referenci; finalna fotografija dolazi iz odobrenog Seedance 2.5 filma s dodatnom opremom i materijalima. Posebna 9:16 kamera prikazuje cijeli znak, vrh i stopala, s mirnim donjim područjem za poruke. Nije centralni izrez desktop filma.

Aktivna putanja je 450vh uz jednu sticky visinu, ukupno 550vh. H1 i početni nadnaslov postupno nestaju kroz prvu četvrtinu priče, da ne prekrivaju otkrivenu konstrukciju. Šest poruka iz storyboarda prati stvarno nacrtani kadar; skip i kontakt stalno su dostupni. Donji gradient osigurava čitljivost bez zatamnjivanja cijelog dovršenog znaka. U reduced-motion/Data Saver prikazu nema produžene skrol putanje. Na niskom vodoravnom ekranu (npr. 844×390) cijela kompozicija stane ispod zaglavlja kroz contain, kako vrh znaka ne bi bio odrezan.

Ovaj dodatak zamjenjuje ograničenje na šestsekundnu probu niže. Ne stvara se druga dizajnerska specifikacija.

# Nastavak odobren nakon pregleda — 20.9.2026.

Korisnik prihvaća izgled lokalne probe i traži nastavak cijele priče u Blenderu, s namjerom kasnije uporabe kao Higgsfield reference. Ta nova odluka zamjenjuje raniju zabranu širenja iz zapisa probe. Zadržavamo storyboard ispod, jedan geometrijski master i dvije kamere. Cilj ove faze je puna 20-sekundna deterministička referenca, ne plaćena AI obrada. Pilot i njegov web prikaz ostaju sačuvani. Izvoz: editabilni pakirani Blender masteri, oba MP4 filma bez teksta, vremenski označeni ključni kadrovi i reference po fazama.

# Adduco — simbol koji nastaje

Jedini vizualni ugovor odvojene verzije, 20. rujna 2026. Korisnikov smjer je dogovoren; konkretan storyboard i razrada A ispod **odobreni su za jednu lokalnu probu**, ne gotova produkcija. Prethodni ugovor sačuvan je u izvornom projektu i Git reviziji b263a1e, bez konkurentskog dizajnerskog dokumenta u ovoj verziji.

## Osnova i vizualni jezik

Publika: privatni i poslovni investitori. Glavni poziv: „Razgovarajmo o vašem projektu”. Zadržati originalni PNG `adduco logo/adduco logo.png`, vjerne postojeće header izvedenice i samostalno hostani Manrope. Fotografije projekata nisu dostavljene; generirani prizori nikad nisu portfolio.

Zadržati svijet #111E2B, površinu #171B21, tekst #F3F5F8, sekundarni #C4CFDE, crvenu akciju #E41122 i hover #9D0512. Boje ploha znaka uzimati iz originala, s postojećim približnim uzorcima #830108, #9D0512, #C70817, #E70104–#ED0F19; to nisu službene tiskarske specifikacije. Mokar beton neutralan, metal crven, nebo hladno, radna rasvjeta topla. Materijali moraju ostati vidljivi u sjeni, refleksije neravne i lokalne.

Manrope 800 za kratke naslove; čitljivi tekst 16–18 px, 48–65 znakova u retku. Razmaci 8/12/16/24/32/48/64/96/128 px; rubovi desktop 56–72, tablet 32, mobitel 20 px. Kvadratne kontrole, tanke neutralne linije, čvrsta crvena akcija, vidljiv fokus i dodirne mete ≥44 px. Kratke HTML poruke odvojene od kadrova; bez ucrtanih slova u renderu.

## Dokazi i reference

- Originalni logo: vanjski trokutasti sklop s razlikama crvenih ploha, bijelim razdjelnicama i zasebnim donjim unutarnjim trokutom. Sačuvati siluetu, omjere, negativni prostor i raspored ploha. Prvo vektorski trasirati PNG i provjeriti preklopom, zatim istu geometriju koristiti u svim fazama.
- [Aktualna stranica](https://adduco-crveni-monolit.mglavinic.chatgpt.site/): dobar kontrast identiteta, mokri materijali, kratke poruke, trajni kontakt i odvojena portretna kompozicija. Otvaranje već otkriva cijeli viseći znak; nova dramaturgija čuva cjelinu za kraj. Ne preuzimati stari približni oblik skulpture ni lebdeći unutarnji dio.
- Postojeći BusinessContent i CONTENT-SOURCES: jasan put do usluga, pripreme/PDF-a, izvora projekata i upita. Sačuvati informacijski redoslijed, ne širiti poslovne tvrdnje.
- [Blender Cycles](https://www.blender.org/features/rendering/): fizičko svjetlo i refleksije kao proizvodni princip. Sam izbor renderera nije dokaz realizma; to mora pokazati proba.

## Tri razrade dogovorenog smjera

Sve imaju istu paletu, logo, gradnju, izravni skrol i završno otkrivanje. Ne otvaraju novu kreativnu temu.

| Razrada | Kompozicija i hijerarhija | Kamera i materijali | Mobitel / rizik |
| --- | --- | --- | --- |
| A — Materijal postaje znak, preporuka | Detalj vodi priču; jedna kratka poruka uz mirni dio prizora, znak se postupno otkriva. Manrope, malo UI elemenata. | Nizak početak, postupno povlačenje i podizanje. Toplo bočno svjetlo razdvaja armaturu, beton i oblogu. | Detalj kroz sredinu, rast prema vrhu, završni znak iznad teksta. Najbolji dokaz transformacije, traži kvalitetne bliske materijale. |
| B — Gradilište u presjeku | Više dubine, prostorno razdvojeni radni zahvati i sitne oznake faza umjesto velikih naslova. | Početak u detalju ruba, povlačenje uz blagi bočni luk koji otkriva oplatu i radnu platformu. | Manje horizontalne paratakse; veći rizik zaklanjanja znaka strojevima i pretjerane gustoće. |
| C — Mjerilo čovjeka | Detalj alata, potom radnik/platforma uspostavljaju veličinu; najviše praznog prostora i veći završni naslov. | Sporiji početak i naglašenije podizanje u zadnjoj trećini; naglasak na vertikali. | Vrlo čitljivo u portretu, ali realistični ljudi i radnje poskupljuju produkciju i mogu odvući pažnju od materijala. |

Predlaže se A, bez izrade tri skupe varijante. Nema nasumičnih čestica, pretjeranog odsjaja, ukrasne magle ni stalnog pomicanja kad korisnik miruje.

## Prostor, konstrukcija i vremensko sažimanje

Jedan monumentalni znak na zajedničkoj temeljnoj platformi. Za početni previz predložena visina 12 m, dubina jezgre oko 1 m; to je konceptualno mjerilo, ne statički projekt ili tvrdnja o izvedenom objektu. Noge i unutarnji trokut imaju vlastiti oslonac na temelj, vrh i kose zone privremeno su poduprti dok konstrukcija nije samonosiva. Skrivena stražnja sekundarna čelična konstrukcija po potrebi nosi oblogu bez promjene prednje siluete.

Oplata ima panele, spone, vijke i podupirače. Armatura ima rebra, vezice i razmake, beton stvarnu debljinu, radne spojeve i tragove oplate. Metalne trokutaste plohe imaju debljinu i skriveno sidrenje; svijetle razdjelnice originala tumače se uskim svijetlim spojnicama, ne svjetlećim LED crtama. Konačni položaji ploha ne mijenjaju se između faza.

Vremenski sažetak radi se kroz **montažne elipse iza stvarnog zaklanjanja**: panel oplate ili podignuta ploča prolazi ispred lokalnog zahvata; iza nje prikazuje se kasnije stanje istog elementa. Curing betona se preskače elipsom, ne prikazuje kao trenutno fizičko stvrdnjavanje. Ostali vidljivi elementi ostaju u istim koordinatama; kamera nastavlja istom putanjom. Vidljiva montaža crvene plohe odvija se krutom translacijom/rotacijom, nikad rastezanjem ili pretapanjem materijala. Svaka skrivena promjena provjerava se i u obrnutom smjeru.

Betonska pumpa s crijevom pojavljuje se samo uz betoniranje; dizalica na osloncima nosi ploču s jasnim prihvatom i zategnutim užetom; platforma služi montaži spoja. Nema dekorativnog bagera ili stroja bez zadaće. Na kraju sva podignuta oprema miruje ili je odmaknuta, a znak stoji na temeljima.

## Storyboard — cijela priča, ne odobrenje pune produkcije

Napredak je položaj u 4,5 visine ekrana **aktivnog skrola**. Sticky pozornica uzima još jednu visinu za vlastiti prikaz: približno 550svh omotača daje 450svh putanje, ne 550svh animacije. Za telefon koristiti stabilnu početnu visinu i ne mijenjati putanju na svako sklapanje browser trake. Orijentacija dobiva novu kompoziciju pri istom normaliziranom napretku.

Jedna glatka putanja povlačenja i podizanja, bez prolaska kroz objekte. Predloženo 18–20 sekundi izvorne vremenske osi, ali posjetitelj određuje stvarno trajanje. Žarišnu duljinu držati približno 45–55 mm ekvivalenta za prirodnu perspektivu; razmak kamere stvara otkrivanje, ne rastezanje zuma. Točne vrijednosti provjeriti previzom.

| Napredak / skrol | Ključni kadar i gradnja | Kamera / desktop 16:9 | Mobilna kompozicija 9:16 | Kratka hrvatska poruka |
| --- | --- | --- | --- | --- |
| 0% / 0H | Rebrasta armatura, vezica i mokri rub oplate; vidi se detalj donje noge, cijeli znak još nije prepoznatljiv. | Visina ~0,8 m, kadar širok ~1,2 m; armatura desno, mirnija tamna zona lijevo. | Vertikalne šipke kroz srednju/višu zonu; tekst pri dnu bez prekrivanja spoja. | Sve počinje temeljem. |
| 20% / 0,9H | Širi kavez iste noge, sidrenje u temelju, poduprta oplata uz dio otvorene armature. | Povlačenje na kadar ~3 m; visina ~1,4 m. | U dubinu umjesto vodoravnog širenja; baza i gornji nastavak u istom kadru. | Snaga je u detalju. |
| 40% / 1,8H | Crijevo pumpe pri vrhu zatvorenog dijela; tragovi mokrog betona i spojevi oplate. Skrivena vremenska elipsa preskače sazrijevanje. | Kadar ~5 m; visina ~2,4 m; oplata lokalno zakloni buduće otkrivanje betona. | Pumpa sa strane, jasna veza crijeva i zahvata; bez prekrivanja naslovne zone. | Oblik dobiva čvrstoću. |
| 60% / 2,7H | Dizalica odmiče panel oplate, otkriva beton; vidljivi nosači prihvaćaju prvu crvenu trokutastu ploču. | Kadar ~8 m, visina ~4 m; povlačenje i rast paratakse potvrđuju dubinu. | Montažni spoj u gornjoj sredini, puna putanja ploče unutar kadra. | Preciznost u svakom spoju. |
| 82% / 3,69H | Crvena obloga zatvara preostala polja; svaki komad sjedne na nosače. Dijelovi cijelog A sada se povezuju. | Kadar ~14 m, visina ~6 m; reflektor otkriva debljinu rubova. | Kamera ranije odstupa da ne odsiječe noge; centar trokuta i vrh čitljivi. | Od konstrukcije do cjeline. |
| 100% / 4,5H | Cijeli gotov znak, oslonjene noge i unutarnji trokut, mokra podloga i prigušena refleksija. | Kadar ~22 m, visina ~8 m; završni gotovo frontalni blagi 3/4, znak desno, CTA lijevo. | Cijela silueta iznad donje tekstne zone; oba stopala, vrh i unutarnji trokut ostaju vidljivi. | Vaš projekt počinje razgovorom. |

Svaka poruka ima mirno čitljivo područje. Nema uvjeta „pričekaj završetak”. Caption se bira prema prikazanom kadru, ne samo ciljanom napretku. Fokusirana poveznica ne nestaje tijekom skrola. Glavni header, „Preskoči priču” i kontakt ostaju dostupni tijekom učitavanja.

## Reprezentativna proba za odobrenje

Jedna šestsekundna scena iz sredine priče (približno 40–70%): skidanje jednog poduprtog panela oplate → vidljiv beton i nosači → dolazak i fiksiranje jedne crvene plohe, uz istodobno povlačenje i podizanje kamere. U kadru ostaje dio armature susjednog nedovršenog polja kao kontrola kontinuiteta. Dva kadriranja iste radnje i istog modela, 16:9 i 9:16. Ne proizvoditi sve ostale faze.

Kontrolni trenuci probe: 0 s beton iza oplate; 1,5 s panel se odmiče na prihvatu; 3 s vidljiv beton/nosači, crvena ploča na zategnutom užetu; 4,5 s ploča sjeda na nosače; 6 s fiksirani spoj i širi pogled, kuka rasterećena tek nakon oslonca. To provjerava stvarnu montažu, ne crveni fade preko sivog materijala.

## Sadržaj, fallback i izlazi

Nakon scene slijede postojeći O nama, Usluge, Priprema/PDF, Projekti i Kontakt kao semantičke sekcije. Svi postojeći poslovni fragmenti ostaju dostupni bez animacije. Zadržati upit koji priprema email za korisnikov pregled; ne uvoditi webhook ni lažnu potvrdu slanja.

Reduced motion i Data Saver prikazuju odabrani statični kadar, kratko objašnjenje i poslovni sadržaj bez praznih 4,5 visina skrola. Neuspjelo učitavanje zadržava zadnji valjani kadar i dostupan izlaz; tekst ne smije opisivati nedosegnutu fazu. Bez JavaScripta dostupni su logo, mirni kadar, sadržaj i kontakt. Kod rotacije zadržati prethodnu sliku dok novo kadriranje istog napretka nije spremno; ne trepnuti na početni kadar.

## Zabilježeno nakon lokalne tehničke probe

Proba koristi jednu scenu u dvije kamere, 144 kadra / 24 fps, privremenu rezoluciju 960×540 i 540×960. Sekvenca zauzima 1,5 visine aktivnog skrola (2,5H omotača); ugovor pune priče ostaje 4,5H aktivnog skrola. Na mobitelu tekst je spušten na 96 px iznad dna kako bi središnji spoj ostao vidljiviji.

**Vizualni gate nije prihvaćen.** Render još djeluje kao jednostavan CG: okolini nedostaju uvjerljivi radni detalji i mjerilo, armatura u ovom srednjem kadru nije dovoljno čitljiva, a početna mobilna putanja djelomično izlazi iz kadra. Osvjetljenje i materijali traže umjetničku doradu. Postojeći deterministički master koristan je za stabilnu geometriju i koreografiju, ali povećanje rezolucije samo po sebi neće riješiti te nedostatke.

Prije širenja: korisnička procjena izgleda i skrola na telefonu, zatim dorada istih ključnih kadrova i spojeva (ne dodatnih faza priče). Izvorni logo je trasiran u 13 ploha; threshold-mask IoU 0,98138 nije dokaz strogog 1 px finalnog geometrijskog kriterija. Konačni frontalni pregled treba dovršiti prije prihvata pune scene. Nema odobrene promjene tog kriterija.

## Referentni izvoz pune priče

Dovršena vremenska os slijedi isti storyboard kroz 20 s / 480 kadrova. Pokret oplate je razdvojen: polovice najprije prilaze/odmiču se normalno od površine, zatim transportiraju paralelno s pročeljem. Beton se uključuje samo iza potpuno zatvorene oplate. Montaža svih završnih ploha počinje nakon odmicanja oplate. Prikaz je sažeta kinematička referenca, bez simulacije statike ili dinamike strojeva.

Finalne 13 plohe imaju iste svjetske koordinate kao trasirani predložak, bez skaliranja roditelja. Zasebna portretna kamera povlači se na 38 m, s približno 8% bočne margine cijelog znaka. Desktop završava s cijelim znakom desno i prostorom za budući tekst lijevo. Frontalni ortografski izvoz i maska dio su referenci za kontrolu AI promjena.

Jednostavan zasebni pregled filma koristi postojeću tamnu paletu, originalni logo i Manrope. To je trajni produkcijski artefakt za pregled i preuzimanje, ne alternativna naslovnica ni zamjena vizualnog ugovora. Filmovi nemaju UI/tekst ugrađen u piksele. Razlučivost i renderer jasno su označeni u paketu.
