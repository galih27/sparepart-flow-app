# API Routes - Quick Reference

Daftar lengkap semua API routes yang telah dibuat.

## 📂 Directory Structure

```
src/app/api/
├── test-db/
│   └── route.ts              # Test database connection
├── inventory/
│   ├── route.ts              # GET all, POST create/batch, DELETE all
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
├── users/
│   ├── route.ts              # GET all, POST create, DELETE all
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
├── daily-bon/
│   ├── route.ts              # GET all, POST create, DELETE all
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
├── bon-pds/
│   ├── route.ts              # GET all, POST create, DELETE all
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
└── msk/
    ├── route.ts              # GET all, POST create, DELETE all
    └── [id]/
        └── route.ts          # GET, PUT, DELETE by ID
```

## 🎯 API Endpoints Summary

### 🧪 Test
- `GET /api/test-db` - Test database connection

### 📦 Inventory (6 endpoints)
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create single item or batch import (array)
- `DELETE /api/inventory` - Delete all items
- `GET /api/inventory/{id}` - Get single item
- `PUT /api/inventory/{id}` - Update item
- `DELETE /api/inventory/{id}` - Delete item

### 👥 Users (6 endpoints)
- `GET /api/users` - Get all users (passwords excluded)
- `POST /api/users` - Create new user
- `DELETE /api/users` - Delete all users
- `GET /api/users/{id}` - Get single user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### 📋 Daily Bon (6 endpoints)
- `GET /api/daily-bon` - Get all daily bons
- `POST /api/daily-bon` - Create with auto stock update
- `DELETE /api/daily-bon` - Delete all
- `GET /api/daily-bon/{id}` - Get single bon
- `PUT /api/daily-bon/{id}` - Update with stock reversal
- `DELETE /api/daily-bon/{id}` - Delete with stock reversal

### 📦 Bon PDS (6 endpoints)
- `GET /api/bon-pds` - Get all bon PDS
- `POST /api/bon-pds` - Create with auto stock update
- `DELETE /api/bon-pds` - Delete all
- `GET /api/bon-pds/{id}` - Get single bon
- `PUT /api/bon-pds/{id}` - Update with stock reversal
- `DELETE /api/bon-pds/{id}` - Delete with stock reversal

### 📥 MSK (6 endpoints)
- `GET /api/msk` - Get all MSK records
- `POST /api/msk` - Create with auto stock addition
- `DELETE /api/msk` - Delete all
- `GET /api/msk/{id}` - Get single MSK
- `PUT /api/msk/{id}` - Update with stock reversal
- `DELETE /api/msk/{id}` - Delete with stock reversal

## ✨ Features Implemented

### 🔒 Transaction Safety
✅ Semua operasi stock menggunakan MySQL transactions
✅ Atomicity - All or nothing
✅ Rollback otomatis jika error

### 📊 Stock Management
✅ Auto update inventory saat create/update/delete
✅ Stock reversal saat status berubah
✅ Validasi stock tidak boleh negatif

### 🛡️ Error Handling
✅ Proper HTTP status codes (200, 201, 404, 409, 500)
✅ Descriptive error messages
✅ Duplicate entry detection (email, NIK)

### 🔐 Security
✅ Password excluded dari GET responses
✅ Prepared statements (SQL injection prevention)
✅ Input validation via request body parsing

### 📝 Data Consistency
✅ UUID untuk semua ID
✅ Auto timestamps (created_at, updated_at)
✅ Foreign key constraints di database

## 🎮 Testing dengan cURL

### Test Connection
```bash
curl http://localhost:3000/api/test-db
```

### Get All Inventory
```bash
curl http://localhost:3000/api/inventory
```

### Create Inventory Item
```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "part": "TEST001",
    "deskripsi": "Test Item",
    "harga_dpp": 10000,
    "ppn": 1100,
    "total_harga": 11100,
    "satuan": "PCS",
    "available_qty": 100,
    "qty_baik": 100,
    "qty_rusak": 0,
    "lokasi": "Warehouse A",
    "return_to_factory": "NO",
    "qty_real": 100
  }'
```

### Create Daily Bon (with auto stock update)
```bash
curl -X POST http://localhost:3000/api/daily-bon \
  -H "Content-Type: application/json" \
  -d '{
    "part": "TEST001",
    "deskripsi": "For repair",
    "qty_dailybon": 5,
    "harga": 10000,
    "status_bon": "BON",
    "teknisi": "John Doe",
    "no_tkl": "TKL001",
    "keterangan": "Test bon"
  }'
```

## 🔄 Next Steps

Untuk menggunakan API ini di frontend:

1. **Buat Custom Hooks** untuk mengganti Firebase hooks
   ```typescript
   // hooks/useInventory.ts
   export function useInventory() {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       fetch('/api/inventory')
         .then(res => res.json())
         .then(result => setData(result.data))
         .finally(() => setLoading(false));
     }, []);
     
     return { data, loading };
   }
   ```

2. **Update Components** untuk menggunakan custom hooks
   
3. **Implement SWR atau React Query** untuk caching & real-time updates

4. **Add Authentication** dengan NextAuth.js

---

**Total API Endpoints Created: 31**

📋 For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
