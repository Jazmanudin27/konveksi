
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  total_produk INT DEFAULT 0,
  harga_potong DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Aktif',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bahan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_bahan VARCHAR(50) NOT NULL UNIQUE,
  nama_bahan VARCHAR(150) NOT NULL,
  satuan VARCHAR(30) NOT NULL,
  harga DECIMAL(14,2) NOT NULL DEFAULT 0,
  stok DECIMAL(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Tersedia',
  supplier VARCHAR(150),
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(60) NOT NULL UNIQUE,
  sku_bahan VARCHAR(60),
  nama_produk VARCHAR(150) NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  varian VARCHAR(100),
  warna_hex VARCHAR(20),
  ukuran VARCHAR(20),
  stok INT NOT NULL DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Aktif',
  harga DECIMAL(14,2) NOT NULL DEFAULT 0,
  hpp DECIMAL(14,2) NOT NULL DEFAULT 0,
  harga_potong DECIMAL(12,2) NOT NULL DEFAULT 0,
  tanggal_update DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_prod_kategori (kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  bagian VARCHAR(100) NOT NULL,
  status VARCHAR(30) DEFAULT 'Aktif',
  telepon VARCHAR(50),
  tanggal_masuk DATE DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jasa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_jasa VARCHAR(50) NOT NULL UNIQUE,
  sku VARCHAR(60),
  nama_jasa VARCHAR(150) NOT NULL,
  qty DECIMAL(12,2) DEFAULT 0,
  harga DECIMAL(14,2) NOT NULL DEFAULT 0,
  satuan VARCHAR(30) DEFAULT 'Pcs',
  status VARCHAR(30) DEFAULT 'Aktif',
  keterangan TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mutasi_bahan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_bukti VARCHAR(60) NOT NULL UNIQUE,
  tgl DATETIME NOT NULL,
  no_reff VARCHAR(60),
  jenis_mutasi VARCHAR(20) NOT NULL,
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mutasi_bahan_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mutasi_id INT NOT NULL,
  no_bukti VARCHAR(60) NOT NULL,
  kode_bahan VARCHAR(50) NOT NULL,
  nama_bahan VARCHAR(150) NOT NULL,
  satuan VARCHAR(30) NOT NULL,
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  harga DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  INDEX idx_mbi_mutasi (mutasi_id),
  INDEX idx_mbi_nobukti (no_bukti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS antrean (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_antrian VARCHAR(60) NOT NULL UNIQUE,
  tgl_masuk VARCHAR(30) NOT NULL,
  sumber_permintaan VARCHAR(100) NOT NULL,
  no_reff VARCHAR(60),
  sku VARCHAR(60) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  prioritas VARCHAR(30) DEFAULT 'Normal',
  deadline VARCHAR(30) NOT NULL,
  status VARCHAR(50) DEFAULT 'Menunggu Cutting',
  catatan TEXT,
  tgl_serah_cutting VARCHAR(30),
  tim_cutting VARCHAR(100),
  tarif_cutting DECIMAL(12,2) DEFAULT 0,
  total_biaya_cutting DECIMAL(14,2) DEFAULT 0,
  catatan_cutting TEXT,
  tgl_serah_jahit VARCHAR(30),
  tim_jahit VARCHAR(100),
  tarif_jahit DECIMAL(12,2) DEFAULT 0,
  total_biaya_jahit DECIMAL(14,2) DEFAULT 0,
  catatan_jahit TEXT,
  tgl_serah_qc VARCHAR(30),
  tim_qc VARCHAR(100),
  catatan_qc TEXT,
  status_qc VARCHAR(50) DEFAULT 'Pemeriksaan',
  qty_pass_qc INT DEFAULT 0,
  qty_reject_qc INT DEFAULT 0,
  catatan_reject_qc TEXT,
  tgl_serah_finishing VARCHAR(30),
  tim_finishing VARCHAR(100),
  catatan_finishing TEXT,
  tgl_serah_gudang VARCHAR(30),
  tgl_selesai VARCHAR(30),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_antrean_sku (sku),
  INDEX idx_antrean_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sumber_permintaan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mutasi_gudang_jadi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_mutasi VARCHAR(60) NOT NULL UNIQUE,
  tgl_mutasi VARCHAR(30) NOT NULL,
  jenis_mutasi VARCHAR(20) NOT NULL DEFAULT 'MASUK',
  sumber VARCHAR(100) NOT NULL,
  no_antrian VARCHAR(60),
  no_reff VARCHAR(60),
  sku VARCHAR(60) NOT NULL,
  nama_produk VARCHAR(150) NOT NULL,
  varian VARCHAR(100),
  ukuran VARCHAR(20),
  qty INT NOT NULL DEFAULT 1,
  satuan VARCHAR(30) DEFAULT 'Pcs',
  lokasi_rak VARCHAR(100),
  petugas VARCHAR(100),
  catatan TEXT,
  tgl_diserahkan VARCHAR(30),
  petugas_serah VARCHAR(100),
  tgl_diterima VARCHAR(30),
  petugas_terima VARCHAR(100),
  status_penerimaan VARCHAR(50) DEFAULT 'Diterima',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mgj_sku (sku),
  INDEX idx_mgj_antrean (no_antrian)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(60) NOT NULL UNIQUE,
  urutan INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pembayaran_upah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_pembayaran VARCHAR(60) NOT NULL UNIQUE,
  antrean_id INT NOT NULL,
  no_antrian VARCHAR(60) NOT NULL,
  sku VARCHAR(60) NOT NULL,
  nama_produk VARCHAR(150) NOT NULL,
  tahapan VARCHAR(50) NOT NULL,
  nama_petugas VARCHAR(150) NOT NULL,
  qty INT NOT NULL DEFAULT 0,
  tarif_per_pcs DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_upah DECIMAL(14,2) NOT NULL DEFAULT 0,
  status_bayar VARCHAR(30) NOT NULL DEFAULT 'Belum Lunas',
  tgl_bayar VARCHAR(30),
  metode_bayar VARCHAR(50),
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_upah_antrean (antrean_id),
  INDEX idx_upah_noantrian (no_antrian),
  INDEX idx_upah_tahapan (tahapan),
  INDEX idx_upah_petugas (nama_petugas),
  INDEX idx_upah_status (status_bayar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS penjahit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) DEFAULT 'Borongan',
  spesialisasi VARCHAR(100) DEFAULT 'Jahit Kaos & Busana',
  tarif_per_pcs DECIMAL(12,2) DEFAULT 3500,
  telepon VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Aktif',
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tim_finishing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_tim VARCHAR(50) NOT NULL UNIQUE,
  nama_tim VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) DEFAULT 'Internal',
  spesialisasi VARCHAR(100) DEFAULT 'Finishing, Setrika Uap & Packing',
  kapasitas_harian INT DEFAULT 200,
  telepon VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Aktif',
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kasbon (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_kasbon VARCHAR(60) NOT NULL UNIQUE,
  tgl_kasbon VARCHAR(30) NOT NULL,
  nama_petugas VARCHAR(150) NOT NULL,
  kategori_petugas VARCHAR(50) DEFAULT 'Penjahit',
  nominal DECIMAL(14,2) NOT NULL DEFAULT 0,
  terbayar DECIMAL(14,2) NOT NULL DEFAULT 0,
  sisa DECIMAL(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Belum Lunas',
  keperluan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kasbon_petugas (nama_petugas),
  INDEX idx_kasbon_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kasbon_pembayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kasbon_id INT NOT NULL,
  pembayaran_upah_id INT,
  no_pembayaran_upah VARCHAR(60),
  nama_petugas VARCHAR(150),
  tgl_potong VARCHAR(30) NOT NULL,
  nominal_potong DECIMAL(14,2) NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kp_kasbon (kasbon_id),
  INDEX idx_kp_upah (pembayaran_upah_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
