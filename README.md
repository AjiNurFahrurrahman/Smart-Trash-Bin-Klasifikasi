# Sortir Sampah - Fullstack

Proyek lengkap: **frontend** (Vite + Three.js, tema taman) dan **backend** (FastAPI +
MongoDB Atlas) untuk sistem Kelas, Akun, Poin, dan Leaderboard.

```
sortir-sampah-fullstack/
├── frontend/     # Website (Vite): kamera, animasi 3D, upload panel, dst.
└── backend/      # API (FastAPI + MongoDB Atlas): kelas, akun, poin, leaderboard
```

Model klasifikasi AI (FastAPI + TensorFlow, buat dideploy terpisah ke Hugging Face
Spaces) ada di paket zip lain (`smart-trash-bin-api.zip`) yang sudah dikirim
sebelumnya -- itu proyek yang berdiri sendiri, dipanggil dari
`frontend/src/ai-classifier.js`.

## Cara menjalankan semuanya secara lokal

### 1. Backend (FastAPI + MongoDB Atlas)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # atau .venv\Scripts\activate di Windows
pip install -r requirements.txt
cp .env.example .env
# isi MONGODB_URI di .env dengan connection string dari MongoDB Atlas-mu
uvicorn app:app --reload --port 8000
```
Backend akan jalan di `http://localhost:8000`. Cek dokumentasi otomatis Swagger di
`http://localhost:8000/docs`.

### 2. Frontend (Vite)
```bash
cd frontend
npm install
cp .env.example .env
# isi VITE_ANTHROPIC_API_KEY (atau ganti ai-classifier.js ke model ML-mu)
# VITE_BACKEND_API_URL default sudah http://localhost:8000, sesuaikan kalau perlu
npm run dev
```
Buka `http://localhost:5173`.

## Alur data lengkap

```
[Kamera/Upload foto di frontend]
        |
        v
[ai-classifier.js] --> model AI (Claude atau smart-trash-bin-api-mu di HF Spaces)
        |
        v
   { category: "kimia" | "daur" | "residu", object_name, reason }
        |
        v
[Animasi 3D: foto terbang ke tong yang sesuai]
        |
        v
[account-store.js] --> POST /api/points ke backend FastAPI
        |
        v
   [MongoDB Atlas: koleksi "classes" bertambah poinnya]
        |
        v
[Leaderboard di frontend] <-- GET /api/leaderboard dari backend
```

## Endpoint backend yang tersedia

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/classes` | Buat kelas baru |
| GET | `/api/classes` | Daftar semua kelas |
| GET | `/api/leaderboard` | Kelas diurutkan berdasar poin (tertinggi dulu) |
| POST | `/api/accounts` | Buat akun baru, terikat ke satu kelas |
| GET | `/api/accounts/{account_id}` | Ambil info akun |
| POST | `/api/points` | Tambah poin ke kelas (dipanggil otomatis setelah AI berhasil klasifikasi) |

## Deploy ke produksi

**Backend** -- bisa dideploy ke Render, Railway, Fly.io, atau Hugging Face Spaces
(Docker SDK, sama seperti model ML-mu). `Dockerfile` sudah disediakan di folder
`backend/`. Jangan lupa set environment variable `MONGODB_URI` di platform hosting-mu
(jangan commit `.env` asli ke git).

**Frontend** -- bisa dideploy ke Vercel, Netlify, atau Cloudflare Pages (`npm run
build` menghasilkan folder `dist/` statis). Set environment variable
`VITE_BACKEND_API_URL` ke URL backend produksi, dan `VITE_ANTHROPIC_API_KEY` (atau
ganti ke model ML-mu) sebelum build.

## Catatan keamanan

- CORS di backend saat ini `allow_origins=["*"]` (bebas) -- untuk produksi, batasi ke
  domain frontend-mu saja.
- Sistem akun ini **tanpa password** (cocok untuk pemakaian internal sekolah, bukan
  untuk kebutuhan keamanan serius). `account_id` adalah UUID acak yang disimpan di
  `localStorage` browser -- siapa pun yang tahu ID itu bisa memakai akun tersebut.
