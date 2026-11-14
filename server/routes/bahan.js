import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all bahan
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM bahan ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      kodeBahan: r.kode_bahan,
      namaBahan: r.nama_bahan,
      satuan: r.satuan,
      supplier: r.supplier || '-',
      harga: Number(r.harga || 0),
      stok: Number(r.stok || 0),
      status: r.status,
      keterangan: r.keterangan
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create bahan
router.post('/', async (req, res) => {
  const { kodeBahan, namaBahan, satuan, supplier, harga, stok, status, keterangan } = req.body;
  try {
    const info = await db.run(
      'INSERT INTO bahan (kode_bahan, nama_bahan, satuan, supplier, harga, stok, status, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kodeBahan, namaBahan, satuan, supplier || null, Number(harga || 0), Number(stok || 0), status || 'Tersedia', keterangan || null]
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update bahan
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { kodeBahan, namaBahan, satuan, supplier, harga, stok, status, keterangan } = req.body;
  try {
    await db.run(
      'UPDATE bahan SET kode_bahan = ?, nama_bahan = ?, satuan = ?, supplier = ?, harga = ?, stok = ?, status = ?, keterangan = ? WHERE id = ?',
      [kodeBahan, namaBahan, satuan, supplier || null, Number(harga || 0), Number(stok || 0), status || 'Tersedia', keterangan || null, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE bahan
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM bahan WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
