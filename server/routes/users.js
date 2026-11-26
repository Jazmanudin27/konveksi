import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// POST /login - Autentikasi Pengguna
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan Password wajib diisi.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const inputPassword = String(password).trim();

  try {
    // 1. Cek dari tabel tim_finishing (Master Tim Finishing & Packing)
    const fin = await db.get(
      `SELECT id, kode_tim, nama_tim, kategori, spesialisasi, kapasitas_harian, telepon, status, username, password 
       FROM tim_finishing 
       WHERE (LOWER(COALESCE(username, '')) = ? OR LOWER(kode_tim) = ? OR LOWER(REPLACE(nama_tim, ' ', '')) = ? OR LOWER(SUBSTRING_INDEX(nama_tim, ' ', 1)) = ?)`,
      [cleanUsername, cleanUsername, cleanUsername, cleanUsername]
    );

    if (fin) {
      if (fin.status !== 'Aktif') {
        return res.status(403).json({ error: `Akun tim finishing "${fin.nama_tim}" sedang ${fin.status}. Hubungi Admin.` });
      }

      const expectedPass = String(fin.password || '123456').trim();
      if (inputPassword !== expectedPass) {
        return res.status(401).json({ error: 'Password Tim Finishing salah.' });
      }

      const finishingUsername = (fin.username || fin.kode_tim || cleanUsername).toLowerCase().replace(/[^a-z0-9_-]/g, '');

      // Sinkronkan ke tabel users role 'finishing'
      try {
        await db.run(
          `INSERT INTO users (username, nama, password, role, status, telepon, keterangan) 
           VALUES (?, ?, ?, 'finishing', 'Aktif', ?, ?)
           ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password), role = 'finishing', status = 'Aktif'`,
          [finishingUsername, fin.nama_tim, expectedPass, fin.telepon || null, `Tim Finishing & Packing (${fin.kategori || 'Internal'})`]
        );
      } catch (_) {}

      return res.json({
        success: true,
        message: 'Login berhasil sebagai Tim Finishing.',
        user: {
          id: fin.id,
          username: finishingUsername,
          nama: fin.nama_tim,
          role: 'finishing',
          status: 'Aktif',
          telepon: fin.telepon,
          keterangan: `Tim Finishing & Packing (${fin.kategori || 'Internal'})`
        }
      });
    }

    // 2. Cek dari tabel employees (Master Karyawan: Cutting, QC, Jahit, dll)
    const emp = await db.get(
      `SELECT id, nik, nama, kategori, bagian, status, telepon, username, password 
       FROM employees 
       WHERE (LOWER(COALESCE(username, '')) = ? OR LOWER(nik) = ? OR LOWER(REPLACE(nama, ' ', '')) = ? OR LOWER(SUBSTRING_INDEX(nama, ' ', 1)) = ?)`,
      [cleanUsername, cleanUsername, cleanUsername, cleanUsername]
    );

    if (emp) {
      if (emp.status !== 'Aktif') {
        return res.status(403).json({ error: `Akun karyawan "${emp.nama}" sedang ${emp.status}. Hubungi Admin.` });
      }

      const expectedPass = String(emp.password || '123456').trim();
      if (inputPassword !== expectedPass) {
        return res.status(401).json({ error: 'Password karyawan salah.' });
      }

      // Tentukan role berdasarkan bagian kerja di tabel employees
      const b = String(emp.bagian || '').toLowerCase();
      let empRole = 'jahit';
      let titleBagian = 'Penjahit';

      if (b.includes('cut') || b.includes('pola')) {
        empRole = 'cutting';
        titleBagian = 'Divisi Cutting (Pola & Potong)';
      } else if (b.includes('qc') || b.includes('quality') || b.includes('inspeksi')) {
        empRole = 'qc';
        titleBagian = 'Divisi Quality Control (QC)';
      } else if (b.includes('finish') || b.includes('pack')) {
        empRole = 'finishing';
        titleBagian = 'Divisi Finishing & Packing';
      } else if (b.includes('gudang')) {
        empRole = 'gudang';
        titleBagian = 'Divisi Gudang';
      } else {
        empRole = 'jahit';
        titleBagian = `Penjahit (${emp.kategori || 'Borongan'})`;
      }

      const empUsername = (emp.username || emp.nik || cleanUsername).toLowerCase().replace(/[^a-z0-9_-]/g, '');

      // Sinkronkan ke tabel users
      try {
        await db.run(
          `INSERT INTO users (username, nama, password, role, status, telepon, keterangan) 
           VALUES (?, ?, ?, ?, 'Aktif', ?, ?)
           ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password), role = VALUES(role), status = 'Aktif'`,
          [empUsername, emp.nama, expectedPass, empRole, emp.telepon || null, `Akun ${titleBagian}`]
        );
      } catch (_) {}

      return res.json({
        success: true,
        message: `Login berhasil sebagai ${titleBagian}.`,
        user: {
          id: emp.id,
          username: empUsername,
          nama: emp.nama,
          role: empRole,
          status: 'Aktif',
          telepon: emp.telepon,
          keterangan: `Akun ${titleBagian}`
        }
      });
    }

    // 3. Fallback: Autentikasi dari tabel users (Khusus Super Admin atau Akun Sistem)
    let user = await db.get(
      'SELECT id, username, nama, email, password, role, status, telepon, keterangan FROM users WHERE LOWER(username) = ?',
      [cleanUsername]
    );

    if (!user) {
      return res.status(401).json({ error: 'Username tidak ditemukan di database.' });
    }

    if (user.status !== 'Aktif') {
      return res.status(403).json({ error: `Akun "${user.username}" sedang ${user.status}. Hubungi Super Admin.` });
    }

    if (user.password !== inputPassword) {
      return res.status(401).json({ error: 'Password yang Anda masukkan salah.' });
    }

    // Login sukses: kembalikan data profil tanpa password
    const { password: _, ...userData } = user;
    res.json({
      success: true,
      message: 'Login berhasil.',
      user: userData
    });
  } catch (err) {
    console.error('❌ Error POST /api/users/login:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat login: ' + err.message });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT id, username, nama, email, role, status, telepon, keterangan, created_at, updated_at FROM users ORDER BY id ASC');
    res.json(rows.map(r => ({
      id: r.id,
      username: r.username,
      nama: r.nama,
      email: r.email,
      role: r.role,
      status: r.status,
      telepon: r.telepon,
      keterangan: r.keterangan,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await db.get('SELECT id, username, nama, email, role, status, telepon, keterangan, created_at, updated_at FROM users WHERE id = ?', [id]);
    if (!r) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({
      id: r.id,
      username: r.username,
      nama: r.nama,
      email: r.email,
      role: r.role,
      status: r.status,
      telepon: r.telepon,
      keterangan: r.keterangan,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { username, nama, email, password, role, status, telepon, keterangan } = req.body;
  if (!username || !nama) {
    return res.status(400).json({ error: 'Username dan Nama Lengkap wajib diisi' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const userPassword = password && password.trim() ? password.trim() : '123456';
  const userRole = role || 'superadmin';
  const userStatus = status || 'Aktif';

  try {
    // Cek username unik
    const existing = await db.get('SELECT id FROM users WHERE LOWER(username) = ?', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` });
    }

    const info = await db.run(
      'INSERT INTO users (username, nama, email, password, role, status, telepon, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [cleanUsername, nama.trim(), email ? email.trim() : null, userPassword, userRole, userStatus, telepon ? telepon.trim() : null, keterangan ? keterangan.trim() : null]
    );

    res.status(201).json({
      id: Number(info.insertId),
      username: cleanUsername,
      nama: nama.trim(),
      email: email ? email.trim() : null,
      role: userRole,
      status: userStatus,
      telepon: telepon ? telepon.trim() : null,
      keterangan: keterangan ? keterangan.trim() : null,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, nama, email, password, role, status, telepon, keterangan } = req.body;
  if (!nama) {
    return res.status(400).json({ error: 'Nama Lengkap wajib diisi' });
  }

  try {
    const existing = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });

    // Jika username diubah, pastikan tidak bentrok dengan user lain
    const cleanUsername = username ? username.trim().toLowerCase() : existing.username;
    if (cleanUsername !== existing.username) {
      const duplicate = await db.get('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?', [cleanUsername, id]);
      if (duplicate) {
        return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` });
      }
    }

    if (password && password.trim()) {
      await db.run(
        'UPDATE users SET username = ?, nama = ?, email = ?, password = ?, role = ?, status = ?, telepon = ?, keterangan = ? WHERE id = ?',
        [cleanUsername, nama.trim(), email ? email.trim() : null, password.trim(), role || 'superadmin', status || 'Aktif', telepon ? telepon.trim() : null, keterangan ? keterangan.trim() : null, id]
      );
    } else {
      await db.run(
        'UPDATE users SET username = ?, nama = ?, email = ?, role = ?, status = ?, telepon = ?, keterangan = ? WHERE id = ?',
        [cleanUsername, nama.trim(), email ? email.trim() : null, role || 'superadmin', status || 'Aktif', telepon ? telepon.trim() : null, keterangan ? keterangan.trim() : null, id]
      );
    }

    res.json({
      success: true,
      id: Number(id),
      username: cleanUsername,
      nama: nama.trim(),
      email: email ? email.trim() : null,
      role: role || 'superadmin',
      status: status || 'Aktif',
      telepon: telepon ? telepon.trim() : null,
      keterangan: keterangan ? keterangan.trim() : null
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const target = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan' });

    // Proteksi akun admin utama
    if (target.username === 'admin') {
      return res.status(400).json({ error: 'Akun Super Admin utama ("admin") tidak boleh dihapus demi keamanan sistem.' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: `Akun ${target.username} berhasil dihapus.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /sync-penjahit - Sinkronisasi otomatis semua penjahit di employees menjadi user login
router.post('/sync-penjahit', async (req, res) => {
  try {
    const penjahits = await db.all(
      `SELECT id, nik, nama, kategori, bagian, status, telepon 
       FROM employees 
       WHERE LOWER(bagian) LIKE '%jahit%' OR LOWER(kategori) LIKE '%borongan%' OR LOWER(bagian) LIKE '%sew%'`
    );

    let createdCount = 0;
    for (const p of penjahits) {
      const rawUser = (p.nik || p.nama.replace(/\s+/g, '')).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const username = rawUser || `penjahit_${p.id}`;
      
      const existing = await db.get('SELECT id FROM users WHERE LOWER(username) = ?', [username]);
      if (!existing) {
        await db.run(
          `INSERT INTO users (username, nama, password, role, status, telepon, keterangan)
           VALUES (?, ?, '123456', 'jahit', ?, ?, ?)`,
          [username, p.nama, p.status || 'Aktif', p.telepon || null, `Akun Penjahit ${p.kategori || 'Borongan'}`]
        );
        createdCount++;
      }
    }

    res.json({
      success: true,
      message: `Sinkronisasi selesai. ${createdCount} akun penjahit baru dibuat (Password default: 123456).`,
      totalPenjahit: penjahits.length,
      createdCount
    });
  } catch (err) {
    console.error('❌ Error /sync-penjahit:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

