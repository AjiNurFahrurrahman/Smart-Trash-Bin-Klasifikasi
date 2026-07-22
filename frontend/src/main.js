import "./style.css";
import bodyHtml from "./body.html?raw";

import {
  createGardenScene,
  startRenderLoop,
  prepareMobileSingleBin,
  restoreBinsFull,
} from "./scene-garden.js";
import { createTongKimia } from "./bins/tong-kimia.js";
import { createTongDaurUlang } from "./bins/tong-daur-ulang.js";
import { createTongResidu } from "./bins/tong-residu.js";
import { flyPhotoIntoBin } from "./flight-animation.js";
import { initCameraCapture, isMobileDevice } from "./camera-capture.js";
import { classifyImage } from "./ai-classifier.js";
import { initLeaderboard } from "./leaderboard.js";
import { initAccountPanel } from "./account-panel.js";
import { initBinTooltip } from "./bin-tooltip.js";

// 1. Pasang markup UI ke halaman
document.getElementById("app").innerHTML = bodyHtml;

// 2. Buat scene taman (langit, rumput, pohon, cahaya) + kamera & renderer
const canvasHolder = document.getElementById("canvas-holder");
const { scene, camera, renderer } = createGardenScene(canvasHolder);

// 3. Buat 3 tong sampah (masing-masing dari modul terpisah) dan daftarkan label untuk raycasting
const binLabelMeshes = [];
const tongKimia = createTongKimia(binLabelMeshes);
const tongDaurUlang = createTongDaurUlang(binLabelMeshes);
const tongResidu = createTongResidu(binLabelMeshes);
scene.add(tongKimia, tongDaurUlang, tongResidu);

const bins = { kimia: tongKimia, daur: tongDaurUlang, residu: tongResidu };

// 4. Mulai render loop (animasi idle tong bergoyang halus)
startRenderLoop(scene, camera, renderer, bins);

// 5. Popup deskripsi tong saat logo tong diklik
const uploadPanel = document.getElementById("upload-panel");
initBinTooltip(camera, renderer, binLabelMeshes, () =>
  uploadPanel.classList.contains("hidden"),
);

// 6. Leaderboard Kelas (pojok kiri atas) & Kelas/Akun (pojok kanan atas)
initLeaderboard();
const accountPanel = initAccountPanel();

// 7. Deteksi device: mobile fokus ke 1 tong saat hasil tampil, desktop tetap tampilkan 3 tong
const isMobile = isMobileDevice();

// 8. Tombol kamera bulat mengambang -- tampilan awal sebelum panel "Foto Sampahmu" dibuka
const cameraFab = document.getElementById("camera-fab");
const cameraFabLabel = document.getElementById("camera-fab-label");
const statusLine = document.getElementById("status-line");
const statusText = document.getElementById("status-text");
const resultBanner = document.getElementById("result-banner");
const resultObj = document.getElementById("result-obj");
const resultCat = document.getElementById("result-cat");
const resultReason = document.getElementById("result-reason");
const analyzeBtn = document.getElementById("analyze-btn");
const errorMsg = document.getElementById("error-msg");

const CAT_META = {
  kimia: { label: "Masuk Tong Limbah Kimia", color: "#e0533d" },
  daur: { label: "Masuk Tong Daur Ulang", color: "#3aa66b" },
  residu: { label: "Masuk Tong Tidak Bisa Daur Ulang", color: "#6b7280" },
};

let currentImageDataUrl = null;
let currentMediaType = "image/jpeg";

// 9. Modul kamera: dipanggil setiap kali user selesai jepret/unggah foto
const cameraCapture = initCameraCapture((dataUrl, mediaType) => {
  currentImageDataUrl = dataUrl;
  currentMediaType = mediaType;
});

function openUploadPanel() {
  cameraFab.classList.add("hidden");
  cameraFabLabel.classList.add("hidden");
  uploadPanel.classList.remove("hidden");
  cameraCapture.resetToSelectStep();
}

function closeUploadPanel() {
  cameraCapture.stopActiveStream();
  uploadPanel.classList.add("hidden");
  cameraFab.classList.remove("hidden");
  cameraFabLabel.classList.remove("hidden");
}

cameraFab.addEventListener("click", openUploadPanel);

document.addEventListener("click", (e) => {
  if (uploadPanel.classList.contains("hidden")) return;
  if (uploadPanel.contains(e.target)) return;
  if (cameraFab.contains(e.target)) return;
  // Jangan tutup panel kalau klik ini adalah "efek samping" dari dialog izin kamera
  // browser (mis. Brave/Chrome) yang baru saja ditutup -- bukan klik user yang sengaja.
  if (cameraCapture.isRecentlyInteracted()) return;
  closeUploadPanel();
});

function resetUI() {
  currentImageDataUrl = null;
  errorMsg.style.display = "none";
  resultBanner.classList.remove("show");
  analyzeBtn.disabled = false;
  closeUploadPanel();

  if (isMobile) {
    restoreBinsFull(camera, bins);
  }
}

analyzeBtn.addEventListener("click", analyzeImage);

async function analyzeImage() {
  if (!currentImageDataUrl) return;
  analyzeBtn.disabled = true;
  statusLine.style.display = "flex";
  statusText.textContent = "Menganalisis gambar...";
  errorMsg.style.display = "none";

  try {
    const result = await classifyImage(currentImageDataUrl, currentMediaType);
    const category = result.category;
    const meta = CAT_META[category];

    statusText.textContent = "Mengirim ke tong...";
    uploadPanel.classList.add("hidden");

    resultObj.textContent = result.object_name;
    resultCat.textContent = meta.label;
    resultCat.style.color = meta.color;
    resultReason.textContent = getResultDescription(
      result.object_name,
      category,
      result.reason,
      result.confidence,
    );

    // Tambahkan poin ke kelas aktif (kalau user sudah punya akun/kelas)
    await accountPanel.awardPointsForCategory(category);

    if (isMobile) {
      prepareMobileSingleBin(camera, bins, category);
      await new Promise((r) => setTimeout(r, 550));
    }

    await flyPhotoIntoBin(scene, bins, currentImageDataUrl, category);

    statusLine.style.display = "none";
    resultBanner.classList.add("show");
    setTimeout(resetUI, 4000);
  } catch (err) {
    statusLine.style.display = "none";
    errorMsg.textContent = "Terjadi kesalahan: " + err.message;
    errorMsg.style.display = "block";
    analyzeBtn.disabled = false;
  }
}

function getResultDescription(objectName, category, reason, confidence) {
  const categoryName =
    {
      kimia: "Tong Limbah Kimia",
      daur: "Tong Daur Ulang",
      residu: "Tong Tidak Bisa Daur Ulang",
    }[category] || "Tong Tidak Dikenal";

  let description = reason
    ? reason
    : "Sampah ini dikategorikan sebagai plastik, jadi dapat didaur ulang.";

  if (typeof confidence === "number" || typeof confidence === "string") {
    const confidenceValue = `${confidence}`.replace(/[^0-9.]/g, "");
    if (confidenceValue) {
      description = `Dengan keyakinan ${confidenceValue}%. ${description}`;
    }
  }

  return `Sampah ini dikategorikan sebagai ${objectName}, jadi dapat dimasukkan ke ${categoryName}. ${description}`;
}
