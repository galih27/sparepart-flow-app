# 🔌 Panduan Memutus Koneksi Firestore

Dokumen ini menjelaskan cara memutus koneksi dari Firebase Firestore dan beralih sepenuhnya ke MySQL.

## ✅ Langkah-Langkah yang Sudah Dilakukan

### 1. **Firebase Provider Disabled di Layout**
File: `src/app/layout.tsx`

```tsx
// BEFORE
<FirebaseClientProvider>
  {children}
</FirebaseClientProvider>

// AFTER - Firebase DISABLED
{/* Firebase Provider - DISABLED for MySQL migration */}
{/* <FirebaseClientProvider> */}
  {children}
{/* </FirebaseClientProvider> */}
```

**Status:** ✅ **DONE** - Firestore tidak akan ter-initialize

---

## 📝 Langkah Tambahan (Opsional)

### 2. **Hapus Firebase Environment Variables**

Edit file `.env` atau `.env.local`:

```env
# ===== MySQL Configuration (AKTIF) =====
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sparepart_flow
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ===== Firebase Configuration (NONAKTIFKAN - Comment atau hapus) =====
# NEXT_PUBLIC_API_KEY=
# NEXT_PUBLIC_AUTH_DOMAIN=
# NEXT_PUBLIC_PROJECT_ID=
# NEXT_PUBLIC_STORAGE_BUCKET=
# NEXT_PUBLIC_MESSAGING_SENDER_ID=
# NEXT_PUBLIC_APP_ID=
```

**Status:** ⏳ **TODO** - Hapus atau comment variabel Firebase

---

### 3. **Uninstall Firebase Dependencies (Opsional)**

Jika ingin menghapus Firebase sepenuhnya dari project:

```bash
npm uninstall firebase
```

**⚠️ Warning:** Hanya lakukan ini jika Anda yakin tidak akan kembali ke Firebase!

---

## 🔍 Verifikasi Firestore Sudah Terputus

### Cara 1: Cek Console Browser

1. Buka aplikasi di browser: `http://localhost:3000`
2. Buka **Developer Tools** (F12)
3. Lihat tab **Console**
4. **Tidak seharusnya ada** log/error tentang Firebase/Firestore

### Cara 2: Cek Network Tab

1. Buka **Developer Tools** (F12)
2. Buka tab **Network**
3. Reload halaman
4. **Tidak seharusnya ada** request ke:
   - `firebaseapp.com`
   - `firestore.googleapis.com`
   - `identitytoolkit.googleapis.com`

### Cara 3: Test API MySQL

Buka browser:
```
http://localhost:3000/api/test-db
```

Jika MySQL sudah terkoneksi, akan muncul:
```json
{
  "success": true,
  "message": "✅ Database MySQL connected successfully!"
}
```

---

## 🔄 Jika Ingin Re-enable Firebase

Jika suatu saat perlu kembali menggunakan Firebase:

### 1. Uncomment Firebase Provider

File: `src/app/layout.tsx`

```tsx
// Hapus comment
<FirebaseClientProvider>
  {children}
</FirebaseClientProvider>
```

### 2. Restore Environment Variables

Uncomment atau restore variabel Firebase di `.env`

### 3. Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 📊 Status Migrasi

| Component | Firebase | MySQL | Status |
|-----------|----------|-------|--------|
| **Database Connection** | ❌ Disabled | ✅ Ready | MySQL |
| **Provider** | ❌ Commented | - | Disabled |
| **API Routes** | - | ✅ 31 endpoints | Ready |
| **Environment** | ⏳ Manual | ✅ Configured | Partial |

---

## 🎯 Next Steps

### Immediate (untuk complete disconnect)

1. ✅ **Firebase Provider** - DONE (sudah di-comment)
2. ⏳ **Environment Variables** - Hapus Firebase vars dari `.env`
3. ⏳ **Setup MySQL** - Ikuti [QUICK_START.md](./QUICK_START.md)
4. ⏳ **Test MySQL API** - Akses `/api/test-db`

### Future (setelah MySQL berjalan)

1. Replace `useCollection` dengan fetch ke MySQL API
2. Replace `useDoc` dengan fetch ke MySQL API  
3. Replace `useUser` dengan NextAuth atau custom auth
4. Uninstall Firebase dependencies (opsional)

---

## ⚠️ Penting!

### Firestore TIDAK AKAN DIAKSES jika:

✅ `FirebaseClientProvider` di-comment di `layout.tsx` (DONE)  
✅ Environment variables Firebase dihapus/kosong  
✅ Code tidak ada yang memanggil `initializeFirebase()`

### Components yang Masih Menggunakan Firebase:

Semua components di `src/components/app/` masih menggunakan:
- `useFirestore()`
- `useCollection()`
- `useDoc()`
- Firebase operations

**Ini akan error** jika Firebase provider disabled. 

**Solusi:** Nanti akan dibuat custom hooks untuk MySQL API.

---

## 🆘 Troubleshooting

### Error: "Firestore not available"

**Penyebab:** Component masih menggunakan `useFirestore()` tapi provider sudah disabled.

**Solusi Sementara:**
1. Re-enable Firebase provider (uncomment)
2. Atau update component untuk tidak pakai Firebase

**Solusi Permanent:**
- Buat custom hooks untuk MySQL API
- Update all components

### Error: Firebase initialization failed

**Penyebab:** Environment variables Firebase tidak lengkap/salah.

**Solusi:**
- Comment semua variabel Firebase di `.env`
- Hapus atau comment `FirebaseClientProvider`

---

## 📚 Related Documentation

- [QUICK_START.md](./QUICK_START.md) - Setup MySQL database
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - MySQL API reference
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Full migration guide

---

**Status:** Firestore connection **DISABLED** ✅  
**Last Updated:** 2025-12-23
