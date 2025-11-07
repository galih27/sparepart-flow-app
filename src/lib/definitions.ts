export type InventoryItem = {
  id?: string; // ID from Firestore
  id_inventory: string;
  part: string;
  deskripsi: string;
  harga_dpp: number;
  ppn: number;
  total_harga: number;
  satuan: string;
  available_qty: number;
  qty_baik: number;
  qty_rusak: number;
  lokasi: string;
  return_to_factory: number;
  qty_real: number;
};

export type User = {
  id?: string; // ID from Firestore
  id_user: string;
  users: string;
  nik: string;
  nama_teknisi: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Teknisi' | 'Manager';
};

export type DailyBon = {
  id?: string; // ID from Firestore
  id_dailybon: string;
  part: string;
  deskripsi: string;
  qty_dailybon: number;
  harga: number;
  status_bon: 'BON' | 'RECEIVED' | 'KMP' | 'CANCELED';
  teknisi: string;
  tanggal_dailybon: string;
  no_tkl: string;
  keterangan: string;
};

export type BonPDS = {
  id?: string; // ID from Firestore
  id_bonpds: string;
  part: string;
  deskripsi: string;
  qty_bonpds: number;
  status_bonpds: 'BON' | 'RECEIVED' | 'CANCELED';
  site_bonpds: string;
  tanggal_bonpds: string;
  no_transaksi: string;
  keterangan: string;
};

export type Msk = {
  id?: string; // ID from Firestore
  id_msk: string;
  part: string;
  deskripsi: string;
  qty_msk: number;
  status_msk: 'BON' | 'RECEIVED' | 'CANCELED';
  site_msk: string;
  tanggal_msk: string;
  no_transaksi: string;
  keterangan: string;
};
