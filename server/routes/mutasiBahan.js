import { Router } from 'express';
import db, { pool } from '../db/database.js';

const router = Router();

// GET all mutasi bahan
router.get('/', async (req, res) => {
  try {
    const headers = await db.all('SELECT * FROM mutasi_bahan ORDER BY id DESC');
    const allItems = await db.all('SELECT * FROM mutasi_bahan_item ORDER BY id ASC');

    const result = headers.map(h => ({
      id: h.id,
      noBukti: h.no_bukti,
      tgl: h.tgl,
      noReff: h.no_reff,
      jenisMutasi: h.jenis_mutasi,
      keterangan: h.keterangan,
      items: allItems.filter(i => i.mutasi_id === h.id).map(i => ({
        id: i.id,
        noBukti: i.no_bukti,
        kode_bahan: i.kode_bahan,
        nama_bahan: i.nama_bahan,
        satuan: i.satuan,
        qty: Number(i.qty || 0),
        harga: Number(i.harga || 0),
        total: Number(i.total || 0)
      }))
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create mutasi bahan (Header + Items)
router.post('/', async (req, res) => {
  const { noBukti, tgl, noReff, jenisMutasi, keterangan, items } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [headerResult] = await connection.query(
      'INSERT INTO mutasi_bahan (no_bukti, tgl, no_reff, jenis_mutasi, keterangan) VALUES (?, ?, ?, ?, ?)',
      [noBukti, tgl, noReff || null, jenisMutasi, keterangan || null]
    );
    const mutasiId = headerResult.insertId;

    if (Array.isArray(items)) {
      for (const item of items) {
        await connection.query(
          'INSERT INTO mutasi_bahan_item (mutasi_id, no_bukti, kode_bahan, nama_bahan, satuan, qty, harga, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            mutasiId,
            noBukti,
            item.kode_bahan || item.kodeBahan,
            item.nama_bahan || item.namaBahan,
            item.satuan,
            Number(item.qty || 0),
            Number(item.harga || 0),
            Number(item.total || 0)
          ]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ id: mutasiId, ...req.body });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// DELETE ALL mutasi bahan
router.delete('/all', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM mutasi_bahan_item');
    await connection.query('DELETE FROM mutasi_bahan');
    await connection.commit();
    res.json({ success: true, message: 'Semua data mutasi bahan berhasil dihapus' });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error DELETE /api/mutasi-bahan/all:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// DELETE single mutasi bahan (Item + Header)
router.delete('/:id', async (req, res) => {
  const param = req.params.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const numId = Number(param);
    const validNum = !isNaN(numId) ? numId : 0;
    const strParam = String(param);

    const [rows] = await connection.query(
      'SELECT id, no_bukti FROM mutasi_bahan WHERE id = ? OR no_bukti = ?',
      [validNum, strParam]
    );
    const row = rows[0];
    const targetId = row ? row.id : validNum;
    const targetNo = row ? row.no_bukti : strParam;

    if (targetId) {
      await connection.query('DELETE FROM mutasi_bahan_item WHERE mutasi_id = ?', [targetId]);
      await connection.query('DELETE FROM mutasi_bahan WHERE id = ?', [targetId]);
    }
    if (targetNo) {
      await connection.query('DELETE FROM mutasi_bahan_item WHERE no_bukti = ?', [targetNo]);
      await connection.query('DELETE FROM mutasi_bahan WHERE no_bukti = ?', [targetNo]);
    }

    await connection.commit();
    res.json({ success: true, id: targetId, noBukti: targetNo });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error DELETE /api/mutasi-bahan/:id:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
