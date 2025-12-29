# Sparepart Flow App

Aplikasi manajemen inventory dan sparepart menggunakan **Next.js 15** dan **MySQL Database**.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- XAMPP (untuk MySQL)
- npm atau yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup MySQL Database**
   
   Ikuti panduan lengkap di: **[docs/QUICK_START.md](./docs/QUICK_START.md)**
   
   Ringkasan:
   - Jalankan MySQL di XAMPP
   - Buat database `sparepart_flow` via phpMyAdmin
   - Import `database/schema.sql`
   - Buat file `.env.local` dengan konfigurasi database

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Setup dalam 5 menit
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Panduan lengkap migrasi dari Firebase
- **[MySQL Configuration](./docs/MYSQL_CONFIG.md)** - Detail konfigurasi database

## 🏗️ Tech Stack

- **Framework**: Next.js 15.3.3 with Turbopack
- **Database**: MySQL (via XAMPP)
- **UI Library**: Radix UI + Tailwind CSS
- **Form**: React Hook Form + Zod
- **Language**: TypeScript

## 📁 Project Structure

```
sparepart-flow-app/
├── database/          # Database schema SQL
├── docs/              # Documentation
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React Components
│   ├── lib/           # Utilities & DB helpers
│   └── firebase/      # (Legacy - akan dihapus)
└── public/            # Static assets
```

## 🔑 Features

- ✅ Inventory Management
- ✅ Daily Bon Management
- ✅ Bon PDS Management
- ✅ MSK Management
- ✅ User Role & Permissions
- ✅ Stock Tracking
- ✅ Transaction History

## 🧪 Testing

Test koneksi database:
```
http://localhost:3000/api/test-db
```

## 📝 Environment Variables

Copy file `.env.local` dengan konfigurasi MySQL Anda:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sparepart_flow
```

## 🆘 Need Help?

Lihat troubleshooting di [QUICK_START.md](./docs/QUICK_START.md#-troubleshooting-cepat)
