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
    const user = await db.get(
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

export default router;

