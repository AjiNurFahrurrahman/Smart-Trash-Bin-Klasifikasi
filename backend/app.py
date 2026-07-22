"""
Backend API - Kelas, Akun, Poin, Leaderboard & Proxy Klasifikasi Gambar
------------------------------------------------------------------------
FastAPI + MongoDB Atlas. Menggantikan window.storage yang dipakai di versi
prototipe (src/account-store.js pada frontend Vite).

Endpoint /api/classify meneruskan gambar ke Hugging Face Space (model
EfficientNetB0 custom) menggunakan HF_TOKEN yang disimpan di server --
sehingga token tidak pernah terkirim ke browser (menghindari batasan CORS
Space private saat dipanggil langsung dari frontend).

Koleksi MongoDB:
- classes:  { slug, name, points, total_buang, jumlah_kimia, jumlah_daur, jumlah_residu }
- accounts: { _id, account_name, class_slug, class_name }
"""

import datetime
import json
import mimetypes
import os
import re
import tempfile
import uuid

from bson.binary import Binary
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file
import gradio_client.utils as _gc_utils

# ---------------- Patch bug internal gradio_client (versi 4.44.1) ----------------
# Beberapa fungsi di gradio_client.utils crash ("argument of type 'bool' is not
# iterable") saat membaca skema JSON dari Space kita. Kita tambal SEMUA fungsi
# terkait sekaligus dengan try/except supaya kegagalan baca skema tidak
# menjatuhkan proses predict().
def _make_safe(original_func):
    def wrapper(*args, **kwargs):
        try:
            return original_func(*args, **kwargs)
        except Exception:
            return "Any"
    return wrapper


_gc_utils.get_type = _make_safe(_gc_utils.get_type)
_gc_utils.json_schema_to_python_type = _make_safe(_gc_utils.json_schema_to_python_type)
if hasattr(_gc_utils, "_json_schema_to_python_type"):
    _gc_utils._json_schema_to_python_type = _make_safe(_gc_utils._json_schema_to_python_type)

from db import classes_collection, accounts_collection, classifications_collection
from models import CreateClassRequest, CreateAccountRequest, AddPointsRequest

load_dotenv()

POIN_PER_KATEGORI = {"kimia": 2, "daur": 2, "residu": 1}
KATEGORI_VALID = {"kimia", "daur", "residu"}

HF_SPACE_ID = os.environ.get("HF_SPACE_ID", "flyclaws/smart-trash-bin-api")
HF_TOKEN = os.environ.get("HF_TOKEN", "")

app = FastAPI(title="Sortir Sampah - Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # sesuaikan ke domain frontend-mu saat produksi
    allow_methods=["*"],
    allow_headers=["*"],
)

_hf_client = None


def get_hf_client() -> Client:
    """Lazy-connect ke HF Space, dibuat sekali saja lalu dipakai ulang."""
    global _hf_client
    if _hf_client is None:
        if not HF_TOKEN:
            raise RuntimeError(
                "HF_TOKEN belum diset. Isi environment variable HF_TOKEN dengan "
                "token Hugging Face (scope Read) di backend/.env (lihat .env.example)."
            )
        _hf_client = Client(HF_SPACE_ID, hf_token=HF_TOKEN)
    return _hf_client


def slugify(name: str) -> str:
    slug = name.strip().lower()
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    return slug


def serialize_class(doc: dict) -> dict:
    return {
        "slug": doc["slug"],
        "name": doc["name"],
        "points": doc.get("points", 0),
        "total_buang": doc.get("total_buang", 0),
        "jumlah_kimia": doc.get("jumlah_kimia", 0),
        "jumlah_daur": doc.get("jumlah_daur", 0),
        "jumlah_residu": doc.get("jumlah_residu", 0),
    }


@app.get("/")
def root():
    return {"status": "ok", "message": "Sortir Sampah backend API is running."}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


# ---------------- Kelas ----------------

@app.get("/api/classes")
def get_all_classes():
    docs = classes_collection.find({})
    return [serialize_class(d) for d in docs]


@app.post("/api/classes")
def create_class(payload: CreateClassRequest):
    slug = slugify(payload.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Nama kelas tidak valid.")

    if classes_collection.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="Kelas dengan nama itu sudah ada.")

    doc = {
        "slug": slug,
        "name": payload.name.strip(),
        "points": 0,
        "total_buang": 0,
        "jumlah_kimia": 0,
        "jumlah_daur": 0,
        "jumlah_residu": 0,
    }
    classes_collection.insert_one(doc)
    return serialize_class(doc)


# ---------------- Leaderboard ----------------

@app.get("/api/leaderboard")
def get_leaderboard():
    docs = classes_collection.find({}).sort("points", -1)
    return [serialize_class(d) for d in docs]


# ---------------- Akun ----------------

@app.post("/api/accounts")
def create_account(payload: CreateAccountRequest):
    class_doc = classes_collection.find_one({"slug": payload.class_slug})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan.")

    account_id = str(uuid.uuid4())
    doc = {
        "_id": account_id,
        "account_name": payload.account_name.strip(),
        "class_slug": payload.class_slug,
        "class_name": class_doc["name"],
    }
    accounts_collection.insert_one(doc)
    return {
        "account_id": account_id,
        "account_name": doc["account_name"],
        "class_slug": doc["class_slug"],
        "class_name": doc["class_name"],
    }


@app.get("/api/accounts/{account_id}")
def get_account(account_id: str):
    doc = accounts_collection.find_one({"_id": account_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan.")
    return {
        "account_id": doc["_id"],
        "account_name": doc["account_name"],
        "class_slug": doc["class_slug"],
        "class_name": doc["class_name"],
    }


# ---------------- Klasifikasi Gambar (proxy ke HF Space) ----------------

@app.post("/api/classify")
async def classify_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Gagal membaca file gambar.")

    suffix = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        client = get_hf_client()
        result = client.predict(handle_file(tmp_path), api_name="/predict")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gagal menghubungi model AI: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    try:
        parsed = json.loads(result) if isinstance(result, str) else result
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(status_code=502, detail="Respons model AI tidak valid.")

    if isinstance(parsed, dict) and parsed.get("error"):
        raise HTTPException(status_code=502, detail=parsed["error"])

    category = parsed.get("category") if isinstance(parsed, dict) else None
    if category not in KATEGORI_VALID:
        category = "residu"

    response_payload = {
        "object_name": (parsed.get("object_name") if isinstance(parsed, dict) else None) or "Benda tidak diketahui",
        "category": category,
        "reason": (parsed.get("reason") if isinstance(parsed, dict) else None) or "",
        "confidence": parsed.get("confidence") if isinstance(parsed, dict) else None,
    }

    # Simpan record klasifikasi ke MongoDB
    try:
        classifications_collection.insert_one({
            "object_name": response_payload["object_name"],
            "category": response_payload["category"],
            "reason": response_payload["reason"],
            "confidence": response_payload["confidence"],
            "created_at": datetime.utcnow(),
            "image_name": file.filename,
            "image_type": mimetypes.guess_type(file.filename or "upload.jpg")[0] or "image/jpeg",
            "image_data": Binary(image_bytes),
            "raw_response": parsed if isinstance(parsed, dict) else {"raw": str(parsed)},
        })
    except Exception:
        # Jika penyimpanan ke database gagal, jangan blokir respons AI.
        pass

    return response_payload


# ---------------- Poin ----------------

@app.post("/api/points")
def add_points(payload: AddPointsRequest):
    if payload.category not in POIN_PER_KATEGORI:
        raise HTTPException(status_code=400, detail="Kategori tidak valid.")

    account = accounts_collection.find_one({"_id": payload.account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan.")

    field = {
        "kimia": "jumlah_kimia",
        "daur": "jumlah_daur",
        "residu": "jumlah_residu",
    }[payload.category]

    points_to_add = POIN_PER_KATEGORI[payload.category]

    classes_collection.update_one(
        {"slug": account["class_slug"]},
        {"$inc": {"points": points_to_add, "total_buang": 1, field: 1}},
    )

    updated = classes_collection.find_one({"slug": account["class_slug"]})
    return serialize_class(updated)