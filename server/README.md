# Backend SQLite Konveksi

Backend API Express + SQLite (`better-sqlite3`) untuk Sistem Manajemen Konveksi.

## Struktur Database
- `categories` (Kategori produk)
- `bahan` (Master bahan baku)
- `products` (Produk & varian)
- `employees` (Data karyawan & bagian)
- `tahapan` (Master tahapan produksi)
- `jasa` (Tarif & ongkos jasa kerja)
- `mutasi_bahan` (Header transaksi keluar/masuk bahan)
- `mutasi_bahan_item` (Detail item mutasi)
- `spk` (Header Surat Perintah Kerja)
- `spk_item` (Detail item SPK, kalkulasi HPP bahan & jasa)

## Cara Menjalankan

1. Masuk ke folder server dan install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Jalankan seeder data awal (otomatis import dari `src/data/mock*.js`):
   ```bash
   npm run seed
   ```
   File database `konveksi.db` akan terbuat otomatis di root project.

3. Jalankan server:
   ```bash
   npm run dev
   ```
   Server aktif di `http://localhost:3001`.

