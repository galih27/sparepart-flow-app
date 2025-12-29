# API Documentation - Sparepart Flow App

Dokumentasi lengkap untuk semua API endpoints yang tersedia.

## 📌 Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication
*(Coming soon - will be implemented with NextAuth or similar)*

---

## 📦 Inventory API

### Get All Inventory
```http
GET /api/inventory
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "part": "ABC123",
      "deskripsi": "Description",
      "harga_dpp": 10000.00,
      "ppn": 1100.00,
      "total_harga": 11100.00,
      "satuan": "PCS",
      "available_qty": 100,
      "qty_baik": 100,
      "qty_rusak": 0,
      "lokasi": "Warehouse A",
      "return_to_factory": "NO",
      "qty_real": 100
    }
  ]
}
```

### Create Inventory Item
```http
POST /api/inventory
```

**Request Body:**
```json
{
  "part": "ABC123",
  "deskripsi": "Sparepart ABC",
  "harga_dpp": 10000.00,
  "ppn": 1100.00,
  "total_harga": 11100.00,
  "satuan": "PCS",
  "available_qty": 100,
  "qty_baik": 100,
  "qty_rusak": 0,
  "lokasi": "Warehouse A",
  "return_to_factory": "NO",
  "qty_real": 100
}
```

### Batch Import Inventory
```http
POST /api/inventory
```

**Request Body (Array):**
```json
[
  {
    "part": "ABC123",
    "deskripsi": "Item 1",
    ...
  },
  {
    "part": "DEF456",
    "deskripsi": "Item 2",
    ...
  }
]
```

### Get Single Inventory Item
```http
GET /api/inventory/{id}
```

### Update Inventory Item
```http
PUT /api/inventory/{id}
```

**Request Body:**
```json
{
  "available_qty": 95,
  "qty_baik": 95
}
```

### Delete Inventory Item
```http
DELETE /api/inventory/{id}
```

### Delete All Inventory
```http
DELETE /api/inventory
```

---

## 👥 Users API

### Get All Users
```http
GET /api/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "users": "username",
      "nik": "12345",
      "nama_teknisi": "John Doe",
      "email": "john@example.com",
      "role": "Admin",
      "permissions": { ... },
      "photo": "url"
    }
  ]
}
```
*Note: Password tidak disertakan dalam response*

### Create User
```http
POST /api/users
```

**Request Body:**
```json
{
  "users": "johndoe",
  "nik": "12345",
  "nama_teknisi": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Teknisi",
  "permissions": {
    "dashboard_view": true,
    "dashboard_edit": false,
    ...
  }
}
```

### Get Single User
```http
GET /api/users/{id}
```

### Update User
```http
PUT /api/users/{id}
```

**Request Body:**
```json
{
  "role": "Manager",
  "permissions": {
    "dashboard_view": true,
    "dashboard_edit": true,
    ...
  }
}
```

### Delete User
```http
DELETE /api/users/{id}
```

---

## 📋 Daily Bon API

### Get All Daily Bons
```http
GET /api/daily-bon
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "part": "ABC123",
      "deskripsi": "Description",
      "qty_dailybon": 5,
      "harga": 10000.00,
      "status_bon": "BON",
      "teknisi": "John Doe",
      "tanggal_dailybon": "2025-12-23",
      "no_tkl": "TKL001",
      "keterangan": "Notes",
      "stock_updated": true
    }
  ]
}
```

### Create Daily Bon
```http
POST /api/daily-bon
```

**Request Body:**
```json
{
  "part": "ABC123",
  "deskripsi": "Sparepart for repair",
  "qty_dailybon": 5,
  "harga": 10000.00,
  "status_bon": "BON",
  "teknisi": "John Doe",
  "tanggal_dailybon": "2025-12-23",
  "no_tkl": "TKL001",
  "keterangan": "For customer A"
}
```

**Stock Logic:**
- `BON`: Mengurangi `available_qty` (temporary)
- `RECEIVED/KMP`: Mengurangi `qty_baik` dan `available_qty` (permanent)
- `CANCELED`: Tidak mengubah stock

### Update Daily Bon
```http
PUT /api/daily-bon/{id}
```

**Request Body:**
```json
{
  "status_bon": "RECEIVED",
  "keterangan": "Updated notes"
}
```

*Note: Perubahan status akan otomatis menyesuaikan stock*

### Delete Daily Bon
```http
DELETE /api/daily-bon/{id}
```

*Note: Stock akan di-reverse jika `stock_updated = true`*

---

## 📦 Bon PDS API

### Get All Bon PDS
```http
GET /api/bon-pds
```

### Create Bon PDS
```http
POST /api/bon-pds
```

**Request Body:**
```json
{
  "part": "ABC123",
  "deskripsi": "Sparepart for site",
  "qty_bonpds": 10,
  "status_bonpds": "BON",
  "site_bonpds": "Site A",
  "tanggal_bonpds": "2025-12-23",
  "no_transaksi": "TRX001",
  "keterangan": "Delivery to site A"
}
```

**Stock Logic:**
- `BON`: Mengurangi `available_qty` (temporary)
- `RECEIVED`: Mengurangi `qty_baik` dan `available_qty` (permanent)
- `CANCELED`: Tidak mengubah stock

### Update Bon PDS
```http
PUT /api/bon-pds/{id}
```

### Delete Bon PDS
```http
DELETE /api/bon-pds/{id}
```

---

## 📥 MSK (Masuk) API

### Get All MSK
```http
GET /api/msk
```

### Create MSK
```http
POST /api/msk
```

**Request Body:**
```json
{
  "part": "ABC123",
  "deskripsi": "Incoming stock",
  "qty_msk": 50,
  "status_msk": "RECEIVED",
  "site_msk": "Site B",
  "tanggal_msk": "2025-12-23",
  "no_transaksi": "MSK001",
  "keterangan": "New stock arrival"
}
```

**Stock Logic:**
- `RECEIVED`: **Menambah** `qty_baik` dan `available_qty`
- Other statuses: Tidak mengubah stock

### Update MSK
```http
PUT /api/msk/{id}
```

### Delete MSK
```http
DELETE /api/msk/{id}
```

*Note: Stock akan di-reverse (dikurangi) jika statusnya RECEIVED*

---

## 🧪 Test API

### Test Database Connection
```http
GET /api/test-db
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Database MySQL connected successfully!",
  "config": {
    "host": "localhost",
    "port": "3306",
    "database": "sparepart_flow",
    "user": "root"
  }
}
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🔢 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 404 | Not Found - Resource tidak ditemukan |
| 409 | Conflict - Duplicate entry (email/NIK) |
| 500 | Internal Server Error - Server error |

---

## 🎯 Stock Management Rules

### Daily Bon & Bon PDS (Pengeluaran)
1. **BON** (Booking/Reserved)
   - Mengurangi `available_qty` saja
   - Stock masih ada tapi di-reserve
   
2. **RECEIVED/KMP** (Diterima)
   - Mengurangi `qty_baik` dan `available_qty`
   - Stock benar-benar keluar
   
3. **CANCELED**
   - Tidak mengubah stock
   - Mengembalikan stock jika sebelumnya sudah di-update

### MSK (Pemasukan)
1. **RECEIVED**
   - **Menambah** `qty_baik` dan `available_qty`
   - Stock bertambah
   
2. **BON/CANCELED**
   - Tidak mengubah stock

---

## 🔒 Transaction Safety

Semua operasi yang melibatkan perubahan stock menggunakan **MySQL Transaction**:
- Atomicity: Semua operasi berhasil atau semua dibatalkan
- Consistency: Stock selalu konsisten
- Isolation: Tidak ada race condition
- Durability: Perubahan permanent

---

## 📝 Notes

1. Semua field `id` menggunakan UUID v4
2. `created_at` dan `updated_at` otomatis di-manage oleh MySQL
3. Permissions di-store sebagai JSON object
4. Password di-hash sebelum disimpan (untuk implementasi nanti)

---

**Need Help?** Lihat [QUICK_START.md](./QUICK_START.md) untuk setup database.
