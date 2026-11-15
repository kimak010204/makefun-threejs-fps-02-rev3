# Polish v5 — readable round-end banner

## Masalah
Teks "VANGUARD WINS THE ROUND" di screenshot 4-end susah dibaca: teks putih
tanpa panel latar, hanya text-shadow lembut (0 2px 12px), langsung di atas
latar 3D yang ramai dan terang (lampu crane + jendela gedung menyala).
"VANGUARD WINS THE" (di atas lampu terang) hampir hilang; "ROUND" (di atas
gedung gelap) lebih terbaca. Subtitle "Spike detonated" kecil dan pudar
(warna --muted, 15px).

## Perubahan
- `game/index.html` (CSS `#banner`, `#banner-title`, `#banner-sub`):
  - Panel latar gelap semi-transparan di belakang teks:
    `background: rgba(8,10,14,.85)`, border 1px + border-top 4px aksen,
    padding 18px 40px 16px, bayangan kotak 0 10px 36px.
  - Judul 38px/800 -> 52px/900, letter-spacing 4 -> 5px, warna putih.
  - Outline teks KUAT: 8 arah text-shadow hitam 2px (hard outline) +
    bayangan lembut 0 4px 18px, supaya huruf tegas di atas latar apapun.
  - Subtitle 15px/--muted -> 19px/--ink/700 dengan outline hitam 1px.
  - Aksen warna tim: `#banner.win-van` (border-top + judul biru
    var(--vanguard)); `#banner.win-emb` (border-top + judul oranye-merah
    var(--ember)). Berlaku untuk VANGUARD maupun EMBER.
- `game/src/hud.js` (`banner()`): deteksi tim dari judul — tambah class
  `win-van` bila judul mengandung "VANGUARD", `win-emb` bila "EMBER";
  banner lain (GO, SPIKE PLANTED, dsb.) tanpa class, pakai aksen default
  var(--accent). Tidak ada perubahan logika/gameplay.
- Catatan: judul 52px membungkus jadi 2 baris ("VANGUARD WINS" /
  "THE ROUND") karena lebar panel dibatasi posisi absolute left:50%.
  Tampilannya tetap rapi dan justru lebih tegas; tidak diubah ke 1 baris
  karena 2 baris terbaca jelas sekilas pandang.

## Screenshot
Regenerasi 4 shot (chrome-headless-shell v157, 1280x720, ?shot=):
4-end.jpg 109.492, 1-play.jpg 142.953, 2-start.jpg 94.341,
3-buy.jpg 125.664 byte (JPG quality 85, semua <= 262.144 byte).
`screenshots/` dan `game/screenshots/` sinkron.

## Verifikasi
- `node --check` LOLOS: hud.js, main.ts.
- 4 mode ?shot= ready, 0 page error: play (live, money $1.200, ammo 26/90),
  start (buy, $800), buy (buy, $4.700), end (over, wins 4-2).
- Dossier: `node main.ts` jalan — game 36 file, 2.876.627 byte,
  screenshots 4, cover 1-play.jpg.
- Dilihat sendiri: 4-end — "VANGUARD WINS THE ROUND" biru terang di panel
  gelap, terbaca jelas sekilas pandang di atas latar terang; subtitle
  "Spike detonated" jelas. 1-play tidak rusak (tidak ada banner di frame
  itu, gameplay + lampu + muzzle flash + tracer tetap bagus).
