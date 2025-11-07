import type { User } from './definitions';

export const usersMockData: Omit<User, 'id'>[] = [
  { id_user: 'user-1', users: 'admin', nik: '11111', nama_teknisi: 'Admin Utama', email: 'admin@example.com', password: 'password', role: 'Admin' },
  { id_user: 'user-2', users: 'budi_s', nik: '22222', nama_teknisi: 'Budi Santoso', email: 'budi@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-3', users: 'siti_a', nik: '33333', nama_teknisi: 'Siti Aminah', email: 'siti@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-4', users: 'eko_p', nik: '44444', nama_teknisi: 'Eko Prasetyo', email: 'eko@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-5', users: 'manager', nik: '55555', nama_teknisi: 'Manager Gudang', email: 'manager@example.com', password: 'password', role: 'Manager' },
  { id_user: 'user-6', users: 'ani_y', nik: '66666', nama_teknisi: 'Ani Yudhoyono', email: 'ani@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-7', users: 'dewi_l', nik: '77777', nama_teknisi: 'Dewi Lestari', email: 'dewi@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-8', users: 'cahyo_w', nik: '88888', nama_teknisi: 'Cahyo Widodo', email: 'cahyo@example.com', password: 'password', role: 'Teknisi' },
  { id_user: 'user-9', users: 'rina_n', nik: '99999', nama_teknisi: 'Rina Nose', email: 'rina@example.com', password: 'password', role: 'Manager' },
];
