# Panduan Migrasi dari Firebase Firestore ke MySQL

## 📋 Daftar Isi
1. [Persiapan](#persiapan)
2. [Setup Database MySQL](#setup-database-mysql)
3. [Konfigurasi Environment](#konfigurasi-environment)
4. [Import Data dari Firestore (Opsional)](#import-data-dari-firestore)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## 🔧 Persiapan

### 1. Pastikan XAMPP Sudah Terinstall
- Jalankan **MySQL** di XAMPP Control Panel
- Pastikan MySQL berjalan di port 3306

### 2. Dependencies Sudah Diinstall
Dependencies `mysql2` sudah diinstall otomatis. Jika belum, jalankan:
```bash
npm install mysql2
```

## 🗄️ Setup Database MySQL

### Opsi 1: Melalui phpMyAdmin

1. Buka browser dan akses `http://localhost/phpmyadmin`
2. Klik **"New"** di sidebar kiri untuk membuat database baru
3. Nama database: `sparepart_flow`
4. Collation: `utf8mb4_unicode_ci`
5. Klik **"Create"**
6. Pilih database `sparepart_flow` yang baru dibuat
7. Klik tab **"Import"**
8. Klik **"Choose File"** dan pilih file `database/schema.sql`
9. Klik **"Go"** untuk mengimport

### Opsi 2: Melalui MySQL Command Line

```bash
# Masuk ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE sparepart_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Keluar dari MySQL
exit;

# Import schema
mysql -u root -p sparepart_flow < database/schema.sql
```

## ⚙️ Konfigurasi Environment

### 1. Buat File .env.local

Buat file `.env.local` di root project dengan isi:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sparepart_flow

# Next.js Configuration  
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Sesuaikan Kredensial MySQL

- **DB_HOST**: `localhost` (untuk XAMPP local)
- **DB_PORT**: `3306` (port default MySQL)
- **DB_USER**: `root` (username default XAMPP)
- **DB_PASSWORD**: Kosongkan jika tidak ada password. Jika ada, masukkan password MySQL Anda
- **DB_NAME**: `sparepart_flow` (nama database yang sudah dibuat)

## 📊 Import Data dari Firestore (Opsional)

Jika Anda ingin memindahkan data yang sudah ada di Firestore ke MySQL:

### 1. Export Data dari Firestore

Anda bisa menggunakan Firebase Admin SDK atau export manual melalui Firebase Console:

**Melalui Firebase Console:**
1. Buka Firebase Console
2. Pilih project Anda
3. Klik **Firestore Database**
4. Export collections: `users`, `inventory`, `daily_bon`, `bon_pds`, `msk`

### 2. Import ke MySQL

Setelah data diexport (format JSON), Anda perlu membuat script untuk mengkonversi dan import ke MySQL. Contoh script akan dibuat terpisah jika diperlukan.

## 🧪 Testing

### 1. Test Koneksi Database

Buat file test di `src/app/api/test-db/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully' 
    });
  } else {
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed' 
    }, { status: 500 });
  }
}
```

Kemudian akses: `http://localhost:3000/api/test-db`

### 2. Test API Endpoints

Setelah server berjalan, test API:

```bash
# Test Get All Inventory
curl http://localhost:3000/api/inventory

# Test Get Single Inventory (ganti {id} dengan ID yang valid)
curl http://localhost:3000/api/inventory/{id}
```

## 🚀 Running Project

1. **Start MySQL** di XAMPP Control Panel
2. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
3. Buka browser: `http://localhost:3000`

## 🔍 Troubleshooting

### Error: "Cannot connect to MySQL"

**Solusi:**
1. Pastikan MySQL service berjalan di XAMPP
2. Cek port MySQL (default 3306), pastikan tidak bentrok dengan aplikasi lain
3. Cek kredensial di file `.env.local`
4. Restart development server setelah mengubah `.env.local`

### Error: "ER_BAD_DB_ERROR: Unknown database"

**Solusi:**
1. Pastikan database `sparepart_flow` sudah dibuat
2. Import schema.sql terlebih dahulu

### Error: "ER_ACCESS_DENIED_ERROR"

**Solusi:**
1. Cek username dan password di `.env.local`
2. Pastikan user memiliki akses ke database
3. Di XAMPP default: username=`root`, password=kosong

### Error: "Port 3306 is already in use"

**Solusi:**
1. MySQL port sudah digunakan oleh service lain
2. Stop service lain yang menggunakan port 3306
3. Atau ubah port MySQL di XAMPP dan update `DB_PORT` di `.env.local`

## 📁 Struktur File Baru

```
sparepart-flow-app/
├── database/
│   └── schema.sql              # Database schema SQL
├── src/
│   ├── lib/
│   │   ├── db.ts              # Database connection & config
│   │   └── db-helpers.ts      # CRUD helper functions
│   └── app/
│       └── api/
│           ├── inventory/
│           │   ├── route.ts          # GET all inventory
│           │   └── [id]/
│           │       └── route.ts      # GET/PUT/DELETE inventory by ID
│           └── test-db/
│               └── route.ts          # Test database connection
├── docs/
│   ├── MYSQL_CONFIG.md        # MySQL configuration guide
│   └── MIGRATION_GUIDE.md     # This file
└── .env.local                 # Environment variables (create this)
```

## 📝 Next Steps

Setelah database MySQL berjalan dengan baik:

1. **Buat API routes untuk collections lain**:
   - `/api/users` - User management
   - `/api/daily-bon` - Daily Bon operations
   - `/api/bon-pds` - Bon PDS operations  
   - `/api/msk` - MSK operations

2. **Update React Components**:
   - Ganti `useCollection` dan `useDoc` dari Firebase dengan custom hooks yang memanggil MySQL API
   - Update form submissions untuk menggunakan API routes

3. **Implementasi Authentication**:
   - Ganti Firebase Auth dengan NextAuth.js atau library auth lain
   - Atau tetap gunakan Firebase Auth jika masih diperlukan

4. **Migration Script**:
   - Buat script untuk memindahkan data dari Firestore ke MySQL jika diperlukan

## 🎯 Keuntungan Menggunakan MySQL

✅ **Full Control**: Database ada di server lokal Anda  
✅ **No Cost**: Tidak ada biaya seperti Firebase  
✅ **Relational**: Mendukung foreign keys dan transactions  
✅ **Familiar**: Menggunakan SQL yang sudah umum  
✅ **Performance**: Lebih cepat untuk query kompleks  

## ⚠️ Yang Perlu Diperhatikan

- Backup database secara rutin
- Implement proper error handling
- Gunakan prepared statements (sudah diimplementasi di db-helpers.ts)
- Set ulang password MySQL di production
- Implement proper authentication & authorization

---

**Jika ada pertanyaan atau masalah, silakan dokumentasikan dan tanyakan!**
