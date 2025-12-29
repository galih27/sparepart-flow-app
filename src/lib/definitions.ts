
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

export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  Admin: {
    dashboard_view: true, dashboard_edit: true,
    reportstock_view: true, reportstock_edit: true, reportstock_delete: true,
    bonpds_view: true, bonpds_edit: true, bonpds_delete: true,
    dailybon_view: true, dailybon_edit: true, dailybon_delete: true,
    userrole_view: true, userrole_edit: true, userrole_delete: true,
    msk_view: true, msk_edit: true, msk_delete: true,
    nr_view: true, nr_edit: true, nr_delete: true,
    tsn_view: true, tsn_edit: true, tsn_delete: true,
    tsp_view: true, tsp_edit: true, tsp_delete: true,
    sob_view: true, sob_edit: true, sob_delete: true,
  },
  Manager: {
    dashboard_view: true, dashboard_edit: true,
    reportstock_view: true, reportstock_edit: true, reportstock_delete: false,
    bonpds_view: true, bonpds_edit: true, bonpds_delete: false,
    dailybon_view: true, dailybon_edit: false, dailybon_delete: false,
    userrole_view: true, userrole_edit: true, userrole_delete: false,
    msk_view: true, msk_edit: true, msk_delete: false,
    nr_view: true, nr_edit: true, nr_delete: false,
    tsn_view: true, tsn_edit: true, tsn_delete: false,
    tsp_view: true, tsp_edit: true, tsp_delete: false,
    sob_view: true, sob_edit: true, sob_delete: false,
  },
  Teknisi: {
    dashboard_view: true, dashboard_edit: false,
    reportstock_view: true, reportstock_edit: false, reportstock_delete: false,
    bonpds_view: false, bonpds_edit: false, bonpds_delete: false,
    dailybon_view: true, dailybon_edit: true, dailybon_delete: false,
    userrole_view: true, userrole_edit: false, userrole_delete: false,
    msk_view: false, msk_edit: false, msk_delete: false,
    nr_view: true, nr_edit: false, nr_delete: false,
    tsn_view: true, tsn_edit: false, tsn_delete: false,
    tsp_view: true, tsp_edit: false, tsp_delete: false,
    sob_view: true, sob_edit: false, sob_delete: false,
  },
  Viewer: {
    dashboard_view: true, dashboard_edit: false,
    reportstock_view: false, reportstock_edit: false, reportstock_delete: false,
    bonpds_view: false, bonpds_edit: false, bonpds_delete: false,
    dailybon_view: false, dailybon_edit: false, dailybon_delete: false,
    userrole_view: true, userrole_edit: false, userrole_delete: false,
    msk_view: false, msk_edit: false, msk_delete: false,
    nr_view: false, nr_edit: false, nr_delete: false,
    tsn_view: false, tsn_edit: false, tsn_delete: false,
    tsp_view: false, tsp_edit: false, tsp_delete: false,
    sob_view: false, sob_edit: false, sob_delete: false,
  },
};

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
  return_to_factory: 'YES' | 'NO';
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
