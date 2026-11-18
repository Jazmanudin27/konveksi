import { Router } from 'express';
import db, { pool } from '../db/database.js';

const router = Router();

// Helper SELECT antrean with joined products
async function getAntreanSelect(whereClause = '', params = []) {
  const sql = `
    SELECT 
      a.id,
      a.no_antrian as noAntrian,
      a.tgl_masuk as tglMasuk,
      a.sumber_permintaan as sumberPermintaan,
      a.no_reff as noReff,
      a.sku,
      a.qty,
      a.prioritas,
      a.deadline,
      a.status,
      a.catatan,
      a.tgl_serah_cutting as tglSerahCutting,
      a.tim_cutting as timCutting,
      a.tarif_cutting as tarifCutting,
      a.total_biaya_cutting as totalBiayaCutting,
      a.catatan_cutting as catatanCutting,
      a.tgl_serah_jahit as tglSerahJahit,
      a.tim_jahit as timJahit,
      a.tarif_jahit as tarifJahit,
      a.total_biaya_jahit as totalBiayaJahit,
      a.catatan_jahit as catatanJahit,
      a.tgl_serah_qc as tglSerahQc,
      a.tim_qc as timQc,
      a.catatan_qc as catatanQc,
      a.status_qc as statusQc,
      a.qty_pass_qc as qtyPassQc,
      a.qty_reject_qc as qtyRejectQc,
      a.catatan_reject_qc as catatanRejectQc,
      a.tgl_serah_finishing as tglSerahFinishing,
      a.tim_finishing as timFinishing,
      a.catatan_finishing as catatanFinishing,
      a.tgl_serah_gudang as tglSerahGudang,
      a.tarif_qc as tarifQc,
      a.total_biaya_qc as totalBiayaQc,
      a.tarif_finishing as tarifFinishing,
      a.total_biaya_finishing as totalBiayaFinishing,
      a.status_bayar_cutting as statusBayarCutting,
      a.status_bayar_jahit as statusBayarJahit,
      a.status_bayar_qc as statusBayarQc,
      a.status_bayar_finishing as statusBayarFinishing,
      a.kebutuhan_bahan as kebutuhanBahan,
      a.total_biaya_bahan as totalBiayaBahan,
      a.total_hpp as totalHpp,
      a.hpp_per_pcs as hppPerPcs,
      a.created_at as createdAt,
      p.nama_produk as namaProduk,
      p.kategori,
      p.varian,
      p.ukuran,
      p.sku_bahan as skuBahan
    FROM antrean a
    LEFT JOIN products p ON a.sku = p.sku
    ${whereClause}
  `;
  const rows = await db.all(sql, params);
  return rows.map((r) => {
    let parsedKebutuhan = [];
    if (r.kebutuhanBahan) {
      if (typeof r.kebutuhanBahan === 'string') {
        try {
          parsedKebutuhan = JSON.parse(r.kebutuhanBahan);
        } catch (_) {
          parsedKebutuhan = [];
        }
      } else if (Array.isArray(r.kebutuhanBahan)) {
        parsedKebutuhan = r.kebutuhanBahan;
      }
    }
    return {
      ...r,
      kebutuhanBahan: Array.isArray(parsedKebutuhan) ? parsedKebutuhan : [],
    };
  });
}

// Helper auto No Pembayaran
function generateNoPembayaran() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `PAY-${dateStr}-${rand}`;
}

// Helper sinkronisasi data upah otomatis ke tabel pembayaran_upah
async function upsertPembayaranUpah(connection, antreanId, tahapan, namaPetugas, qty, tarifPerPcs, totalUpah) {
  try {
    const [antreanRows] = await connection.query(
      "SELECT a.no_antrian, a.sku, p.nama_produk FROM antrean a LEFT JOIN products p ON a.sku = p.sku WHERE a.id = ?",
      [antreanId]
    );
    const ant = antreanRows[0];
    if (!ant) return;

    const [existRows] = await connection.query(
      "SELECT id, status_bayar FROM pembayaran_upah WHERE antrean_id = ? AND tahapan = ?",
      [antreanId, tahapan]
    );

    const safeQty = Number(qty) || 0;
    const safeTarif = Number(tarifPerPcs) || 0;
    const safeTotal = Number(totalUpah) || (safeQty * safeTarif);

    if (existRows && existRows.length > 0) {
      const existing = existRows[0];
      await connection.query(
        `UPDATE pembayaran_upah 
         SET nama_petugas = ?, qty = ?, tarif_per_pcs = ?, total_upah = ? 
         WHERE id = ?`,
        [namaPetugas, safeQty, safeTarif, safeTotal, existing.id]
      );
    } else {
      await connection.query(
        `INSERT INTO pembayaran_upah (
          no_pembayaran, antrean_id, no_antrian, sku, nama_produk,
          tahapan, nama_petugas, qty, tarif_per_pcs, total_upah, status_bayar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Belum Lunas')`,
        [
          generateNoPembayaran(), antreanId, ant.no_antrian, ant.sku, ant.nama_produk || ant.sku,
          tahapan, namaPetugas, safeQty, safeTarif, safeTotal
        ]
      );
    }
  } catch (err) {
    console.warn('Gagal upsert pembayaran_upah:', err.message);
  }
}

// 1. GET all antrean
router.get('/', async (req, res) => {
  try {
    const rows = await getAntreanSelect('ORDER BY a.id DESC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/antrean:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1a. Sumber Permintaan Management (MySQL Persisted)
router.get('/sumber-permintaan', async (req, res) => {
  try {
    const rows = await db.all('SELECT nama FROM sumber_permintaan ORDER BY id ASC');
    if (rows.length === 0) {
      const defaults = ['PO Pelanggan', 'Marketplace / Toko', 'Rencana Internal'];
      for (const d of defaults) {
        await db.run('INSERT IGNORE INTO sumber_permintaan (nama) VALUES (?)', [d]);
      }
      return res.json(defaults);
    }
    res.json(rows.map(r => r.nama));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sumber-permintaan', async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || !nama.trim()) return res.status(400).json({ error: 'Nama sumber wajib diisi' });
    await db.run('INSERT IGNORE INTO sumber_permintaan (nama) VALUES (?)', [nama.trim()]);
    res.json({ success: true, nama: nama.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sumber-permintaan/:nama', async (req, res) => {
  try {
    const nama = decodeURIComponent(req.params.nama);
    await db.run('DELETE FROM sumber_permintaan WHERE nama = ?', [nama]);
    res.json({ success: true, nama });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1b. GET Public Customer Tracking by noAntrian or id (no authentication / no wage leak)
router.get('/track/:query', async (req, res) => {
  try {
    const q = decodeURIComponent(req.params.query).trim();
    const rows = await getAntreanSelect(
      'WHERE a.no_antrian = ? OR a.no_reff = ? OR a.id = ?',
      [q, q, q]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan. Periksa kembali nomor antrean.' });
    }
    const a = rows[0];
    // Return sanitized public tracking data (protect private wage/cost data)
    res.json({
      id: a.id,
      noAntrian: a.noAntrian,
      tglMasuk: a.tglMasuk,
      sumberPermintaan: a.sumberPermintaan,
      noReff: a.noReff,
      sku: a.sku,
      namaProduk: a.namaProduk,
      kategori: a.kategori,
      varian: a.varian,
      ukuran: a.ukuran,
      qty: a.qty,
      status: a.status,
      prioritas: a.prioritas,
      deadline: a.deadline,
      catatan: a.catatan,
      tglSerahCutting: a.tglSerahCutting,
      timCutting: a.timCutting,
      tglSerahJahit: a.tglSerahJahit,
      timJahit: a.timJahit,
      tglSerahQc: a.tglSerahQc,
      timQc: a.timQc,
      statusQc: a.statusQc,
      qtyPassQc: a.qtyPassQc,
      qtyRejectQc: a.qtyRejectQc,
      tglSerahFinishing: a.tglSerahFinishing,
      timFinishing: a.timFinishing,
      tglSerahGudang: a.tglSerahGudang,
      createdAt: a.createdAt,
    });
  } catch (err) {
    console.error('❌ Error GET /api/antrean/track/:query:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1c. GET antrean by id
router.get('/:id', async (req, res) => {
  try {
    const rows = await getAntreanSelect('WHERE a.id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Antrean tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error GET /api/antrean/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST create antrean
router.post('/', async (req, res) => {
  const {
    noAntrian,
    tglMasuk,
    sumberPermintaan,
    noReff,
    sku,
    qty,
    prioritas,
    deadline,
    status,
    catatan,
    tglSerahCutting,
    timCutting,
    tarifCutting,
    totalBiayaCutting,
    catatanCutting,
    kebutuhanBahan,
    totalBiayaBahan,
    totalHpp,
    hppPerPcs
  } = req.body;

  try {
    if (!sku || String(sku).trim() === '') {
      return res.status(400).json({ error: 'Kode SKU produk wajib diisi.' });
    }

    let finalNo = noAntrian ? String(noAntrian).trim() : '';
    if (!finalNo) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countRow = await db.get('SELECT COUNT(*) as cnt FROM antrean');
      const seq = String((countRow ? countRow.cnt : 0) + 1).padStart(3, '0');
      finalNo = `ANT-${today}-${seq}`;
    }

    const existing = await db.get('SELECT id FROM antrean WHERE no_antrian = ?', [finalNo]);
    if (existing) {
      const seqSuffix = Math.floor(Math.random() * 899 + 100);
      finalNo = `${finalNo}-${seqSuffix}`;
    }

    const rawKebutuhan = kebutuhanBahan
      ? (typeof kebutuhanBahan === 'string' ? kebutuhanBahan : JSON.stringify(kebutuhanBahan))
      : '[]';

    const info = await db.run(`
      INSERT INTO antrean (
        no_antrian, tgl_masuk, sumber_permintaan, no_reff, sku, qty, prioritas, deadline, status, catatan,
        tgl_serah_cutting, tim_cutting, tarif_cutting, total_biaya_cutting, catatan_cutting, kebutuhan_bahan,
        total_biaya_bahan, total_hpp, hpp_per_pcs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalNo,
      tglMasuk || new Date().toISOString().slice(0, 10),
      sumberPermintaan || 'Rencana Internal',
      noReff || null,
      String(sku).trim(),
      Number(qty) || 1,
      prioritas || 'Normal',
      deadline || new Date().toISOString().slice(0, 10),
      status || 'Menunggu Cutting',
      catatan || null,
      tglSerahCutting || null,
      timCutting || null,
      Number(tarifCutting) || 0,
      Number(totalBiayaCutting) || 0,
      catatanCutting || null,
      rawKebutuhan,
      Number(totalBiayaBahan) || 0,
      Number(totalHpp) || 0,
      Number(hppPerPcs) || 0
    ]);

    res.status(201).json({
      id: Number(info.insertId),
      noAntrian: finalNo,
      ...req.body
    });
  } catch (err) {
    console.error('❌ Error POST /api/antrean:', err);
    res.status(400).json({ error: err.message });
  }
});

// 3. PUT update antrean
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.get('SELECT * FROM antrean WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Antrean tidak ditemukan' });
    }

    const {
      noAntrian = existing.no_antrian,
      tglMasuk = existing.tgl_masuk,
      sumberPermintaan = existing.sumber_permintaan,
      noReff = existing.no_reff,
      sku = existing.sku,
      qty = existing.qty,
      prioritas = existing.prioritas,
      deadline = existing.deadline,
      status = existing.status,
      catatan = existing.catatan,
      tglSerahCutting = existing.tgl_serah_cutting,
      timCutting = existing.tim_cutting,
      tarifCutting = existing.tarif_cutting,
      totalBiayaCutting = existing.total_biaya_cutting,
      catatanCutting = existing.catatan_cutting,
      tglSerahJahit = existing.tgl_serah_jahit,
      timJahit = existing.tim_jahit,
      tarifJahit = existing.tarif_jahit,
      totalBiayaJahit = existing.total_biaya_jahit,
      catatanJahit = existing.catatan_jahit,
      kebutuhanBahan = existing.kebutuhan_bahan,
      totalBiayaBahan = existing.total_biaya_bahan,
      totalHpp = existing.total_hpp,
      hppPerPcs = existing.hpp_per_pcs
    } = req.body || {};

    const rawKebutuhan = kebutuhanBahan !== undefined
      ? (typeof kebutuhanBahan === 'string' ? kebutuhanBahan : JSON.stringify(kebutuhanBahan || []))
      : existing.kebutuhan_bahan;

    await db.run(`
      UPDATE antrean
      SET 
        no_antrian = ?,
        tgl_masuk = ?,
        sumber_permintaan = ?,
        no_reff = ?,
        sku = ?,
        qty = ?,
        prioritas = ?,
        deadline = ?,
        status = ?,
        catatan = ?,
        tgl_serah_cutting = ?,
        tim_cutting = ?,
        tarif_cutting = ?,
        total_biaya_cutting = ?,
        catatan_cutting = ?,
        tgl_serah_jahit = ?,
        tim_jahit = ?,
        tarif_jahit = ?,
        total_biaya_jahit = ?,
        catatan_jahit = ?,
        kebutuhan_bahan = ?,
        total_biaya_bahan = ?,
        total_hpp = ?,
        hpp_per_pcs = ?
      WHERE id = ?
    `, [
      noAntrian,
      tglMasuk,
      sumberPermintaan,
      noReff || null,
      sku,
      Number(qty) || 1,
      prioritas || 'Normal',
      deadline,
      status || 'Menunggu Cutting',
      catatan || null,
      tglSerahCutting,
      timCutting,
      tarifCutting !== undefined ? Number(tarifCutting) : null,
      totalBiayaCutting !== undefined ? Number(totalBiayaCutting) : null,
      catatanCutting,
      tglSerahJahit,
      timJahit,
      tarifJahit !== undefined ? Number(tarifJahit) : null,
      totalBiayaJahit !== undefined ? Number(totalBiayaJahit) : null,
      catatanJahit,
      rawKebutuhan,
      Number(totalBiayaBahan) || 0,
      Number(totalHpp) || 0,
      Number(hppPerPcs) || 0,
      id
    ]);

    const rows = await getAntreanSelect('WHERE a.id = ?', [id]);
    res.json(rows[0] || { success: true, id: Number(id) });
  } catch (err) {
    console.error('❌ Error PUT /api/antrean/:id:', err);
    res.status(400).json({ error: err.message });
  }
});

// 4. POST serah-cutting
router.post('/serah-cutting', async (req, res) => {
  const { ids, tglSerahCutting, timCutting, tarifCutting, catatanCutting } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const id of ids) {
      await connection.query(`
        UPDATE antrean
        SET 
          status = 'Proses Cutting',
          tgl_serah_cutting = ?,
          tim_cutting = ?,
          tarif_cutting = ?,
          total_biaya_cutting = (qty * ?),
          catatan_cutting = ?
        WHERE id = ?
      `, [
        tglSerahCutting || new Date().toISOString().slice(0, 10),
        timCutting || 'Tim Cutting',
        Number(tarifCutting) || 0,
        Number(tarifCutting) || 0,
        catatanCutting || null,
        id
      ]);

      const [antRow] = await connection.query('SELECT qty FROM antrean WHERE id = ?', [id]);
      const cutQty = antRow[0]?.qty || 1;
      const cutTarif = Number(tarifCutting) || 0;
      await upsertPembayaranUpah(connection, id, 'Cutting', timCutting || 'Tim Cutting', cutQty, cutTarif, cutQty * cutTarif);
    }

    await connection.commit();

    const placeholders = ids.map(() => '?').join(',');
    const updatedRows = await getAntreanSelect(`WHERE a.id IN (${placeholders})`, ids);
    res.json({ success: true, count: ids.length, updated: updatedRows });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error POST /api/antrean/serah-cutting:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 5. POST serah-jahit
router.post('/serah-jahit', async (req, res) => {
  const { ids, tglSerahJahit, timJahit, tarifJahit, catatanJahit } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const id of ids) {
      await connection.query(`
        UPDATE antrean
        SET 
          status = 'Proses Jahit',
          tgl_serah_jahit = ?,
          tim_jahit = ?,
          tarif_jahit = ?,
          total_biaya_jahit = (qty * ?),
          catatan_jahit = ?
        WHERE id = ?
      `, [
        tglSerahJahit || new Date().toISOString().slice(0, 10),
        timJahit || 'Tim Jahit',
        Number(tarifJahit) || 0,
        Number(tarifJahit) || 0,
        catatanJahit || null,
        id
      ]);

      const [antRow] = await connection.query('SELECT qty FROM antrean WHERE id = ?', [id]);
      const jahitQty = antRow[0]?.qty || 1;
      const jahitTarif = Number(tarifJahit) || 0;
      await upsertPembayaranUpah(connection, id, 'Jahit', timJahit || 'Tim Jahit', jahitQty, jahitTarif, jahitQty * jahitTarif);
    }

    await connection.commit();

    const placeholders = ids.map(() => '?').join(',');
    const updatedRows = await getAntreanSelect(`WHERE a.id IN (${placeholders})`, ids);
    res.json({ success: true, count: ids.length, updated: updatedRows });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error POST /api/antrean/serah-jahit:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 6. POST serah-qc
router.post('/serah-qc', async (req, res) => {
  const { ids, tglSerahQc, timQc, catatanQc, statusQc, tarifQc } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  const safeTarifQc = Number(tarifQc) || 500;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const id of ids) {
      await connection.query(`
        UPDATE antrean
        SET 
          status = 'Proses QC',
          tgl_serah_qc = ?,
          tim_qc = ?,
          catatan_qc = ?,
          status_qc = ?,
          tarif_qc = ?,
          total_biaya_qc = (qty * ?)
        WHERE id = ?
      `, [
        tglSerahQc || new Date().toISOString().slice(0, 10),
        timQc || 'Tim QC (Pemeriksaan)',
        catatanQc || null,
        statusQc || 'Pemeriksaan',
        safeTarifQc,
        safeTarifQc,
        id
      ]);

      const [antRow] = await connection.query('SELECT qty FROM antrean WHERE id = ?', [id]);
      const qcQty = antRow[0]?.qty || 1;
      await upsertPembayaranUpah(connection, id, 'QC', timQc || 'Tim QC', qcQty, safeTarifQc, qcQty * safeTarifQc);
    }

    await connection.commit();

    const placeholders = ids.map(() => '?').join(',');
    const updatedRows = await getAntreanSelect(`WHERE a.id IN (${placeholders})`, ids);
    res.json({ success: true, count: ids.length, updated: updatedRows });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error POST /api/antrean/serah-qc:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 7. POST serah-finishing (Hasil QC: Lolos vs Reject Retur Jahit)
router.post('/serah-finishing', async (req, res) => {
  const {
    ids,
    qtyPassQc,
    qtyRejectQc,
    catatanRejectQc,
    tglSerahFinishing,
    timFinishing,
    catatanFinishing,
    tarifFinishing
  } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  const safeTarifFin = Number(tarifFinishing) || 1000;
  const connection = await pool.getConnection();
  try {
    const pass = Math.max(0, Number(qtyPassQc) || 0);
    const reject = Math.max(0, Number(qtyRejectQc) || 0);
    const affectedIds = [];
    const returItems = [];

    await connection.beginTransaction();

    for (const id of ids) {
      const [origRows] = await connection.query('SELECT * FROM antrean WHERE id = ?', [id]);
      const orig = origRows[0];
      if (!orig) continue;

      const origQty = Number(orig.qty) || 0;
      const itemPass = ids.length === 1 ? pass : Math.round((origQty / (pass + reject || origQty)) * pass);
      const itemReject = ids.length === 1 ? reject : (origQty - itemPass);

      if (itemReject > 0 && itemPass === 0) {
        // 100% Reject -> Kembali Jahit
        await connection.query(`
          UPDATE antrean
          SET 
            status = 'Proses Jahit',
            status_qc = 'Reject (Kembali Jahit)',
            qty_pass_qc = 0,
            qty_reject_qc = ?,
            catatan_reject_qc = ?,
            catatan = CASE 
              WHEN catatan IS NULL OR catatan = '' THEN ? 
              ELSE CONCAT(catatan, ' | ', ?) 
            END,
            catatan_jahit = CASE 
              WHEN catatan_jahit IS NULL OR catatan_jahit = '' THEN ? 
              ELSE CONCAT(catatan_jahit, ' | ', ?) 
            END
          WHERE id = ?
        `, [
          itemReject,
          catatanRejectQc || null,
          `[RETUR QC REPAIR]: ${catatanRejectQc || 'Cacat jahit'}`,
          `[RETUR QC REPAIR]: ${catatanRejectQc || 'Cacat jahit'}`,
          `[PERBAIKAN QC]: ${catatanRejectQc || 'Cacat jahit'}`,
          `[PERBAIKAN QC]: ${catatanRejectQc || 'Cacat jahit'}`,
          id
        ]);
        affectedIds.push(id);
      } else if (itemReject > 0 && itemPass > 0) {
        // Split: Sebagian lolos ke finishing, sebagian retur perbaikan jahit
        await connection.query(`
          UPDATE antrean
          SET 
            qty = ?,
            status = 'Proses Finishing',
            status_qc = 'Selesai QC (Lolos Sebagian)',
            qty_pass_qc = ?,
            qty_reject_qc = ?,
            catatan_reject_qc = ?,
            tgl_serah_finishing = ?,
            tim_finishing = ?,
            catatan_finishing = ?,
            tarif_finishing = ?,
            total_biaya_finishing = (? * ?),
            total_biaya_cutting = (? * COALESCE(tarif_cutting, 0)),
            total_biaya_jahit = (? * COALESCE(tarif_jahit, 0))
          WHERE id = ?
        `, [
          itemPass,
          itemPass,
          itemReject,
          catatanRejectQc || null,
          tglSerahFinishing || new Date().toISOString().slice(0, 10),
          timFinishing || 'Tim Finishing & Packing',
          catatanFinishing || null,
          safeTarifFin,
          itemPass,
          safeTarifFin,
          itemPass,
          itemPass,
          id
        ]);
        await upsertPembayaranUpah(connection, id, 'Finishing', timFinishing || 'Tim Finishing & Packing', itemPass, safeTarifFin, itemPass * safeTarifFin);
        affectedIds.push(id);

        // Pecahan antrean retur
        let baseNo = `${orig.no_antrian}-R`;
        let candidateNo = baseNo;
        let counter = 1;
        while (true) {
          const [chk] = await connection.query('SELECT id FROM antrean WHERE no_antrian = ?', [candidateNo]);
          if (!chk || chk.length === 0) break;
          counter++;
          candidateNo = `${baseNo}${counter}`;
        }

        const [insertRetur] = await connection.query(`
          INSERT INTO antrean (
            no_antrian, tgl_masuk, sumber_permintaan, no_reff, sku, qty, prioritas, deadline, status, catatan,
            tgl_serah_cutting, tim_cutting, tarif_cutting, total_biaya_cutting, catatan_cutting,
            tgl_serah_jahit, tim_jahit, tarif_jahit, total_biaya_jahit, catatan_jahit,
            tgl_serah_qc, tim_qc, catatan_qc, status_qc, qty_pass_qc, qty_reject_qc, catatan_reject_qc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          candidateNo,
          orig.tgl_masuk || new Date().toISOString().slice(0, 10),
          orig.sumber_permintaan || 'PO Pelanggan',
          orig.no_reff ? `${orig.no_reff} (Retur QC)` : 'Retur QC',
          orig.sku,
          itemReject,
          'Urgent',
          orig.deadline,
          'Proses Jahit',
          `[RETUR REVISI QC]: ${catatanRejectQc || 'Perbaikan cacat jahit'}`,
          orig.tgl_serah_cutting,
          orig.tim_cutting,
          0,
          0,
          `Pecahan retur reject dari ${orig.no_antrian}`,
          new Date().toISOString().slice(0, 10),
          orig.tim_jahit || 'Tim Jahit',
          0,
          0,
          `[PERBAIKAN REJECT QC]: ${catatanRejectQc || 'Perbaiki jahitan yang meleset'}`,
          orig.tgl_serah_qc,
          orig.tim_qc,
          orig.catatan_qc,
          'Perbaikan Jahit',
          0,
          itemReject,
          catatanRejectQc || null
        ]);

        affectedIds.push(insertRetur.insertId);
        returItems.push({
          id: insertRetur.insertId,
          noAntrian: candidateNo,
          qty: itemReject,
          timJahit: orig.tim_jahit || 'Tim Jahit'
        });
      } else {
        // 100% Lolos
        await connection.query(`
          UPDATE antrean
          SET 
            status = 'Proses Finishing',
            status_qc = 'Selesai QC',
            qty_pass_qc = ?,
            qty_reject_qc = 0,
            catatan_reject_qc = NULL,
            tgl_serah_finishing = ?,
            tim_finishing = ?,
            catatan_finishing = ?,
            tarif_finishing = ?,
            total_biaya_finishing = (? * ?)
          WHERE id = ?
        `, [
          origQty,
          tglSerahFinishing || new Date().toISOString().slice(0, 10),
          timFinishing || 'Tim Finishing & Packing',
          catatanFinishing || null,
          safeTarifFin,
          origQty,
          safeTarifFin,
          id
        ]);
        await upsertPembayaranUpah(connection, id, 'Finishing', timFinishing || 'Tim Finishing & Packing', origQty, safeTarifFin, origQty * safeTarifFin);
        affectedIds.push(id);
      }
    }

    await connection.commit();

    const placeholders = affectedIds.map(() => '?').join(',');
    const updatedRows = await getAntreanSelect(`WHERE a.id IN (${placeholders})`, affectedIds);

    res.json({
      success: true,
      count: affectedIds.length,
      updated: updatedRows,
      returItems
    });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error POST /api/antrean/serah-finishing:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 8. POST selesai-finishing (Serahkan ke Gudang Jadi)
router.post('/selesai-finishing', async (req, res) => {
  const { ids, tglDiserahkan, tglSelesai, petugasSerah, timFinishing, catatan } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  const connection = await pool.getConnection();
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const tglSerah = tglDiserahkan || tglSelesai || new Date().toISOString().slice(0, 10);
    const results = [];

    await connection.beginTransaction();

    for (const id of ids) {
      const [itemRows] = await connection.query(`
        SELECT a.*, p.nama_produk, p.varian, p.ukuran 
        FROM antrean a 
        LEFT JOIN products p ON a.sku = p.sku 
        WHERE a.id = ?
      `, [id]);
      const item = itemRows[0];
      if (!item) continue;

      const finalPetugasSerah = petugasSerah || timFinishing || item.tim_finishing || 'Tim Finishing';

      // 1. Update status antrean -> 'Selesai'
      await connection.query(`
        UPDATE antrean 
        SET status = 'Selesai',
            tgl_serah_gudang = ?
        WHERE id = ?
      `, [tglSerah, id]);

      // 2. Generate No Mutasi unik
      let rand = Math.floor(100 + Math.random() * 900);
      let candidateNo = `MGJ-${today}-${rand}`;
      while (true) {
        const [chk] = await connection.query('SELECT id FROM mutasi_gudang_jadi WHERE no_mutasi = ?', [candidateNo]);
        if (!chk || chk.length === 0) break;
        rand = Math.floor(100 + Math.random() * 900);
        candidateNo = `MGJ-${today}-${rand}`;
      }

      const qtyFinal = Number(item.qty) || 1;
      const prodName = item.nama_produk || item.sku;
      const prodVarian = item.varian || 'Polos';
      const prodUkuran = item.ukuran || 'All Size';
      const finalCatatan = catatan || `Diserahkan dari ${finalPetugasSerah} (Menunggu Approval Gudang Jadi)`;

      // 3. Masukkan ke mutasi_gudang_jadi
      await connection.query(`
        INSERT INTO mutasi_gudang_jadi (
          no_mutasi, tgl_mutasi, jenis_mutasi, sumber, no_antrian, no_reff,
          sku, nama_produk, varian, ukuran, qty, satuan, lokasi_rak,
          petugas, catatan, tgl_diserahkan, petugas_serah, tgl_diterima, petugas_terima, status_penerimaan
        ) VALUES (?, ?, 'MASUK', 'Produksi Finishing', ?, ?, ?, ?, ?, ?, ?, 'Pcs', NULL, ?, ?, ?, ?, NULL, NULL, 'Menunggu Penerimaan')
      `, [
        candidateNo,
        tglSerah,
        item.no_antrian,
        item.no_reff || '-',
        item.sku,
        prodName,
        prodVarian,
        prodUkuran,
        qtyFinal,
        finalPetugasSerah,
        finalCatatan,
        tglSerah,
        finalPetugasSerah
      ]);

      results.push({
        antreanId: id,
        noAntrian: item.no_antrian,
        noMutasi: candidateNo,
        qty: qtyFinal,
        status: 'Menunggu Penerimaan Gudang'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error POST /api/antrean/selesai-finishing:', err);
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 9. POST rollback tahap (Undo jika salah proses)
router.post('/rollback', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID antrean wajib ada.' });

  try {
    const row = await db.get('SELECT * FROM antrean WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Antrean tidak ditemukan.' });

    let newStatus = 'Menunggu Cutting';
    let sqlUpdate = '';

    if (row.status === 'Proses Cutting') {
      newStatus = 'Menunggu Cutting';
      sqlUpdate = `
        UPDATE antrean
        SET status = 'Menunggu Cutting',
            tgl_serah_cutting = NULL,
            tim_cutting = NULL,
            tarif_cutting = 0,
            total_biaya_cutting = 0,
            catatan_cutting = NULL
        WHERE id = ?
      `;
    } else if (row.status === 'Proses Jahit') {
      newStatus = 'Proses Cutting';
      sqlUpdate = `
        UPDATE antrean
        SET status = 'Proses Cutting',
            tgl_serah_jahit = NULL,
            tim_jahit = NULL,
            tarif_jahit = 0,
            total_biaya_jahit = 0,
            catatan_jahit = NULL
        WHERE id = ?
      `;
    } else if (row.status === 'Proses QC') {
      newStatus = 'Proses Jahit';
      sqlUpdate = `
        UPDATE antrean
        SET status = 'Proses Jahit',
            tgl_serah_qc = NULL,
            tim_qc = NULL,
            catatan_qc = NULL,
            status_qc = NULL
        WHERE id = ?
      `;
    } else if (row.status === 'Selesai' || row.status === 'Menunggu Penerimaan Gudang') {
      newStatus = 'Proses Finishing';
      sqlUpdate = `
        UPDATE antrean
        SET status = 'Proses Finishing',
            tgl_serah_gudang = NULL
        WHERE id = ?
      `;
      try {
        await db.run('DELETE FROM mutasi_gudang_jadi WHERE no_antrian = ?', [row.no_antrian]);
      } catch (_) {}
    } else if (row.status === 'Proses Finishing') {
      newStatus = 'Proses QC';
      sqlUpdate = `
        UPDATE antrean
        SET status = 'Proses QC',
            status_qc = 'Pemeriksaan',
            qty_pass_qc = 0,
            qty_reject_qc = 0,
            catatan_reject_qc = NULL,
            tgl_serah_finishing = NULL,
            tim_finishing = NULL,
            catatan_finishing = NULL
        WHERE id = ?
      `;
    }

    if (sqlUpdate) {
      await db.run(sqlUpdate, [id]);
    }

    const rows = await getAntreanSelect('WHERE a.id = ?', [id]);
    res.json({ success: true, previousStatus: row.status, newStatus, updated: rows[0] });
  } catch (err) {
    console.error('❌ Error rollback antrean:', err);
    res.status(400).json({ error: err.message });
  }
});

// 10. DELETE antrean
router.delete('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT no_antrian FROM antrean WHERE id = ?', [req.params.id]);
    if (item && item.no_antrian) {
      try {
        await db.run('DELETE FROM mutasi_gudang_jadi WHERE no_antrian = ?', [item.no_antrian]);
      } catch (_) {}
    }
    await db.run('DELETE FROM antrean WHERE id = ?', [req.params.id]);
    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
