# Konfigurasi Environment Variables untuk MySQL

Untuk menggunakan MySQL sebagai database, buat file `.env.local` di root project dengan konfigurasi berikut:

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

## Cara Setup:

1. **Copy konfigurasi di atas** dan buat file `.env.local` di root project
2. **Sesuaikan kredensial MySQL** Anda:
   - `DB_HOST`: Hostname MySQL (biasanya `localhost` untuk XAMPP)
   - `DB_PORT`: Port MySQL (default `3306`)
   - `DB_USER`: Username MySQL Anda (default `root` di XAMPP)
   - `DB_PASSWORD`: Password MySQL (kosongkan jika tidak ada password di XAMPP)
   - `DB_NAME`: Nama database (gunakan `sparepart_flow`)

3. **Import database schema**:
   ```bash
   # Melalui MySQL command line
   mysql -u root -p sparepart_flow < database/schema.sql
   
   # Atau melalui phpMyAdmin
   # - Buka phpMyAdmin
   # - Buat database baru bernama 'sparepart_flow'
   # - Import file database/schema.sql
   ```

4. **Restart development server**:
   ```bash
   npm run dev
   ```
