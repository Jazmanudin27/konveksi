import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all categories
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM categories ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      kode: r.kode,
      nama: r.nama,
      deskripsi: r.deskripsi,
      totalProduk: r.total_produk,
      hargaPotong: Number(r.harga_potong || 0),
      status: r.status,
      updatedAt: r.updated_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const { kode, nama, deskripsi, hargaPotong, status } = req.body;
  try {
    const info = await db.run(
      'INSERT INTO categories (kode, nama, deskripsi, harga_potong, status) VALUES (?, ?, ?, ?, ?)',
      [kode, nama, deskripsi || null, Number(hargaPotong || 0), status || 'Aktif']
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body, hargaPotong: Number(hargaPotong || 0) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { kode, nama, deskripsi, hargaPotong, status } = req.body;
  try {
    await db.run(
      'UPDATE categories SET kode = ?, nama = ?, deskripsi = ?, harga_potong = ?, status = ? WHERE id = ?',
      [kode, nama, deskripsi || null, Number(hargaPotong || 0), status || 'Aktif', id]
    );
    res.json({ success: true, id: Number(id), hargaPotong: Number(hargaPotong || 0) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
