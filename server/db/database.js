import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi Koneksi MySQL Server
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "konveksi",
  password: process.env.DB_PASSWORD || "Jazman@271998",
  database: process.env.DB_NAME || "konveksi",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper normalisasi SQL query dari SQLite ke MySQL
function normalizeSql(sql) {
  return sql
    .replace(/datetime\('now',\s*'localtime'\)/gi, "NOW()")
    .replace(/datetime\('now'\)/gi, "NOW()")
    .replace(/date\('now'\)/gi, "CURRENT_DATE")
    .replace(/INSERT\s+OR\s+IGNORE/gi, "INSERT IGNORE");
}

// Wrapper DB Helper yang kompatibel dengan async/await
const db = {
  pool,

  async query(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    const [results] = await pool.query(cleanSql, params);
    return results;
  },

  async all(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    const [rows] = await pool.query(cleanSql, params);
    return Array.isArray(rows) ? rows : [];
  },

  async get(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    const [rows] = await pool.query(cleanSql, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  },

  async run(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    const [result] = await pool.query(cleanSql, params);
    return {
      lastInsertRowid: result.insertId,
      insertId: result.insertId,
      changes: result.affectedRows,
      affectedRows: result.affectedRows,
    };
  },

  prepare(sql) {
    const cleanSql = normalizeSql(sql);
    return {
      all: (...args) => db.all(cleanSql, args.flat()),
      get: (...args) => db.get(cleanSql, args.flat()),
      run: (...args) => db.run(cleanSql, args.flat()),
    };
  },
};

// Inisialisasi skema tabel MySQL dan data awal saat server start
async function initMysql() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Terhubung ke MySQL Database (konveksi@localhost)");

    const schemaPath = path.resolve(__dirname, "schema.mysql.sql");
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      const statements = schemaSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
      }
      console.log("✅ Skema tabel MySQL konveksi berhasil diverifikasi");
    }

    // Pastikan nilai default sumber_permintaan tersedia
    const [sumberRows] = await connection.query(
      "SELECT COUNT(*) as cnt FROM sumber_permintaan",
    );
    if (sumberRows[0].cnt === 0) {
      await connection.query(
        "INSERT IGNORE INTO sumber_permintaan (nama) VALUES ('PO Pelanggan'), ('Marketplace / Toko'), ('Rencana Internal')",
      );
    }

    // Pastikan kolom tarif & status bayar QC / Finishing tersedia di antrean
    const extraCols = [
      { name: 'tarif_qc', def: 'DECIMAL(12,2) DEFAULT 0' },
      { name: 'total_biaya_qc', def: 'DECIMAL(14,2) DEFAULT 0' },
      { name: 'tarif_finishing', def: 'DECIMAL(12,2) DEFAULT 0' },
      { name: 'total_biaya_finishing', def: 'DECIMAL(14,2) DEFAULT 0' },
      { name: 'status_bayar_cutting', def: "VARCHAR(30) DEFAULT 'Belum Lunas'" },
      { name: 'status_bayar_jahit', def: "VARCHAR(30) DEFAULT 'Belum Lunas'" },
      { name: 'status_bayar_qc', def: "VARCHAR(30) DEFAULT 'Belum Lunas'" },
      { name: 'status_bayar_finishing', def: "VARCHAR(30) DEFAULT 'Belum Lunas'" },
      { name: 'kebutuhan_bahan', def: "TEXT NULL" },
      { name: 'total_biaya_bahan', def: "DECIMAL(14,2) DEFAULT 0" },
      { name: 'total_hpp', def: "DECIMAL(14,2) DEFAULT 0" },
      { name: 'hpp_per_pcs', def: "DECIMAL(14,2) DEFAULT 0" },
    ];

    for (const col of extraCols) {
      try {
        const [colCheck] = await connection.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'antrean' AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()",
          [col.name]
        );
        if (!colCheck || colCheck.length === 0) {
          await connection.query(`ALTER TABLE antrean ADD COLUMN ${col.name} ${col.def}`);
        }
      } catch (_) {}
    }

    // Pastikan kolom potongan kasbon tersedia di pembayaran_upah
    const upahCols = [
      { name: 'potongan_kasbon', def: 'DECIMAL(14,2) DEFAULT 0' },
      { name: 'total_bersih', def: 'DECIMAL(14,2) DEFAULT 0' },
      { name: 'kasbon_id', def: 'INT NULL' }
    ];

    for (const col of upahCols) {
      try {
        const [colCheck] = await connection.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pembayaran_upah' AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()",
          [col.name]
        );
        if (!colCheck || colCheck.length === 0) {
          await connection.query(`ALTER TABLE pembayaran_upah ADD COLUMN ${col.name} ${col.def}`);
        }
      } catch (_) {}
    }

    // Pastikan kolom sku_induk tersedia di products (Etalase SKU Induk)
    try {
      const [colCheck] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'sku_induk' AND TABLE_SCHEMA = DATABASE()"
      );
      if (!colCheck || colCheck.length === 0) {
        await connection.query("ALTER TABLE products ADD COLUMN sku_induk VARCHAR(100) NULL AFTER id");
      }
      // Isi default sku_induk dari kategori atau nama_produk jika masih kosong
      await connection.query(`
        UPDATE products 
        SET sku_induk = COALESCE(NULLIF(TRIM(kategori), ''), TRIM(nama_produk))
        WHERE sku_induk IS NULL OR TRIM(sku_induk) = ''
      `);
    } catch (_) {}

    // Pastikan nilai default total_bersih terisi sesuai total_upah jika belum ada potongan kasbon
    try {
      await connection.query(`
        UPDATE pembayaran_upah 
        SET total_bersih = total_upah 
        WHERE (total_bersih IS NULL OR total_bersih = 0) AND (potongan_kasbon IS NULL OR potongan_kasbon = 0)
      `);
    } catch (_) {}

    // Migrasi data penjahit ke employees & hapus tabel terpisah penjahit
    try {
      const [tableCheck] = await connection.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'penjahit' AND TABLE_SCHEMA = DATABASE()"
      );
      if (tableCheck && tableCheck.length > 0) {
        await connection.query(`
          INSERT IGNORE INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk)
          SELECT nik, nama, kategori, 'Penjahit', status, telepon, CURRENT_DATE FROM penjahit
        `);
        await connection.query("DROP TABLE IF EXISTS penjahit");
        console.log("✅ Data penjahit berhasil digabungkan ke tabel employees dan tabel penjahit lama telah dibersihkan");
      }
    } catch (_) {}

    // Pastikan karyawan dengan bagian Penjahit tersedia di tabel employees
    try {
      const [jahitEmpRows] = await connection.query(
        "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(bagian) LIKE '%jahit%' OR LOWER(bagian) LIKE '%penjahit%'"
      );
      if (jahitEmpRows[0].cnt === 0) {
        await connection.query(`
          INSERT IGNORE INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk) VALUES
          ('JHT-001', 'CEPI', 'Borongan', 'Penjahit', 'Aktif', '0812-1111-2222', CURRENT_DATE),
          ('JHT-002', 'Siti Aminah', 'Tetap', 'Penjahit', 'Aktif', '0813-2222-3333', CURRENT_DATE),
          ('JHT-003', 'Budi Santoso', 'Borongan', 'Penjahit', 'Aktif', '0815-3333-4444', CURRENT_DATE)
        `);
      }
    } catch (_) {}

    // Pastikan data awal tabel tim_finishing tersedia (Terpisah murni dari penjahit)
    try {
      const [finishingRows] = await connection.query("SELECT COUNT(*) as cnt FROM tim_finishing");
      if (finishingRows[0].cnt === 0) {
        await connection.query(`
          INSERT IGNORE INTO tim_finishing (kode_tim, nama_tim, kategori, spesialisasi, kapasitas_harian, telepon) VALUES
          ('FIN-001', 'Tim Finishing 1 (Uap & Lipat)', 'Internal', 'Setrika Uap & Lipat Presisi', 300, '0812-4444-5555'),
          ('FIN-002', 'Tim Finishing 2 (Hangtag & Plastik OPP)', 'Internal', 'Pemasangan Hangtag & Packing OPP', 250, '0813-5555-6666'),
          ('FIN-003', 'Gudang Packing Akhir', 'Borongan', 'Finishing Akhir & Box Karton', 500, '0817-6666-7777')
        `);
      }
    } catch (_) {}

    // Pastikan master kategori dan harga potong tersimpan permanen di database MySQL
    try {
      const initialCategories = [
        { kode: 'CAT-SAMIRA', nama: 'SAMIRA', harga_potong: 700 },
        { kode: 'CAT-AISHA', nama: 'AISHA', harga_potong: 600 },
        { kode: 'CAT-SHAFEA', nama: 'SHAFEA', harga_potong: 1000 },
        { kode: 'CAT-COQUETTE', nama: 'COQUETTE', harga_potong: 1000 },
        { kode: 'CAT-NAYYARA', nama: 'NAYYARA', harga_potong: 1000 },
        { kode: 'CAT-ALUNA', nama: 'ALUNA', harga_potong: 1000 },
        { kode: 'CAT-HAFSA', nama: 'HAFSA', harga_potong: 1000 },
        { kode: 'CAT-MINA', nama: 'MINA', harga_potong: 1000 },
        { kode: 'CAT-NAEEMA', nama: 'NAEEMA', harga_potong: 1000 },
        { kode: 'CAT-IRANANDHA', nama: 'IRANANDHA', harga_potong: 500 },
        { kode: 'CAT-NAOMI', nama: 'NAOMI', harga_potong: 500 },
        { kode: 'CAT-RALINE', nama: 'RALINE', harga_potong: 500 },
        { kode: 'CAT-AYUMI', nama: 'AYUMI', harga_potong: 500 },
        { kode: 'CAT-VISCOSE', nama: 'VISCOSE', harga_potong: 500 },
        { kode: 'CAT-KERUDUNG', nama: 'KERUDUNG', harga_potong: 500 },
        { kode: 'CAT-OVAL', nama: 'OVAL', harga_potong: 500 },
        { kode: 'CAT-RAWDA', nama: 'RAWDA', harga_potong: 700 },
        { kode: 'CAT-LINI', nama: 'LINI', harga_potong: 600 },
        { kode: 'CAT-ZAFIRA', nama: 'ZAFIRA', harga_potong: 700 },
        { kode: 'CAT-NOIRA', nama: 'NOIRA', harga_potong: 600 },
        { kode: 'CAT-ALYSSA', nama: 'ALYSSA', harga_potong: 700 },
        { kode: 'CAT-LAVINA', nama: 'LAVINA', harga_potong: 600 },
        { kode: 'CAT-ELVARA', nama: 'ELVARA', harga_potong: 500 },
        { kode: 'CAT-ARUMI', nama: 'ARUMI', harga_potong: 500 },
        { kode: 'CAT-HABIBAH', nama: 'HABIBAH', harga_potong: 500 },
        { kode: 'CAT-FATIYA', nama: 'FATIYA', harga_potong: 500 },
        { kode: 'CAT-HANA', nama: 'HANA', harga_potong: 700 },
        { kode: 'CAT-LARISA', nama: 'LARISA', harga_potong: 600 },
        { kode: 'CAT-LUNARA', nama: 'LUNARA', harga_potong: 200 },
        { kode: 'CAT-ALIFA', nama: 'ALIFA', harga_potong: 600 },
        { kode: 'CAT-KALUNA', nama: 'KALUNA', harga_potong: 600 },
        { kode: 'CAT-HUMAIRA', nama: 'HUMAIRA', harga_potong: 1000 },
        { kode: 'CAT-PASBAN-UV', nama: 'PASBAN UV', harga_potong: 500 },
        { kode: 'CAT-ZAHWA', nama: 'ZAHWA', harga_potong: 500 },
      ];

      for (const cat of initialCategories) {
        const [existing] = await connection.query(
          "SELECT id, harga_potong FROM categories WHERE UPPER(nama) = ? OR UPPER(kode) = ?",
          [cat.nama.toUpperCase(), cat.kode.toUpperCase()]
        );
        if (!existing || existing.length === 0) {
          await connection.query(
            "INSERT INTO categories (kode, nama, harga_potong, status) VALUES (?, ?, ?, 'Aktif')",
            [cat.kode, cat.nama, cat.harga_potong]
          );
        } else if (Number(existing[0].harga_potong || 0) === 0) {
          await connection.query(
            "UPDATE categories SET harga_potong = ? WHERE id = ?",
            [cat.harga_potong, existing[0].id]
          );
        }
      }
      console.log("✅ Master kategori & harga potong tersinkron permanen di MySQL");
    } catch (catErr) {
      console.warn("Peringatan sinkronisasi kategori MySQL:", catErr.message);
    }

    // Pastikan master ukuran (sizes) tersedia di tabel sizes MySQL
    try {
      const defaultSizes = [
        'S', 'M', 'L', 'XL', 'XXL', '3XL', 'All Size', '28', '30', '32', '34', '36'
      ];
      for (let i = 0; i < defaultSizes.length; i++) {
        await connection.query(
          "INSERT IGNORE INTO sizes (nama, urutan) VALUES (?, ?)",
          [defaultSizes[i], i + 1]
        );
      }
      console.log("✅ Master ukuran (sizes) tersinkron permanen di MySQL");
    } catch (szErr) {
      console.warn("Peringatan sinkronisasi sizes MySQL:", szErr.message);
    }

    connection.release();
  } catch (err) {
    console.error("❌ Gagal inisialisasi MySQL Database:", err.message);
  }
}

initMysql();

export default db;
