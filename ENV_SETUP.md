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
### Cara Mendapatkan URL & Key:
1. Masuk ke Dashboard Project Supabase Anda.
2. Klik icon **Settings (Gerigi)** di bagian bawah sidebar kiri.
3. Pilih menu **API**.
4. Anda akan melihat dua kolom utama:
   - **Project URL**: Ini adalah `NEXT_PUBLIC_SUPABASE_URL`.
   - **Project API keys**: Copy yang berlabel `anon` `public`. Ini adalah `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

![Supabase API Settings Location](/C:/Users/SheilaFenolia/.gemini/antigravity/brain/dec85e8d-f481-4af6-86cc-dda0a9f9806c/supabase_url_location_1767008899174.png)

### Setup Database:
- Jalankan SQL Query untuk membuat table yang dibutuhkan (`inventory`, `users` jika custom table).
- Atau gunakan Supabase Auth untuk `users`.
- Enable RLS (Row Level Security) dan tambahkan policy "Enable read access for all users" (atau "authenticated" jika login required).

## 4. Konfigurasi Cloudinary
### Cara Mendapatkan Cloud Name & Preset:
1. **Cloud Name**:
   - Masuk ke Dashboard (Halaman Utama).
   - Di bagian "Account Details", Anda akan melihat **Cloud Name**. Copy nilai tersebut untuk `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
2. **Upload Preset**:
   - Klik icon **Settings (Gerigi)** di pojok kanan atas.
   - Pilih Tab **Upload**.
   - Scroll ke bawah sampai bagian "Upload presets".
   - Klik "Add upload preset".
   - **Signing Mode**: Pilih **Unsigned** (PENTING!).
   - **Name**: Copy nama preset tersebut (contoh: `ml_default`). Ini adalah `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
