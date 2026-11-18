import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM products ORDER BY id ASC');
    res.json(rows.map(r => {
      const hargaJual = Number(r.harga || 0);
      const hppValue = r.hpp !== undefined && r.hpp !== null && Number(r.hpp) > 0
        ? Number(r.hpp)
        : Math.round(hargaJual * 0.70);

      let parsedKebutuhan = [];
      if (r.kebutuhan_bahan) {
        try {
          parsedKebutuhan = typeof r.kebutuhan_bahan === 'string' ? JSON.parse(r.kebutuhan_bahan) : r.kebutuhan_bahan;
        } catch (_) {}
      }

      return {
        id: r.id,
        skuInduk: r.sku_induk || r.kategori || r.nama_produk,
        sku: r.sku,
        skuBahan: r.sku_bahan,
        namaProduk: r.nama_produk,
        kategori: r.kategori,
        varian: r.varian,
        warnaHex: r.warna_hex,
        ukuran: r.ukuran,
        stok: Number(r.stok || 0),
        status: r.status,
        harga: hargaJual,
        hpp: hppValue,
        hargaPotong: Number(r.harga_potong || 0),
        kebutuhanBahan: Array.isArray(parsedKebutuhan) ? parsedKebutuhan : [],
        tanggalUpdate: r.tanggal_update
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  const { skuInduk, sku, skuBahan, namaProduk, kategori, varian, warnaHex, ukuran, stok, status, harga, hpp, hargaPotong } = req.body;
  const hppValue = hpp !== undefined && hpp !== null && Number(hpp) > 0
    ? Number(hpp)
    : Math.round(Number(harga || 0) * 0.70);
  const skuIndukVal = (skuInduk || kategori || namaProduk || '').trim();

  try {
    const info = await db.run(`
      INSERT INTO products (sku_induk, sku, sku_bahan, nama_produk, kategori, varian, warna_hex, ukuran, stok, status, harga, hpp, harga_potong)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [skuIndukVal, sku, skuBahan || null, namaProduk, kategori, varian || null, warnaHex || null, ukuran || null, Number(stok || 0), status || 'Aktif', Number(harga || 0), hppValue, Number(hargaPotong || 0)]);
    res.status(201).json({ id: Number(info.insertId), ...req.body, skuInduk: skuIndukVal, hpp: hppValue, hargaPotong: Number(hargaPotong || 0) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { skuInduk, sku, skuBahan, namaProduk, kategori, varian, warnaHex, ukuran, stok, status, harga, hpp, hargaPotong } = req.body;
  const hppValue = hpp !== undefined && hpp !== null && Number(hpp) > 0
    ? Number(hpp)
    : Math.round(Number(harga || 0) * 0.70);
  const skuIndukVal = (skuInduk || kategori || namaProduk || '').trim();

  try {
    await db.run(`
      UPDATE products
      SET sku_induk = ?, sku = ?, sku_bahan = ?, nama_produk = ?, kategori = ?, varian = ?, warna_hex = ?, ukuran = ?, stok = ?, status = ?, harga = ?, hpp = ?, harga_potong = ?
      WHERE id = ?
    `, [skuIndukVal, sku, skuBahan || null, namaProduk, kategori, varian || null, warnaHex || null, ukuran || null, Number(stok || 0), status || 'Aktif', Number(harga || 0), hppValue, Number(hargaPotong || 0), id]);
    res.json({ success: true, id: Number(id), skuInduk: skuIndukVal, hpp: hppValue, hargaPotong: Number(hargaPotong || 0) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT simpan otomatis resep bahan baku per pcs produk (BOM Template)
router.put('/resep-bahan/:sku', async (req, res) => {
  const { sku } = req.params;
  const { kebutuhanBahan, applyToCategory } = req.body;
  try {
    const jsonStr = typeof kebutuhanBahan === 'string' ? kebutuhanBahan : JSON.stringify(kebutuhanBahan || []);
    await db.run('UPDATE products SET kebutuhan_bahan = ? WHERE sku = ?', [jsonStr, sku]);

    if (applyToCategory) {
      const prod = await db.get('SELECT kategori, sku_induk FROM products WHERE sku = ?', [sku]);
      if (prod && prod.kategori) {
        await db.run('UPDATE products SET kebutuhan_bahan = ? WHERE kategori = ? OR sku_induk = ?', [
          jsonStr,
          prod.kategori,
          prod.sku_induk || prod.kategori,
        ]);
      }
    }

    res.json({ success: true, sku, kebutuhanBahan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
