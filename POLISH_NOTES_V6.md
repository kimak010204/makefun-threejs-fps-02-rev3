# Polish v6 — Larger round-end subtitle

## Masalah (dari sir, 15 Nov ~21:26 WIB)
Subtitle "Spike detonated" di bawah judul "VANGUARD WINS THE ROUND" masih terlalu
kecil di screenshot 4-end. Di polish v5 subtitle sudah naik dari 15px ke 19px,
tapi dibanding judul 52px tetap terasa kecil.

## Perubahan (1 file)
- `game/index.html` — CSS `#banner-sub`:
  - font-size 19px → **25px** (+32%)
  - font-weight 700 → **800**
  - letter-spacing 1px → **1.5px**
  - margin-top 10px → **12px**
  - text-shadow: outline diperkuat dari 1px jadi **2px 8-arah** (sama seperti judul),
    supaya subtitle tetap tegas di atas latar apapun.
- Berlaku untuk SEMUA subtitle banner (bukan hanya "Spike detonated"): round end
  ("Spike detonated", "Spike defused", "Time expired", dsb.), "GO", "SPIKE PLANTED",
  "FIRST BLOOD", "CLUTCH", "YOU ARE DOWN", "ROUND n" — semuanya lewat `#banner-sub`
  yang sama di `hud.js` `banner()`. Tidak ada perubahan logika/gameplay.

## Kenapa aman untuk layout
Panel `#banner` tidak punya lebar tetap (position absolute, left 50%,
translateX(-50%)) — panel melebar mengikuti konten. Subtitle terpanjang yang ada
("Spectating — click to cycle teammates", 38 karakter) di 25px ≈ 500px, masih muat
di viewport 1280px. Judul 52px tetap elemen terlebar di sebagian besar banner.

## Verifikasi (chrome-headless-shell v157, 1280×720)
- `node --check` LOLOS: main.ts, hud.js, main.js.
- 4 mode `?shot=` ready, **0 page error**: play (live, kills 1, damage 136,
  health 100, $1.200, 4v4), start (buy, $800), buy (buy, $4.700),
  end (over, wins 4–2).
- Dossier: `node main.ts` jalan — game 36 file, 2.781.280 byte, screenshots 4,
  cover 1-play.jpg.
- Dilihat sendiri: screenshot 4-end — subtitle "Spike detonated" kini putih tebal
  25px, terbaca jelas sekilas pandang di bawah judul biru; 1-play tidak rusak
  (gameplay + lampu + muzzle flash + tracer tetap bagus).
- Screenshot baru (JPG, semua ≤262.144 byte), `screenshots/` dan `game/screenshots/`
  sinkron: 1-play 117.167, 2-start 66.858, 3-buy 91.489, 4-end 101.519 byte.

## Catatan
- Di screenshot 4-end baru, panel radio callout (DUST Plan / ASH Setup) terlihat di
  sisi kiri — itu elemen HUD game yang muncul sesaat (bukan akibat perubahan ini),
  tidak menutupi banner dan tidak mengganggu keterbacaan subtitle.
