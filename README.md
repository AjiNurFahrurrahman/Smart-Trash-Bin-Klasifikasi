# SmartTrash

SmartTrash adalah proyek pengelolaan sampah berbasis web yang menggabungkan antarmuka interaktif, klasifikasi gambar berbasis AI, dan sistem poin/leaderboard untuk mendorong kesadaran memilah sampah secara lebih menarik.

## Ringkasan Proyek

Proyek ini terdiri dari dua bagian utama:

- Frontend: antarmuka web interaktif berbasis Vite dan Three.js untuk menampilkan pengalaman visual berupa taman digital dan tong sampah.
- Backend: API berbasis FastAPI yang menangani data kelas, akun, poin, leaderboard, serta proxy klasifikasi gambar ke model AI.

## Fitur Utama

- Klasifikasi gambar sampah menggunakan model AI melalui backend
- Visualisasi interaktif dengan animasi 3D dan elemen taman
- Sistem akun pengguna sederhana
- Sistem poin dan leaderboard per kelas
- API RESTful untuk pengelolaan data

## Teknologi yang Digunakan

### Frontend

- Vite
- JavaScript
- Three.js

### Backend

- Python
- FastAPI
- MongoDB Atlas
- Gradio Client

## Struktur Proyek

```text
SmartTrash/
├── backend/         # API FastAPI dan logika bisnis
├── frontend/        # Antarmuka pengguna berbasis Vite
├── README.md        # Dokumentasi proyek
└── CARA_JALANKAN.md # Panduan menjalankan proyek secara lokal
```

## Prasyarat

Sebelum menjalankan proyek, pastikan perangkat Anda telah menginstal:

- Python 3.10+
- Node.js 18+
- npm
- MongoDB Atlas account
- Akses ke Hugging Face Space atau model AI yang kompatibel

## Menjalankan Proyek Secara Lokal

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
# Untuk Windows PowerShell:
# .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Buat file `.env` di folder backend dan isi variabel berikut:

```env
MONGODB_URI=your_mongodb_connection_string
HF_SPACE_ID=your_huggingface_space_id
HF_TOKEN=your_huggingface_token
```

Lalu jalankan server:

```bash
uvicorn app:app --reload --port 8000
```

Backend akan tersedia di:

- http://localhost:8000
- Dokumentasi API: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend akan tersedia di:

- http://localhost:5173

## Alur Kerja Aplikasi

```text
Pengguna mengunggah gambar melalui frontend
        ↓
Frontend mengirimkan data ke backend
        ↓
Backend memproses gambar melalui model AI
        ↓
Hasil klasifikasi dikembalikan ke frontend
        ↓
Sistem menampilkan animasi dan menambah poin ke akun/kelas terkait
```

## Endpoint Penting

| Method | Path                       | Deskripsi                         |
| ------ | -------------------------- | --------------------------------- |
| GET    | /api/health                | Cek status server                 |
| GET    | /api/classes               | Melihat daftar kelas              |
| POST   | /api/classes               | Membuat kelas baru                |
| GET    | /api/leaderboard           | Melihat leaderboard               |
| POST   | /api/accounts              | Membuat akun pengguna             |
| GET    | /api/accounts/{account_id} | Melihat data akun                 |
| POST   | /api/classify              | Mengirim gambar untuk klasifikasi |

## Deployment

Proyek ini dapat di-deploy ke platform seperti:

- Backend: Render, Railway, Fly.io, atau Hugging Face Spaces
- Frontend: Vercel, Netlify, atau Cloudflare Pages

Pastikan variabel environment sensitif seperti token dan URI database disimpan dengan aman dan tidak di-commit ke repository publik.

## Catatan Keamanan

- CORS saat ini diset terbuka untuk mempermudah pengembangan lokal.
- Untuk production, sebaiknya batasi origin yang diizinkan.
- Sistem akun pada proyek ini masih sederhana dan tidak dirancang untuk kebutuhan autentikasi keamanan tinggi.

## Kontribusi

Kontribusi sangat terbuka. Jika Anda ingin mengembangkan proyek ini lebih lanjut, silakan buat branch baru dan kirim pull request.
