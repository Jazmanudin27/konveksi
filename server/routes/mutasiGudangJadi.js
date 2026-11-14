import { Router } from 'express';
import db, { pool } from '../db/database.js';

const router = Router();

// 1. GET all mutasi gudang jadi
router.get('/', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT 
        id,
        no_mutasi as noMutasi,
        tgl_mutasi as tglMutasi,
        jenis_mutasi as jenisMutasi,
        sumber,
        no_antrian as noAntrian,
        no_reff as noReff,
        sku,
        nama_produk as namaProduk,
        varian,
        ukuran,
        qty,
        satuan,
        lokasi_rak as lokasiRak,
        petugas,
        catatan,
        tgl_diserahkan as tglDiserahkan,
        petugas_serah as petugasSerah,
        tgl_diterima as tglDiterima,
        petugas_terima as petugasTerima,
        status_penerimaan as statusPenerimaan,
        created_at as createdAt
      FROM mutasi_gudang_jadi
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/mutasi-gudang-jadi:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST create manual mutasi gudang jadi
router.post('/', async (req, res) => {
  const {
    noMutasi,
    tglMutasi,
    jenisMutasi,
    sumber,
    noAntrian,
    noReff,
    sku,
    namaProduk,
    varian,
    ukuran,
    qty,
    satuan,
    lokasiRak,
    petugas,
    catatan
  } = req.body;

  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let finalNo = noMutasi;
    if (!finalNo) {
      let rand = Math.floor(100 + Math.random() * 900);
      finalNo = `MGJ-${today}-${rand}`;
      while (await db.get('SELECT id FROM mutasi_gudang_jadi WHERE no_mutasi = ?', [finalNo])) {
        rand = Math.floor(100 + Math.random() * 900);
        finalNo = `MGJ-${today}-${rand}`;
      }
    }

    const tglNow = tglMutasi || new Date().toISOString().slice(0, 16).replace('T', ' ');
    const qtyNum = Number(qty) || 1;
    const jenis = (jenisMutasi || 'MASUK').toUpperCase();

    const result = await db.run(`
      INSERT INTO mutasi_gudang_jadi (
        no_mutasi, tgl_mutasi, jenis_mutasi, sumber, no_antrian, no_reff,
        sku, nama_produk, varian, ukuran, qty, satuan, lokasi_rak, petugas, catatan,
        tgl_diterima, petugas_terima, status_penerimaan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diterima')
    `, [
      finalNo,
      tglNow,
      jenis,
      sumber || (jenis === 'MASUK' ? 'Manual Masuk' : 'Pengiriman Order'),
      noAntrian || null,
      noReff || '-',
      sku || 'SKU-CUSTOM',
      namaProduk || 'Produk Jadi',
      varian || 'Polos',
      ukuran || 'All Size',
      qtyNum,
      satuan || 'Pcs',
      lokasiRak || 'Gudang Utama',
      petugas || 'Staff Gudang',
      catatan || null,
      tglNow,
      petugas || 'Staff Gudang'
    ]);

    // Update stok produk
    try {
      if (jenis === 'MASUK') {
        await db.run('UPDATE products SET stok = COALESCE(stok, 0) + ? WHERE sku = ?', [qtyNum, sku]);
      } else if (jenis === 'KELUAR') {
        await db.run('UPDATE products SET stok = GREATEST(0, COALESCE(stok, 0) - ?) WHERE sku = ?', [qtyNum, sku]);
      }
    } catch (_) {}

    const inserted = await db.get('SELECT * FROM mutasi_gudang_jadi WHERE id = ?', [result.insertId]);
    res.json(inserted);
  } catch (err) {
    console.error('❌ Error POST /api/mutasi-gudang-jadi:', err);
    res.status(400).json({ error: err.message });
  }
});

// 3. POST approve penerimaan barang jadi ke rak gudang
router.post('/approve', async (req, res) => {
  const { id, tglDiterima, petugasTerima, lokasiRak, catatan } = req.body;
  if (!id) return res.status(400).json({ error: 'ID mutasi wajib diisi.' });

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM mutasi_gudang_jadi WHERE id = ?', [id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Data mutasi gudang jadi tidak ditemukan.' });

    const finalTglDiterima = tglDiterima || new Date().toISOString().slice(0, 10);
    const finalPetugas = petugasTerima || 'Staff Gudang Jadi';
    const finalRak = lokasiRak || 'Gudang Utama - Rak A1';

    await connection.beginTransaction();

    await connection.query(`
      UPDATE mutasi_gudang_jadi
      SET 
        status_penerimaan = 'Diterima',
        tgl_diterima = ?,
        petugas_terima = ?,
        petugas = ?,
        lokasi_rak = ?,
        tgl_mutasi = ?,
        catatan = CASE 
          WHEN ? IS NOT NULL AND ? != '' THEN ? 
          ELSE catatan 
        END
      WHERE id = ?
    `, [
      finalTglDiterima,
      finalPetugas,
      finalPetugas,
      finalRak,
      finalTglDiterima,
      catatan,
      catatan,
      catatan,
      id
    ]);

    // Update status antrean -> 'Selesai'
    if (row.no_antrian) {
      await connection.query("UPDATE antrean SET status = 'Selesai' WHERE no_antrian = ?", [row.no_antrian]);
    }

    // Tambah stok produk
    if (row.jenis_mutasi === 'MASUK') {
      try {
        await connection.query('UPDATE products SET stok = COALESCE(stok, 0) + ? WHERE sku = ?', [row.qty, row.sku]);
      } catch (_) {}
    }

    await connection.commit();

    const [updatedRows] = await pool.query(`
      SELECT 
        id,
        no_mutasi as noMutasi,
        tgl_mutasi as tglMutasi,
        jenis_mutasi as jenisMutasi,
        sumber,
        no_antrian as noAntrian,
        no_reff as noReff,
        sku,
        nama_produk as namaProduk,
        varian,
        ukuran,
        qty,
        satuan,
        lokasi_rak as lokasiRak,
        petugas,
        catatan,
        tgl_diserahkan as tglDiserahkan,
        petugas_serah as petugasSerah,
        tgl_diterima as tglDiterima,
        petugas_terima as petugasTerima,
        status_penerimaan as statusPenerimaan,
        created_at as createdAt
      FROM mutasi_gudang_jadi
      WHERE id = ?
    `, [id]);

    res.json({ success: true, updated: updatedRows[0] });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error POST /api/mutasi-gudang-jadi/approve:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 4. DELETE mutasi gudang jadi
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM mutasi_gudang_jadi WHERE id = ?', [req.params.id]);
    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
