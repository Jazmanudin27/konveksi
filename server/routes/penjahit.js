import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all penjahit (diambil langsung dari data karyawan / employees)
router.get('/', async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM employees WHERE LOWER(bagian) LIKE '%jahit%' OR LOWER(bagian) LIKE '%penjahit%' ORDER BY id ASC");
    res.json(rows.map(r => ({
      id: r.id,
      nik: r.nik,
      nama: r.nama,
      kategori: r.kategori || 'Borongan',
      bagian: r.bagian || 'Penjahit',
      spesialisasi: r.bagian || 'Penjahit',
      tarifPerPcs: 3500,
      telepon: r.telepon || '',
      status: r.status || 'Aktif',
      tanggalMasuk: r.tanggal_masuk,
      catatan: ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create penjahit (disimpan langsung ke tabel employees dengan bagian 'Penjahit')
router.post('/', async (req, res) => {
  const { nik, nama, kategori, status, telepon, tanggalMasuk } = req.body;
  try {
    const autoNik = nik || `JHT-${Date.now().toString().slice(-4)}`;
    const info = await db.run(
      'INSERT INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [autoNik, nama, kategori || 'Borongan', 'Penjahit', status || 'Aktif', telepon || null, tanggalMasuk || null]
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body, nik: autoNik, bagian: 'Penjahit' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update penjahit (update data ke tabel employees)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nik, nama, kategori, status, telepon, tanggalMasuk } = req.body;
  try {
    await db.run(
      "UPDATE employees SET nik = ?, nama = ?, kategori = ?, bagian = 'Penjahit', status = ?, telepon = ?, tanggal_masuk = ? WHERE id = ?",
      [nik, nama, kategori, status || 'Aktif', telepon || null, tanggalMasuk || null, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE penjahit (hapus dari tabel employees)
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

