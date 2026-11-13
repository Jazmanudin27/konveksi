import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all bahan
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bahan ORDER BY id ASC').all();
    res.json(rows.map(r => ({
      id: r.id,
      kodeBahan: r.kode_bahan,
      namaBahan: r.nama_bahan,
      satuan: r.satuan,
      supplier: r.supplier || '-',
      harga: r.harga,
      stok: r.stok,
      status: r.status,
      keterangan: r.keterangan
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create bahan
router.post('/', (req, res) => {
  const { kodeBahan, namaBahan, satuan, supplier, harga, stok, status, keterangan } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO bahan (kode_bahan, nama_bahan, satuan, supplier, harga, stok, status, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(kodeBahan, namaBahan, satuan, supplier || null, harga || 0, stok || 0, status || 'Tersedia', keterangan || null);
    res.status(201).json({ id: Number(info.lastInsertRowid), ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update bahan
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { kodeBahan, namaBahan, satuan, supplier, harga, stok, status, keterangan } = req.body;
  try {
    db.prepare(`
      UPDATE bahan
      SET kode_bahan = ?, nama_bahan = ?, satuan = ?, supplier = ?, harga = ?, stok = ?, status = ?, keterangan = ?
      WHERE id = ?
    `).run(kodeBahan, namaBahan, satuan, supplier || null, harga || 0, stok || 0, status || 'Tersedia', keterangan || null, id);
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE bahan
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM bahan WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

