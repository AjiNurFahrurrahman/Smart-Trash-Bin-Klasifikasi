import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection

load_dotenv()

MONGODB_URI = os.environ.get("MONGODB_URI", "")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "smart_trash_bin")

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI belum diset. Isi environment variable MONGODB_URI dengan "
        "connection string dari MongoDB Atlas-mu (lihat .env.example)."
    )

_client = MongoClient(MONGODB_URI)
_db = _client[DB_NAME]

classes_collection: Collection = _db["classes"]
accounts_collection: Collection = _db["accounts"]

# Index supaya slug kelas unik & pencarian cepat
classes_collection.create_index("slug", unique=True)
