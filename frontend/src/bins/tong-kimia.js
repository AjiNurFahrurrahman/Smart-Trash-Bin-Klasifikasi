import { buildBin } from './bin-shared.js';

// Tong Sampah 1: Limbah Kimia (baterai, kaleng cat, obat-obatan, cairan kimia, oli, elektronik)
export function createTongKimia(binLabelMeshes) {
  const config = { id: 'kimia', label: 'KIMIA', color: 0xe0533d, x: -3.6 };
  return buildBin(config, binLabelMeshes);
}

export const TONG_KIMIA_DESKRIPSI = {
  title: 'Tong Limbah Kimia',
  color: '#e0533d',
  desc: 'Untuk sampah berbahaya seperti baterai, kaleng cat, obat-obatan, cairan kimia, oli, dan barang elektronik.'
};
