import { Router } from "express";
import { pool } from "../db/database.js";

const router = Router();

// 1. GET /api/kasbon
// Ambil seluruh data kasbon dengan filter status, petugas & search
router.get("/", async (req, res) => {
  const { status, petugas, search } = req.query;
  const connection = await pool.getConnection();

  try {
    let sql = "SELECT * FROM kasbon WHERE 1=1";
    const params = [];

    if (status && status !== "Semua") {
      sql += " AND status = ?";
      params.push(status);
    }

    if (petugas) {
      sql += " AND nama_petugas = ?";
      params.push(petugas);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += " AND (no_kasbon LIKE ? OR nama_petugas LIKE ? OR keperluan LIKE ?)";
      params.push(q, q, q);
    }

    sql += " ORDER BY id DESC";

    const [rows] = await connection.query(sql, params);

    res.json(
      rows.map((r) => ({
        id: r.id,
        noKasbon: r.no_kasbon,
        tglKasbon: r.tgl_kasbon,
        namaPetugas: r.nama_petugas,
        kategoriPetugas: r.kategori_petugas || "Penjahit",
        nominal: Number(r.nominal) || 0,
        terbayar: Number(r.terbayar) || 0,
        sisa: Number(r.sisa) || 0,
        status: r.status,
        keperluan: r.keperluan || "",
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
    );
  } catch (err) {
    console.error("❌ Error GET /api/kasbon:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 2. GET /api/kasbon/rekap
// Rekap KPI total pinjaman, terbayar, dan sisa kasbon aktif
router.get("/rekap", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        COUNT(*) as totalTransaksi,
        COALESCE(SUM(nominal), 0) as totalKasbon,
        COALESCE(SUM(terbayar), 0) as totalTerbayar,
        COALESCE(SUM(sisa), 0) as totalSisa,
        SUM(CASE WHEN status = 'Belum Lunas' THEN 1 ELSE 0 END) as countBelumLunas,
        SUM(CASE WHEN status = 'Lunas' THEN 1 ELSE 0 END) as countLunas,
        COUNT(DISTINCT CASE WHEN status = 'Belum Lunas' THEN nama_petugas ELSE NULL END) as jumlahPeminjamAktif
      FROM kasbon
    `);

    const r = rows[0] || {};
    res.json({
      totalTransaksi: Number(r.totalTransaksi) || 0,
      totalKasbon: Number(r.totalKasbon) || 0,
      totalTerbayar: Number(r.totalTerbayar) || 0,
      totalSisa: Number(r.totalSisa) || 0,
      countBelumLunas: Number(r.countBelumLunas) || 0,
      countLunas: Number(r.countLunas) || 0,
      jumlahPeminjamAktif: Number(r.jumlahPeminjamAktif) || 0,
    });
  } catch (err) {
    console.error("❌ Error GET /api/kasbon/rekap:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 3. GET /api/kasbon/saldo/:petugas
// Mengambil total saldo sisa kasbon aktif untuk satu petugas (Digunakan untuk auto-potong saat gajian)
router.get("/saldo/:petugas", async (req, res) => {
  const { petugas } = req.params;
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `SELECT * FROM kasbon 
       WHERE LOWER(TRIM(nama_petugas)) = LOWER(TRIM(?)) AND status = 'Belum Lunas' AND sisa > 0
       ORDER BY id ASC`,
      [petugas]
    );

    const items = rows.map((r) => ({
      id: r.id,
      noKasbon: r.no_kasbon,
      tglKasbon: r.tgl_kasbon,
      nominal: Number(r.nominal) || 0,
      terbayar: Number(r.terbayar) || 0,
      sisa: Number(r.sisa) || 0,
      keperluan: r.keperluan || "",
    }));

    const totalSisa = items.reduce((acc, curr) => acc + curr.sisa, 0);

    res.json({
      namaPetugas: petugas,
      totalSisaKasbon: totalSisa,
      countKasbon: items.length,
      items,
    });
  } catch (err) {
    console.error("❌ Error GET /api/kasbon/saldo:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 4. POST /api/kasbon
// Buat kasbon baru untuk karyawan / penjahit
router.post("/", async (req, res) => {
  const { namaPetugas, kategoriPetugas, tglKasbon, nominal, keperluan } = req.body;

  if (!namaPetugas || !nominal || Number(nominal) <= 0) {
    return res.status(400).json({ error: "Nama petugas dan nominal kasbon wajib diisi valid." });
  }

  const nom = Number(nominal);
  const tgl = tglKasbon || new Date().toISOString().slice(0, 10);
  const noKasbon = `KSB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query(
      `INSERT INTO kasbon (no_kasbon, tgl_kasbon, nama_petugas, kategori_petugas, nominal, terbayar, sisa, status, keperluan)
       VALUES (?, ?, ?, ?, ?, 0, ?, 'Belum Lunas', ?)`,
      [noKasbon, tgl, namaPetugas, kategoriPetugas || "Penjahit", nom, nom, keperluan || null]
    );

    res.status(201).json({
      success: true,
      message: `Kasbon atas nama ${namaPetugas} sebesar Rp ${nom.toLocaleString("id-ID")} berhasil dicatat.`,
      id: result.insertId,
      noKasbon,
    });
  } catch (err) {
    console.error("❌ Error POST /api/kasbon:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 5. PUT /api/kasbon/:id
// Update data kasbon (hanya jika belum pernah dipotong sebagian)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { namaPetugas, kategoriPetugas, tglKasbon, nominal, keperluan } = req.body;
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query("SELECT * FROM kasbon WHERE id = ?", [id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: "Data kasbon tidak ditemukan." });

    if (Number(existing.terbayar) > 0) {
      return res.status(400).json({
        error: "Kasbon yang sudah terpotong sebagian tidak dapat diubah nominalnya.",
      });
    }

    const nom = Number(nominal) || Number(existing.nominal);
    await connection.query(
      `UPDATE kasbon 
       SET nama_petugas = ?, kategori_petugas = ?, tgl_kasbon = ?, nominal = ?, sisa = ?, keperluan = ?
       WHERE id = ?`,
      [
        namaPetugas || existing.nama_petugas,
        kategoriPetugas || existing.kategori_petugas,
        tglKasbon || existing.tgl_kasbon,
        nom,
        nom,
        keperluan ?? existing.keperluan,
        id,
      ]
    );

    res.json({ success: true, message: "Data kasbon berhasil diperbarui." });
  } catch (err) {
    console.error("❌ Error PUT /api/kasbon:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 6. DELETE /api/kasbon/:id
// Hapus kasbon (hanya jika belum pernah dipotong)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query("SELECT * FROM kasbon WHERE id = ?", [id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: "Data kasbon tidak ditemukan." });

    if (Number(existing.terbayar) > 0) {
      return res.status(400).json({
        error: "Kasbon yang sudah terpotong tidak dapat dihapus. Silakan batalkan transaksi pembayaran upah terlebih dahulu.",
      });
    }

    await connection.query("DELETE FROM kasbon WHERE id = ?", [id]);
    res.json({ success: true, message: "Data kasbon berhasil dihapus." });
  } catch (err) {
    console.error("❌ Error DELETE /api/kasbon:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 7. GET /api/kasbon/:id/riwayat
// Riwayat pemotongan upah untuk satu transaksi kasbon
router.get("/:id/riwayat", async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `SELECT * FROM kasbon_pembayaran WHERE kasbon_id = ? ORDER BY id DESC`,
      [id]
    );

    res.json(
      rows.map((r) => ({
        id: r.id,
        kasbonId: r.kasbon_id,
        pembayaranUpahId: r.pembayaran_upah_id,
        noPembayaranUpah: r.no_pembayaran_upah,
        tglPotong: r.tgl_potong,
        nominalPotong: Number(r.nominal_potong) || 0,
        catatan: r.catatan || "",
        createdAt: r.created_at,
      }))
    );
  } catch (err) {
    console.error("❌ Error GET /api/kasbon/:id/riwayat:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;

