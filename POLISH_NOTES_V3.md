# POLISH NOTES v3 — threejs-fps-02 rev-3 ("YARD 7")

Polish visual putaran ke-3 (setelah v2, commit e338eec). Arahan sir: perbaiki
SEMUA agar terlihat bagus dan TIDAK BURIK — siluet gedung, map, SEMUA senjata,
tangan, peluru, efek tembakan, bot. Gameplay / HUD / ekonomi / bot / statistik
senjata TIDAK diubah (satu-satunya edit main.js: import + panggil dressV3, dan
puff asap kecil untuk pistol — murni visual).

## Yang berubah (file)

- `game/src/v3.js` (BARU, ~21 KB, `dressV3(scene)`, diimpor PALING AKHIR di
  main.js agar dossier yang hampir penuh memotong file ini duluan):
  - Lapis dekat: fasad hidup di atas 5 blok v2 (pita y 4,0 ke atas yang
    terlihat di atas tembok yard) — tekstur bata / beton / korugasi per gedung
    + grid jendela bervariasi (hangat menyala, dingin redup, gelap, tirai,
    gorden setengah tertutup, AC di bawah jendela) + noda, karat, retak.
    Parapet + atap bertingkat + props atap (tangki air, AC, ventilasi,
    cerobong, antena ujung merah) + 2 lampu dinding + halo.
  - 2 gedung baru di sayap (x +/-25, z -21,5) supaya lapis dekat tidak
    berhenti di x +/-20.
  - Lapis tengah: fasad redup + parapet + atap di atas 6 kotak skyline
    world.js (utara) + 4 kotak sisi (barat/timur) + 3 kotak selatan.
  - Lapis jauh: 8 siluet kota berkabut (z -44..-52) + jendela redup sedikit +
    2 suar merah; zona bulan (x 28..48) dijaga rendah (<=18) supaya bulan
    tetap bersih.
  - Hiasan dinding dalam yard: stensil "07" / "YARD 7" / "BAY 3", rambu
    NO TRESPASSING / HARD HAT AREA / BAY 3, poster SCRAP / YARD 7, pipa
    conduit tegak, strip hazard — menutup dinding polos (termasuk dinding
    tan di shot end).
- `game/src/hands.js` (BARU, ~4,2 KB, `attachHands(grp, def)`): tangan
  bersarung tangan untuk SEMUA viewmodel — tangan kanan di gagang picu
  (telapak + 4 jari melingkar + ibu jari + pelat knuckle + pergelangan +
  lengan), tangan kiri di handguard (rifle/DMR), foregrip tegak (SMG), pump
  (shotgun), atau penopang dua tangan (P9). Lengan pendek + gelap, masuk
  dari tepi bawah layar seperti FPS biasa.
- `game/src/guns.js` (+26 baris): detail per senjata — P9: picu, hammer,
  ejection port, front strap; SMG: charging handle, side rail, jendela mag
  kuningan; VK-47: charging handle, ejection port + selongsong kuningan,
  lubang ventilasi handguard; Scrap-12: side saddle 4 selongsong merah,
  heat shield, bibir kuningan di loading port; DMR: turret scope, reticle
  di depan lensa, bolt handle + knob, ujung peluru di mag. + panggil
  attachHands di akhir buildGun.
- `game/src/figures.js` (+22 baris): balaclava, strip helm warna tim, sabuk
  + kantong, sepatu bot, kantong + bedroll ransel, radio bahu + antena,
  tangan bersarung di senapan bot.
- `game/src/marks.js` (+10 baris): tekstur lubang peluru kini punya 6 garis
  retak radial + cincin terkelupas supaya terbaca sekilas.
- `game/src/main.js` (+4 baris): import + panggil dressV3 setelah dressV2;
  puff asap kecil untuk pistol saat menembak (sebelumnya hanya 4 senjata
  lain yang punya puff).

## Koreksi lengan (iterasi di dalam v3)

Percobaan pertama: lengan terlalu panjang (0,24-0,26 m) + terlalu terang —
di cover, lengan kiri jadi papan krem besar yang menutupi receiver rifle
(kena sorot flash light). Perbaikan: lengan dipendekkan (0,13 m), sudut
lebih menukik ke bawah (rot.x 0,7 -> 1,05), offset ke kamera dikurangi,
material lengan digelapkan (#3a4a5e -> #272e3a). Setelah perbaikan, rifle
terlihat penuh (handguard kayu, scope + dot merah menyala, flash) dan
tangan hanya tampak sebagai sarung gelap di gagang — benar.

## Verifikasi (browser headless sungguhan, chrome-headless-shell, 1280x720)

- `node --check` LOLOS: v3.js, hands.js, guns.js, figures.js, marks.js, main.js.
- 4 mode ?shot= ready, 0 page error di semua shot:
  - play: live, kills 1, damage 102, health 100, KEVLAR 50, alive 4v4, timer 1:26.
  - buy: phase buy, money $4.700, health 100, timer BUY 15.
  - start: phase buy, money $800, health 100, timer BUY 15.
  - end: phase over, wins 4-2, timer SPIKE DETONATED.
- Screenshot baru (PNG -> JPG quality 85, semua <= 262.144 byte):
  - 1-play.jpg 141.175 byte, 2-start.jpg 92.925, 3-buy.jpg 118.493,
    4-end.jpg 107.681. `screenshots/` dan `game/screenshots/` sinkron.
- Dossier: `node main.ts` (MAKEFUN_OUTPUT_DIR=/tmp/output-v3) — game 35 file
  2.851.254 byte, screenshots 4, cover 1-play.jpg, teks dossier
  163.833/163.840 byte. File gameplay LENGKAP di dossier (main, palette,
  plans, hearing, utility, world, player, weapon, bots, waypoints, rounds,
  effects, audio, hud, minimap, scoreboard); titik potong jatuh di
  damagefx.js (38/59 baris — modul angka damage, bukan logika gameplay);
  11 file yang tidak masuk semuanya modul visual/pendukung (ambient, input,
  skin, props, guns, figures, hands, life, marks, v2, v3) — sesuai desain.

## Penilaian visual (dilihat sendiri, 1280x720)

- 1-play.jpg (cover): gedung latar kini BUKAN kotak datar — fasad bata
  dengan jendela menyala bervariasi, gedung korugasi teal, gedung tinggi
  gelap dengan jendela, tangki air + cerobong + antena di atap, bulan +
  halo + bintang bersih. Rifle VK-47 lengkap (handguard kayu, scope,
  dot merah menyala, flash starburst, tracer, selongsong kuningan
  terlempar), musuh EMBER jatuh (damage "34" x3, hitmarker), papan
  SCRAPLINE terbaca, strip hazard, peti SCRAP. TIDAK BURIK.
- 2-start.jpg: panel judul bersih; latar kontainer + gedung berjendela
  menyala + bulan; tidak ada panel biru.
- 3-buy.jpg: menu buy lengkap dan terbaca ($4.700); latar yard + gedung
  berjendela + bulan; P9 di pojok kanan bawah rapi.
- 4-end.jpg: "VANGUARD WINS THE ROUND", SPIKE DETONATED 4-2; gedung bata
  berjendela menyala mendominasi latar atas, rambu A + HARD HAT AREA,
  cone oranye, strip hazard, pistol P9 + tangan di kanan bawah. Dinding
  tan kanan masih ada tapi sudah dipecah crane + rambu + bayangan.

## Sesi / agent

- Sesi subagent ini (polish v3) — parent perlu untuk re-bundle (nanti 5 sesi:
  builder rev-3 + fix main.ts + polish v1 + polish v2 + polish v3).
- Server dev game port 8903 (node serve.ts) dimatikan setelah verifikasi.
- JANGAN submit / upload GitHub dari sini — tugas parent.
