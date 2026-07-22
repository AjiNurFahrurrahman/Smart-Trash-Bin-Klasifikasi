import * as THREE from 'three';

// Membuat label (ikon daur ulang + teks) sebagai tekstur untuk ditempel di badan tong
export function drawLabelTexture(label) {
  const W = 300, H = 260;
  const cnv = document.createElement('canvas');
  cnv.width = W; cnv.height = H;
  const ctx = cnv.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W/2, 46);

  const cx = W/2, cy = 155, r = 62;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const startAngle = (i * 120 + 12) * Math.PI/180;
    const endAngle = (i * 120 + 92) * Math.PI/180;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.stroke();
    const ax = cx + r * Math.cos(endAngle);
    const ay = cy + r * Math.sin(endAngle);
    const tangent = endAngle + Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(ax + 17*Math.cos(tangent+2.6), ay + 17*Math.sin(tangent+2.6));
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax + 17*Math.cos(tangent-2.6), ay + 17*Math.sin(tangent-2.6));
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cnv);
  tex.needsUpdate = true;
  return tex;
}

// Profil tong (radius vs tinggi) yang diputar 360° -> bentuk tong 3D nyata
export function makeBinBodyGeometry() {
  const pts = [
    new THREE.Vector2(0.0,   0.00),
    new THREE.Vector2(0.62,  0.00),
    new THREE.Vector2(0.66,  0.05),
    new THREE.Vector2(0.60,  0.10),
    new THREE.Vector2(0.66,  0.55),
    new THREE.Vector2(0.78,  1.55),
    new THREE.Vector2(0.86,  1.95),
    new THREE.Vector2(0.90,  2.00),
    new THREE.Vector2(0.94,  2.03),
    new THREE.Vector2(0.90,  2.06),
    new THREE.Vector2(0.83,  2.06)
  ];
  return new THREE.LatheGeometry(pts, 32);
}

// Membangun satu tong lengkap (badan, interior gelap, tutup ayun, label, bayangan, glow)
// dari konfigurasi { id, label, color, x }. Dipakai oleh tong-kimia.js, tong-daur-ulang.js, tong-residu.js.
export function buildBin(bt, binLabelMeshes) {
  const group = new THREE.Group();

  // Badan tong 3D
  const bodyGeo = makeBinBodyGeometry();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bt.color, roughness: 0.38, metalness: 0.12 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Interior gelap (terlihat dari mulut tong yang terbuka)
  const innerGeo = new THREE.CylinderGeometry(0.78, 0.5, 1.9, 24, 1, true);
  const innerMat = new THREE.MeshStandardMaterial({ color: 0x0c1310, side: THREE.BackSide, roughness: 0.9 });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.y = 1.05;
  group.add(inner);
  const innerFloor = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshStandardMaterial({ color: 0x0c1310, roughness:0.9 }));
  innerFloor.rotation.x = -Math.PI/2;
  innerFloor.position.y = 0.1;
  group.add(innerFloor);

  // Tutup terbuka (miring ke belakang, seperti engsel)
  const lidGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.06, 32);
  const lidMat = new THREE.MeshStandardMaterial({ color: 0x141b16, roughness: 0.5, metalness: 0.2 });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.castShadow = true;
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 2.05, -0.9);
  lid.position.set(0, 0, 0.9);
  lidPivot.add(lid);
  lidPivot.rotation.x = -1.15; // membuka ke belakang
  group.add(lidPivot);

  // Label melengkung di badan depan tong
  const labelTex = drawLabelTexture(bt.label);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelGeo = new THREE.CylinderGeometry(0.885, 0.79, 1.15, 24, 1, true, -0.75, 1.5);
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = 1.0;
  label.userData.binId = bt.id;
  group.add(label);
  if (binLabelMeshes) binLabelMeshes.push(label);

  // bayangan lonjong di lantai bawah tong
  const shadowGeo = new THREE.CircleGeometry(0.85, 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI/2;
  shadowMesh.position.y = 0.015;
  group.add(shadowMesh);

  const glow = new THREE.PointLight(bt.color, 0.45, 3.5);
  glow.position.set(0, 1.2, 0.9);
  group.add(glow);

  group.position.x = bt.x;
  group.userData = { id: bt.id, glow, lidPivot, baseLidRotX: lidPivot.rotation.x, originalX: bt.x };
  return group;
}
