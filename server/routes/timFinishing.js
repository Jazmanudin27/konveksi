import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all tim finishing
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM tim_finishing ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      kodeTim: r.kode_tim,
      namaTim: r.nama_tim,
      kategori: r.kategori || 'Internal',
      spesialisasi: r.spesialisasi || 'Finishing, Setrika Uap & Packing',
      kapasitasHarian: Number(r.kapasitas_harian) || 200,
      telepon: r.telepon || '',
      status: r.status || 'Aktif',
      catatan: r.catatan || '',
      createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create tim finishing
router.post('/', async (req, res) => {
  const { kodeTim, namaTim, kategori, spesialisasi, kapasitasHarian, telepon, status, catatan } = req.body;
  try {
    const autoKode = kodeTim || `FIN-${Date.now().toString().slice(-4)}`;
    const info = await db.run(
      'INSERT INTO tim_finishing (kode_tim, nama_tim, kategori, spesialisasi, kapasitas_harian, telepon, status, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [autoKode, namaTim, kategori || 'Internal', spesialisasi || 'Finishing & Packing', Number(kapasitasHarian) || 200, telepon || null, status || 'Aktif', catatan || null]
    );
    res.status(201).json({ id: Number(info.insertId), ...req.body, kodeTim: autoKode });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update tim finishing
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { kodeTim, namaTim, kategori, spesialisasi, kapasitasHarian, telepon, status, catatan } = req.body;
  try {
    await db.run(
      'UPDATE tim_finishing SET kode_tim = ?, nama_tim = ?, kategori = ?, spesialisasi = ?, kapasitas_harian = ?, telepon = ?, status = ?, catatan = ? WHERE id = ?',
      [kodeTim, namaTim, kategori, spesialisasi, Number(kapasitasHarian) || 200, telepon || null, status || 'Aktif', catatan || null, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE tim finishing
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM tim_finishing WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

