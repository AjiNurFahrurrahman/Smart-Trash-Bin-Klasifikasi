# Cara Menjalankan Proyek Ini

Proyek ini punya 2 bagian: `frontend/` (Vite + Three.js) dan `backend/` (FastAPI +
MongoDB Atlas). Klasifikasi gambar sampah memanggil model custom di Hugging Face
Space `flyclaws/smart-trash-bin-api` (private) **lewat backend** (bukan langsung
dari frontend) -- karena Space private memblokir panggilan CORS langsung dari
browser.

## Alur

```
Frontend (browser) --[gambar]--> Backend FastAPI --[gambar + HF_TOKEN]--> HF Space (model AI)
Frontend (browser) --[poin dsb]--> Backend FastAPI --> MongoDB Atlas
```

Token HF disimpan di `backend/.env` (server), **tidak pernah** terkirim ke browser.

## 1. Isi file .env

Sudah dibuatkan file `.env` (hasil salinan dari `.env.example`) di masing-masing
folder -- tinggal isi nilai aslinya:

### `backend/.env`
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=smart_trash_bin
HF_SPACE_ID=flyclaws/smart-trash-bin-api
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   <-- isi token HF kamu (scope Read)
```
- MongoDB: ambil connection string dari Atlas dashboard -> Database -> Connect -> Drivers -> Python.
- HF Token: buat di https://huggingface.co/settings/tokens (pilih scope **Read**).

### `frontend/.env`
```
VITE_BACKEND_API_URL=http://localhost:8000
```
Nggak perlu isi apa pun soal HF di sini -- frontend cuma bicara ke backend kita sendiri.

## 2. Jalankan backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
Backend akan jalan di http://localhost:8000 (cek http://localhost:8000/api/health).

## 3. Jalankan frontend (Vite)

Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Frontend akan jalan di http://localhost:5173 (atau port yang ditampilkan di terminal).

## Alur Klasifikasi Gambar (detail)

1. User jepret/upload foto sampah di frontend
2. `src/ai-classifier.js` mengirim gambar (multipart/form-data) ke
   `POST {VITE_BACKEND_API_URL}/api/classify` -- endpoint di backend kita sendiri
3. Backend (`backend/app.py`, fungsi `classify_image`) menyimpan gambar ke file
   sementara, lalu meneruskannya ke HF Space via `gradio_client` (Python),
   menggunakan `HF_TOKEN` yang tersimpan di server
4. HF Space menjalankan model EfficientNetB0, mengembalikan JSON:
   `{ object_name, category, reason, confidence, ... }`
5. Backend meneruskan hasil itu ke frontend
6. Frontend menampilkan animasi & mengirim poin ke backend (`/api/points`)
   yang tersimpan di MongoDB Atlas

## Kalau nanti Space HF diganti public

Kalau Space-nya diganti ke public, `HF_TOKEN` di `backend/.env` boleh dikosongkan
-- `gradio_client` tetap bisa connect tanpa token ke Space public. Endpoint
`/api/classify` di backend tidak perlu diubah sama sekali.

