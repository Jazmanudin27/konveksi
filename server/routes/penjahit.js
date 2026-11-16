import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all penjahit
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM penjahit ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      nik: r.nik,
      nama: r.nama,
      kategori: r.kategori || 'Borongan',
      spesialisasi: r.spesialisasi || 'Jahit Kaos & Busana',
      tarifPerPcs: Number(r.tarif_per_pcs) || 3500,
      telepon: r.telepon || '',
      status: r.status || 'Aktif',
      catatan: r.catatan || '',
      createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create penjahit
router.post('/', async (req, res) => {
  const { nik, nama, kategori, spesialisasi, tarifPerPcs, telepon, status, catatan } = req.body;
  try {
    const autoNik = nik || `JHT-${Date.now().toString().slice(-4)}`;
    const info = await db.run(
      'INSERT INTO penjahit (nik, nama, kategori, spesialisasi, tarif_per_pcs, telepon, status, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [autoNik, nama, kategori || 'Borongan', spesialisasi || 'Jahit', Number(tarifPerPcs) || 3500, telepon || null, status || 'Aktif', catatan || null]
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body, nik: autoNik });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update penjahit
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nik, nama, kategori, spesialisasi, tarifPerPcs, telepon, status, catatan } = req.body;
  try {
    await db.run(
      'UPDATE penjahit SET nik = ?, nama = ?, kategori = ?, spesialisasi = ?, tarif_per_pcs = ?, telepon = ?, status = ?, catatan = ? WHERE id = ?',
      [nik, nama, kategori, spesialisasi, Number(tarifPerPcs) || 3500, telepon || null, status || 'Aktif', catatan || null, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE penjahit
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM penjahit WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

