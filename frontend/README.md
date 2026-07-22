# AI Sortir Sampah

Website interaktif bertema taman: foto/jepret barang sampah lewat kamera (otomatis
mendeteksi HP vs Laptop/PC), AI menentukan tong yang tepat (Kimia / Daur Ulang / Residu),
animasi 3D foto "terbang" masuk ke tong, plus sistem Kelas & Akun dengan Leaderboard poin
antar kelas.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env
# isi VITE_ANTHROPIC_API_KEY di .env dengan API key dari console.anthropic.com
npm run dev
```

Build produksi:
```bash
npm run build
npm run preview
```

## Struktur modul (dipecah per fitur)

```
src/
├── main.js                  # orkestrator utama: menyatukan semua modul di bawah ini
├── style.css                # semua styling (tema taman)
├── body.html                # markup UI (dimuat via ?raw import)
│
├── scene-garden.js          # scene Three.js: langit, rumput, pohon, cahaya, kamera 3D,
│                             #   render loop, dan mode fokus 1-tong untuk mobile
│
├── bins/                    # TIGA TONG SAMPAH -- masing-masing file terpisah
│   ├── bin-shared.js         #   geometry & label texture yang dipakai bersama
│   ├── tong-kimia.js         #   Tong Sampah 1: Limbah Kimia
│   ├── tong-daur-ulang.js    #   Tong Sampah 2: Daur Ulang
│   └── tong-residu.js        #   Tong Sampah 3: Residu / Tidak Bisa Daur Ulang
│
├── flight-animation.js      # animasi foto "terbang" ke tong + efek partikel & tutup
├── bin-tooltip.js            # popup deskripsi saat logo tong diklik
│
├── camera-capture.js         # deteksi & capture kamera (mobile facingMode / desktop enumerasi device)
├── ai-classifier.js           # BAGIAN AI -- panggilan ke Claude vision (gampang diganti ke ML custom-mu)
│
├── account-store.js           # data layer murni Kelas & Akun (gampang diganti ke MongoDB Atlas API)
├── leaderboard.js              # UI panel Leaderboard Kelas (tombol pojok kiri atas)
└── account-panel.js            # UI panel Kelas & Akun -- "buka akun" (tombol pojok kanan atas)
```

## Mengganti ke backend-mu sendiri (ML custom + MongoDB Atlas)

**1. Model ML kamu** -- edit `src/ai-classifier.js`. Ganti isi fungsi `classifyImage()`
supaya memanggil endpoint API model-mu sendiri. Yang penting fungsinya tetap
mengembalikan:
```js
{ object_name: string, category: 'kimia' | 'daur' | 'residu', reason: string }
```
Tidak ada file lain yang perlu diubah -- `main.js`, animasi, dan poin otomatis tetap jalan.

**2. MongoDB Atlas** -- edit `src/account-store.js`. Setiap fungsi di file itu (
`getAllClasses`, `createClass`, `addPointsToClass`, `getMyAccount`, `setMyAccount`,
`clearMyAccount`) saat ini memanggil `window.storage` (penyimpanan sementara bawaan
Claude Artifacts). Ganti isi tiap fungsi dengan `fetch()` ke REST API/backend-mu yang
terhubung ke MongoDB Atlas. Struktur data kelas:
```js
{ slug, name, points, totalBuang, jumlah_kimia, jumlah_daur, jumlah_residu }
```
bisa langsung dipakai sebagai skema koleksi MongoDB.

## Penting soal keamanan API key (mode saat ini)

Kode contoh ini memanggil Anthropic API **langsung dari browser** memakai header
`anthropic-dangerous-direct-browser-access` -- cocok untuk demo/prototipe, **tapi tidak
aman untuk produksi publik** (API key terlihat di DevTools). Untuk produksi: buat backend
kecil yang menyimpan API key/kredensial model ML-mu di server, lalu ganti URL fetch di
`src/ai-classifier.js` menjadi endpoint backend-mu sendiri.

## Catatan teknis lain

- Akses kamera (`getUserMedia`) perlu HTTPS atau localhost.
- Mobile: hanya menampilkan 1 tong (sesuai kategori) untuk hemat ruang layar.
- Desktop: menampilkan ketiga tong sekaligus.
- Sistem Kelas/Akun saat ini pakai penyimpanan sederhana tanpa password terenkripsi --
  cocok untuk pemakaian internal (sekolah), bukan untuk kebutuhan keamanan serius.
