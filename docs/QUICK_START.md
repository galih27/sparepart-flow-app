# 🚀 Quick Start: Menggunakan MySQL Database

Panduan cepat untuk setup database MySQL di project ini.

## ✅ Checklist Setup (5 Menit)

### 1️⃣ Jalankan MySQL di XAMPP
- Buka **XAMPP Control Panel**
- Klik tombol **Start** pada **MySQL**
- Pastikan statusnya berubah menjadi hijau/running

### 2️⃣ Buat Database via phpMyAdmin
- Buka browser: `http://localhost/phpmyadmin`
- Klik **"New"** (untuk database baru)  
- Nama database: `sparepart_flow`
- Klik **"Create"**

### 3️⃣ Import Schema Database
- Pilih database `sparepart_flow` di sidebar
- Klik tab **"Import"**
- **Choose File** → Pilih file: `database/schema.sql`
- Klik **"Go"**
- Tunggu sampai selesai (muncul pesan sukses)

### 4️⃣ Setup Environment Variables
Buat file `.env.local` di root project (sejajar dengan `package.json`):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sparepart_flow
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Catatan:**
- Jika MySQL Anda ada password, isi di `DB_PASSWORD`
- Jika tidak ada password (default XAMPP), biarkan kosong

### 5️⃣ Restart Development Server
```bash
# Stop server yang sedang berjalan (Ctrl+C)
# Kemudian jalankan lagi
npm run dev
```

## 🧪 Test Koneksi Database

Setelah server jalan, buka di browser:
```
http://localhost:3000/api/test-db
```

**Jika berhasil**, akan muncul:
```json
{
  "success": true,
  "message": "✅ Database MySQL connected successfully!"
}
```

**Jika gagal**, cek:
1. MySQL di XAMPP sudah running?
2. File `.env.local` sudah dibuat dengan benar?
3. Database `sparepart_flow` sudah dibuat?
4. Schema sudah diimport?

## 📊 Struktur Database

Database ini memiliki 7 tabel utama:
- `users` - Data pengguna dan permissions
- `inventory` - Data stok sparepart
- `daily_bon` - Bon harian teknisi
- `bon_pds` - Bon PDS site
- `msk` - Data MSK
- `nr`, `tsn`, `tsp`, `sob` - Tabel placeholder untuk fitur mendatang

## 🔄 Next API Endpoints

Setelah setup, Anda bisa akses:

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/test-db` | GET | Test koneksi database |
| `/api/inventory` | GET | Get semua inventory |
| `/api/inventory/[id]` | GET | Get inventory by ID |
| `/api/inventory/[id]` | PUT | Update inventory |
| `/api/inventory/[id]` | DELETE | Delete inventory |

## 📚 Dokumentasi Lengkap

Untuk panduan lebih detail, lihat:
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Panduan lengkap migrasi
- **[MYSQL_CONFIG.md](./MYSQL_CONFIG.md)** - Konfigurasi MySQL

## 🆘 Troubleshooting Cepat

### Error: Cannot connect to MySQL
- Pastikan MySQL di XAMPP sudah **Start** (hijau)
- Restart XAMPP jika perlu

### Error: Unknown database 'sparepart_flow'
- Database belum dibuat, ikuti langkah 2️⃣ dan 3️⃣ di atas

### Error: Access denied for user 'root'
- Cek username/password di `.env.local`
- Default XAMPP: user=`root`, password=kosong

### Port 3306 sudah digunakan?
- Stop aplikasi lain yang pakai MySQL
- Atau ubah port MySQL di XAMPP config

---

**✨ Selamat! Database MySQL Anda siap digunakan!**
