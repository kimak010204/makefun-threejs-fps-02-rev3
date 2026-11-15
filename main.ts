// YARD 7 — pengemas entry threejs-fps-02 rev-3.
//
// Tugas file ini cuma satu: menyiapkan folder hand-in yang akan dinilai
// scorer. Ia menyalin game/ dan screenshots/ dari repo ini ke folder
// tujuan, memeriksa batas-batas gerbang (gate.json) sebelum menyalin,
// lalu menulis dossier.json dari folder tujuan itu sendiri.
//
// Dijalankan langsung oleh scorer sebagai `node main.ts`; tidak ada
// argumen baris perintah dan tidak ada dependensi di luar stdlib Node 22.
// Ditulis sebagai JavaScript polos di dalam file .ts agar `node --check`
// pun bisa memeriksanya.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-threejs.ts';

// ---------------------------------------------------------------- batas gerbang

// Batas-batas dari gate.json, ditulis ulang di sini agar kegagalan terjadi sebelum penyalinan.
const BATAS = {
  gameMaksFile: 993,
  gameMaksByte: 50331648,
  gambarMaksJumlah: 4,
  gambarMaksByte: 262144,
  teksMaksByte: 163840,
};

// Ekstensi yang dihitung sebagai gambar tangkapan layar.
const EKSTENSI_GAMBAR = new Set(['.jpg', '.jpeg', '.png']);

// ---------------------------------------------------------------- lokasi

// Folder repo ini: folder yang memuat file ini.
const repoDir = dirname(fileURLToPath(import.meta.url));

// Folder hand-in: dari environment, atau /output bila tidak disetel.
const tujuanDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ---------------------------------------------------------------- hitung isi folder

// Jalan rekursif: hitung semua file di bawah `akar` beserta total bytenya.
// Mengembalikan { jumlahFile, totalByte }.
function hitungFolder(akar) {
  let jumlahFile = 0;
  let totalByte = 0;
  const antrean = [akar];
  while (antrean.length > 0) {
    const kini = antrean.pop();
    for (const nama of readdirSync(kini)) {
      const penuh = join(kini, nama);
      const info = statSync(penuh);
      if (info.isDirectory()) {
        antrean.push(penuh);
      } else if (info.isFile()) {
        jumlahFile += 1;
        totalByte += info.size;
      }
    }
  }
  return { jumlahFile, totalByte };
}

// ---------------------------------------------------------------- validasi

const gameDir = join(repoDir, 'game');
const shotDir = join(repoDir, 'screenshots');

if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) {
  throw new Error('game/: tidak ada atau bukan folder');
}

const isiGame = hitungFolder(gameDir);
if (isiGame.jumlahFile > BATAS.gameMaksFile) {
  throw new Error(`game/: ${isiGame.jumlahFile} file, melewati batas ${BATAS.gameMaksFile}`);
}
if (isiGame.totalByte > BATAS.gameMaksByte) {
  throw new Error(`game/: ${isiGame.totalByte} byte, melewati batas ${BATAS.gameMaksByte}`);
}

if (!existsSync(shotDir) || !statSync(shotDir).isDirectory()) {
  throw new Error('screenshots/: tidak ada atau bukan folder');
}
const namaGambar = readdirSync(shotDir)
  .filter((nama) => EKSTENSI_GAMBAR.has(extname(nama).toLowerCase()))
  .sort();
if (namaGambar.length === 0) {
  throw new Error('screenshots/: tidak ada gambar');
}
if (namaGambar.length > BATAS.gambarMaksJumlah) {
  throw new Error(`screenshots/: ${namaGambar.length} gambar, melewati batas ${BATAS.gambarMaksJumlah}`);
}
for (const nama of namaGambar) {
  const ukuran = statSync(join(shotDir, nama)).size;
  if (ukuran > BATAS.gambarMaksByte) {
    throw new Error(`screenshots/${nama}: ${ukuran} byte, melewati batas ${BATAS.gambarMaksByte}`);
  }
}

// ---------------------------------------------------------------- salin dan susun dossier

mkdirSync(tujuanDir, { recursive: true });
cpSync(gameDir, join(tujuanDir, 'game'), { recursive: true });
cpSync(shotDir, join(tujuanDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(tujuanDir, {
  text_max_bytes: BATAS.teksMaksByte,
  screenshots: { max: BATAS.gambarMaksJumlah, max_bytes: BATAS.gambarMaksByte },
  game_max_files: BATAS.gameMaksFile,
  game_max_bytes: BATAS.gameMaksByte,
});
writeFileSync(join(tujuanDir, 'dossier.json'), dossier);

const sampul = namaGambar[0];
console.log(
  `game: ${isiGame.jumlahFile} file, ${isiGame.totalByte} byte; screenshots: ${namaGambar.length}; output: ${tujuanDir}; cover: ${sampul}`,
);
