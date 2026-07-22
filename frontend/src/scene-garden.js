import * as THREE from 'three';

// Membuat scene bergaya taman: langit, rumput bertekstur, jalan setapak,
// pohon-pohon low-poly, bunga-bunga, dan pencahayaan siang hari.
// Mengembalikan { scene, camera, renderer } yang siap dipakai main.js.
export function createGardenScene(canvasHolder) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe9c8, 14, 34);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 5.2, 12);
  camera.lookAt(0, 1.4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  canvasHolder.appendChild(renderer.domElement);

  // Cahaya siang hari: langit biru terang & pantulan rumput hijau dari bawah
  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x8fbf6a, 1.0);
  scene.add(hemi);
  const dirLight = new THREE.DirectionalLight(0xfff6da, 1.25);
  dirLight.position.set(6, 14, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.left = -10;
  dirLight.shadow.camera.right = 10;
  dirLight.shadow.camera.top = 10;
  dirLight.shadow.camera.bottom = -10;
  scene.add(dirLight);
  const ambientFill = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambientFill);

  // Tanah rumput dengan sedikit variasi warna (bercak rumput natural)
  function makeGrassTexture() {
    const cnv = document.createElement('canvas');
    cnv.width = 512; cnv.height = 512;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#5fa84a';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const shade = Math.random() > 0.5 ? 'rgba(80,150,60,0.35)' : 'rgba(120,190,90,0.3)';
      ctx.fillStyle = shade;
      const x = Math.random()*512, y = Math.random()*512;
      const s = 4 + Math.random()*10;
      ctx.beginPath();
      ctx.ellipse(x, y, s, s*0.4, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(cnv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }

  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({ map: makeGrassTexture(), roughness: 0.95 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // sedikit jalan setapak paving di bawah tong-tong sampah
  const pathGeo = new THREE.PlaneGeometry(9, 6);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xcbb896, roughness: 0.85 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI/2;
  path.position.y = 0.005;
  path.receiveShadow = true;
  scene.add(path);

  // Pohon-pohon sederhana low-poly di sekeliling taman
  function makeTree(x, z, scale) {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.7;
    trunk.castShadow = true;
    group.add(trunk);

    const leafColors = [0x4c9a4a, 0x5cae55, 0x448a44];
    for (let i = 0; i < 3; i++) {
      const r = 0.95 - i*0.18;
      const leafGeo = new THREE.SphereGeometry(r, 8, 8);
      const leafMat = new THREE.MeshStandardMaterial({ color: leafColors[i % leafColors.length], roughness: 0.85 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set((Math.random()-0.5)*0.4, 1.7 + i*0.55, (Math.random()-0.5)*0.4);
      leaf.castShadow = true;
      group.add(leaf);
    }
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    return group;
  }

  const treePositions = [
    [-8.5, -4, 1.1], [8.7, -3.5, 0.95], [-9.5, 2.5, 1.25], [9.3, 3, 1.05],
    [-6.5, -8, 0.85], [6.8, -8.5, 0.9], [-5, 6.5, 1.0], [5.2, 7, 0.95],
    [0, -10, 1.1], [-11, -1, 1.0], [11, -0.5, 1.05]
  ];
  treePositions.forEach(([x, z, s]) => scene.add(makeTree(x, z, s)));

  // Bunga-bunga kecil warna-warni tersebar di rumput
  function makeFlowerPatch(x, z, color) {
    const geo = new THREE.SphereGeometry(0.09, 6, 6);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const flower = new THREE.Mesh(geo, mat);
    flower.position.set(x, 0.09, z);
    return flower;
  }
  const flowerColors = [0xff6b8a, 0xffd166, 0xffffff, 0xc77dff];
  for (let i = 0; i < 26; i++) {
    const angle = Math.random()*Math.PI*2;
    const dist = 5.5 + Math.random()*5.5;
    const fx = Math.cos(angle)*dist, fz = Math.sin(angle)*dist*0.7 - 2;
    scene.add(makeFlowerPatch(fx, fz, flowerColors[i % flowerColors.length]));
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

// Animasi idle: tong-tong bergoyang halus naik-turun
export function startRenderLoop(scene, camera, renderer, bins) {
  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now()/1000;
    let i = 0;
    Object.values(bins).forEach(b => { b.position.y = Math.sin(t + i) * 0.03; i++; });
    renderer.render(scene, camera);
  }
  animate();
}

// ---------------- Mode tampilan mobile: fokus ke 1 tong saja ----------------
function tweenCameraTo(camera, pos, lookAt, duration) {
  const startPos = camera.position.clone();
  const startTime = performance.now();
  function step() {
    const p = Math.min(1, (performance.now() - startTime) / duration);
    const e = 1 - Math.pow(1 - p, 3);
    camera.position.lerpVectors(startPos, new THREE.Vector3(pos.x, pos.y, pos.z), e);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function tweenBinX(binGroup, targetX, duration) {
  const startX = binGroup.position.x;
  const startTime = performance.now();
  function step() {
    const p = Math.min(1, (performance.now() - startTime) / duration);
    const e = 1 - Math.pow(1 - p, 3);
    binGroup.position.x = startX + (targetX - startX) * e;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Menampilkan hanya 1 tong (sesuai kategori) di tengah, 2 tong lain disembunyikan,
// kamera di-zoom lebih dekat -- dipakai khusus untuk layar mobile yang lebih kecil.
export function prepareMobileSingleBin(camera, bins, category) {
  Object.values(bins).forEach(b => {
    if (b.userData.id === category) {
      b.visible = true;
      tweenBinX(b, 0, 500);
    } else {
      b.visible = false;
    }
  });
  tweenCameraTo(camera, { x: 0, y: 4.3, z: 8.4 }, { x: 0, y: 1.4, z: 0 }, 500);
}

export function restoreBinsFull(camera, bins) {
  Object.values(bins).forEach(b => {
    b.visible = true;
    tweenBinX(b, b.userData.originalX, 500);
  });
  tweenCameraTo(camera, { x: 0, y: 5.2, z: 12 }, { x: 0, y: 1.4, z: 0 }, 500);
}
