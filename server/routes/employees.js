import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all employees
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
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
router.post('/', (req, res) => {
  const { nik, nama, kategori, bagian, status, telepon, tanggalMasuk } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO employees (nik, nama, kategori, bagian, status, telepon, tanggal_masuk)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(nik, nama, kategori, bagian, status || 'Aktif', telepon || null, tanggalMasuk || null);
    res.status(201).json({ id: Number(info.lastInsertRowid), ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update employee
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nik, nama, kategori, bagian, status, telepon, tanggalMasuk } = req.body;
  try {
    db.prepare(`
      UPDATE employees
      SET nik = ?, nama = ?, kategori = ?, bagian = ?, status = ?, telepon = ?, tanggal_masuk = ?
      WHERE id = ?
    `).run(nik, nama, kategori, bagian, status || 'Aktif', telepon || null, tanggalMasuk || null, id);
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE employee
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

