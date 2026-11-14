import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM employees ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      nik: r.nik,
      nama: r.nama,
      kategori: r.kategori,
      bagian: r.bagian,
      status: r.status,
      telepon: r.telepon,
      tanggalMasuk: r.tanggal_masuk
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create employee
router.post('/', async (req, res) => {
  const { nik, nama, kategori, bagian, status, telepon, tanggalMasuk } = req.body;
  try {
    const info = await db.run(
      'INSERT INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nik, nama, kategori, bagian, status || 'Aktif', telepon || null, tanggalMasuk || null]
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nik, nama, kategori, bagian, status, telepon, tanggalMasuk } = req.body;
  try {
    await db.run(
      'UPDATE employees SET nik = ?, nama = ?, kategori = ?, bagian = ?, status = ?, telepon = ?, tanggal_masuk = ? WHERE id = ?',
      [nik, nama, kategori, bagian, status || 'Aktif', telepon || null, tanggalMasuk || null, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
