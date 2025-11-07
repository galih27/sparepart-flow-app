import type { User, DailyBon, BonPDS, Msk } from './definitions';
import { inventoryData as mockInventory } from './inventory-mock';


export const usersData: User[] = [
  { id_user: 'user-1', users: 'admin', nik: '11111', nama_teknisi: 'Admin Utama', email: 'admin@example.com', password: 'password', role: 'Admin' },
  { id_user: 'user-2', users: 'budi_s', nik: '22222', nama_teknisi: 'Budi Santoso', email: 'budi@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-3', users: 'siti_a', nik: '33333', nama_teknisi: 'Siti Aminah', email: 'siti@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-4', users: 'eko_p', nik: '44444', nama_teknisi: 'Eko Prasetyo', email: 'eko@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-5', users: 'manager', nik: '55555', nama_teknisi: 'Manager Gudang', email: 'manager@example.com', password: 'password', role: 'Manager' },
];

export const dailyBonData: DailyBon[] = Array.from({ length: 30 }, (_, i) => {
  const id = i + 1;
  const item = mockInventory[i % mockInventory.length];
  const teknisi = usersData[(i % 3) + 1];
  return {
    id_dailybon: `db-${id}`,
    part: item.part,
    deskripsi: item.deskripsi,
    qty_dailybon: Math.floor(Math.random() * 5) + 1,
    harga: item.total_harga,
    status_bon: ['BON', 'RECEIVED', 'KMP', 'CANCELED'][i % 4] as DailyBon['status_bon'],
    teknisi: teknisi.nama_teknisi,
    tanggal_dailybon: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    no_tkl: `TKL-2024-${String(id).padStart(4, '0')}`,
    keterangan: `Keterangan untuk bon harian ${id}`,
  };
});

export const bonPdsData: BonPDS[] = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1;
  const item = mockInventory[(i + 10) % mockInventory.length];
  return {
    id_bonpds: `pds-${id}`,
    part: item.part,
    deskripsi: item.deskripsi,
    qty_bonpds: Math.floor(Math.random() * 20) + 5,
    status_bonpds: ['BON', 'RECEIVED', 'CANCELED'][i % 3] as BonPDS['status_bonpds'],
    site_bonpds: ['Site A', 'Site B', 'Site C'][i % 3],
    tanggal_bonpds: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    no_transaksi: `TRX-PDS-2024-${String(id).padStart(3, '0')}`,
    keterangan: `Transfer ke ${['Site A', 'Site B', 'Site C'][i % 3]}`,
  };
});

export const mskData: Msk[] = Array.from({ length: 15 }, (_, i) => {
  const id = i + 1;
  const item = mockInventory[(i + 20) % mockInventory.length];
  return {
    id_msk: `msk-${id}`,
    part: item.part,
    deskripsi: item.deskripsi,
    qty_msk: Math.floor(Math.random() * 50) + 10,
    status_msk: ['BON', 'RECEIVED', 'CANCELED'][i % 3] as Msk['status_msk'],
    site_msk: ['Kantor Pusat', 'Site A', 'Site C'][i % 3],
    tanggal_msk: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    no_transaksi: `TRX-MSK-2024-${String(id).padStart(3, '0')}`,
    keterangan: `Penerimaan dari ${['Kantor Pusat', 'Site A', 'Site C'][i % 3]}`,
  };
});
