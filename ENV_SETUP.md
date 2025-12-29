# Setup Environment untuk GitHub Pages + Supabase + Cloudinary

Untuk menjalankan aplikasi ini secara online, Anda perlu mengatur Environment Variables.
Karena Anda menggunakan GitHub Pages (Static Hosting), variable ini akan "di-bake" ke dalam build code.

## 1. Buat File .env.local (Untuk local development)
Buat file bernama `.env.local` di root project dan isi dengan:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

## 2. GitHub Actions (Untuk Deployment Otomatis)
Jika Anda menggunakan GitHub Actions untuk deploy ke GitHub Pages, tambahkan "Secrets" di repository settings:
- Settings > Secrets and variables > Actions > New repository secret
- Tambahkan key yang sama seperti di atas.

## 3. Konfigurasi Supabase
- Buat project baru di Supabase.
- Jalankan SQL Query untuk membuat table yang dibutuhkan (`inventory`, `users` jika custom table).
- Atau gunakan Supabase Auth untuk `users`.
- Enable RLS (Row Level Security) dan tambahkan policy "Enable read access for all users" (atau "authenticated" jika login required).

## 4. Konfigurasi Cloudinary
- Login ke Cloudinary.
- Settings > Upload > Add upload preset.
- **Mode**: Unsigned.
- **Name**: Gunakan nama ini untuk `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
