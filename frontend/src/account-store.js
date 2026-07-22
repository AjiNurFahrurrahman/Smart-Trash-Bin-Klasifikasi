// ---------------- Data layer Kelas & Akun ----------------
// Versi fullstack: memanggil backend FastAPI (backend/) yang terhubung ke MongoDB Atlas.
// account_id disimpan di localStorage browser supaya akun tetap aktif walau halaman di-refresh.

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
const LOCAL_KEY = 'sortir-sampah:account_id';

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    let detail = 'Terjadi kesalahan pada server.';
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (e) { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function getAllClasses() {
  try {
    return await apiFetch('/api/classes');
  } catch (e) {
    console.error('getAllClasses gagal:', e);
    return [];
  }
}

export async function createClass(name) {
  return apiFetch('/api/classes', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function addPointsToClass(classSlug, category) {
  const accountId = localStorage.getItem(LOCAL_KEY);
  if (!accountId) return;
  try {
    await apiFetch('/api/points', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, category })
    });
  } catch (e) {
    console.error('addPointsToClass gagal:', e);
  }
}

export async function getMyAccount() {
  const accountId = localStorage.getItem(LOCAL_KEY);
  if (!accountId) return null;
  try {
    const acc = await apiFetch('/api/accounts/' + accountId);
    return { accountName: acc.account_name, classSlug: acc.class_slug, className: acc.class_name };
  } catch (e) {
    // akun mungkin sudah dihapus di server -> bersihkan juga di sisi klien
    localStorage.removeItem(LOCAL_KEY);
    return null;
  }
}

export async function setMyAccount(accountName, classSlug, className) {
  const acc = await apiFetch('/api/accounts', {
    method: 'POST',
    body: JSON.stringify({ account_name: accountName, class_slug: classSlug })
  });
  localStorage.setItem(LOCAL_KEY, acc.account_id);
  return { accountName: acc.account_name, classSlug: acc.class_slug, className: acc.class_name };
}

export async function clearMyAccount() {
  localStorage.removeItem(LOCAL_KEY);
}
