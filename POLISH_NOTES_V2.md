# POLISH NOTES v2 — threejs-fps-02 rev-3 ("YARD 7")

Polish visual putaran ke-2 (setelah v1, commit d6600aa). Arahan sir: lebih detail
BAYANGAN, SILUET GEDUNG, DETAIL SENJATA, PELURU; perbaiki sampai TIDAK BURIK.
Gameplay / HUD / ekonomi / bot / statistik senjata TIDAK diubah.

## Diagnosis panel biru (akar masalah, terbukti raycast + dump objek)

Panel biru besar di latar screenshot buy/start v1 BUKAN dinding/langit, melainkan
bot VANGUARD kawan yang berdiri tepat di posisi spawn pemain (0, 15.5): kamera
berada DI DALAM kepala bot, visor biru #4aa3ff-nya (box 0,3x0,07x0,05 pada jarak
0,12-0,15 m) memenuhi layar atas. Bukti: raycast dari kamera melalui (640,200)
mengenai BoxGeometry #4aa3ff pada jarak 0,12 m; dump objek dekat kamera menemukan
figur bot lengkap di (0, ~1.1, 15.5). Perbaikan: teleport staging buy/start
(0, 15.5) -> (0, 12) — keluar dari garis spawn bot. Panel biru HILANG di semua
screenshot v2 (buy/start terverifikasi bersih).

## Yang berubah (file)

- `game/src/v2.js` (BARU, ~10,9 KB, `dressV2(scene)`, diimpor PALING AKHIR di
  main.js agar dossier yang hampir penuh memotong file ini duluan):
  - Muka selatan blok tengah (z=-1,0): papan "SCRAPLINE / YARD 7 — MID CONNECTOR"
    (3,0x0,75), strip hazard chevron kuning-hitam 8,0x0,45, jendela hangat menyala
    (kaca amber + crossbar + siluet) + jendela dingin biru, pipa conduit vertikal +
    2 kotak sambungan, lampu dinding hangat + halo, strip AO gelap di kaki dinding,
    4 blob bayangan kontak (bawah tong/palet/peti).
  - Lapis kedua skyline (5 blok dekat #232936 di z=-20,5..-22, tinggi 5,2-8, +
    9 jendela kota amber); detail atap skyline jauh (3 tangki air, 2 ventilasi,
    3 antena + ujung merah #ff2e1f).
  - Bulan (lingkaran r=2,2 #e8e2d2 fog:false di (38,26,-48) + halo r=3,6) +
    140 bintang (Points, size 0,35, #cdd8ff, fog:false, y 18..45).
  - Klaster 3 tong (karat/teal/kuning) di sisi barat blok tengah + palet miring +
    2 peti di sisi timur. Semua visual saja, tanpa collider/state gameplay.
- `game/src/world.js` (pencahayaan/bayangan): key light (-26,16,6) -> (-30,10,4)
  (elevasi ~18°, bayangan dusk lebih panjang), shadow map 2048 -> 4096,
  hemisphere 1.5 -> 1.25, key intensity 3.2 -> 3.4 (kontras terang-gelap lebih kuat).
- `game/src/guns.js` (rifle VK-47): rail atas + 6 notch, riser red-dot + housing
  tabung (r=0,028) + lensa kaca + dot merah (sphere r=0,008 di z=0,06, tepat di
  depan lensa agar terlihat), selector switch sisi kiri, 2 ujung peluru kuningan
  vertikal di magazine, 2 port samping muzzle brake.
- `game/src/weapon.js`: tekstur muzzle flash digambar ulang jadi starburst
  (8 spike + inti radial terang), skala flash 0.34 -> 0.44, durasi flash
  0.08 -> 0.12 dtk.
- `game/src/effects.js`: tracer kini punya BEAM 3D (box 0,035 additive #ffe0b0,
  diorientasikan sepanjang jalur tembak, fade bersama line) — tracer lama 1px
  hampir tak terlihat; TRACER_LIFE 0.14 -> 0.3 dtk; casing membesar
  0.02x0.02x0.045 -> 0.024x0.024x0.05.
- `game/src/main.js` (staging screenshot saja, bukan gameplay):
  - runShot 'start'/'buy': teleport (0, 15.5, 0) -> (0, 12, 0) (perbaikan panel biru).
  - runShot 'play': musuh (0,0) -> (0,4) (6 m dari pemain, lebih besar/dramatis),
    bot defend kedua `flank` di (-4, 3) yaw PI*0.15 (membelakangi pemain, menahan mid),
    settle(30) -> settle(20) sebelum tembakan, settle(2) -> settle(10) setelah
    3 tembakan (musuh jatuh ~35°), refresh flash `weapon.state.flash = 0.12` +
    settle(1), lalu `match.frozen = true` sebelum paintTwiceThenReady.
  - `match.frozen = true` sebelum paintTwiceThenReady untuk SEMUA shot: main loop
    men-step simulasi selama 2 frame paint (headless ~1 fps, tiap frame sampai 5 step)
    sehingga flash/tracer/spark keburu habis sebelum screenshot — ini akar masalah
    flash yang tidak terlihat di v2-play pertama. Dengan freeze, efek tertangkap segar.

## Verifikasi (browser headless sungguhan, chrome-headless-shell, 1280x720)

- `node --check` LOLOS: main.js, world.js, guns.js, weapon.js, effects.js, v2.js, main.ts.
- 4 mode ?shot= ready, 0 page error di semua shot:
  - play: live, kills 1, damage 102, health 100, KEVLAR 50, alive 4v4, timer 1:26.
  - buy: phase buy, money $4.700, health 100, timer BUY 15.
  - start: phase buy, money $800, health 100, timer BUY 15.
  - end: phase over, wins 4-2, timer SPIKE DETONATED.
- Screenshot baru (PNG -> JPG quality 85, semua <= 262.144 byte):
  - 1-play.jpg 112.018 byte, 2-start.jpg 84.019, 3-buy.jpg 113.224, 4-end.jpg 97.872.
  - `screenshots/` dan `game/screenshots/` sinkron (file sama).
- Dossier: `node main.ts` (MAKEFUN_OUTPUT_DIR=/tmp/output-v2) — game 33 file
  2.768.385 byte, screenshots 4, cover 1-play.jpg, teks dossier 163.811/163.840 byte.
  File gameplay (main, palette, plans, hearing, utility, world, player, weapon,
  bots, rounds, effects, audio, hud, minimap, scoreboard, damage-numbers) LENGKAP
  di dossier (dicek via tail-marker tiap file); yang terpotong hanya modul visual/
  pendukung (ambient, input, skin, props, guns, figures, life, marks, v2) — sama
  seperti v1, TIDAK ada regresi.
- Cek lokal kit (`makefun.mjs check`, bundle lama 2 sesi): **ok:true, failed:[]** —
  thinking_reproduces/priced/revised/in_window/wellformed/turns PASS; license,
  entrypoint, snapshot, competition_open PASS; repo_* = submission (selesai saat
  upload GitHub). Parent perlu re-bundle dengan sesi polish v2 ini agar bundle
  memuat 4 sesi (builder rev-3 + fix main.ts + polish v1 + polish v2).

## Penilaian visual (dilihat sendiri, 1280x720)

- 1-play.jpg (cover): bulan besar + halo + bintang, skyline berlapis (jendela
  menyala, crane kuning, rambu A/B), papan SCRAPLINE terbaca, jendela hangat,
  strip hazard, musuh EMBER jatuh di tengah (damage "34" x3, hitmarker), MUZZLE
  FLASH starburst putih-kuning TERLIHAT di moncong, tracer beam samar, selongsong
  kuningan terlempar di udara (kanan), dot merah menyala di red-dot sight, rifle
  detail (rail notch, tabung red-dot, handguard kayu, mag melengkung, plat
  "VK-47 · SN 8841"), bayangan panjang kontainer di aspal, health 100. TIDAK BURIK.
- 2-start.jpg: panel biru hilang; latar kontainer karat/teal + langit dusk +
  bulan; panel judul SCRAPLINE bersih.
- 3-buy.jpg: panel biru hilang; latar kontainer + bulan + bintang; menu buy
  lengkap dan terbaca ($4.700, 5 senjata + 4 utility/armor).
- 4-end.jpg: "VANGUARD WINS THE ROUND", SPIKE DETONATED 4-2, cone oranye, peti,
  pistol viewmodel. Catatan minor: dinding tan besar di sisi kanan frame masih
  relatif polos (sisi bangunan barat, diterangi key hangat) — shot ke-4, frame
  keseluruhan sudah padat; dibiarkan.

## Sesi / agent

- Sesi subagent: 7f6f4d8b-2ec0-4594-859f-d89d4bcb3207 (label 8234886f-75b8-9a87-9d8f-e0ddf4cc2ab2).
- Server dev game port 8903 (python http.server di game/) masih jalan saat laporan ini.
- JANGAN submit / upload GitHub dari sini — tugas parent.
