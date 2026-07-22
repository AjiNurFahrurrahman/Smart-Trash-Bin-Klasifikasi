import * as THREE from 'three';

// Tutup "mengunyah": menutup cepat lalu kembali terbuka, seolah menelan sampah
function animateLidChew(binGroup) {
  const lidPivot = binGroup.userData.lidPivot;
  const baseRot = binGroup.userData.baseLidRotX;
  const closedRot = -0.08; // hampir menutup rapat
  const duration = 420;
  const startTime = performance.now();

  function step() {
    const now = performance.now();
    const p = Math.min(1, (now - startTime) / duration);
    let rot;
    if (p < 0.35) {
      const q = p / 0.35;
      rot = baseRot + (closedRot - baseRot) * q;
    } else {
      const q = (p - 0.35) / 0.65;
      const eased = 1 - Math.pow(1 - q, 2);
      rot = closedRot + (baseRot - closedRot) * eased;
    }
    lidPivot.rotation.x = rot;
    if (p < 1) requestAnimationFrame(step);
    else lidPivot.rotation.x = baseRot;
  }
  requestAnimationFrame(step);
}

// Percikan partikel kecil (debu/kilau) yang muncrat dari mulut tong
function spawnBurstParticles(scene, binGroup) {
  const count = 14;
  const particles = [];
  const colorHex = new THREE.Color(binGroup.children[0].material.color);

  for (let i = 0; i < count; i++) {
    const isSpark = Math.random() > 0.5;
    const geo = isSpark
      ? new THREE.TetrahedronGeometry(0.05 + Math.random()*0.04)
      : new THREE.SphereGeometry(0.035 + Math.random()*0.03, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: isSpark ? 0xffe9b0 : colorHex,
      transparent: true,
      opacity: 1
    });
    const p = new THREE.Mesh(geo, mat);
    const originY = 1.9;
    p.position.set(
      binGroup.position.x + (Math.random()-0.5)*0.3,
      originY,
      (Math.random()-0.5)*0.3
    );
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random()*1.8;
    p.userData.vel = new THREE.Vector3(
      Math.cos(angle)*speed*0.4,
      1.5 + Math.random()*1.8,
      Math.sin(angle)*speed*0.4
    );
    p.userData.gravity = -4.5;
    p.userData.life = 0;
    p.userData.maxLife = 0.6 + Math.random()*0.3;
    scene.add(p);
    particles.push(p);
  }

  function step() {
    const dt = 0.016;
    let allDead = true;
    particles.forEach(p => {
      p.userData.life += dt;
      if (p.userData.life < p.userData.maxLife) {
        allDead = false;
        p.userData.vel.y += p.userData.gravity * dt;
        p.position.addScaledVector(p.userData.vel, dt);
        p.material.opacity = 1 - (p.userData.life / p.userData.maxLife);
        p.rotation.x += dt*6;
        p.rotation.y += dt*4;
      } else if (p.parent) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
      }
    });
    if (!allDead) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Efek saat sampah "masuk" ke tong: glow pulse + tutup mengunyah + burst partikel
function pulseBin(scene, binGroup) {
  const glow = binGroup.userData.glow;
  glow.intensity = 3;
  binGroup.scale.set(1.15, 0.9, 1.15);
  setTimeout(() => {
    glow.intensity = 0.4;
    binGroup.scale.set(1,1,1);
  }, 260);

  animateLidChew(binGroup);
  spawnBurstParticles(scene, binGroup);
}

function spawnTrailSpark(scene, x, y, z) {
  const geo = new THREE.SphereGeometry(0.025 + Math.random()*0.02, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff2cf, transparent: true, opacity: 0.85 });
  const p = new THREE.Mesh(geo, mat);
  p.position.set(x, y, z);
  scene.add(p);
  const startTime = performance.now();
  const life = 0.35;
  function step() {
    const t = (performance.now() - startTime) / 1000;
    if (t < life) {
      p.material.opacity = 0.85 * (1 - t/life);
      p.scale.setScalar(1 - t/life*0.6);
      requestAnimationFrame(step);
    } else {
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    }
  }
  requestAnimationFrame(step);
}

// Menerbangkan foto yang baru difoto/diunggah masuk ke tong yang sesuai kategori,
// dengan lintasan melengkung, wobble seperti daun jatuh, dan jejak kilau.
export function flyPhotoIntoBin(scene, bins, imageDataUrl, targetBinId) {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(imageDataUrl, (texture) => {
      texture.encoding = THREE.sRGBEncoding;
      const aspect = texture.image.width / texture.image.height;
      const w = 2.2, h = 2.2 / aspect;
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, transparent:true });
      const plane = new THREE.Mesh(geo, mat);
      plane.position.set(0, 4.6, 3.5);
      plane.castShadow = true;
      scene.add(plane);

      const bin = bins[targetBinId];
      const start = { x: 0, y: 4.6, z: 3.5, scale: 1 };
      const end = { x: bin.position.x, y: 1.3, z: 0, scale: 0.05 };
      const arcHeight = 1.6;
      const duration = 1300;
      const startTime = performance.now();
      let lastTrailTime = 0;

      function easeInOutQuad(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
      function easeInCubic(t) { return t*t*t; }

      function step() {
        const now = performance.now();
        const p = Math.min(1, (now - startTime) / duration);
        const moveP = easeInOutQuad(p);
        const fallP = easeInCubic(p);

        plane.position.x = start.x + (end.x - start.x) * moveP;
        plane.position.z = start.z + (end.z - start.z) * moveP;

        const straightY = start.y + (end.y - start.y) * fallP;
        const arcOffset = Math.sin(p * Math.PI) * arcHeight * (1 - p*0.6);
        plane.position.y = straightY + arcOffset;

        const wobbleDamp = 1 - p*0.85;
        plane.rotation.z = Math.sin(p * 18) * 0.35 * wobbleDamp;
        plane.rotation.x = Math.sin(p * 11 + 1) * 0.25 * wobbleDamp;
        plane.rotation.y += 0.12;

        const squash = 1 + Math.sin(p * Math.PI * 3) * 0.06 * wobbleDamp;
        const scale = (start.scale + (end.scale - start.scale) * easeInCubic(p));
        plane.scale.set(scale * squash, scale / squash, scale);

        mat.opacity = 1 - Math.pow(p, 7);

        if (now - lastTrailTime > 45 && p < 0.9) {
          spawnTrailSpark(scene, plane.position.x, plane.position.y, plane.position.z);
          lastTrailTime = now;
        }

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          scene.remove(plane);
          geo.dispose();
          mat.dispose();
          texture.dispose();
          pulseBin(scene, bin);
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  });
}
