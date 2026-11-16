import { Router } from "express";
import db, { pool } from "../db/database.js";

const router = Router();

// Helper generate No Pembayaran otomatis: PAY-YYYYMMDD-XXX
function generateNoPembayaran() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `PAY-${dateStr}-${rand}`;
}

// 1. GET /api/pembayaran-upah
// List seluruh data upah dengan filter tahapan, status bayar, petugas, dan pencarian
router.get("/", async (req, res) => {
  try {
    const { tahapan, status_bayar, petugas, search } = req.query;

    let sql = `
      SELECT 
        id,
        no_pembayaran as noPembayaran,
        antrean_id as antreanId,
        no_antrian as noAntrian,
        sku,
        nama_produk as namaProduk,
        tahapan,
        nama_petugas as namaPetugas,
        qty,
        tarif_per_pcs as tarifPerPcs,
        total_upah as totalUpah,
        COALESCE(potongan_kasbon, 0) as potonganKasbon,
        COALESCE(total_bersih, total_upah) as totalBersih,
        status_bayar as statusBayar,
        tgl_bayar as tglBayar,
        metode_bayar as metodeBayar,
        catatan,
        created_at as createdAt,
        updated_at as updatedAt
      FROM pembayaran_upah
      WHERE 1=1
    `;

    const params = [];

    if (tahapan && tahapan !== "Semua") {
      sql += ` AND tahapan = ?`;
      params.push(tahapan);
    }

    if (status_bayar && status_bayar !== "Semua") {
      sql += ` AND status_bayar = ?`;
      params.push(status_bayar);
    }

    if (petugas) {
      sql += ` AND nama_petugas LIKE ?`;
      params.push(`%${petugas}%`);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (no_pembayaran LIKE ? OR no_antrian LIKE ? OR sku LIKE ? OR nama_produk LIKE ? OR nama_petugas LIKE ?)`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /api/pembayaran-upah:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/pembayaran-upah/rekap
// Ringkasan total tagihan upah, total lunas, pending, dan rincian per tahapan
router.get("/rekap", async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT 
        tahapan,
        status_bayar as statusBayar,
        COUNT(*) as countItems,
        COALESCE(SUM(qty), 0) as totalQty,
        COALESCE(SUM(total_upah), 0) as totalNominal
      FROM pembayaran_upah
      GROUP BY tahapan, status_bayar
    `);

    let totalTagihan = 0;
    let totalLunas = 0;
    let totalPending = 0;
    let totalPcs = 0;

    const perTahapan = {
      Cutting: { count: 0, total: 0, lunas: 0, pending: 0, pcs: 0 },
      Jahit: { count: 0, total: 0, lunas: 0, pending: 0, pcs: 0 },
      QC: { count: 0, total: 0, lunas: 0, pending: 0, pcs: 0 },
      Finishing: { count: 0, total: 0, lunas: 0, pending: 0, pcs: 0 },
    };

    rows.forEach((r) => {
      const nom = Number(r.totalNominal) || 0;
      const count = Number(r.countItems) || 0;
      const pcs = Number(r.totalQty) || 0;
      const isLunas = r.statusBayar === "Lunas";

      totalTagihan += nom;
      totalPcs += pcs;
      if (isLunas) totalLunas += nom;
      else totalPending += nom;

      if (perTahapan[r.tahapan]) {
        perTahapan[r.tahapan].count += count;
        perTahapan[r.tahapan].total += nom;
        perTahapan[r.tahapan].pcs += pcs;
        if (isLunas) perTahapan[r.tahapan].lunas += nom;
        else perTahapan[r.tahapan].pending += nom;
      }
    });

    res.json({
      totalTagihan,
      totalLunas,
      totalPending,
      totalPcs,
      perTahapan,
    });
  } catch (err) {
    console.error("❌ Error GET /api/pembayaran-upah/rekap:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/pembayaran-upah/bayar
// Memproses pembayaran upah untuk 1 atau beberapa transaksi (Batch Payment) + Potong Kasbon Otomatis
router.post("/bayar", async (req, res) => {
  const { ids, tglBayar, metodeBayar, catatan, potonganKasbon } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Pilih minimal 1 data tagihan upah." });
  }

  const payDate = tglBayar || new Date().toISOString().slice(0, 10);
  const payMethod = metodeBayar || "Tunai / Cash";
  let nominalPotongKasbon = Number(potonganKasbon) || 0;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const id of ids) {
      const [rows] = await connection.query(
        "SELECT * FROM pembayaran_upah WHERE id = ?",
        [id]
      );
      const item = rows[0];
      if (!item) continue;

      const totalUpah = Number(item.total_upah) || 0;
      let potonganItem = 0;

      // Jika ada permohonan potong kasbon untuk transaksi ini
      if (nominalPotongKasbon > 0 && item.nama_petugas) {
        // Ambil daftar kasbon belum lunas milik petugas ini
        const [activeKasbon] = await connection.query(
          `SELECT * FROM kasbon 
           WHERE LOWER(TRIM(nama_petugas)) = LOWER(TRIM(?)) AND status = 'Belum Lunas' AND sisa > 0 
           ORDER BY id ASC`,
          [item.nama_petugas]
        );

        let sisaDibutuhkan = Math.min(nominalPotongKasbon, totalUpah);

        for (const k of activeKasbon) {
          if (sisaDibutuhkan <= 0) break;
          const sisaKasbon = Number(k.sisa) || 0;
          const potongNominal = Math.min(sisaKasbon, sisaDibutuhkan);

          if (potongNominal > 0) {
            // Update kasbon: tambah terbayar, kurangi sisa
            await connection.query(
              `UPDATE kasbon 
               SET terbayar = terbayar + ?, 
                   sisa = sisa - ?, 
                   status = CASE WHEN sisa <= 0 THEN 'Lunas' ELSE 'Belum Lunas' END 
               WHERE id = ?`,
              [potongNominal, potongNominal, k.id]
            );

            // Catat ke audit trail kasbon_pembayaran
            await connection.query(
              `INSERT INTO kasbon_pembayaran 
               (kasbon_id, pembayaran_upah_id, no_pembayaran_upah, nama_petugas, tgl_potong, nominal_potong, catatan) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                k.id,
                item.id,
                item.no_pembayaran,
                item.nama_petugas,
                payDate,
                potongNominal,
                catatan || `Dipotong langsung dari pembayaran upah ${item.no_pembayaran}`,
              ]
            );

            sisaDibutuhkan -= potongNominal;
            potonganItem += potongNominal;
            nominalPotongKasbon -= potongNominal;
          }
        }
      }

      const totalBersih = Math.max(0, totalUpah - potonganItem);

      await connection.query(
        `UPDATE pembayaran_upah 
         SET status_bayar = 'Lunas', 
             tgl_bayar = ?, 
             metode_bayar = ?, 
             potongan_kasbon = ?,
             total_bersih = ?,
             catatan = COALESCE(?, catatan)
         WHERE id = ?`,
        [payDate, payMethod, potonganItem, totalBersih, catatan || null, id]
      );

      // Sinkronkan ke kolom status_bayar_{tahapan} di antrean jika ada
      const tahapLower = (item.tahapan || "").toLowerCase();
      if (["cutting", "jahit", "qc", "finishing"].includes(tahapLower)) {
        try {
          await connection.query(
            `UPDATE antrean SET status_bayar_${tahapLower} = 'Lunas' WHERE id = ?`,
            [item.antrean_id]
          );
        } catch (_) {}
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: `${ids.length} tagihan upah berhasil dibayarkan (Lunas).`,
      count: ids.length,
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error POST /api/pembayaran-upah/bayar:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 4. POST /api/pembayaran-upah/batal-bayar
// Membatalkan status pembayaran kembali ke Belum Lunas
router.post("/batal-bayar", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID pembayaran wajib diisi." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM pembayaran_upah WHERE id = ?",
      [id]
    );
    const item = rows[0];
    if (!item) {
      return res.status(404).json({ error: "Data pembayaran tidak ditemukan." });
    }

    // Rollback potongan kasbon jika sebelumnya ada potongan dari pembayaran ini
    const [kpRows] = await connection.query(
      "SELECT * FROM kasbon_pembayaran WHERE pembayaran_upah_id = ?",
      [id]
    );

    for (const kp of kpRows) {
      await connection.query(
        `UPDATE kasbon 
         SET terbayar = GREATEST(0, terbayar - ?), 
             sisa = sisa + ?, 
             status = 'Belum Lunas' 
         WHERE id = ?`,
        [Number(kp.nominal_potong), Number(kp.nominal_potong), kp.kasbon_id]
      );
    }

    if (kpRows.length > 0) {
      await connection.query(
        "DELETE FROM kasbon_pembayaran WHERE pembayaran_upah_id = ?",
        [id]
      );
    }

    await connection.query(
      `UPDATE pembayaran_upah 
       SET status_bayar = 'Belum Lunas', 
           tgl_bayar = NULL, 
           metode_bayar = NULL,
           potongan_kasbon = 0,
           total_bersih = total_upah
       WHERE id = ?`,
      [id]
    );

    const tahapLower = (item.tahapan || "").toLowerCase();
    if (["cutting", "jahit", "qc", "finishing"].includes(tahapLower)) {
      try {
        await connection.query(
          `UPDATE antrean SET status_bayar_${tahapLower} = 'Belum Lunas' WHERE id = ?`,
          [item.antrean_id]
        );
      } catch (_) {}
    }

    await connection.commit();
    res.json({ success: true, message: "Status pembayaran dikembalikan ke Belum Lunas." });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error POST /api/pembayaran-upah/batal-bayar:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 5. POST /api/pembayaran-upah/sync-from-antrean
// Auto-sinkronisasi seluruh data penyerahan tahap antrean menjadi tagihan upah
router.post("/sync-from-antrean", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [antreanList] = await connection.query(`
      SELECT 
        a.id, a.no_antrian, a.sku, a.qty,
        a.tgl_serah_cutting, a.tim_cutting, a.tarif_cutting, a.total_biaya_cutting,
        a.tgl_serah_jahit, a.tim_jahit, a.tarif_jahit, a.total_biaya_jahit,
        a.tgl_serah_qc, a.tim_qc, a.qty_pass_qc, a.qty_reject_qc, a.tarif_qc, a.total_biaya_qc,
        a.tgl_serah_finishing, a.tim_finishing, a.tarif_finishing, a.total_biaya_finishing,
        p.nama_produk
      FROM antrean a
      LEFT JOIN products p ON a.sku = p.sku
    `);

    let createdCount = 0;

    for (const a of antreanList) {
      const namaProd = a.nama_produk || a.sku || "Produk Konveksi";

      // 1. Cutting
      if (a.tgl_serah_cutting && a.tim_cutting) {
        const [exist] = await connection.query(
          "SELECT id FROM pembayaran_upah WHERE antrean_id = ? AND tahapan = 'Cutting'",
          [a.id]
        );
        const qtyCut = Number(a.qty) || 1;
        const tarifCut = Number(a.tarif_cutting) || 1500;
        const totCut = Number(a.total_biaya_cutting) || (qtyCut * tarifCut);

        if (!exist || exist.length === 0) {
          await connection.query(`
            INSERT INTO pembayaran_upah (
              no_pembayaran, antrean_id, no_antrian, sku, nama_produk,
              tahapan, nama_petugas, qty, tarif_per_pcs, total_upah, status_bayar
            ) VALUES (?, ?, ?, ?, ?, 'Cutting', ?, ?, ?, ?, 'Belum Lunas')
          `, [
            generateNoPembayaran(), a.id, a.no_antrian, a.sku, namaProd,
            a.tim_cutting, qtyCut, tarifCut, totCut
          ]);
          createdCount++;
        }
      }

      // 2. Jahit
      if (a.tgl_serah_jahit && a.tim_jahit) {
        const [exist] = await connection.query(
          "SELECT id FROM pembayaran_upah WHERE antrean_id = ? AND tahapan = 'Jahit'",
          [a.id]
        );
        const qtyJahit = Number(a.qty) || 1;
        const tarifJahit = Number(a.tarif_jahit) || 3500;
        const totJahit = Number(a.total_biaya_jahit) || (qtyJahit * tarifJahit);

        if (!exist || exist.length === 0) {
          await connection.query(`
            INSERT INTO pembayaran_upah (
              no_pembayaran, antrean_id, no_antrian, sku, nama_produk,
              tahapan, nama_petugas, qty, tarif_per_pcs, total_upah, status_bayar
            ) VALUES (?, ?, ?, ?, ?, 'Jahit', ?, ?, ?, ?, 'Belum Lunas')
          `, [
            generateNoPembayaran(), a.id, a.no_antrian, a.sku, namaProd,
            a.tim_jahit, qtyJahit, tarifJahit, totJahit
          ]);
          createdCount++;
        }
      }

      // 3. QC
      if (a.tgl_serah_qc && a.tim_qc) {
        const [exist] = await connection.query(
          "SELECT id FROM pembayaran_upah WHERE antrean_id = ? AND tahapan = 'QC'",
          [a.id]
        );
        const passQc = Number(a.qty_pass_qc) || 0;
        const rejQc = Number(a.qty_reject_qc) || 0;
        const qtyQc = (passQc + rejQc) > 0 ? (passQc + rejQc) : (Number(a.qty) || 1);
        const tarifQc = Number(a.tarif_qc) || 500;
        const totQc = Number(a.total_biaya_qc) || (qtyQc * tarifQc);

        if (!exist || exist.length === 0) {
          await connection.query(`
            INSERT INTO pembayaran_upah (
              no_pembayaran, antrean_id, no_antrian, sku, nama_produk,
              tahapan, nama_petugas, qty, tarif_per_pcs, total_upah, status_bayar
            ) VALUES (?, ?, ?, ?, ?, 'QC', ?, ?, ?, ?, 'Belum Lunas')
          `, [
            generateNoPembayaran(), a.id, a.no_antrian, a.sku, namaProd,
            a.tim_qc, qtyQc, tarifQc, totQc
          ]);
          createdCount++;
        }
      }

      // 4. Finishing
      if (a.tgl_serah_finishing && a.tim_finishing) {
        const [exist] = await connection.query(
          "SELECT id FROM pembayaran_upah WHERE antrean_id = ? AND tahapan = 'Finishing'",
          [a.id]
        );
        const qtyFin = Number(a.qty_pass_qc) || Number(a.qty) || 1;
        const tarifFin = Number(a.tarif_finishing) || 1000;
        const totFin = Number(a.total_biaya_finishing) || (qtyFin * tarifFin);

        if (!exist || exist.length === 0) {
          await connection.query(`
            INSERT INTO pembayaran_upah (
              no_pembayaran, antrean_id, no_antrian, sku, nama_produk,
              tahapan, nama_petugas, qty, tarif_per_pcs, total_upah, status_bayar
            ) VALUES (?, ?, ?, ?, ?, 'Finishing', ?, ?, ?, ?, 'Belum Lunas')
          `, [
            generateNoPembayaran(), a.id, a.no_antrian, a.sku, namaProd,
            a.tim_finishing, qtyFin, tarifFin, totFin
          ]);
          createdCount++;
        }
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: `Sinkronisasi tagihan upah selesai (${createdCount} tagihan baru dibuat).`,
      createdCount,
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error POST /api/pembayaran-upah/sync-from-antrean:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;

