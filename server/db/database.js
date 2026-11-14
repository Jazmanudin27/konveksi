import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../../konveksi.db");
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

// Init schema
const schemaPath = path.resolve(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// Drop SPK & Tahapan tables per user request
db.exec("DROP TABLE IF EXISTS spk_item;");
db.exec("DROP TABLE IF EXISTS spk;");
db.exec("DROP TABLE IF EXISTS tahapan;");

// Ensure Antrean table exists
db.exec(`
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
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_antrean_no ON antrean(no_antrian);
  CREATE INDEX IF NOT EXISTS idx_antrean_sku ON antrean(sku);

  CREATE TABLE IF NOT EXISTS sumber_permintaan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL UNIQUE
  );
`);

// Migrasi kolom tambahan secara aman
try { db.exec("ALTER TABLE antrean ADD COLUMN tgl_serah_cutting TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tim_cutting TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tarif_cutting REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN total_biaya_cutting REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN catatan_cutting TEXT;"); } catch (e) {}

// Migrasi kolom tahap Jahit
try { db.exec("ALTER TABLE antrean ADD COLUMN tgl_serah_jahit TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tim_jahit TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tarif_jahit REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN total_biaya_jahit REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN catatan_jahit TEXT;"); } catch (e) {}

// Migrasi kolom tahap QC (Quality Control)
try { db.exec("ALTER TABLE antrean ADD COLUMN tgl_serah_qc TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tim_qc TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN catatan_qc TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN status_qc TEXT DEFAULT 'Pemeriksaan';"); } catch (e) {}

// Migrasi kolom hasil QC & tahap Finishing
try { db.exec("ALTER TABLE antrean ADD COLUMN qty_pass_qc INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN qty_reject_qc INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN catatan_reject_qc TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tgl_serah_finishing TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tim_finishing TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN catatan_finishing TEXT;"); } catch (e) {}

// Migrasi kolom HPP & Harga Potong produk
try { db.exec("ALTER TABLE products ADD COLUMN hpp REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE products ADD COLUMN harga_potong REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE categories ADD COLUMN harga_potong REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE bahan ADD COLUMN supplier TEXT;"); } catch (e) {}

// Ensure table Mutasi Gudang Jadi exists
db.exec(`
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
    tgl_diserahkan TEXT,
    petugas_serah TEXT,
    tgl_diterima TEXT,
    petugas_terima TEXT,
    status_penerimaan TEXT DEFAULT 'Diterima',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_mgj_no ON mutasi_gudang_jadi(no_mutasi);
  CREATE INDEX IF NOT EXISTS idx_mgj_sku ON mutasi_gudang_jadi(sku);
  CREATE INDEX IF NOT EXISTS idx_mgj_antrean ON mutasi_gudang_jadi(no_antrian);
`);

// Migrasi kolom serah terima Gudang Jadi jika tabel sudah ada sebelumnya
try { db.exec("ALTER TABLE mutasi_gudang_jadi ADD COLUMN tgl_diserahkan TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE mutasi_gudang_jadi ADD COLUMN petugas_serah TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE mutasi_gudang_jadi ADD COLUMN tgl_diterima TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE mutasi_gudang_jadi ADD COLUMN petugas_terima TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE mutasi_gudang_jadi ADD COLUMN status_penerimaan TEXT DEFAULT 'Diterima';"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tgl_serah_gudang TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE antrean ADD COLUMN tgl_selesai TEXT;"); } catch (e) {}

// Update status lama 'Sedang Diproses' menjadi 'Proses Cutting'
try { db.exec("UPDATE antrean SET status = 'Proses Cutting' WHERE status = 'Sedang Diproses';"); } catch (e) {}
// Pastikan antrean yang diserahkan ke gudang berstatus 'Selesai'
try { db.exec("UPDATE antrean SET status = 'Selesai' WHERE status = 'Menunggu Penerimaan Gudang';"); } catch (e) {}

export default db;
