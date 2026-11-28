import { Router } from 'express';
import db from '../db/database.js';
import { verifyPassword, hashPassword, isHashed } from '../utils/password.js';

const router = Router();

// Tentukan role berdasarkan bagian kerja di tabel employees
function resolveEmployeeRole(emp) {
  const b = String(emp.bagian || '').toLowerCase();
  if (b.includes('cut') || b.includes('pola')) return { role: 'cutting', title: 'Divisi Cutting (Pola & Potong)' };
  if (b.includes('qc') || b.includes('quality') || b.includes('inspeksi')) return { role: 'qc', title: 'Divisi Quality Control (QC)' };
  if (b.includes('finish') || b.includes('pack')) return { role: 'finishing', title: 'Divisi Finishing & Packing' };
  if (b.includes('gudang')) return { role: 'gudang', title: 'Divisi Gudang' };
  return { role: 'jahit', title: `Penjahit (${emp.kategori || 'Borongan'})` };
}

// POST /login - Autentikasi Pengguna
// Urutan: users (admin/gudang) -> tim_finishing -> employees (cutting/qc/jahit)
// Password mendukung hash bcrypt ($2y$/$2a$/$2b$) maupun plain text lama.
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan Password wajib diisi.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const inputPassword = String(password).trim();
  let foundButInactive = null;
  let foundAny = false;

  try {
    // 1. Tabel users (Super Admin, Admin Gudang)
    const user = await db.get(
      'SELECT id, username, nama, email, password, role, status, telepon, keterangan FROM users WHERE LOWER(username) = ?',
      [cleanUsername]
    );
    if (user) {
      foundAny = true;
      if (await verifyPassword(inputPassword, user.password)) {
        if (user.status !== 'Aktif') {
          return res.status(403).json({ error: `Akun "${user.username}" sedang ${user.status}. Hubungi Super Admin.` });
        }
        const { password: _, ...userData } = user;
        return res.json({ success: true, message: 'Login berhasil.', user: userData });
      }
    }

    // 2. Tabel tim_cutting (Tim Cutting & Pola)
    const cut = await db.get(
      `SELECT id, kode_tim, nama_tim, kategori, telepon, status, username, password
       FROM tim_cutting
       WHERE LOWER(COALESCE(username, '')) = ? OR LOWER(kode_tim) = ?
       LIMIT 1`,
      [cleanUsername, cleanUsername]
    );
    if (cut) {
      foundAny = true;
      if (await verifyPassword(inputPassword, cut.password)) {
        if (cut.status !== 'Aktif') {
          foundButInactive = `Akun tim cutting "${cut.nama_tim}" sedang ${cut.status}. Hubungi Admin.`;
        } else {
          return res.json({
            success: true,
            message: 'Login berhasil sebagai Tim Cutting.',
            user: {
              id: cut.id,
              username: (cut.username || cut.kode_tim || cleanUsername).toLowerCase(),
              nama: cut.nama_tim,
              role: 'cutting',
              status: 'Aktif',
              telepon: cut.telepon,
              keterangan: `Tim Cutting (${cut.kategori || 'Internal'})`,
              source: 'tim_cutting'
            }
          });
        }
      }
    }

    // 3. Tabel tim_qc (Tim Quality Control)
    const qc = await db.get(
      `SELECT id, kode_tim, nama_tim, kategori, telepon, status, username, password
       FROM tim_qc
       WHERE LOWER(COALESCE(username, '')) = ? OR LOWER(kode_tim) = ?
       LIMIT 1`,
      [cleanUsername, cleanUsername]
    );
    if (qc) {
      foundAny = true;
      if (await verifyPassword(inputPassword, qc.password)) {
        if (qc.status !== 'Aktif') {
          foundButInactive = `Akun tim QC "${qc.nama_tim}" sedang ${qc.status}. Hubungi Admin.`;
        } else {
          return res.json({
            success: true,
            message: 'Login berhasil sebagai Tim QC.',
            user: {
              id: qc.id,
              username: (qc.username || qc.kode_tim || cleanUsername).toLowerCase(),
              nama: qc.nama_tim,
              role: 'qc',
              status: 'Aktif',
              telepon: qc.telepon,
              keterangan: `Tim Quality Control (${qc.kategori || 'Internal'})`,
              source: 'tim_qc'
            }
          });
        }
      }
    }

    // 4. Tabel tim_finishing (Tim Finishing & Packing)
    const fin = await db.get(
      `SELECT id, kode_tim, nama_tim, kategori, telepon, status, username, password
       FROM tim_finishing
       WHERE LOWER(COALESCE(username, '')) = ? OR LOWER(kode_tim) = ?
       LIMIT 1`,
      [cleanUsername, cleanUsername]
    );
    if (fin) {
      foundAny = true;
      if (await verifyPassword(inputPassword, fin.password)) {
        if (fin.status !== 'Aktif') {
          foundButInactive = `Akun tim finishing "${fin.nama_tim}" sedang ${fin.status}. Hubungi Admin.`;
        } else {
          return res.json({
            success: true,
            message: 'Login berhasil sebagai Tim Finishing.',
            user: {
              id: fin.id,
              username: (fin.username || fin.kode_tim || cleanUsername).toLowerCase(),
              nama: fin.nama_tim,
              role: 'finishing',
              status: 'Aktif',
              telepon: fin.telepon,
              keterangan: `Tim Finishing & Packing (${fin.kategori || 'Internal'})`,
              source: 'tim_finishing'
            }
          });
        }
      }
    }

    // 3. Tabel employees (Cutting, QC, Jahit, dll)
    const emp = await db.get(
      `SELECT id, nik, nama, kategori, bagian, status, telepon, username, password
       FROM employees
       WHERE LOWER(COALESCE(username, '')) = ? OR LOWER(nik) = ?
       LIMIT 1`,
      [cleanUsername, cleanUsername]
    );
    if (emp) {
      foundAny = true;
      if (await verifyPassword(inputPassword, emp.password)) {
        if (emp.status !== 'Aktif') {
          foundButInactive = `Akun karyawan "${emp.nama}" sedang ${emp.status}. Hubungi Admin.`;
        } else {
          const { role, title } = resolveEmployeeRole(emp);
          return res.json({
            success: true,
            message: `Login berhasil sebagai ${title}.`,
            user: {
              id: emp.id,
              username: (emp.username || emp.nik || cleanUsername).toLowerCase(),
              nama: emp.nama,
              role,
              status: 'Aktif',
              telepon: emp.telepon,
              keterangan: `Akun ${title}`,
              source: 'employees'
            }
          });
        }
      }
    }

    if (foundButInactive) return res.status(403).json({ error: foundButInactive });
    if (!foundAny) return res.status(401).json({ error: 'Username tidak ditemukan di database.' });
    return res.status(401).json({ error: 'Password yang Anda masukkan salah.' });
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

// POST create user (password otomatis di-hash bcrypt)
router.post('/', async (req, res) => {
  const { username, nama, email, password, role, status, telepon, keterangan } = req.body;
  if (!username || !nama) {
    return res.status(400).json({ error: 'Username dan Nama Lengkap wajib diisi' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const rawPassword = password && password.trim() ? password.trim() : '123456';
  const userRole = role || 'superadmin';
  const userStatus = status || 'Aktif';

  try {
    const existing = await db.get('SELECT id FROM users WHERE LOWER(username) = ?', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` });
    }

    const storedPassword = isHashed(rawPassword) ? rawPassword : await hashPassword(rawPassword);

    const info = await db.run(
      'INSERT INTO users (username, nama, email, password, role, status, telepon, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [cleanUsername, nama.trim(), email ? email.trim() : null, storedPassword, userRole, userStatus, telepon ? telepon.trim() : null, keterangan ? keterangan.trim() : null]
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

// PUT update user (password baru otomatis di-hash bcrypt)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, nama, email, password, role, status, telepon, keterangan } = req.body;
  if (!nama) {
    return res.status(400).json({ error: 'Nama Lengkap wajib diisi' });
  }

  try {
    const existing = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });

    const cleanUsername = username ? username.trim().toLowerCase() : existing.username;
    if (cleanUsername !== existing.username) {
      const duplicate = await db.get('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?', [cleanUsername, id]);
      if (duplicate) {
        return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` });
      }
    }

    if (password && password.trim()) {
      const raw = password.trim();
      const storedPassword = isHashed(raw) ? raw : await hashPassword(raw);
      await db.run(
        'UPDATE users SET username = ?, nama = ?, email = ?, password = ?, role = ?, status = ?, telepon = ?, keterangan = ? WHERE id = ?',
        [cleanUsername, nama.trim(), email ? email.trim() : null, storedPassword, role || 'superadmin', status || 'Aktif', telepon ? telepon.trim() : null, keterangan ? keterangan.trim() : null, id]
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

    if (target.username === 'admin') {
      return res.status(400).json({ error: 'Akun Super Admin utama ("admin") tidak boleh dihapus demi keamanan sistem.' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: `Akun ${target.username} berhasil dihapus.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /sync-penjahit - Tidak dipakai lagi: penjahit/cutting/qc login langsung dari tabel employees
router.post('/sync-penjahit', (req, res) => {
  res.json({
    success: true,
    message: 'Tidak perlu sinkron. Akun Penjahit, Cutting & QC login langsung dari Master Karyawan; Tim Finishing dari Master Tim Finishing.',
    createdCount: 0
  });
});

export default router;
