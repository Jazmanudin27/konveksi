import express from "express";
import db, { pool } from "../db/database.js";

const router = express.Router();

const DEFAULT_SIZES = [
  "SET",
  "TANPA",
  "ANAK M",
  "ANAK L",
  "ANAK XL",
  "ANAK XXL",
  "STANDAR",
  "BIG",
  "JUMBO",
  "ALLSIZE",
  "TUNIK STANDAR",
  "TUNIK JUMBO",
  "SET ROK STANDAR",
  "SET ROK JUMBO",
  "M",
  "L/XL",
  "KEMEJA PND",
  "KEMEJA PJ",
  "UV",
  "CRINKLE",
  "L",
  "XL",
  "ATASAN STANDAR",
  "ATASAN JUMBO",
  "SET CELANA STANDAR",
  "SET CELANA JUMBO",
  "CAMPUR",
];

// Helper auto-init tabel sizes dan seed default
async function ensureSizesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(60) NOT NULL UNIQUE,
        urutan INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM sizes");
    if (rows[0].cnt === 0) {
      for (let i = 0; i < DEFAULT_SIZES.length; i++) {
        await pool.query(
          "INSERT IGNORE INTO sizes (nama, urutan) VALUES (?, ?)",
          [DEFAULT_SIZES[i], i + 1]
        );
      }
      console.log(`✅ ${DEFAULT_SIZES.length} Ukuran master berhasil diinisialisasi`);
    }
  } catch (err) {
    console.error("Gagal verifikasi tabel sizes:", err);
  }
}

// GET /api/sizes - Ambil semua ukuran
router.get("/", async (req, res) => {
  try {
    await ensureSizesTable();
    const [rows] = await pool.query(
      "SELECT id, nama, urutan FROM sizes ORDER BY urutan ASC, id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/sizes error:", err);
    res.status(500).json({ error: "Gagal mengambil data ukuran" });
  }
});

// POST /api/sizes - Tambah ukuran baru
router.post("/", async (req, res) => {
  try {
    await ensureSizesTable();
    const { nama, urutan } = req.body;
    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: "Nama ukuran wajib diisi" });
    }

    const cleanNama = nama.trim().toUpperCase();

    // Cek duplikasi
    const [existing] = await pool.query("SELECT id FROM sizes WHERE nama = ?", [cleanNama]);
    if (existing.length > 0) {
      return res.status(400).json({ error: `Ukuran '${cleanNama}' sudah ada` });
    }

    const [maxOrder] = await pool.query("SELECT MAX(urutan) as max_u FROM sizes");
    const nextUrutan = urutan !== undefined ? Number(urutan) : (maxOrder[0].max_u || 0) + 1;

    const [result] = await pool.query(
      "INSERT INTO sizes (nama, urutan) VALUES (?, ?)",
      [cleanNama, nextUrutan]
    );

    res.status(201).json({
      id: result.insertId,
      nama: cleanNama,
      urutan: nextUrutan,
      message: "Ukuran berhasil ditambahkan",
    });
  } catch (err) {
    console.error("POST /api/sizes error:", err);
    res.status(500).json({ error: "Gagal menambahkan ukuran baru" });
  }
});

// PUT /api/sizes/:id - Edit nama ukuran
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, urutan } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: "Nama ukuran tidak boleh kosong" });
    }

    const cleanNama = nama.trim().toUpperCase();

    // Cek duplikasi dengan id lain
    const [existing] = await pool.query(
      "SELECT id FROM sizes WHERE nama = ? AND id != ?",
      [cleanNama, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: `Ukuran '${cleanNama}' sudah ada` });
    }

    await pool.query(
      "UPDATE sizes SET nama = ?, urutan = COALESCE(?, urutan) WHERE id = ?",
      [cleanNama, urutan !== undefined ? Number(urutan) : null, id]
    );

    res.json({ id: Number(id), nama: cleanNama, message: "Ukuran berhasil diubah" });
  } catch (err) {
    console.error("PUT /api/sizes/:id error:", err);
    res.status(500).json({ error: "Gagal mengubah data ukuran" });
  }
});

// DELETE /api/sizes/:id - Hapus ukuran
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM sizes WHERE id = ?", [id]);
    res.json({ id: Number(id), message: "Ukuran berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /api/sizes/:id error:", err);
    res.status(500).json({ error: "Gagal menghapus ukuran" });
  }
});

export default router;

