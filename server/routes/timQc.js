import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all tim qc
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM tim_qc ORDER BY id ASC');
    res.json(rows.map((r) => ({
      id: r.id,
      kodeTim: r.kode_tim,
      namaTim: r.nama_tim,
      kategori: r.kategori || 'Internal',
      spesialisasi: r.spesialisasi || 'Inspeksi Jahitan, Ukuran & Mutu',
      kapasitasHarian: Number(r.kapasitas_harian) || 250,
      telepon: r.telepon || '',
      status: r.status || 'Aktif',
      catatan: r.catatan || '',
      username: r.username || (r.kode_tim || r.nama_tim.replace(/\s+/g, '')).toLowerCase(),
      password: r.password || '123456',
      createdAt: r.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create tim qc
router.post('/', async (req, res) => {
  const { kodeTim, namaTim, kategori, spesialisasi, kapasitasHarian, telepon, status, catatan, username, password } = req.body;
  const autoKode = kodeTim || `QC-${Date.now().toString().slice(-4)}`;
  const cleanUsername = (username || autoKode || namaTim.replace(/\s+/g, '')).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const cleanPassword = password || '123456';

  try {
    const info = await db.run(
      'INSERT INTO tim_qc (kode_tim, nama_tim, kategori, spesialisasi, kapasitas_harian, telepon, status, catatan, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [autoKode, namaTim, kategori || 'Internal', spesialisasi || 'Inspeksi Jahitan, Ukuran & Mutu', Number(kapasitasHarian) || 250, telepon || null, status || 'Aktif', catatan || null, cleanUsername, cleanPassword]
    );
    res.status(201).json({
      id: Number(info.insertId),
      ...req.body,
      kodeTim: autoKode,
      username: cleanUsername,
      password: cleanPassword,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update tim qc
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { kodeTim, namaTim, kategori, spesialisasi, kapasitasHarian, telepon, status, catatan, username, password } = req.body;
  const cleanUsername = (username || kodeTim || namaTim.replace(/\s+/g, '')).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const cleanPassword = password || '123456';

  try {
    await db.run(
      'UPDATE tim_qc SET kode_tim = ?, nama_tim = ?, kategori = ?, spesialisasi = ?, kapasitas_harian = ?, telepon = ?, status = ?, catatan = ?, username = ?, password = ? WHERE id = ?',
      [kodeTim, namaTim, kategori, spesialisasi, Number(kapasitasHarian) || 250, telepon || null, status || 'Aktif', catatan || null, cleanUsername, cleanPassword, id]
    );
    res.json({
      success: true,
      id: Number(id),
      username: cleanUsername,
      password: cleanPassword,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE tim qc
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM tim_qc WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
