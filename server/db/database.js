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

    connection.release();
  } catch (err) {
    console.error("❌ Gagal inisialisasi MySQL Database:", err.message);
  }
}

initMysql();

export default db;
