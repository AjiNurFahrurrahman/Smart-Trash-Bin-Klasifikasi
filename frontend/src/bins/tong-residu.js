import { buildBin } from './bin-shared.js';

// Tong Sampah 3: Residu / Tidak Bisa Didaur Ulang (bungkus snack, popok, sisa makanan, puntung rokok)
export function createTongResidu(binLabelMeshes) {
  const config = { id: 'residu', label: 'RESIDU', color: 0x6b7280, x: 3.6 };
  return buildBin(config, binLabelMeshes);
}

export const TONG_RESIDU_DESKRIPSI = {
  title: 'Tong Tidak Bisa Daur Ulang',
  color: '#6b7280',
  desc: 'Untuk sampah sisa lainnya seperti bungkus snack berlapis, popok, sisa makanan, dan puntung rokok.'
};
