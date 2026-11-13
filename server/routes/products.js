import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET all products
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY id ASC').all();
    res.json(rows.map(r => {
      const hargaJual = Number(r.harga || 0);
      const hppValue = r.hpp !== undefined && r.hpp !== null && Number(r.hpp) > 0
        ? Number(r.hpp)
        : Math.round(hargaJual * 0.70); // Estimasi HPP 70% dari harga jual

      return {
        id: r.id,
        sku: r.sku,
        skuBahan: r.sku_bahan,
        namaProduk: r.nama_produk,
        kategori: r.kategori,
        varian: r.varian,
        warnaHex: r.warna_hex,
        ukuran: r.ukuran,
        stok: r.stok,
        status: r.status,
        harga: hargaJual,
        hpp: hppValue,
        hargaPotong: Number(r.harga_potong || 0),
        tanggalUpdate: r.tanggal_update
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', (req, res) => {
  const { sku, skuBahan, namaProduk, kategori, varian, warnaHex, ukuran, stok, status, harga, hpp, hargaPotong } = req.body;
  const hppValue = hpp !== undefined && hpp !== null && Number(hpp) > 0
    ? Number(hpp)
    : Math.round(Number(harga || 0) * 0.70);

  try {
    const stmt = db.prepare(`
      INSERT INTO products (sku, sku_bahan, nama_produk, kategori, varian, warna_hex, ukuran, stok, status, harga, hpp, harga_potong)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(sku, skuBahan || null, namaProduk, kategori, varian || null, warnaHex || null, ukuran || null, stok || 0, status || 'Aktif', harga || 0, hppValue, Number(hargaPotong || 0));
    res.status(201).json({ id: Number(info.lastInsertRowid), ...req.body, hpp: hppValue, hargaPotong: Number(hargaPotong || 0) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { sku, skuBahan, namaProduk, kategori, varian, warnaHex, ukuran, stok, status, harga, hpp, hargaPotong } = req.body;
  const hppValue = hpp !== undefined && hpp !== null && Number(hpp) > 0
    ? Number(hpp)
    : Math.round(Number(harga || 0) * 0.70);

  try {
    db.prepare(`
      UPDATE products
      SET sku = ?, sku_bahan = ?, nama_produk = ?, kategori = ?, varian = ?, warna_hex = ?, ukuran = ?, stok = ?, status = ?, harga = ?, hpp = ?, harga_potong = ?, tanggal_update = datetime('now', 'localtime')
      WHERE id = ?
    `).run(sku, skuBahan || null, namaProduk, kategori, varian || null, warnaHex || null, ukuran || null, stok || 0, status || 'Aktif', harga || 0, hppValue, Number(hargaPotong || 0), id);
    res.json({ success: true, id: Number(id), hpp: hppValue, hargaPotong: Number(hargaPotong || 0) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

