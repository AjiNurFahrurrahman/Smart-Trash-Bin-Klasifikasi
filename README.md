# SmartTrash

SmartTrash adalah proyek web interaktif yang menggabungkan teknologi AI, frontend modern, dan backend API untuk membantu pengguna memahami pentingnya memilah sampah dengan cara yang lebih menarik.

## Tentang Proyek

SmartTrash dirancang sebagai solusi digital edukatif dan visual yang menghubungkan:

- frontend interaktif berbasis Vite dan Three.js,
- backend API berbasis FastAPI,
- sistem klasifikasi gambar menggunakan model AI,
- serta fitur akun, poin, dan leaderboard untuk mendukung pengalaman pengguna.

## Fitur Utama

- Klasifikasi gambar sampah berbasis AI
- Antarmuka visual interaktif dengan animasi 3D
- Sistem akun pengguna sederhana
- Penghargaan poin per kelas
- Leaderboard untuk memantau aktivitas pengguna
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
├── backend/               # API FastAPI dan logika bisnis
├── frontend/              # Antarmuka pengguna berbasis Vite
├── README.md              # Dokumentasi proyek
└── CARA_JALANKAN.md       # Panduan menjalankan proyek secara lokal
```

## Prasyarat

Pastikan perangkat Anda sudah memiliki:

- Python 3.10+
- Node.js 18+
- npm
- Akun MongoDB Atlas
- Akses ke model AI atau Hugging Face Space

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

Jalankan server:

```bash
uvicorn app:app --reload --port 8000
```

Akses:

- http://localhost:8000
- http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Akses:

- http://localhost:5173

## Alur Kerja Aplikasi

```text
Pengguna mengunggah gambar melalui frontend
        ↓
Backend memproses gambar menggunakan model AI
        ↓
Hasil klasifikasi dikembalikan ke frontend
        ↓
Sistem menampilkan animasi dan menambah poin ke akun/kelas terkait
```

## Endpoint Penting

| Method | Path                       | Deskripsi                         |
| ------ | -------------------------- | --------------------------------- |
| GET    | /api/health                | Mengecek status server            |
| GET    | /api/classes               | Melihat daftar kelas              |
| POST   | /api/classes               | Membuat kelas baru                |
| GET    | /api/leaderboard           | Melihat leaderboard               |
| POST   | /api/accounts              | Membuat akun pengguna             |
| GET    | /api/accounts/{account_id} | Melihat data akun                 |
| POST   | /api/classify              | Mengirim gambar untuk klasifikasi |

## Deployment

Proyek ini dapat di-deploy ke berbagai platform seperti:

- Backend: Render, Railway, Fly.io, atau Hugging Face Spaces
- Frontend: Vercel, Netlify, atau Cloudflare Pages

Pastikan variabel sensitif seperti token dan URI database disimpan dengan aman dan tidak dipublikasikan ke repository publik.

## Catatan Keamanan

- CORS saat ini diset terbuka untuk mempermudah pengembangan lokal.
- Untuk lingkungan produksi, disarankan membatasi origin yang diizinkan.
- Sistem akun pada proyek ini masih sederhana dan tidak ditujukan untuk kebutuhan autentikasi keamanan tinggi.

## Kontribusi

Jika Anda ingin mengembangkan proyek ini lebih lanjut, silakan buat branch baru lalu kirim pull request.
