import { buildBin } from './bin-shared.js';

// Tong Sampah 2: Daur Ulang (botol plastik, kaleng minuman, kardus, kertas, botol/kaca bersih)
export function createTongDaurUlang(binLabelMeshes) {
  const config = { id: 'daur', label: 'DAUR ULANG', color: 0x3aa66b, x: 0 };
  return buildBin(config, binLabelMeshes);
}

export const TONG_DAUR_ULANG_DESKRIPSI = {
  title: 'Tong Daur Ulang',
  color: '#3aa66b',
  desc: 'Untuk sampah yang bisa didaur ulang seperti botol plastik, kaleng minuman, kardus, kertas, dan botol/kaca bersih.'
};
