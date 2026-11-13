import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all mutasi bahan
router.get('/', (req, res) => {
  try {
    const headers = db.prepare('SELECT * FROM mutasi_bahan ORDER BY id DESC').all();
    const getItems = db.prepare('SELECT * FROM mutasi_bahan_item WHERE mutasi_id = ?');

    const result = headers.map(h => ({
      id: h.id,
      noBukti: h.no_bukti,
      tgl: h.tgl,
      noReff: h.no_reff,
      jenisMutasi: h.jenis_mutasi,
      keterangan: h.keterangan,
      items: getItems.all(h.id).map(i => ({
        id: i.id,
        noBukti: i.no_bukti,
        kode_bahan: i.kode_bahan,
        nama_bahan: i.nama_bahan,
        satuan: i.satuan,
        qty: i.qty,
        harga: i.harga,
        total: i.total
      }))
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create mutasi bahan (Header + Items)
router.post('/', (req, res) => {
  const { noBukti, tgl, noReff, jenisMutasi, keterangan, items } = req.body;
  const insertHeader = db.prepare(`
    INSERT INTO mutasi_bahan (no_bukti, tgl, no_reff, jenis_mutasi, keterangan)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO mutasi_bahan_item (mutasi_id, no_bukti, kode_bahan, nama_bahan, satuan, qty, harga, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    const info = insertHeader.run(noBukti, tgl, noReff || null, jenisMutasi, keterangan || null);
    const mutasiId = Number(info.lastInsertRowid);
    if (Array.isArray(items)) {
      for (const item of items) {
        insertItem.run(
          mutasiId,
          noBukti,
          item.kode_bahan || item.kodeBahan,
          item.nama_bahan || item.namaBahan,
          item.satuan,
          item.qty || 0,
          item.harga || 0,
          item.total || 0
        );
      }
    }
    db.exec('COMMIT');
    res.status(201).json({ id: mutasiId, ...req.body });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// DELETE ALL mutasi bahan
router.delete('/all', (req, res) => {
  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM mutasi_bahan_item').run();
    db.prepare('DELETE FROM mutasi_bahan').run();
    db.exec('COMMIT');
    res.json({ success: true, message: 'Semua data mutasi bahan berhasil dihapus' });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('❌ Error DELETE /api/mutasi-bahan/all:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE single mutasi bahan (Item + Header)
router.delete('/:id', (req, res) => {
  const param = req.params.id;
  try {
    db.exec('BEGIN');
    const numId = Number(param);
    const validNum = !isNaN(numId) ? numId : 0;
    const strParam = String(param);

    // Cari mutasi berdasarkan id (integer) atau no_bukti (text)
    const row = db.prepare('SELECT id, no_bukti FROM mutasi_bahan WHERE id = ? OR no_bukti = ?').get(validNum, strParam);
    const targetId = row ? row.id : validNum;
    const targetNo = row ? row.no_bukti : strParam;

    // Hapus detail item terlebih dahulu agar tidak terkendala foreign key
    if (targetId) {
      db.prepare('DELETE FROM mutasi_bahan_item WHERE mutasi_id = ?').run(targetId);
      db.prepare('DELETE FROM mutasi_bahan WHERE id = ?').run(targetId);
    }
    if (targetNo) {
      db.prepare('DELETE FROM mutasi_bahan_item WHERE no_bukti = ?').run(targetNo);
      db.prepare('DELETE FROM mutasi_bahan WHERE no_bukti = ?').run(targetNo);
    }

    db.exec('COMMIT');
    res.json({ success: true, id: targetId, noBukti: targetNo });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('❌ Error DELETE /api/mutasi-bahan/:id:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;

