# 🔥 FIREBASE DISCONNECTION - MIGRATION TO MySQL

## ✅ YANG SUDAH DILAKUKAN

### 1. **Hapus Dependency Firebase**
- ✅ Removed `firebase` package dari `package.json`
- ✅ Running `npm install` untuk clean up node_modules

### 2. **Hapus Folder & File Firebase**
- ✅ Deleted `/src/firebase` folder lengkap
- ✅ Deleted `FirebaseErrorListener.tsx` component

### 3. **Update RootLayout**
- ✅ Removed `FirebaseClientProvider` dari `src/app/layout.tsx`
- ✅ App sekarang standalone tanpa Firebase wrapper

### 4. **Buat MySQL Hooks**
- ✅ Created `src/hooks/use-api.ts` dengan custom hooks:
  - `useAPIFetch<T>` - menggantikan `useCollection`
  - `useAPIDoc<T>` - menggantikan `useDoc`  
  - `useCurrentUser` - menggantikan `useUser`

### 5. **Update Komponen**
- ✅ `sidebar-nav.tsx` - switched to MySQL hooks
- ✅ `user-roles-client.tsx` - full rewrite menggunakan fetch API

---

### File-file yang sudah sukses diupdate (hapus Firebase hooks):

1. ✅ **`src/components/app/report-stock-client.tsx`**
2. ✅ **`src/components/app/msk-client.tsx`**
3. ✅ **`src/components/app/daily-bon-client.tsx`**
4. ✅ **`src/components/app/bon-pds-client.tsx`**
5. ✅ **`src/components/app/user-roles-client.tsx`**
6. ✅ **`src/components/app/profile-client.tsx`**
7. ✅ **`src/components/app/header.tsx`**
8. ✅ **`src/components/app/sidebar-nav.tsx`**

### Pattern untuk Update File:

#### BEFORE (Firebase):
\`\`\`typescript
import { useCollection, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firestore = useFirestore();
const { user: authUser } = useUser();
const inventoryQuery = collection(firestore, 'inventory');
const { data } = useCollection<InventoryItem>(inventoryQuery);

// Update
await updateDoc(doc(firestore, 'inventory', id), { ...data });

// Delete
await deleteDoc(doc(firestore, 'inventory', id));

// Add
await addDoc(collection(firestore, 'inventory'), newItem);
\`\`\`

#### AFTER (MySQL API):
\`\`\`typescript
import { useAPIFetch, useCurrentUser } from '@/hooks/use-api';

const { user: authUser } = useCurrentUser();
const { data } = useAPIFetch<InventoryItem>('/api/inventory');

// Update
await fetch(\`/api/inventory/\${id}\`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Delete
await fetch(\`/api/inventory/\${id}\`, { method: 'DELETE' });

// Add/Create
await fetch('/api/inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newItem)
});
\`\`\`

---

## 📝 LANGKAH-LANGKAH MANUAL UPDATE

### Untuk setiap file client yang tersisa:

1. **Hapus Firebase Imports**
\`\`\`typescript
// HAPUS INI:
import { use Collection, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
\`\`\`

2. **Tambah MySQL Hooks**
\`\`\`typescript
// TAMBAH INI:
import { useAPIFetch, useAPIDoc, useCurrentUser } from '@/hooks/use-api';
\`\`\`

3. **Ganti Firebase Hooks dengan MySQL Hooks**
\`\`\`typescript
// SEBELUM:
const firestore = useFirestore();
const { user } = useUser();
const query = collection(firestore, 'inventory');
const { data } = useCollection<Item>(query);

// SESUDAH:
const { user } = useCurrentUser();
const { data } = useAPIFetch<Item>('/api/inventory');
\`\`\`

4. **Ganti Firestore Operations dengan Fetch API**

**CREATE:**
\`\`\`typescript
// SEBELUM:
await addDoc(collection(firestore, 'inventory'), newItem);

// SESUDAH:
const response = await fetch('/api/inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newItem)
});
if (!response.ok) throw new Error('Failed to create');
\`\`\`

**UPDATE:**
\`\`\`typescript
// SEBELUM:
await updateDoc(doc(firestore, 'inventory', id), updateData);

// SESUDAH:
const response = await fetch(\`/api/inventory/\${id}\`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});
if (!response.ok) throw new Error('Failed to update');
\`\`\`

**DELETE:**
\`\`\`typescript
// SEBELUM:
await deleteDoc(doc(firestore, 'inventory', id));

// SESUDAH:
const response = await fetch(\`/api/inventory/\${id}\`, {
  method: 'DELETE'
});
if (!response.ok) throw new Error('Failed to delete');
\`\`\`

**BATCH OPERATIONS:**
\`\`\`typescript
// SEBELUM:
const batch = writeBatch(firestore);
items.forEach(item => batch.delete(doc(firestore, 'inventory', item.id)));
await batch.commit();

// SESUDAH:
await Promise.all(
  items.map(item => 
    fetch(\`/api/inventory/\${item.id}\`, { method: 'DELETE' })
  )
);
// ATAU buat endpoint batch: POST /api/inventory/batch-delete
\`\`\`

5. **Hapus Error Handling Firebase**
\`\`\`typescript
// HAPUS INI:
.catch(async (serverError) => {
  const permissionError = new FirestorePermissionError({...});
  errorEmitter.emit('permission-error', permissionError);
});

// GANTI DENGAN:
.catch((error) => {
  toast({ 
    variant: "destructive", 
    title: "Error", 
    description: error.message || "Terjadi kesalahan" 
  });
});
\`\`\`

6. **Update Refresh Pattern**
\`\`\`typescript
// SEBELUM:
await refetch(); // dari useCollection

// SESUDAH:
window.location.reload(); 
// ATAU implement refetch di useAPIFetch hook
\`\`\`

---

## 🎯 API ENDPOINTS YANG PERLU ADA

Pastikan Anda sudah membuat API routes untuk semua operasi:

### Users API
- ✅ `GET /api/users` - list all users
- ✅ `GET /api/users/[id]` - get single user
- ✅ `POST /api/users` - create user
- ✅ `PUT /api/users/[id]` - update user
- ✅ `DELETE /api/users/[id]` - delete user

### Inventory API (Report Stock)
- ⚠️ `GET /api/inventory` - list all inventory items
- ⚠️ `GET /api/inventory/[id]` - get single item
- ⚠️ `POST /api/inventory` - create item
- ⚠️ `PUT /api/inventory/[id]` - update item
- ⚠️ `DELETE /api/inventory/[id]` - delete item
- ⚠️ `POST /api/inventory/batch-import` - bulk import dari Excel
- ⚠️ `DELETE /api/inventory/batch-delete` - delete all

### Daily Bon API
- ⚠️ `GET /api/daily-bon`
- ⚠️ `POST /api/daily-bon`
- ⚠️ `PUT /api/daily-bon/[id]`
- ⚠️ `DELETE /api/daily-bon/[id]`

### Bon PDS API
- ⚠️ `GET /api/bon-pds`
- ⚠️ `POST /api/bon-pds`
- ⚠️ `PUT /api/bon-pds/[id]`
- ⚠️ `DELETE /api/bon-pds/[id]`

### MSK API
- ⚠️ `GET /api/msk`
- ⚠️ `POST /api/msk`
- ⚠️ `PUT /api/msk/[id]`
- ⚠️ `DELETE /api/msk/[id]`

---

## 🔐 AUTHENTICATION

Anda perlu implement autentikasi untuk menggantikan Firebase Auth:

### Option 1: NextAuth.js
\`\`\`bash
npm install next-auth
\`\`\`

### Option 2: JWT Manual
Buat session management dengan JWT tokens

### Update `useCurrentUser` Hook
Di `src/hooks/use-api.ts`, update fungsi `useCurrentUser()` untuk fetch dari session/JWT Anda.

---

## ✅ VERIFIKASI

Setelah selesai, pastikan:

1. ❌ Tidak ada error import dari `'@/firebase'`
2. ❌ Tidak ada error import dari `'firebase/...'`
3. ✅ Semua data fetching menggunakan `/api/...` endpoints
4. ✅ App berjalan tanpa error Firebase di console
5. ✅ Semua CRUD operations bekerja dengan MySQL

---

## 🚀 QUICK CHECKLIST

\`\`\`bash
# 1. Pastikan Firebase sudah terhapus dari dependencies
grep -r "firebase" package.json
# Seharusnya tidak ada hasil

# 2. Cari semua import Firebase yang tersisa
grep -r "from '@/firebase'" src/
grep -r "from 'firebase" src/
# Hapus semua yang ditemukan

# 3. Restart dev server
npm run dev

# 4. Check console browser untuk error
# Seharusnya tidak ada error "module not found: firebase"
\`\`\`

---

## 📞 TROUBLESHOOTING

### Error: "Module not found: '@/firebase'"
**Fix:** Hapus import dan ganti dengan `useAPI` hooks

### Error: "firestore is not defined"
**Fix:** Remove all Firestore operations, ganti dengan fetch API

### Error: "useCollection is not defined"
**Fix:** Ganti dengan `useAPIFetch` dari `@/hooks/use-api`

### Data tidak muncul setelah operasi CRUD
**Fix:** Implement proper refresh:
- Gunakan `window.location.reload()`
- Atau update `useAPIFetch` untuk support refetch

---

**STATUS:** Firebase DISCONNECTED - MySQL ONLY MODE 🎉
