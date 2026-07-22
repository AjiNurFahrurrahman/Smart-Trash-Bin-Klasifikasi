// ---------------- Deteksi & capture kamera ----------------
// Mobile: dua pilihan sederhana (facingMode 'environment'/'user').
// Desktop/Laptop: minta izin dulu (setelah tombol "Aktifkan Kamera" diklik),
// lalu enumerasi semua device video yang terdeteksi (built-in / webcam eksternal).

export function isMobileDevice() {
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const touchLikely =
    "ontouchstart" in window &&
    Math.min(window.innerWidth, window.innerHeight) < 900;
  return uaMobile || touchLikely;
}

const CAM_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="#e8c468" stroke-width="1.6"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4"/></svg>`;

// onPhotoReady(dataUrl, mediaType) dipanggil saat user selesai jepret/unggah foto (masuk step-preview)
export function initCameraCapture(onPhotoReady) {
  const stepSelect = document.getElementById("step-select");
  const stepCamera = document.getElementById("step-camera");
  const stepPreview = document.getElementById("step-preview");
  const cameraOptionsEl = document.getElementById("camera-options");
  const cameraLoadingEl = document.getElementById("camera-loading");
  const cameraVideo = document.getElementById("camera-video");
  const captureCanvas = document.getElementById("capture-canvas");
  const captureBtn = document.getElementById("capture-btn");
  const switchCamBtn = document.getElementById("switch-cam-btn");
  const uploadLink = document.getElementById("upload-link");
  const fileInput = document.getElementById("file-input");
  const retakeLink = document.getElementById("retake-link");
  const previewImg = document.getElementById("preview-img");
  const errorMsg = document.getElementById("error-msg");

  let activeStream = null;
  let videoInputDevices = [];

  // Penanda waktu interaksi kamera terakhir. Dipakai supaya klik "Allow" pada dialog
  // izin kamera browser (mis. Brave/Chrome, yang kadang bocor jadi event klik di
  // halaman) tidak keliru dianggap "klik di luar panel" dan menutup panel foto.
  let lastCameraInteractionAt = 0;

  function markCameraInteraction() {
    lastCameraInteractionAt = Date.now();
  }

  function showStep(stepEl) {
    [stepSelect, stepCamera, stepPreview].forEach((s) =>
      s.classList.remove("active"),
    );
    stepEl.classList.add("active");
  }

  function renderCamOption(label, sub, onClick) {
    const el = document.createElement("div");
    el.className = "cam-option";
    el.innerHTML = `${CAM_ICON}<div><div class="cam-label">${label}</div><div class="cam-sub">${sub}</div></div>`;
    el.addEventListener("click", () => {
      markCameraInteraction();
      onClick();
    });
    cameraOptionsEl.appendChild(el);
    return el;
  }

  async function buildCameraOptions() {
    cameraOptionsEl.innerHTML = "";
    errorMsg.style.display = "none";

    if (isMobileDevice()) {
      renderCamOption(
        "Kamera Belakang",
        "Untuk memotret barang di depanmu",
        () => openCamera({ facingMode: { ideal: "environment" } }),
      );
      renderCamOption("Kamera Depan", "Untuk selfie / barang di dekatmu", () =>
        openCamera({ facingMode: { ideal: "user" } }),
      );
      return;
    }

    // Laptop/PC: tampilkan tombol dulu, jangan minta izin kamera otomatis saat halaman dibuka
    renderCamOption(
      "Aktifkan Kamera",
      "Klik untuk mendeteksi kamera bawaan / webcam",
      requestDesktopCameras,
    );
  }

  async function requestDesktopCameras() {
    cameraOptionsEl.innerHTML = "";
    errorMsg.style.display = "none";
    cameraLoadingEl.style.display = "block";
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      markCameraInteraction(); // dialog izin browser baru saja ditutup -- jangan anggap klik di luar panel
      tempStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      videoInputDevices = devices.filter((d) => d.kind === "videoinput");
      cameraLoadingEl.style.display = "none";

      if (videoInputDevices.length === 0) {
        errorMsg.textContent =
          "Tidak ada kamera yang terdeteksi di perangkat ini.";
        errorMsg.style.display = "block";
        renderCamOption(
          "Coba Lagi",
          "Klik untuk mendeteksi ulang kamera",
          requestDesktopCameras,
        );
        return;
      }

      videoInputDevices.forEach((d, i) => {
        const rawLabel = d.label || `Kamera ${i + 1}`;
        const isBuiltin = /built-?in|integrated|facetime/i.test(rawLabel);
        const niceLabel = isBuiltin
          ? "Kamera Bawaan Laptop"
          : rawLabel || "Webcam / Kamera Eksternal";
        renderCamOption(niceLabel, rawLabel, () =>
          openCamera({ deviceId: { exact: d.deviceId } }),
        );
      });
    } catch (err) {
      cameraLoadingEl.style.display = "none";
      errorMsg.textContent =
        "Tidak bisa mengakses kamera: " +
        err.message +
        ". Kamu masih bisa unggah foto dari file.";
      errorMsg.style.display = "block";
      renderCamOption(
        "Coba Lagi",
        "Klik untuk meminta izin kamera lagi",
        requestDesktopCameras,
      );
    }
  }

  async function openCamera(videoConstraints) {
    errorMsg.style.display = "none";
    stopActiveStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      markCameraInteraction(); // dialog izin browser baru saja ditutup -- jangan anggap klik di luar panel
      activeStream = stream;
      cameraVideo.srcObject = stream;
      cameraVideo.muted = true;
      try {
        await cameraVideo.play();
      } catch (playErr) {
        console.warn("video.play() gagal:", playErr);
      }
      showStep(stepCamera);
    } catch (err) {
      errorMsg.textContent = "Tidak bisa membuka kamera itu: " + err.message;
      errorMsg.style.display = "block";
      showStep(stepSelect);
    }
  }

  function stopActiveStream() {
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
      activeStream = null;
    }
  }

  captureBtn.addEventListener("click", () => {
    markCameraInteraction();
    const w = cameraVideo.videoWidth,
      h = cameraVideo.videoHeight;
    if (!w || !h) return;
    captureCanvas.width = w;
    captureCanvas.height = h;
    const ctx = captureCanvas.getContext("2d");
    ctx.drawImage(cameraVideo, 0, 0, w, h);
    const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
    previewImg.src = dataUrl;
    stopActiveStream();
    showStep(stepPreview);
    onPhotoReady(dataUrl, "image/jpeg");
  });

  switchCamBtn.addEventListener("click", () => {
    markCameraInteraction();
    stopActiveStream();
    showStep(stepSelect);
    buildCameraOptions();
  });

  uploadLink.addEventListener("click", () => {
    markCameraInteraction();
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    errorMsg.style.display = "none";
    if (!file.type.startsWith("image/")) {
      errorMsg.textContent = "File harus berupa gambar.";
      errorMsg.style.display = "block";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImg.src = ev.target.result;
      showStep(stepPreview);
      onPhotoReady(ev.target.result, file.type);
    };
    reader.readAsDataURL(file);
  }

  retakeLink.addEventListener("click", () => {
    markCameraInteraction();
    fileInput.value = "";
    showStep(stepSelect);
    buildCameraOptions();
  });

  return {
    buildCameraOptions,
    stopActiveStream,
    isRecentlyInteracted() {
      return Date.now() - lastCameraInteractionAt < 800;
    },
    resetToSelectStep() {
      fileInput.value = "";
      stopActiveStream();
      showStep(stepSelect);
      buildCameraOptions();
    },
  };
}
