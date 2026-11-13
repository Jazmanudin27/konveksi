-- Skema Database SQLite Sistem Manajemen Konveksi
PRAGMA foreign_keys = ON;

-- 1. Kategori Produk
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  total_produk INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Aktif',
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. Bahan Baku
CREATE TABLE IF NOT EXISTS bahan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_bahan TEXT NOT NULL UNIQUE,
  nama_bahan TEXT NOT NULL,
  satuan TEXT NOT NULL,
  harga REAL NOT NULL DEFAULT 0,
  stok REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Tersedia',
  keterangan TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 3. Produk & Varian
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  sku_bahan TEXT,
  nama_produk TEXT NOT NULL,
  kategori TEXT NOT NULL,
  varian TEXT,
  warna_hex TEXT,
  ukuran TEXT,
  stok INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Aktif',
  harga REAL NOT NULL DEFAULT 0,
  tanggal_update TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 4. Karyawan
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nik TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  bagian TEXT NOT NULL,
  status TEXT DEFAULT 'Aktif',
  telepon TEXT,
  tanggal_masuk TEXT DEFAULT (date('now'))
);

-- 5. Tarif & Jasa
CREATE TABLE IF NOT EXISTS jasa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_jasa TEXT NOT NULL UNIQUE,
  sku TEXT,
  nama_jasa TEXT NOT NULL,
  qty REAL DEFAULT 0,
  harga REAL NOT NULL DEFAULT 0,
  satuan TEXT DEFAULT 'Pcs',
  status TEXT DEFAULT 'Aktif',
  keterangan TEXT
);

-- 7. Mutasi Bahan Baku (Header)
CREATE TABLE IF NOT EXISTS mutasi_bahan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no_bukti TEXT NOT NULL UNIQUE,
  tgl TEXT NOT NULL,
  no_reff TEXT,
  jenis_mutasi TEXT NOT NULL,
  keterangan TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 8. Mutasi Bahan Baku (Detail Item)
CREATE TABLE IF NOT EXISTS mutasi_bahan_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mutasi_id INTEGER NOT NULL REFERENCES mutasi_bahan(id) ON DELETE CASCADE,
  no_bukti TEXT NOT NULL,
  kode_bahan TEXT NOT NULL,
  nama_bahan TEXT NOT NULL,
  satuan TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 0,
  harga REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);

-- 9. List Antrean Permintaan Produksi (Relasi ke Produk)
CREATE TABLE IF NOT EXISTS antrean (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no_antrian TEXT NOT NULL UNIQUE,
  tgl_masuk TEXT NOT NULL,
  sumber_permintaan TEXT NOT NULL,
  no_reff TEXT,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  prioritas TEXT DEFAULT 'Normal',
  deadline TEXT NOT NULL,
  status TEXT DEFAULT 'Menunggu Cutting',
  catatan TEXT,
  tgl_serah_cutting TEXT,
  tim_cutting TEXT,
  tarif_cutting REAL DEFAULT 0,
  total_biaya_cutting REAL DEFAULT 0,
  catatan_cutting TEXT,
  tgl_serah_jahit TEXT,
  tim_jahit TEXT,
  tarif_jahit REAL DEFAULT 0,
  total_biaya_jahit REAL DEFAULT 0,
  catatan_jahit TEXT,
  tgl_serah_qc TEXT,
  tim_qc TEXT,
  catatan_qc TEXT,
  status_qc TEXT DEFAULT 'Pemeriksaan',
  qty_pass_qc INTEGER DEFAULT 0,
  qty_reject_qc INTEGER DEFAULT 0,
  catatan_reject_qc TEXT,
  tgl_serah_finishing TEXT,
  tim_finishing TEXT,
  catatan_finishing TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 10. Mutasi Gudang Jadi (Barang Jadi Masuk/Keluar)
CREATE TABLE IF NOT EXISTS mutasi_gudang_jadi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no_mutasi TEXT NOT NULL UNIQUE,
  tgl_mutasi TEXT NOT NULL,
  jenis_mutasi TEXT NOT NULL DEFAULT 'MASUK',
  sumber TEXT NOT NULL,
  no_antrian TEXT,
  no_reff TEXT,
  sku TEXT NOT NULL,
  nama_produk TEXT NOT NULL,
  varian TEXT,
  ukuran TEXT,
  qty INTEGER NOT NULL DEFAULT 1,
  satuan TEXT DEFAULT 'Pcs',
  lokasi_rak TEXT,
  petugas TEXT,
  catatan TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Index performa query
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_kategori ON products(kategori);
CREATE INDEX IF NOT EXISTS idx_bahan_kode ON bahan(kode_bahan);
CREATE INDEX IF NOT EXISTS idx_mutasi_item_mutasi_id ON mutasi_bahan_item(mutasi_id);
CREATE INDEX IF NOT EXISTS idx_mutasi_item_nobukti ON mutasi_bahan_item(no_bukti);
CREATE INDEX IF NOT EXISTS idx_antrean_no ON antrean(no_antrian);
CREATE INDEX IF NOT EXISTS idx_antrean_sku ON antrean(sku);
CREATE INDEX IF NOT EXISTS idx_mgj_no ON mutasi_gudang_jadi(no_mutasi);
CREATE INDEX IF NOT EXISTS idx_mgj_sku ON mutasi_gudang_jadi(sku);
CREATE INDEX IF NOT EXISTS idx_mgj_antrean ON mutasi_gudang_jadi(no_antrian);
