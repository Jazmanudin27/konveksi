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

// Inisialisasi skema tabel MySQL saat server start
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

    // Pastikan kolom tarif & status bayar QC / Finishing tersedia di antrean
    const extraCols = [
      { name: "tarif_qc", def: "DECIMAL(12,2) DEFAULT 0" },
      { name: "total_biaya_qc", def: "DECIMAL(14,2) DEFAULT 0" },
      { name: "tarif_finishing", def: "DECIMAL(12,2) DEFAULT 0" },
      { name: "total_biaya_finishing", def: "DECIMAL(14,2) DEFAULT 0" },
      {
        name: "status_bayar_cutting",
        def: "VARCHAR(30) DEFAULT 'Belum Lunas'",
      },
      { name: "status_bayar_jahit", def: "VARCHAR(30) DEFAULT 'Belum Lunas'" },
      { name: "status_bayar_qc", def: "VARCHAR(30) DEFAULT 'Belum Lunas'" },
      {
        name: "status_bayar_finishing",
        def: "VARCHAR(30) DEFAULT 'Belum Lunas'",
      },
      { name: "kebutuhan_bahan", def: "TEXT NULL" },
      { name: "total_biaya_bahan", def: "DECIMAL(14,2) DEFAULT 0" },
      { name: "total_hpp", def: "DECIMAL(14,2) DEFAULT 0" },
      { name: "hpp_per_pcs", def: "DECIMAL(14,2) DEFAULT 0" },
    ];

    for (const col of extraCols) {
      try {
        const [colCheck] = await connection.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'antrean' AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()",
          [col.name],
        );
        if (!colCheck || colCheck.length === 0) {
          await connection.query(
            `ALTER TABLE antrean ADD COLUMN ${col.name} ${col.def}`,
          );
        }
      } catch (_) {}
    }

    // Pastikan kolom potongan kasbon tersedia di pembayaran_upah
    const upahCols = [
      { name: "potongan_kasbon", def: "DECIMAL(14,2) DEFAULT 0" },
      { name: "total_bersih", def: "DECIMAL(14,2) DEFAULT 0" },
      { name: "kasbon_id", def: "INT NULL" },
    ];

    for (const col of upahCols) {
      try {
        const [colCheck] = await connection.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pembayaran_upah' AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()",
          [col.name],
        );
        if (!colCheck || colCheck.length === 0) {
          await connection.query(
            `ALTER TABLE pembayaran_upah ADD COLUMN ${col.name} ${col.def}`,
          );
        }
      } catch (_) {}
    }

    // Pastikan kolom sku_induk & kebutuhan_bahan tersedia di products
    try {
      const [colCheckSku] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'sku_induk' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colCheckSku || colCheckSku.length === 0) {
        await connection.query(
          "ALTER TABLE products ADD COLUMN sku_induk VARCHAR(100) NULL AFTER id",
        );
      }

      const [colCheckBOM] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'kebutuhan_bahan' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colCheckBOM || colCheckBOM.length === 0) {
        await connection.query(
          "ALTER TABLE products ADD COLUMN kebutuhan_bahan TEXT NULL AFTER hpp",
        );
      }
    } catch (_) {}

    // Pastikan kolom username & password tersedia di tabel employees
    try {
      const [colUser] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'username' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colUser || colUser.length === 0) {
        await connection.query(
          "ALTER TABLE employees ADD COLUMN username VARCHAR(100) NULL AFTER tanggal_masuk",
        );
      }

      const [colPass] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'password' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colPass || colPass.length === 0) {
        await connection.query(
          "ALTER TABLE employees ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '123456' AFTER username",
        );
      }
    } catch (_) {}

    // Pastikan kolom username & password tersedia di tabel tim_finishing
    try {
      const [colUserFin] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tim_finishing' AND COLUMN_NAME = 'username' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colUserFin || colUserFin.length === 0) {
        await connection.query(
          "ALTER TABLE tim_finishing ADD COLUMN username VARCHAR(100) NULL AFTER catatan",
        );
      }

      const [colPassFin] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tim_finishing' AND COLUMN_NAME = 'password' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colPassFin || colPassFin.length === 0) {
        await connection.query(
          "ALTER TABLE tim_finishing ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '123456' AFTER username",
        );
      }
    } catch (_) {}

    connection.release();
  } catch (err) {
    console.error("❌ Gagal inisialisasi MySQL Database:", err.message);
  }
}

initMysql();

export default db;
