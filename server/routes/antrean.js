import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Helper SELECT antrean with joined products
function getAntreanSelect(whereClause = '', params = []) {
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
  return db.prepare(sql).all(...params);
}

// 1. GET all antrean
router.get('/', (req, res) => {
  try {
    const rows = getAntreanSelect('ORDER BY a.id DESC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/antrean:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1b. GET antrean by id
router.get('/:id', (req, res) => {
  try {
    const rows = getAntreanSelect('WHERE a.id = ?', [req.params.id]);
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
router.post('/', (req, res) => {
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
    catatanCutting
  } = req.body;

  try {
    if (!sku || String(sku).trim() === '') {
      return res.status(400).json({ error: 'Kode SKU produk wajib diisi.' });
    }

    let finalNo = noAntrian ? String(noAntrian).trim() : '';
    if (!finalNo) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countRow = db.prepare('SELECT COUNT(*) as cnt FROM antrean').get();
      const seq = String((countRow ? countRow.cnt : 0) + 1).padStart(3, '0');
      finalNo = `ANT-${today}-${seq}`;
    }

    const existing = db.prepare('SELECT id FROM antrean WHERE no_antrian = ?').get(finalNo);
    if (existing) {
      const seqSuffix = Math.floor(Math.random() * 899 + 100);
      finalNo = `${finalNo}-${seqSuffix}`;
    }

    const stmt = db.prepare(`
      INSERT INTO antrean (
        no_antrian, tgl_masuk, sumber_permintaan, no_reff, sku, qty, prioritas, deadline, status, catatan,
        tgl_serah_cutting, tim_cutting, tarif_cutting, total_biaya_cutting, catatan_cutting
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
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
      catatanCutting || null
    );

    res.status(201).json({
      id: Number(info.lastInsertRowid),
      noAntrian: finalNo,
      ...req.body
    });
  } catch (err) {
    console.error('❌ Error POST /api/antrean:', err);
    res.status(400).json({ error: err.message });
  }
});

// 3. PUT update antrean
router.put('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM antrean WHERE id = ?').get(id);
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
      catatanJahit = existing.catatan_jahit
    } = req.body || {};

    db.prepare(`
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
        catatan_jahit = ?
      WHERE id = ?
    `).run(
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
      id
    );

    const rows = getAntreanSelect('WHERE a.id = ?', [id]);
    res.json(rows[0] || { success: true, id: Number(id) });
  } catch (err) {
    console.error('❌ Error PUT /api/antrean/:id:', err);
    res.status(400).json({ error: err.message });
  }
});

// 4. POST serah-cutting
router.post('/serah-cutting', (req, res) => {
  const { ids, tglSerahCutting, timCutting, tarifCutting, catatanCutting } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  try {
    const updateStmt = db.prepare(`
      UPDATE antrean
      SET 
        status = 'Proses Cutting',
        tgl_serah_cutting = ?,
        tim_cutting = ?,
        tarif_cutting = ?,
        total_biaya_cutting = (qty * ?),
        catatan_cutting = ?
      WHERE id = ?
    `);

    db.exec('BEGIN');
    try {
      for (const id of ids) {
        updateStmt.run(
          tglSerahCutting || new Date().toISOString().slice(0, 10),
          timCutting || 'Tim Cutting',
          Number(tarifCutting) || 0,
          Number(tarifCutting) || 0,
          catatanCutting || null,
          id
        );
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const placeholders = ids.map(() => '?').join(',');
    const updatedRows = getAntreanSelect(`WHERE a.id IN (${placeholders})`, ids);
    res.json({ success: true, count: ids.length, updated: updatedRows });
  } catch (err) {
    console.error('❌ Error POST /api/antrean/serah-cutting:', err);
    res.status(400).json({ error: err.message });
  }
});

// 5. POST serah-jahit
router.post('/serah-jahit', (req, res) => {
  const { ids, tglSerahJahit, timJahit, tarifJahit, catatanJahit } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  try {
    const updateStmt = db.prepare(`
      UPDATE antrean
      SET 
        status = 'Proses Jahit',
        tgl_serah_jahit = ?,
        tim_jahit = ?,
        tarif_jahit = ?,
        total_biaya_jahit = (qty * ?),
        catatan_jahit = ?
      WHERE id = ?
    `);

    db.exec('BEGIN');
    try {
      for (const id of ids) {
        updateStmt.run(
          tglSerahJahit || new Date().toISOString().slice(0, 10),
          timJahit || 'Tim Jahit',
          Number(tarifJahit) || 0,
          Number(tarifJahit) || 0,
          catatanJahit || null,
          id
        );
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const placeholders = ids.map(() => '?').join(',');
    const updatedRows = getAntreanSelect(`WHERE a.id IN (${placeholders})`, ids);
    res.json({ success: true, count: ids.length, updated: updatedRows });
  } catch (err) {
    console.error('❌ Error POST /api/antrean/serah-jahit:', err);
    res.status(400).json({ error: err.message });
  }
});

// 6. POST serah-qc
router.post('/serah-qc', (req, res) => {
  const { ids, tglSerahQc, timQc, catatanQc, statusQc } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  try {
    const updateStmt = db.prepare(`
      UPDATE antrean
      SET 
        status = 'Proses QC',
        tgl_serah_qc = ?,
        tim_qc = ?,
        catatan_qc = ?,
        status_qc = ?
      WHERE id = ?
    `);

    db.exec('BEGIN');
    try {
      for (const id of ids) {
        updateStmt.run(
          tglSerahQc || new Date().toISOString().slice(0, 10),
          timQc || 'Tim QC (Pemeriksaan)',
          catatanQc || null,
          statusQc || 'Pemeriksaan',
          id
        );
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const placeholders = ids.map(() => '?').join(',');
    const updatedRows = getAntreanSelect(`WHERE a.id IN (${placeholders})`, ids);
    res.json({ success: true, count: ids.length, updated: updatedRows });
  } catch (err) {
    console.error('❌ Error POST /api/antrean/serah-qc:', err);
    res.status(400).json({ error: err.message });
  }
});

// 7. POST serah-finishing (Hasil QC: Lolos vs Reject Retur Jahit)
router.post('/serah-finishing', (req, res) => {
  const {
    ids,
    qtyPassQc,
    qtyRejectQc,
    catatanRejectQc,
    tglSerahFinishing,
    timFinishing,
    catatanFinishing
  } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  try {
    const pass = Math.max(0, Number(qtyPassQc) || 0);
    const reject = Math.max(0, Number(qtyRejectQc) || 0);
    const affectedIds = [];
    const returItems = [];

    db.exec('BEGIN');
    try {
      for (const id of ids) {
        const orig = db.prepare('SELECT * FROM antrean WHERE id = ?').get(id);
        if (!orig) continue;

        const origQty = Number(orig.qty) || 0;
        const itemPass = ids.length === 1 ? pass : Math.round((origQty / (pass + reject || origQty)) * pass);
        const itemReject = ids.length === 1 ? reject : (origQty - itemPass);

        if (itemReject > 0 && itemPass === 0) {
          // 100% Reject -> Kembali Jahit
          db.prepare(`
            UPDATE antrean
            SET 
              status = 'Proses Jahit',
              status_qc = 'Reject (Kembali Jahit)',
              qty_pass_qc = 0,
              qty_reject_qc = ?,
              catatan_reject_qc = ?,
              catatan = CASE 
                WHEN catatan IS NULL OR catatan = '' THEN ? 
                ELSE catatan || ' | ' || ? 
              END,
              catatan_jahit = CASE 
                WHEN catatan_jahit IS NULL OR catatan_jahit = '' THEN ? 
                ELSE catatan_jahit || ' | ' || ? 
              END
            WHERE id = ?
          `).run(
            itemReject,
            catatanRejectQc || null,
            `[RETUR QC REPAIR]: ${catatanRejectQc || 'Cacat jahit'}`,
            `[RETUR QC REPAIR]: ${catatanRejectQc || 'Cacat jahit'}`,
            `[PERBAIKAN QC]: ${catatanRejectQc || 'Cacat jahit'}`,
            `[PERBAIKAN QC]: ${catatanRejectQc || 'Cacat jahit'}`,
            id
          );
          affectedIds.push(id);
        } else if (itemReject > 0 && itemPass > 0) {
          // Split: Sebagian lolos ke finishing, sebagian retur perbaikan jahit
          db.prepare(`
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
              total_biaya_cutting = (? * COALESCE(tarif_cutting, 0)),
              total_biaya_jahit = (? * COALESCE(tarif_jahit, 0))
            WHERE id = ?
          `).run(
            itemPass,
            itemPass,
            itemReject,
            catatanRejectQc || null,
            tglSerahFinishing || new Date().toISOString().slice(0, 10),
            timFinishing || 'Tim Finishing & Packing',
            catatanFinishing || null,
            itemPass,
            itemPass,
            id
          );
          affectedIds.push(id);

          // Pecahan antrean retur
          let baseNo = `${orig.no_antrian}-R`;
          let candidateNo = baseNo;
          let counter = 1;
          while (db.prepare('SELECT id FROM antrean WHERE no_antrian = ?').get(candidateNo)) {
            counter++;
            candidateNo = `${baseNo}${counter}`;
          }

          const insertRetur = db.prepare(`
            INSERT INTO antrean (
              no_antrian, tgl_masuk, sumber_permintaan, no_reff, sku, qty, prioritas, deadline, status, catatan,
              tgl_serah_cutting, tim_cutting, tarif_cutting, total_biaya_cutting, catatan_cutting,
              tgl_serah_jahit, tim_jahit, tarif_jahit, total_biaya_jahit, catatan_jahit,
              tgl_serah_qc, tim_qc, catatan_qc, status_qc, qty_pass_qc, qty_reject_qc, catatan_reject_qc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
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
          );

          affectedIds.push(insertRetur.lastInsertRowid);
          returItems.push({
            id: insertRetur.lastInsertRowid,
            noAntrian: candidateNo,
            qty: itemReject,
            timJahit: orig.tim_jahit || 'Tim Jahit'
          });
        } else {
          // 100% Lolos
          db.prepare(`
            UPDATE antrean
            SET 
              status = 'Proses Finishing',
              status_qc = 'Selesai QC',
              qty_pass_qc = ?,
              qty_reject_qc = 0,
              catatan_reject_qc = NULL,
              tgl_serah_finishing = ?,
              tim_finishing = ?,
              catatan_finishing = ?
            WHERE id = ?
          `).run(
            origQty,
            tglSerahFinishing || new Date().toISOString().slice(0, 10),
            timFinishing || 'Tim Finishing & Packing',
            catatanFinishing || null,
            id
          );
          affectedIds.push(id);
        }
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const placeholders = affectedIds.map(() => '?').join(',');
    const updatedRows = getAntreanSelect(`WHERE a.id IN (${placeholders})`, affectedIds);

    res.json({
      success: true,
      count: affectedIds.length,
      updated: updatedRows,
      returItems
    });
  } catch (err) {
    console.error('❌ Error POST /api/antrean/serah-finishing:', err);
    res.status(400).json({ error: err.message });
  }
});

// 8. POST selesai-finishing (Serahkan ke Gudang Jadi)
router.post('/selesai-finishing', (req, res) => {
  const { ids, tglDiserahkan, tglSelesai, petugasSerah, timFinishing, catatan } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Daftar antrean wajib dipilih.' });
  }

  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const tglSerah = tglDiserahkan || tglSelesai || new Date().toISOString().slice(0, 10);
    const results = [];

    db.exec('BEGIN');
    try {
      for (const id of ids) {
        const item = db.prepare(`
          SELECT a.*, p.nama_produk, p.varian, p.ukuran 
          FROM antrean a 
          LEFT JOIN products p ON a.sku = p.sku 
          WHERE a.id = ?
        `).get(id);
        if (!item) continue;

        const finalPetugasSerah = petugasSerah || timFinishing || item.tim_finishing || 'Tim Finishing';

        // 1. Update status antrean -> 'Selesai' (masuk status Selesai di Antrean Produksi)
        db.prepare(`
          UPDATE antrean 
          SET status = 'Selesai',
              tgl_serah_gudang = ?
          WHERE id = ?
        `).run(tglSerah, id);

        // 2. Generate No Mutasi unik
        let rand = Math.floor(100 + Math.random() * 900);
        let candidateNo = `MGJ-${today}-${rand}`;
        while (db.prepare('SELECT id FROM mutasi_gudang_jadi WHERE no_mutasi = ?').get(candidateNo)) {
          rand = Math.floor(100 + Math.random() * 900);
          candidateNo = `MGJ-${today}-${rand}`;
        }

        const qtyFinal = Number(item.qty) || 1;
        const prodName = item.nama_produk || item.sku;
        const prodVarian = item.varian || 'Polos';
        const prodUkuran = item.ukuran || 'All Size';
        const finalCatatan = catatan || `Diserahkan dari ${finalPetugasSerah} (Menunggu Approval Gudang Jadi)`;

        // 3. Masukkan ke mutasi_gudang_jadi
        db.prepare(`
          INSERT INTO mutasi_gudang_jadi (
            no_mutasi, tgl_mutasi, jenis_mutasi, sumber, no_antrian, no_reff,
            sku, nama_produk, varian, ukuran, qty, satuan, lokasi_rak,
            petugas, catatan, tgl_diserahkan, petugas_serah, tgl_diterima, petugas_terima, status_penerimaan
          ) VALUES (?, ?, 'MASUK', 'Produksi Finishing', ?, ?, ?, ?, ?, ?, ?, 'Pcs', NULL, ?, ?, ?, ?, NULL, NULL, 'Menunggu Penerimaan')
        `).run(
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
        );

        results.push({
          antreanId: id,
          noAntrian: item.no_antrian,
          noMutasi: candidateNo,
          qty: qtyFinal,
          status: 'Menunggu Penerimaan Gudang'
        });
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error('❌ Error POST /api/antrean/selesai-finishing:', err);
    res.status(400).json({ error: err.message });
  }
});

// 9. POST rollback tahap (Undo jika salah proses)
router.post('/rollback', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID antrean wajib ada.' });

  try {
    const row = db.prepare('SELECT * FROM antrean WHERE id = ?').get(id);
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
        db.prepare("DELETE FROM mutasi_gudang_jadi WHERE no_antrian = ?").run(row.no_antrian);
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
      db.prepare(sqlUpdate).run(id);
    }

    const rows = getAntreanSelect('WHERE a.id = ?', [id]);
    res.json({ success: true, previousStatus: row.status, newStatus, updated: rows[0] });
  } catch (err) {
    console.error('❌ Error rollback antrean:', err);
    res.status(400).json({ error: err.message });
  }
});

// 10. DELETE antrean
router.delete('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT no_antrian FROM antrean WHERE id = ?').get(req.params.id);
    if (item && item.no_antrian) {
      try {
        db.prepare('DELETE FROM mutasi_gudang_jadi WHERE no_antrian = ?').run(item.no_antrian);
      } catch (_) {}
    }
    db.prepare('DELETE FROM antrean WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

