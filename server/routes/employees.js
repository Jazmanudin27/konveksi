import { Router } from "express";
import db from "../db/database.js";

const router = Router();

// GET all employees
router.get("/", async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM employees ORDER BY id ASC");
    res.json(
      rows.map((r) => ({
        id: r.id,
        nik: r.nik,
        nama: r.nama,
        kategori: r.kategori,
        bagian: r.bagian,
        status: r.status,
        telepon: r.telepon,
        tanggalMasuk: r.tanggal_masuk,
        username:
          r.username || (r.nik || r.nama.replace(/\s+/g, "")).toLowerCase(),
        password: r.password || "123456",
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create employee
router.post("/", async (req, res) => {
  const {
    nik,
    nama,
    kategori,
    bagian,
    status,
    telepon,
    tanggalMasuk,
    username,
    password,
  } = req.body;
  const cleanUsername = (username || nik || nama.replace(/\s+/g, ""))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  const cleanPassword = password || "123456";

  try {
    const info = await db.run(
      "INSERT INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nik,
        nama,
        kategori,
        bagian,
        status || "Aktif",
        telepon || null,
        tanggalMasuk || null,
        cleanUsername,
        cleanPassword,
      ],
    );

    // Jika bagian penjahit atau borongan, sinkronkan juga ke tabel users
    if (
      String(bagian || "")
        .toLowerCase()
        .includes("jahit") ||
      String(kategori || "")
        .toLowerCase()
        .includes("borongan")
    ) {
      await db.run(
        `INSERT INTO users (username, nama, password, role, status, telepon, keterangan)
         VALUES (?, ?, ?, 'jahit', ?, ?, ?)
         ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password), status = VALUES(status)`,
        [
          cleanUsername,
          nama,
          cleanPassword,
          status || "Aktif",
          telepon || null,
          `Akun Penjahit ${kategori || "Borongan"}`,
        ],
      );
    }

    res.status(201).json({
      id: Number(info.insertId),
      ...req.body,
      username: cleanUsername,
      password: cleanPassword,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update employee
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nik,
    nama,
    kategori,
    bagian,
    status,
    telepon,
    tanggalMasuk,
    username,
    password,
  } = req.body;
  const cleanUsername = (username || nik || nama.replace(/\s+/g, ""))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  const cleanPassword = password || "123456";

  try {
    await db.run(
      "UPDATE employees SET nik = ?, nama = ?, kategori = ?, bagian = ?, status = ?, telepon = ?, tanggal_masuk = ?, username = ?, password = ? WHERE id = ?",
      [
        nik,
        nama,
        kategori,
        bagian,
        status || "Aktif",
        telepon || null,
        tanggalMasuk || null,
        cleanUsername,
        cleanPassword,
        id,
      ],
    );

    // Sinkronkan ke tabel users jika penjahit
    if (
      String(bagian || "")
        .toLowerCase()
        .includes("jahit") ||
      String(kategori || "")
        .toLowerCase()
        .includes("borongan")
    ) {
      await db.run(
        `INSERT INTO users (username, nama, password, role, status, telepon, keterangan)
         VALUES (?, ?, ?, 'jahit', ?, ?, ?)
         ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password), status = VALUES(status)`,
        [
          cleanUsername,
          nama,
          cleanPassword,
          status || "Aktif",
          telepon || null,
          `Akun Penjahit ${kategori || "Borongan"}`,
        ],
      );
    }

    res.json({
      success: true,
      id: Number(id),
      username: cleanUsername,
      password: cleanPassword,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    const emp = await db.get(
      "SELECT nik, username FROM employees WHERE id = ?",
      [req.params.id],
    );
    if (emp) {
      const u = emp.username || emp.nik;
      if (u) {
        await db.run(
          'DELETE FROM users WHERE username = ? AND role = "jahit"',
          [u],
        );
      }
    }
    await db.run("DELETE FROM employees WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
