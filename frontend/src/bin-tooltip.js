import * as THREE from 'three';
import { TONG_KIMIA_DESKRIPSI } from './bins/tong-kimia.js';
import { TONG_DAUR_ULANG_DESKRIPSI } from './bins/tong-daur-ulang.js';
import { TONG_RESIDU_DESKRIPSI } from './bins/tong-residu.js';

const BIN_DESCRIPTIONS = {
  kimia: TONG_KIMIA_DESKRIPSI,
  daur: TONG_DAUR_ULANG_DESKRIPSI,
  residu: TONG_RESIDU_DESKRIPSI
};

// Klik logo/label di badan tong -> tampilkan popup deskripsi jenis sampah untuk tong itu.
// isUploadPanelHidden() dipakai supaya interaksi ini nonaktif selagi panel foto sedang terbuka.
export function initBinTooltip(camera, renderer, binLabelMeshes, isUploadPanelHidden) {
  const binInfoEl = document.getElementById('bin-info');
  const binInfoTitle = document.getElementById('bin-info-title');
  const binInfoDesc = document.getElementById('bin-info-desc');

  function showBinInfo(binId) {
    const meta = BIN_DESCRIPTIONS[binId];
    if (!meta) return;
    binInfoTitle.textContent = meta.title;
    binInfoTitle.style.color = meta.color;
    binInfoDesc.textContent = meta.desc;
    binInfoEl.classList.add('show');
  }

  function hideBinInfo() {
    binInfoEl.classList.remove('show');
  }

  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();

  renderer.domElement.addEventListener('click', (e) => {
    if (!isUploadPanelHidden()) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);

    const visibleLabels = binLabelMeshes.filter(m => m.visible);
    const intersects = raycaster.intersectObjects(visibleLabels, false);

    if (intersects.length > 0) {
      showBinInfo(intersects[0].object.userData.binId);
    } else {
      hideBinInfo();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target !== renderer.domElement) hideBinInfo();
  });

  return { hideBinInfo };
}
