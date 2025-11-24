
export type Permissions = {
  dashboard_view: boolean;
  dashboard_edit: boolean;
  reportstock_view: boolean;
  reportstock_edit: boolean;
  reportstock_delete: boolean;
  bonpds_view: boolean;
  bonpds_edit: boolean;
  bonpds_delete: boolean;
  dailybon_view: boolean;
  dailybon_edit: boolean;
  dailybon_delete: boolean;
  userrole_view: boolean;
  userrole_edit: boolean;
  userrole_delete: boolean;
  msk_view: boolean;
  msk_edit: boolean;
  msk_delete: boolean;
  nr_view: boolean;
  nr_edit: boolean;
  nr_delete: boolean;
  tsn_view: boolean;
  tsn_edit: boolean;
  tsn_delete: boolean;
  tsp_view: boolean;
  tsp_edit: boolean;
  tsp_delete: boolean;
  sob_view: boolean;
  sob_edit: boolean;
  sob_delete: boolean;
};

export type Role = 'Admin' | 'Teknisi' | 'Manager' | 'Viewer';

export type InventoryItem = {
  id?: string; // ID from Firestore
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
  return_to_factory: string;
  qty_real: number;
};

export type User = {
  id?: string; // ID from Firestore
  users: string;
  nik: string;
  nama_teknisi: string;
  email: string;
  password?: string;
  role: Role;
  permissions: Permissions;
  photo?: string;
};

export type DailyBon = {
  id?: string; // ID from Firestore
  part: string;
  deskripsi: string;
  qty_dailybon: number;
  harga: number;
  status_bon: 'BON' | 'RECEIVED' | 'KMP' | 'CANCELED';
  teknisi: string;
  tanggal_dailybon: string;
  no_tkl: string;
  keterangan: string;
  stock_updated?: boolean; // Flag to track if stock has been updated
};

export type BonPDS = {
  id?: string; // ID from Firestore
  part: string;
  deskripsi: string;
  qty_bonpds: number;
  status_bonpds: 'BON' | 'RECEIVED' | 'CANCELED';
  site_bonpds: string;
  tanggal_bonpds: string;
  no_transaksi: string;
  keterangan: string;
  stock_updated?: boolean; // Flag to track if stock has been updated
};

export type Msk = {
  id?: string; // ID from Firestore
  part: string;
  deskripsi: string;
  qty_msk: number;
  status_msk: 'BON' | 'RECEIVED' | 'CANCELED';
  site_msk: string;
  tanggal_msk: string;
  no_transaksi: string;
  keterangan: string;
  stock_updated?: boolean; // Flag to track if stock has been updated
};

// Placeholder types for new entities
export type Nr = {
  id?: string;
  name: string;
};
export type Tsn = {
  id?: string;
  name: string;
};
export type Tsp = {
  id?: string;
  name: string;
};
export type Sob = {
  id?: string;
  name: string;
};
