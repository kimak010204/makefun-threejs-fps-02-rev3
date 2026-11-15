# Polish v7 — Round-end team sheet + in-game chat

## Masalah (perintah sir 16 Nov 01:01 WIB)
1. Banner akhir ronde ("VANGUARD WINS THE ROUND" + "Spike detonated") terlalu
   polos — hanya judul + satu baris alasan, tanpa detail pemain.
2. Game belum punya fitur chat (team chat + all chat).

## Yang diubah

### 1. Banner akhir ronde — detail pemain kedua tim
- `game/index.html`: tambah `<div id="banner-details">` di dalam `#banner` +
  CSS (`.banner-score`, `.banner-teams`, `.banner-team.van/.emb`, baris
  nama + K/D). Panel gelap + judul 52px tetap, detail di bawah subtitle.
- `game/src/hud.js`: `banner(title, sub, ms, detailsHtml)` — parameter ke-4
  opsional (panggilan lama tanpa details tetap jalan). Baru:
  `roundEndDetails(rows, wins)` — bangun HTML dari `scoreboard.table()`:
  baris skor "VANGUARD 4 — 2 EMBER", lalu dua kolom (tim pemenang dulu):
  VANGUARD biru (YOU, DUST, RIVET, BOLT, FUSE) dan EMBER merah (ASH, COAL,
  SLAG, CINDER, SOOT), tiap pemain nama + K/D.
- `game/src/main.js` `onRoundEnd`: banner kini dipanggil dengan details dari
  scoreboard + skor ronde saat itu.
- Shot `end`: seed 6 kill di scoreboard (YOU 2, DUST/RIVET/BOLT 1, SOOT 1)
  supaya banner menampilkan K/D nyata, bukan roster 0/0.

### 2. Fitur chat (baru: `game/src/chat.js`, ~3,2 KB)
- **T** = All chat (semua pemain lihat), **Y** = Team chat (hanya tim sendiri).
  Enter kirim, Esc batal. Input box muncul di pojok kiri bawah dengan label
  mode `[ALL]`/`[TEAM]`; log maks 6 baris terakhir, nama pengirim berwarna
  tim (biru Vanguard / merah Ember), tag `[TEAM]`/`[ALL]`.
- Team chat dari tim musuh **tidak pernah tampil** di HUD pemain
  (`receive()` membuangnya) — All chat selalu tampil.
- Saat chat terbuka, semua tombol game dinonaktifkan (`pressed.clear()` di
  `step()` + pointer lock dilepas) supaya mengetik tidak menggerakkan
  pemain / reload / buy. `game/src/input.js`: keydown yang targetnya
  `<input>`/`<textarea>` diabaikan — mengetik "t"/"y" di kotak chat tidak
  membuka chat lagi.
- **Bot ikut chat**: DUST (team) mengumumkan rencana ronde di awal ronde
  (pakai baris plan dari `plans.js`); killer bot 25% All chat ("Nice shot!",
  "Got one!") / 20% Team chat; planter otomatis team callout; defuser
  All chat. Probabilitas rendah supaya log tidak banjir.
- Pesan chat **tidak auto-hilang** (persist sampai terdorong 6 baris baru) —
  chat adalah catatan yang bisa dibaca ulang, dan screenshot harus
  menampilkannya. (Awalnya 12 detik, diubah setelah terbukti hilang di
  screenshot virtual-time.)
- Shot `play`: seed 1 baris All chat ASH ("They are pushing A!") + baris
  rencana DUST otomatis dari round start, supaya fitur terlihat di 1-play.

### 3. Screenshot baru (1280×720, JPG q85, semua ≤262.144 byte)
- 1-play 152.332, 2-start 95.599, 3-buy 124.748, 4-end 123.365 byte.
  `screenshots/` dan `game/screenshots/` sinkron.
- 4-end: banner kini menampilkan skor + kedua tim lengkap dengan K/D;
  kotak chat kiri bawah menampilkan 2 baris DUST [TEAM].
- 1-play: kotak chat kiri bawah menampilkan DUST [TEAM] ×2 + ASH [ALL].

## Yang TIDAK diubah
- Gameplay inti (senjata, ronde, bot, ekonomi, plant/defuse) tidak disentuh.
- Aturan: tidak submit, tidak upload GitHub, tidak bundle.

## Verifikasi (chrome-headless-shell v157, 1280×720)
- `node --check` LOLOS: main.ts, main.js, hud.js, chat.js, input.js.
- 4 mode `?shot=` ready, **0 page error** (hanya warning autoplay
  AudioContext bawaan headless, sudah ada sebelum v7).
- Tes logika chat headless (`/tmp/test-chat.mjs`, fake DOM): **13/13 PASS** —
  team chat musuh dibuang, all chat tampil, open/close, cap 6 baris.
- Dilihat sendiri: screenshot 4-end — banner + detail tim + chat terbaca
  jelas; 1-play — kotak chat terbaca, tidak menutupi gameplay.
- Dossier: `node main.ts` jalan — game 37 file (+chat.js), 2.910.764 byte,
  screenshots 4, cover 1-play.jpg; teks dossier 163.668/163.840.

## Catatan
- Di shot `play`/`end`, baris rencana DUST muncul 2× (MID TAKE + B RUSH):
  artefak harness shot (`startMatch()` dipanggil 2×: sekali saat load modul,
  sekali di `runShot`). Di permainan nyata tiap ronde hanya 1 baris rencana.
  Bukan bug chat — radio log punya perilaku yang sama.
- Dossier teks 163.668/163.840 (sisa 172 char): chat.js + roundEndDetails
  masuk ke teks dossier; titik potong dossier bergeser sedikit. Tidak ada
  file yang terpotong dari gate (game tetap 37 file, semua di bawah batas).
