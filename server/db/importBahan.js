import db from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure supplier column exists
try { db.exec("ALTER TABLE bahan ADD COLUMN supplier TEXT;"); } catch (e) {}

const newBahanList = [
  {
    id: 1,
    kodeBahan: "BHN-001",
    namaBahan: "Fleece Hitam 280gsm",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 98000,
    stok: 428,
    status: "Tersedia",
    keterangan: "Fleece 280gsm gramasi tebal"
  },
  {
    id: 2,
    kodeBahan: "BHN-002",
    namaBahan: "Fleece Navy 280gsm",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 98000,
    stok: 344,
    status: "Tersedia",
    keterangan: "Fleece 280gsm gramasi tebal"
  },
  {
    id: 3,
    kodeBahan: "BHN-003",
    namaBahan: "Cotton Combed 24s Putih",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 85000,
    stok: 205,
    status: "Tersedia",
    keterangan: "Combed 24s katun premium"
  },
  {
    id: 4,
    kodeBahan: "BHN-004",
    namaBahan: "Cotton Combed 24s Hitam",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 85000,
    stok: 144,
    status: "Tersedia",
    keterangan: "Combed 24s katun premium"
  },
  {
    id: 5,
    kodeBahan: "BHN-005",
    namaBahan: "Terry Abu",
    satuan: "Kg",
    supplier: "UD Kain Makmur",
    harga: 92000,
    stok: 326,
    status: "Tersedia",
    keterangan: "Baby terry rajut halus"
  },
  {
    id: 6,
    kodeBahan: "BHN-006",
    namaBahan: "Benang Jahit Hitam",
    satuan: "Cone",
    supplier: "Toko Aksesoris Jaya",
    harga: 12000,
    stok: 30,
    status: "Tersedia",
    keterangan: "Benang jahit cone industri"
  }
];

// 1. UPDATE SQLITE
db.exec("BEGIN");
try {
  db.exec("DELETE FROM bahan;");

  const insertStmt = db.prepare(`
    INSERT INTO bahan (id, kode_bahan, nama_bahan, satuan, supplier, harga, stok, status, keterangan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of newBahanList) {
    insertStmt.run(
      b.id,
      b.kodeBahan,
      b.namaBahan,
      b.satuan,
      b.supplier,
      b.harga,
      b.stok,
      b.status,
      b.keterangan
    );
  }

  db.exec("COMMIT");
  console.log("✅ Successfully committed new bahan data to SQLite konveksi.db!");
} catch (err) {
  db.exec("ROLLBACK");
  console.error("❌ Failed to insert bahan:", err);
  process.exit(1);
}

// 2. UPDATE initialData.js
const initialDataPath = path.resolve(__dirname, "initialData.js");
let initialContent = fs.readFileSync(initialDataPath, "utf8");

const newInitialBahanStr = `export const initialBahan = ${JSON.stringify(newBahanList, null, 2)};\n`;
initialContent = initialContent.replace(/export const initialBahan = \[[\s\S]*?\];/m, newInitialBahanStr.trim());
fs.writeFileSync(initialDataPath, initialContent, "utf8");
console.log("✅ Successfully updated initialData.js!");

