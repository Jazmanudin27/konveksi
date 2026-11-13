import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all jasa
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM jasa ORDER BY id ASC').all();
    res.json(rows.map(r => ({
      id: r.id,
      kodeJasa: r.kode_jasa,
      sku: r.sku,
      namaJasa: r.nama_jasa,
      qty: r.qty,
      harga: r.harga,
      satuan: r.satuan,
      status: r.status,
      keterangan: r.keterangan
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create jasa
router.post('/', (req, res) => {
  const { kodeJasa, sku, namaJasa, qty, harga, satuan, status, keterangan } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO jasa (kode_jasa, sku, nama_jasa, qty, harga, satuan, status, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(kodeJasa, sku || null, namaJasa, qty || 0, harga || 0, satuan || 'Pcs', status || 'Aktif', keterangan || null);
    res.status(201).json({ id: Number(info.lastInsertRowid), ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update jasa
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { kodeJasa, sku, namaJasa, qty, harga, satuan, status, keterangan } = req.body;
  try {
    db.prepare(`
      UPDATE jasa
      SET kode_jasa = ?, sku = ?, nama_jasa = ?, qty = ?, harga = ?, satuan = ?, status = ?, keterangan = ?
      WHERE id = ?
    `).run(kodeJasa, sku || null, namaJasa, qty || 0, harga || 0, satuan || 'Pcs', status || 'Aktif', keterangan || null, id);
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE jasa
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM jasa WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

