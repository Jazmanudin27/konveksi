import db from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  initialCategories,
  initialBahan,
  initialProducts,
  initialEmployees,
  initialJasa,
  initialMutasiBahan,
  initialAntrean,
} from "./initialData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Seeding SQLite database...");

// Recreate fresh tables
const dropSql = `
  DROP TABLE IF EXISTS antrean;
  DROP TABLE IF EXISTS spk_item;
  DROP TABLE IF EXISTS spk;
  DROP TABLE IF EXISTS mutasi_bahan_item;
  DROP TABLE IF EXISTS mutasi_bahan;
  DROP TABLE IF EXISTS jasa;
  DROP TABLE IF EXISTS tahapan;
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS bahan;
  DROP TABLE IF EXISTS categories;
`;
db.exec(dropSql);

const schemaPath = path.resolve(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

db.exec("BEGIN");

try {
  // 1. Categories
  const insertCat = db.prepare(`
    INSERT INTO categories (id, kode, nama, deskripsi, total_produk, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of initialCategories) {
    insertCat.run(
      c.id,
      c.kode,
      c.nama,
      c.deskripsi || null,
      c.totalProduk || 0,
      c.status || "Aktif",
      c.updatedAt || null,
    );
  }

  // 2. Bahan
  const insertBhn = db.prepare(`
    INSERT INTO bahan (id, kode_bahan, nama_bahan, satuan, harga, stok, status, keterangan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of initialBahan) {
    insertBhn.run(
      b.id,
      b.kodeBahan,
      b.namaBahan,
      b.satuan,
      b.harga || 0,
      b.stok || 0,
      b.status || "Tersedia",
      b.keterangan || null,
    );
  }

  // 3. Products
  const insertPrd = db.prepare(`
    INSERT INTO products (id, sku, sku_bahan, nama_produk, kategori, varian, warna_hex, ukuran, stok, status, harga, tanggal_update)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of initialProducts) {
    insertPrd.run(
      p.id,
      p.sku,
      p.skuBahan || null,
      p.namaProduk,
      p.kategori,
      p.varian || null,
      p.warnaHex || null,
      p.ukuran || null,
      p.stok || 0,
      p.status || "Aktif",
      p.harga || 0,
      p.tanggalUpdate || null,
    );
  }

  // 4. Employees
  const insertEmp = db.prepare(`
    INSERT INTO employees (id, nik, nama, kategori, bagian, status, telepon, tanggal_masuk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const e of initialEmployees) {
    insertEmp.run(
      e.id,
      e.nik,
      e.nama,
      e.kategori,
      e.bagian,
      e.status || "Aktif",
      e.telepon || null,
      e.tanggalMasuk || null,
    );
  }

  // 5. Jasa
  const insertJsa = db.prepare(`
    INSERT INTO jasa (id, kode_jasa, sku, nama_jasa, qty, harga, satuan, status, keterangan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const j of initialJasa) {
    insertJsa.run(
      j.id,
      j.kodeJasa,
      j.sku || null,
      j.namaJasa,
      j.qty || 0,
      j.harga || 0,
      j.satuan || "Pcs",
      j.status || "Aktif",
      j.keterangan || null,
    );
  }

  // 7. Mutasi Bahan & Items
  const insertMut = db.prepare(`
    INSERT INTO mutasi_bahan (id, no_bukti, tgl, no_reff, jenis_mutasi, keterangan)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertMutItem = db.prepare(`
    INSERT INTO mutasi_bahan_item (id, mutasi_id, no_bukti, kode_bahan, nama_bahan, satuan, qty, harga, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of initialMutasiBahan) {
    insertMut.run(
      m.id,
      m.noBukti,
      m.tgl,
      m.noReff || null,
      m.jenisMutasi,
      m.keterangan || null,
    );
    if (Array.isArray(m.items)) {
      for (const item of m.items) {
        insertMutItem.run(
          item.id,
          m.id,
          item.noBukti || m.noBukti,
          item.kode_bahan || item.kodeBahan,
          item.nama_bahan || item.namaBahan,
          item.satuan,
          item.qty || 0,
          item.harga || 0,
          item.total || 0,
        );
      }
    }
  }

  // 8. Antrean Produksi (Relasi ke Produk)
  const insertAnt = db.prepare(`
    INSERT INTO antrean (id, no_antrian, tgl_masuk, sumber_permintaan, no_reff, sku, qty, prioritas, deadline, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of initialAntrean) {
    insertAnt.run(
      a.id,
      a.noAntrian,
      a.tglMasuk,
      a.sumberPermintaan,
      a.noReff || null,
      a.sku,
      a.qty || 1,
      a.prioritas || 'Normal',
      a.deadline,
      a.status || 'Menunggu Cutting',
      a.catatan || null
    );
  }

  db.exec("COMMIT");
  console.log("Seeding selesai sukses! Database konveksi.db siap digunakan.");
} catch (err) {
  db.exec("ROLLBACK");
  console.error("Seeding gagal:", err);
  process.exit(1);
}
