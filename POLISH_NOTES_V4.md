# POLISH NOTES v4 — threejs-fps-02 rev-3 ("YARD 7")

Polish visual putaran ke-4 (setelah v3, commit 82df2ae). Arahan sir: pencahayaan
LEBIH BAGUS dan RAPI terutama LAMPU, plus detail TEMBAKAN dan TARGET yang kena
tembakan. Gameplay / HUD / ekonomi / bot / statistik senjata TIDAK diubah
(satu-satunya edit main.js: import + panggil dressV4, efek tembakan di shoot(),
dan staging play shot; semua murni visual).

## Yang berubah (file)

- `game/src/v4.js` (BARU, ~7,7 KB, `dressV4(scene)`, diimpor PALING AKHIR di
  main.js agar dossier yang hampir penuh memotong file ini duluan):
  - Lampu tiang yard (4 tiang di world.js): halo berlapis (halo besar redup +
    inti bohlam putih-kuning terang), kolam cahaya radial yang rapi di tanah
    (radius 3,3 m, amber, memudar halus), dan kap lampu gelap di atas bohlam
    supaya terbaca sebagai fixture. Suhu warna konsisten amber hangat
    (#ffc27a) — tidak ada lampu putih/biru baru.
  - Lampu gantung tengah (0, 4,4, 4): halo + kolam (radius 3,6 m) — kolamnya
    jatuh tepat di jalur mid sehingga musuh yang melintas terbaca jelas.
  - Lampu crane (-15, 4, -11) dan lampu tungku/site (16.5, 3,4, -13, oranye):
    halo + kolam kecil supaya sumber cahayanya terbaca (sebelumnya hanya
    PointLight tanpa wujud).
  - Jendela skyline utara (5 jendela world.js): kilau aditif sangat redup
    (0,16) di sekelilingnya + ambang bawah gelap + palang tengah (mullion)
    supaya terbaca sebagai jendela berbingkai, bukan persegi terang polos.
  - Kerucut cahaya SENGAJA TIDAK dipakai: di dusk yang gelap, kerucut aditif
    terbaca sebagai piramida putih padat, bukan cahaya (terbukti di uji coba —
    dua piramida putih besar muncul di tengah frame). Halo + kolam saja.
- `game/src/weapon.js`: muzzle flash berlapis — inti putih-kuning pekat
  (sprite radial) + starburst lama; skala flash per senjata (pistol 0,36,
  SMG 0,40, rifle 0,46, shotgun 0,58, DMR 0,52); flashLight 12 -> 15.
  Flash tetap 0,12 dtk supaya tidak mengganggu aim.
- `game/src/effects.js`: tracer — garis 1px tetap, beam 3D kini 0,03 (dari
  0,05) dan MULAI 1 m di depan moncong (bukan di moncong): beam yang mulai
  tepat di kamera terbaca sebagai piramida putih besar (foreshortening).
  TRACER_LIFE 0,3 -> 0,5 dtk supaya tracer tertangkap di screenshot.
  Baru: `impact(point)` — kilau benturan + percikan + debu saat peluru
  mengenai dinding/lantai.
- `game/src/bots.js`: flash kena tembak lebih kuat — suit (torso+kepala+
  lengan) menyala merah-putih terang (emissive 0xff2e2e, intensitas sampai
  2,0) + strip glow tim ikut menyala (0,35 -> 1,95); durasi flash 0,12 ->
  0,16 dtk. Baru: flinch visual — badan tersentak miring (rotasi x/z kecil)
  seiring flash memudar. (Sebelumnya hanya torso merah redup 0x881111.)
- `game/src/main.js`: shoot() — kena bot: burst ganda (merah 3,6 + kuning
  2,4) + puff asap di titik kena; kena dinding: `effects.impact()`.
  Play shot: tembakan ke-4 ke bot flank yang masih hidup (damage total
  102 -> 136), lalu bidik kembali ke tengah antara musuh yang jatuh dan
  flank supaya keduanya masuk frame.
- `game/index.html` (CSS): hitmarker lebih besar/tegas (batang 2->3px,
  11->14px, bayangan lebih kuat; kill membesar 1,25x + merah); angka damage
  17->21px (headshot 22->27px, font 800, bayangan lebih kuat).
- `game/src/damagefx.js`: angka damage bertahan 0,75 -> 0,9 dtk, naik
  46 -> 56px (lebih terbaca di screenshot).

## Koreksi saat uji coba (iterasi di dalam v4)

- Percobaan pertama: muzzle flash terlalu besar (rifle 0,52 + inti 0,55 +
  flashLight 22) jadi gumpalan putih besar menutupi tengah layar; kerucut
  cahaya (opacity 0,07, DoubleSide) jadi dua piramida putih padat.
  Perbaikan: flash dikecilkan (rifle 0,46, inti 0,45x, flashLight 15);
  kerucut dihapus total; tracer beam ditipiskan + dimundurkan 1 m dari
  moncong (akar piramida putih kedua). Setelah perbaikan, tidak ada lagi
  piramida putih; flash, tracer, dan lampu terbaca rapi.

## Verifikasi (browser headless sungguhan, chrome-headless-shell v157, 1280x720)

- `node --check` LOLOS: main.js, weapon.js, effects.js, bots.js,
  damagefx.js, v4.js, main.ts, index.html (CSS diubah, bukan JS).
- 4 mode ?shot= ready, 0 page error di semua shot:
  - play: live, kills 1, damage 136, health 100, KEVLAR 50, alive 4v4,
    timer 1:26, ammo 26/90.
  - buy: phase buy, money $4.700, health 100, timer BUY 15.
  - start: phase buy, money $800, health 100, timer BUY 15.
  - end: phase over, wins 4-2, timer SPIKE DETONATED.
- Screenshot baru (PNG -> JPG quality 85, semua <= 262.144 byte):
  - 1-play.jpg 142.051 byte, 2-start.jpg 92.798, 3-buy.jpg 118.503,
    4-end.jpg 108.005. `screenshots/` dan `game/screenshots/` sinkron.
- Dossier: `node main.ts` (MAKEFUN_OUTPUT_DIR=/tmp/output-v4) — game 36 file
  2.864.678 byte, screenshots 4, cover 1-play.jpg, teks dossier
  163.808/163.840 byte. CATATAN: titik potong bergeser dari damagefx.js (v3)
  ke minimap.js (v4, 70/131 baris) karena ~6 KB kode visual tambahan di
  file yang masuk dossier; file gameplay INTI tetap LENGKAP (index.html,
  main, palette, plans, hearing, utility, world, player, weapon, bots,
  waypoints, rounds, effects, audio, hud). 14 file yang terpotong semuanya
  modul visual/pendukung (scoreboard, damagefx, ambient, input, skin, props,
  guns, figures, hands, life, marks, v2, v3, v4) — sama seperti v3.

## Penilaian visual (dilihat sendiri, 1280x720)

- 1-play.jpg (cover): musuh EMBER jatuh di tengah (angka damage "34" x3
  lebih besar dan terbaca, hitmarker X putih lebih tegas), muzzle flash
  berlapis terlihat di moncong (inti terang + starburst), tracer garis
  putih bersih melintang, lampu tiang kanan ber-halo hangat, kolam cahaya
  di tanah, gedung berjendela menyala + bulan. TIDAK BURIK, tidak ada
  piramida putih.
- 2-start.jpg: panel judul bersih; latar kontainer + gedung + bulan; lampu
  ber-halo di kanan; tidak ada panel biru.
- 3-buy.jpg: menu buy lengkap dan terbaca ($4.700); latar yard + gedung
  berjendela + bulan; P9 di pojok kanan bawah rapi.
- 4-end.jpg: "VANGUARD WINS THE ROUND", SPIKE DETONATED 4-2; halo lampu
  crane terang di latar atas, rambu A, cone oranye, strip hazard, pistol P9
  + tangan di kanan bawah.
- Catatan jujur: flash + flinch bot flank yang masih hidup kurang kentara
  di screenshot play (flank di tepi kiri frame, sebagian tertutup) — efeknya
  paling terasa saat bermain live, bukan di frame beku. Kerucut cahaya
  tidak jadi dipakai (terbukti jelek sebagai piramida putih).

## Sesi / agent

- Sesi subagent ini (polish v4) — parent perlu untuk re-bundle (nanti 6 sesi:
  builder rev-3 + fix main.ts + polish v1 + polish v2 + polish v3 + polish v4).
- Server dev game port 8903 (python http.server di game/) masih jalan saat
  laporan ini; chrome headless profile /tmp/chrome-v4-profile.
- JANGAN submit / upload GitHub / bundle dari sini — tugas parent.
