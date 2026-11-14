import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all jasa
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM jasa ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      kodeJasa: r.kode_jasa,
      sku: r.sku,
      namaJasa: r.nama_jasa,
      qty: Number(r.qty || 0),
      harga: Number(r.harga || 0),
      satuan: r.satuan,
      status: r.status,
      keterangan: r.keterangan
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create jasa
router.post('/', async (req, res) => {
  const { kodeJasa, sku, namaJasa, qty, harga, satuan, status, keterangan } = req.body;
  try {
    const info = await db.run(
      'INSERT INTO jasa (kode_jasa, sku, nama_jasa, qty, harga, satuan, status, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kodeJasa, sku || null, namaJasa, Number(qty || 0), Number(harga || 0), satuan || 'Pcs', status || 'Aktif', keterangan || null]
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update jasa
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { kodeJasa, sku, namaJasa, qty, harga, satuan, status, keterangan } = req.body;
  try {
    await db.run(
      'UPDATE jasa SET kode_jasa = ?, sku = ?, nama_jasa = ?, qty = ?, harga = ?, satuan = ?, status = ?, keterangan = ? WHERE id = ?',
      [kodeJasa, sku || null, namaJasa, Number(qty || 0), Number(harga || 0), satuan || 'Pcs', status || 'Aktif', keterangan || null, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE jasa
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM jasa WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
