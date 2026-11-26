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

    // Pastikan kolom sku_induk tersedia di products (Etalase SKU Induk)
    try {
      const [colCheck] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'sku_induk' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colCheck || colCheck.length === 0) {
        await connection.query(
          "ALTER TABLE products ADD COLUMN sku_induk VARCHAR(100) NULL AFTER id",
        );
      }
      // Isi default sku_induk dari kategori atau nama_produk jika masih kosong
      await connection.query(`
        UPDATE products 
        SET sku_induk = COALESCE(NULLIF(TRIM(kategori), ''), TRIM(nama_produk))
        WHERE sku_induk IS NULL OR TRIM(sku_induk) = ''
      `);
    } catch (_) {}

    // Pastikan kolom kebutuhan_bahan (Resep BOM Bahan Baku per Pcs) tersedia di products
    try {
      const [colCheck] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'kebutuhan_bahan' AND TABLE_SCHEMA = DATABASE()",
      );
      if (!colCheck || colCheck.length === 0) {
        await connection.query(
          "ALTER TABLE products ADD COLUMN kebutuhan_bahan TEXT NULL AFTER hpp",
        );
      }
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
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'penjahit' AND TABLE_SCHEMA = DATABASE()",
      );
      if (tableCheck && tableCheck.length > 0) {
        await connection.query(`
          INSERT IGNORE INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk)
          SELECT nik, nama, kategori, 'Penjahit', status, telepon, CURRENT_DATE FROM penjahit
        `);
        await connection.query("DROP TABLE IF EXISTS penjahit");
        console.log(
          "✅ Data penjahit berhasil digabungkan ke tabel employees dan tabel penjahit lama telah dibersihkan",
        );
      }
    } catch (_) {}

    // Pastikan kolom username & password tersedia di tabel employees (Akun Login Penjahit)
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

      // Isi default username jika belum terisi
      await connection.query(`
        UPDATE employees 
        SET username = LOWER(REPLACE(COALESCE(NULLIF(TRIM(nik), ''), TRIM(nama)), ' ', '')),
            password = COALESCE(NULLIF(TRIM(password), ''), '123456')
        WHERE username IS NULL OR TRIM(username) = ''
      `);
    } catch (_) {}

    // Pastikan kolom username & password tersedia di tabel tim_finishing (Akun Login Tim Finishing)
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

      // Isi default username jika belum terisi
      await connection.query(`
        UPDATE tim_finishing 
        SET username = LOWER(REPLACE(COALESCE(NULLIF(TRIM(kode_tim), ''), TRIM(nama_tim)), ' ', '')),
            password = COALESCE(NULLIF(TRIM(password), ''), '123456')
        WHERE username IS NULL OR TRIM(username) = ''
      `);
    } catch (_) {}

    // Bersihkan data dummy / fake lama jika pernah ter-generate otomatis
    try {
      await connection.query(
        "DELETE FROM employees WHERE nik IN ('JHT-001', 'JHT-002', 'JHT-003') AND nama IN ('CEPI', 'Siti Aminah', 'Budi Santoso')",
      );
      await connection.query(
        "DELETE FROM tim_finishing WHERE kode_tim IN ('FIN-001', 'FIN-002', 'FIN-003') AND nama_tim LIKE 'Tim Finishing%'",
      );
    } catch (_) {}

    // Pastikan tabel users dan user operasional tersedia di database MySQL
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          nama VARCHAR(150) NOT NULL,
          email VARCHAR(150),
          password VARCHAR(255) NOT NULL DEFAULT '123456',
          role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
          status VARCHAR(30) NOT NULL DEFAULT 'Aktif',
          telepon VARCHAR(50),
          keterangan TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users_role (role),
          INDEX idx_users_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const [userRows] = await connection.query(
        "SELECT COUNT(*) as cnt FROM users",
      );
      if (userRows[0].cnt === 0) {
        await connection.query(`
          INSERT IGNORE INTO users (username, nama, email, password, role, status, telepon) VALUES
          ('admin', 'Super Admin Ruang Konveksi', 'admin@ruangtech.com', '123456', 'superadmin', 'Aktif', '0812-3456-7890'),
          ('gudang', 'Admin Gudang & Restock', 'gudang@ruangtech.com', '123456', 'gudang', 'Aktif', '0813-1122-3344'),
          ('cutting', 'Admin Divisi Cutting', 'cutting@ruangtech.com', '123456', 'cutting', 'Aktif', '0815-5566-7788'),
          ('jahit', 'Admin Divisi Jahit', 'jahit@ruangtech.com', '123456', 'jahit', 'Aktif', '0817-9900-1122'),
          ('qc', 'Admin Quality Control', 'qc@ruangtech.com', '123456', 'qc', 'Aktif', '0818-3344-5566'),
          ('finishing', 'Admin Finishing & Packing', 'finishing@ruangtech.com', '123456', 'finishing', 'Aktif', '0819-7788-9900')
        `);
      }

      // Auto-sinkronisasi semua penjahit dari master employees ke tabel users
      try {
        const [penjahits] = await connection.query(`
          SELECT id, nik, nama, kategori, bagian, status, telepon 
          FROM employees 
          WHERE LOWER(bagian) LIKE '%jahit%' OR LOWER(kategori) LIKE '%borongan%' OR LOWER(bagian) LIKE '%sew%'
        `);
        for (const p of penjahits) {
          const rawUser = (p.nik || p.nama.replace(/\\s+/g, ""))
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "");
          const username = rawUser || `penjahit_${p.id}`;
          await connection.query(
            `
            INSERT IGNORE INTO users (username, nama, password, role, status, telepon, keterangan)
            VALUES (?, ?, '123456', 'jahit', ?, ?, ?)
          `,
            [
              username,
              p.nama,
              p.status || "Aktif",
              p.telepon || null,
              `Akun Penjahit ${p.kategori || "Borongan"}`,
            ],
          );
        }
      } catch (_) {}

      console.log("✅ Tabel users & data akun operasional tersinkron di MySQL");
    } catch (uErr) {
      console.warn("Peringatan sinkronisasi users MySQL:", uErr.message);
    }

    connection.release();
  } catch (err) {
    console.error("❌ Gagal inisialisasi MySQL Database:", err.message);
  }
}

initMysql();

export default db;
