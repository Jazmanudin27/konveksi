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

    // Pastikan nilai default total_bersih terisi sesuai total_upah jika belum ada potongan kasbon
    try {
      await connection.query(`
        UPDATE pembayaran_upah 
        SET total_bersih = total_upah 
        WHERE (total_bersih IS NULL OR total_bersih = 0) AND (potongan_kasbon IS NULL OR potongan_kasbon = 0)
      `);
    } catch (_) {}

    // Pastikan data awal tabel penjahit tersedia
    try {
      const [penjahitRows] = await connection.query("SELECT COUNT(*) as cnt FROM penjahit");
      if (penjahitRows[0].cnt === 0) {
        await connection.query(`
          INSERT IGNORE INTO penjahit (nik, nama, kategori, spesialisasi, tarif_per_pcs, telepon) VALUES
          ('JHT-001', 'CEPI', 'Borongan', 'Jahit Kaos & Busana', 3500, '0812-1111-2222'),
          ('JHT-002', 'Siti Aminah', 'Tetap', 'Jahit Gamis & Obras', 3500, '0813-2222-3333'),
          ('JHT-003', 'Budi Santoso', 'Borongan', 'Perakitan & Stik Balik', 3500, '0815-3333-4444')
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

    connection.release();
  } catch (err) {
    console.error("❌ Gagal inisialisasi MySQL Database:", err.message);
  }
}

initMysql();

export default db;
