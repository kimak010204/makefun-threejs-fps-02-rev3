# Polish visual rev-3 — catatan builder

Sesi builder: `805882a4-aa35-43ab-9d08-14aed8694751` (subagent polish, 15 Nov 2026).
Perintah sir 17:37 + 17:42 WIB: map harus terasa seperti tempat sungguhan yang
dihuni — bangunan lebih hidup, senjata lebih detail, detail kecil di mana-mana.
JANGAN submit / upload GitHub — hanya polish lokal + commit lokal.

## File baru (semua kode ditulis dari nol di sesi ini)

- `game/src/skin.js` — pustaka tekstur prosedural canvas (seeded, tanpa aset
  eksternal): bata (+jendela menyala), corrugated karat/teal/abu, beton bernoda
  + cat mengelupas + retak, karat, aspal (retak, tambalan tar, jejak ban, noda
  oli, jejak kaki di debu, daun kering, pecahan kaca berkilau), tanah, hazard
  stripes, pagar mesh, kayu + stensil, poster lusuh, rambu, langit dusk.
- `game/src/props.js` — dressing statis: tumpukan mobil hancur (2 sudut spawn),
  kontainer corrugated tambahan, fasad gudang bata + parapet + tangki air atap,
  talang + downspout, pagar mesh di belakang spawn, palet, dumpster, cone,
  wire spool, peti stensil, tong warna-warni, cangkir kopi di peti, kunci
  inggris, kaleng cat, koran, radio tua, sarung tangan, pintu tersegel
  (gagang + engsel + gembok kuningan + rantai), jam dinding, unit AC, rambu
  (NO TRESPASSING / HARD HAT AREA / BAY 3 / DANGER), poster (SCRAP / YARD 7 /
  WANTED), manhole + drainase + marka "07"/"BAY 3" di aspal, genangan
  tambahan, baut berserakan, rumpun lumut di retakan.
- `game/src/guns.js` — viewmodel detail per senjata: laras, rail + notch,
  magazine (melengkung di VK-47), stock kayu, iron sights / scope DMR,
  muzzle brake, pump ber-rib, bead sight, grip tape, sling, pelat nomor seri
  (P9 SN 0117, RPTR SN 2204, VK-47 SN 8841, SCRP-12 SN 0550, LGSHOT SN 9902),
  laser di SMG. Posisi muzzle flash mengikuti laras tiap senjata.
- `game/src/figures.js` — bot: helm + visor strip warna tim, vest plate +
  pouch, shoulder pad, armband tim, knee pad, antena backpack. Hit mesh
  (torso/head) tidak disentuh.
- `game/src/life.js` — yang bergerak: beacon berkedip (crane, cerobong,
  antena merah), neon SCRAPLINE berkedip sesekali, terpal berkibar di atas
  kontainer, kipas dinding berputar, 2 bendera berkibar, 3 burung terbang jauh,
  percikan las sesekali di tungku (+flash), berkas debu di bawah lampu.
- `game/src/marks.js` — decal lubang peluru di dinding (pool 24, direset tiap
  ronde).

## File lama yang diubah (wiring minimal, gameplay/HUD/ekonomi/bot TIDAK diubah)

- `game/src/world.js` — material dinding/lantai/kontainer/peti memakai tekstur
  skin.js; langit memakai sky skin; fungsi groundTexture/skyTexture lama
  dihapus; `createWorld(scene, {skin, dressYard})`; solidBox dukung rotasi.
- `game/src/weapon.js` — buildViewModel lama dihapus, pakai `look.buildGun`;
  flash mengikuti muzzle tiap senjata; sway halus (rotation.z).
- `game/src/bots.js` — satu baris: `hooks.dressBot?.(group, team)`.
- `game/src/main.js` — import modul baru di AKHIR daftar import (supaya
  dossier text tetap memuat semua kode gameplay; modul visual yang
  terpotong), `life.step(dt)`, decal di tembakan dinding, puff laras untuk
  rifle/SMG, `marks.reset()` tiap ronde.

## Dossier / cap

- Total source game naik 151.462 → 194.547 byte, tapi dossier text tetap
  163.829/163.840 byte: yang terpotong HANYA modul visual baru + input.js +
  sebagian ambient.js. Semua kode gameplay (main, world, weapon, bots, hud,
  dst.) tetap lengkap di dossier. Game jalan penuh dari file game/ — tidak
  ada yang hilang saat dimainkan. `node main.ts` ke /tmp: OK
  (game 32 file, 2.720.462 byte; screenshots 4).

## Verifikasi (browser headless sungguhan, chrome-headless-shell + SwiftShader)

- `node --check` semua file game/src + main.ts: OK (serve.ts gagal --check
  karena anotasi TS — sudah begitu sejak awal, bukan dari perubahan ini;
  `node serve.ts` jalan normal).
- 4 mode `?shot=`: start / play / buy / end — semua `ready:true`,
  **0 page error** (console + exception + log dicek via CDP).
  - play: phase live, kills 1, damage 102 (3 tembakan membunuh bot),
    timer 1:26, plan "B RUSH".
  - buy: phase buy, money 4700, menu tampil.
  - end: phase over, skor 4–2, "SPIKE DETONATED".
- Screenshot baru (1280×720, JPG q85, semua ≤ 262.144 byte):
  `screenshots/1-play.jpg` (98.175), `2-start.jpg` (80.581),
  `3-buy.jpg` (92.979), `4-end.jpg` (101.019) — disalin juga ke
  `game/screenshots/` (sinkron, dicek diff).
- Diagnosa tambahan via raycast CDP: "balon biru" di tepi frame saat
  menghadap timur = helm/antena bot kawan yang berdiri tepat di samping
  kamera (spawn berdekatan, perilaku lama, bukan bug polish); dinding
  gelap ber-grid di kanan = pagar mesh di belakang spawn (wajar).
- Performa: tidak ada lampu point baru, tekstur canvas saja, mesh tambahan
  ~120 (kecil, material shared). Render SwiftShader tetap ~1 fps seperti
  sebelumnya — tidak ada penurunan terukur yang baru.

## Yang TIDAK dilakukan (sesuai brief)

- Tidak submit, tidak upload GitHub, tidak ubah gameplay/HUD/ekonomi/bot/
  statistik senjata. Hanya visual.
