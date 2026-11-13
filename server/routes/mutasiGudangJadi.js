import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// 1. GET all mutasi gudang jadi
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
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
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/mutasi-gudang-jadi:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST create manual mutasi gudang jadi
router.post('/', (req, res) => {
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
      while (db.prepare('SELECT id FROM mutasi_gudang_jadi WHERE no_mutasi = ?').get(finalNo)) {
        rand = Math.floor(100 + Math.random() * 900);
        finalNo = `MGJ-${today}-${rand}`;
      }
    }

    const tglNow = tglMutasi || new Date().toISOString().slice(0, 16).replace('T', ' ');
    const qtyNum = Number(qty) || 1;
    const jenis = (jenisMutasi || 'MASUK').toUpperCase();

    const result = db.prepare(`
      INSERT INTO mutasi_gudang_jadi (
        no_mutasi, tgl_mutasi, jenis_mutasi, sumber, no_antrian, no_reff,
        sku, nama_produk, varian, ukuran, qty, satuan, lokasi_rak, petugas, catatan,
        tgl_diterima, petugas_terima, status_penerimaan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diterima')
    `).run(
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
    );

    // Update stok produk
    try {
      if (jenis === 'MASUK') {
        db.prepare('UPDATE products SET stok = COALESCE(stok, 0) + ? WHERE sku = ?').run(qtyNum, sku);
      } else if (jenis === 'KELUAR') {
        db.prepare('UPDATE products SET stok = MAX(0, COALESCE(stok, 0) - ?) WHERE sku = ?').run(qtyNum, sku);
      }
    } catch (_) {}

    const inserted = db.prepare('SELECT * FROM mutasi_gudang_jadi WHERE id = ?').get(result.lastInsertRowid);
    res.json(inserted);
  } catch (err) {
    console.error('❌ Error POST /api/mutasi-gudang-jadi:', err);
    res.status(400).json({ error: err.message });
  }
});

// 3. POST approve penerimaan barang jadi ke rak gudang
router.post('/approve', (req, res) => {
  const { id, tglDiterima, petugasTerima, lokasiRak, catatan } = req.body;
  if (!id) return res.status(400).json({ error: 'ID mutasi wajib diisi.' });

  try {
    const row = db.prepare('SELECT * FROM mutasi_gudang_jadi WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Data mutasi gudang jadi tidak ditemukan.' });

    const finalTglDiterima = tglDiterima || new Date().toISOString().slice(0, 10);
    const finalPetugas = petugasTerima || 'Staff Gudang Jadi';
    const finalRak = lokasiRak || 'Gudang Utama - Rak A1';

    db.exec('BEGIN');
    try {
      // 1. Update mutasi_gudang_jadi
      db.prepare(`
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
      `).run(
        finalTglDiterima,
        finalPetugas,
        finalPetugas,
        finalRak,
        finalTglDiterima,
        catatan,
        catatan,
        catatan,
        id
      );

      // 2. Update status antrean -> 'Selesai'
      if (row.no_antrian) {
        db.prepare(`
          UPDATE antrean
          SET status = 'Selesai'
          WHERE no_antrian = ?
        `).run(row.no_antrian);
      }

      // 3. Tambah stok produk
      if (row.jenis_mutasi === 'MASUK') {
        try {
          db.prepare('UPDATE products SET stok = COALESCE(stok, 0) + ? WHERE sku = ?').run(row.qty, row.sku);
        } catch (_) {}
      }

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const updated = db.prepare(`
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
    `).get(id);

    res.json({ success: true, updated });
  } catch (err) {
    console.error('❌ Error POST /api/mutasi-gudang-jadi/approve:', err);
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE mutasi gudang jadi
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM mutasi_gudang_jadi WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

