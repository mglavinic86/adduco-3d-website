# Adduco — monumentalna priča pod skrolom

Aktivna verzija: `web/monumentalni-v2/adduco`, grana `codex/monumental-scroll`. Korisnik je 21.9.2026. odabrao nastavak na ovoj verziji i dao pozitivnu povratnu informaciju nakon pregleda na mobitelu. Stariji filmski i korporativni web ostaju odvojeni.

Sites adresa ovog izdanja: https://adduco-crveni-monolit.mglavinic.chatgpt.site/ — monumentalna verzija s doradama navigacije i upita od 21.9.2026., pripremljena za objavu 28.9.2026. Rezultati i granice provjere vode se u [QA.md](QA.md).

## Što je spremno

- Prirodni skrol upravlja gradnjom znaka: armatura → oplata/beton → crveni paneli → cijeli simbol. Jedna priča, posebno portretno i vodoravno kadriranje, originalni logo i Manrope.
- Poslovne sekcije, potkrijepljeni tekstualni projekti, izravni kontakt i PDF kontrolna lista dostupni su neovisno o animaciji.
- Interna navigacija prenosi fokus u odabranu sekciju. Mobilni izbornik podržava Escape, izlaz fokusa i skrol na niskim ekranima.
- Upit provjerava polja i priprema poruku za pregled. Posjetitelj otvara svoju aplikaciju za e-poštu ili kopira tekst; zabrana kopiranja nudi označivo polje. Stranica ne šalje niti pohranjuje upit i ne tvrdi da je poruka dostavljena.
- Reduced motion, Data Saver i no-JS ostavljaju sliku i poslovni sadržaj. Bez JavaScripta ostaju izravni e-mail, telefon i PDF, a interaktivni obrazac je skriven.

## Lokalni rad i provjera

```sh
npm ci
npm run dev -- --port 5278 --strictPort
npm test
npm run typecheck
npm run lint
npm run build
npm run preview -- --port 5277 --strictPort
npm run test:e2e
```

React/TypeScript/Vite; verzije i naredbe u `package.json` su mjerodavne. Build unaprijed ispisuje osnovni HTML u `dist/`. Browser testovi očekuju taj produkcijski pregled na 5277; `ADDUCO_BASE_URL` mijenja adresu. Testovi stvarnih kadrova zahtijevaju lokalni ffmpeg, Chrome i instalirani Playwright WebKit.

## Aktualni filmski prikaz

`SceneJourney.tsx` mapira 4,5 visina aktivnog skrola na 481 kadar; omotač zajedno sa sticky pozornicom zauzima 5,5 visina. Natpisi prate prikazani kadar. Nema autonomnog autoplayja ili reda gesti. Rotacija zadržava prethodni canvas dok odgovarajući kadar novog kadriranja nije spreman.

`ScrollFilm.ts` odabire `StreamFilm.ts` s jednim trajnim MediaSource/ManagedMediaSource dekoderom, ili `NativeScrollFilm.ts` za preglednike bez podrške. HEVC se bira samo ako je podržan; AVC je alternativa. HEVC ima kratke GOP12/GOP6 fragmente, a AVC postojeći HD izvoz bez ponovnog kodiranja. Najviše dva preuzimanja i prioritet aktualnog cilja; izbačeni buffer može se obnoviti iz ograničenog komprimiranog cachea.

Izvorni 1080p i fotografija ostaju očuvani. Medijski payload prema mjerenju od 20.9.: HEVC približno 13,5 MB portret / 20,3 MB vodoravno; AVC 19,8 / 24,5 MB. Početni cilj 2 MB i puni 26 MB vode se odvojeno. Stari ukupni 5 MB cilj nije ispunjen. QA.md sadrži uvjete, vjernost kompresije i granice tih mjerenja. Hladna veza može kratko zadržati sliku; desktop emulacija nije jamstvo rada svakog telefona.

## Materijali za dovršetak

Za svaki projekt dovoljno je poslati jednu mapu s izvornim fotografijama i kratkim opisom:

1. Naziv projekta, mjesto i što je točno radio Adduco.
2. Godina i status radova, ako su potvrđeni; naručitelj samo ako se smije javno navesti.
3. Nekoliko kvalitetnih fotografija: širi kadar, detalji i završeno stanje, ako postoje. Koristiti originalne datoteke kad god je moguće.
4. Potvrda prava na javnu objavu; navesti autora i eventualna ograničenja prikaza ljudi, registracija ili naručitelja.

Dodatno potvrditi javni e-mail, telefon, adresu i primatelja budućih upita. Trenutačni kontakti imaju zabilježene izvore u [CONTENT-SOURCES.md](CONTENT-SOURCES.md), ali konačna korisnička potvrda i dalje je otvorena. Službeni vektorski logo je koristan ako postoji; postojeći originalni logo ostaje u uporabi.

Fotografije i nove činjenice ulaze tek nakon potvrde. Konceptualni film ne zamjenjuje fotografije izvedenih projekata. Automatsko slanje, konačni pravni tekst i konačna domena traže zasebne ulaze/odobrenja. Prikaz pri dijeljenju već je pripremljen za preview; `noindex` i postojeći robots ostaju do odluke o lansiranju.

## Izvori i evidencija

- [DESIGN.md](DESIGN.md) — jedini vizualni ugovor.
- [PRD.md](PRD.md) — aktualni zahtjevi ispred povijesti.
- [IMPLEMENTATION.md](IMPLEMENTATION.md) — cjeline i tehničke odluke.
- [QA.md](QA.md) — testovi, mjerenja i ograničenja.
- [CONTENT-SOURCES.md](CONTENT-SOURCES.md) — izvori poslovnih podataka i medija.
- `deliverables/adduco-story/higgsfield/` — lokalni masteri i evidencija generiranja, izvan Gita.
- `deliverables/adduco-story/web-encodes/` — četiri referentna MP4 izvoza u Gitu, potrebna za ponovljive pixel testove.
- `assets-source/monument/` — editabilna Blender referenca.

Dodatna ponovljiva mjerenja, odvojeno od ostalih browser testova:

```sh
ADDUCO_BASE_URL=http://127.0.0.1:5277 node scripts/monument/continuous_scroll.mjs
ADDUCO_BASE_URL=http://127.0.0.1:5277 node scripts/monument/measure_full_transfer.mjs
```

Filmska građevina je konceptualna vizualizacija brenda, ne portfolio dokaz ili statički proračun.
