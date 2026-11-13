import db from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hargaPotongMap = {
  "SAMIRA": 700,
  "AISHA": 600,
  "SHAFEA": 1000,
  "COQUETTE": 1000,
  "NAYYARA": 1000,
  "ALUNA": 1000,
  "HAFSA": 1000,
  "MINA": 1000,
  "NAEEMA": 1000,
  "IRANANDHA": 500,
  "NAOMI": 500,
  "RALINE": 500,
  "AYUMI": 500,
  "VISCOSE": 500,
  "KERUDUNG": 500,
  "OVAL": 500,
  "RAWDA": 700,
  "LINI": 600,
  "ZAFIRA": 700,
  "NOIRA": 600,
  "ALYSSA": 700,
  "LAVINA": 600,
  "ELVARA": 500,
  "ARUMI": 500,
  "HANA": 700,
  "LARISA": 600,
  "LUNARA": 200,
  "ALIFA": 600,
  "KALUNA": 600,
  "HUMAIRA": 1000,
  "PASBAN UV": 500
};

// 1. ALTER TABLE IF NEEDED
try { db.exec("ALTER TABLE categories ADD COLUMN harga_potong REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE products ADD COLUMN harga_potong REAL DEFAULT 0;"); } catch (e) {}

// 2. UPDATE CATEGORIES & PRODUCTS
db.exec("BEGIN");
try {
  const updateCatStmt = db.prepare("UPDATE categories SET harga_potong = ? WHERE UPPER(nama) = ?");
  const updatePrdStmt = db.prepare("UPDATE products SET harga_potong = ? WHERE UPPER(kategori) = ?");

  for (const [kat, tarif] of Object.entries(hargaPotongMap)) {
    updateCatStmt.run(tarif, kat.toUpperCase());
    updatePrdStmt.run(tarif, kat.toUpperCase());
  }

  db.exec("COMMIT");
  console.log("✅ Successfully updated harga_potong in categories and products tables!");
} catch (err) {
  db.exec("ROLLBACK");
  console.error("❌ Failed to update database:", err);
  process.exit(1);
}

// 3. UPDATE initialData.js
const initialDataPath = path.resolve(__dirname, "initialData.js");
let initialContent = fs.readFileSync(initialDataPath, "utf8");

// We can read categories and products from db and re-export to initialData.js
const allCats = db.prepare("SELECT * FROM categories ORDER BY id ASC").all().map(c => ({
  id: c.id,
  kode: c.kode,
  nama: c.nama,
  deskripsi: c.deskripsi,
  totalProduk: c.total_produk,
  hargaPotong: Number(c.harga_potong || 0),
  status: c.status,
  updatedAt: c.updated_at
}));

const allPrds = db.prepare("SELECT * FROM products ORDER BY id ASC").all().map(p => ({
  id: p.id,
  sku: p.sku,
  skuBahan: p.sku_bahan,
  namaProduk: p.nama_produk,
  kategori: p.kategori,
  varian: p.varian,
  warnaHex: p.warna_hex,
  ukuran: p.ukuran,
  stok: p.stok,
  status: p.status,
  harga: p.harga,
  hpp: p.hpp,
  hargaPotong: Number(p.harga_potong || 0),
  tanggalUpdate: p.tanggal_update
}));

const newInitialCategoriesStr = `export const initialCategories = ${JSON.stringify(allCats, null, 2)};\n`;
const newInitialProductsStr = `export const initialProducts = ${JSON.stringify(allPrds, null, 2)};\n`;

initialContent = initialContent.replace(/export const initialCategories = \[[\s\S]*?\];/m, newInitialCategoriesStr.trim());
initialContent = initialContent.replace(/export const initialProducts = \[[\s\S]*?\];/m, newInitialProductsStr.trim());

fs.writeFileSync(initialDataPath, initialContent, "utf8");
console.log("✅ Successfully updated initialData.js with hargaPotong!");

