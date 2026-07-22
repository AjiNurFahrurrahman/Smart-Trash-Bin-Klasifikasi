// ---------------- AI Classifier ----------------
// Mengirim gambar sampah ke BACKEND kita sendiri (bukan langsung ke Hugging
// Face), yang lalu meneruskannya ke Space model custom (EfficientNetB0).
//
// Kenapa lewat backend? Karena Space HF-nya private, dan pemanggilan
// langsung dari browser (client-side) diblokir CORS oleh HF untuk Space
// private. Backend FastAPI kita jalan di server (bukan browser) sehingga
// tidak kena batasan itu, dan token HF pun tidak pernah terkirim ke browser.
//
// Backend endpoint: POST {VITE_BACKEND_API_URL}/api/classify (multipart/form-data, field "file")
// Mengembalikan objek { object_name, category, reason } dengan category
// salah satu dari 'kimia' | 'daur' | 'residu'.

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000";

export async function classifyImage(imageDataUrl) {
  const blob = await (await fetch(imageDataUrl)).blob();

  const formData = new FormData();
  formData.append("file", blob, "upload.jpg");

  const response = await fetch(`${BACKEND_URL}/api/classify`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = `status ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody.detail) detail = errBody.detail;
    } catch (_) {
      // response bukan JSON, biarkan pesan default
    }
    throw new Error(detail);
  }

  const parsed = await response.json();

  const category = ['kimia', 'daur', 'residu'].includes(parsed.category) ? parsed.category : 'residu';
  return {
    object_name: parsed.object_name || 'Benda tidak diketahui',
    category,
    reason: parsed.reason || ''
  };
}
