import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;

export function isHashed(value) {
  return BCRYPT_PREFIX.test(String(value || ''));
}

// Hash password baru (bcrypt, cost 10)
export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), 10);
}

// Verifikasi password: dukung hash bcrypt ($2y$ PHP / $2a$ / $2b$) & plain text lama
export async function verifyPassword(input, stored) {
  const plain = String(input ?? '');
  const saved = String(stored ?? '').trim();
  if (!saved) return false;

  if (isHashed(saved)) {
    // $2y$ (PHP) identik algoritmanya dengan $2b$
    const normalized = saved.replace(/^\$2y\$/, '$2b$');
    try {
      return await bcrypt.compare(plain, normalized);
    } catch (_) {
      return false;
    }
  }
  return plain === saved;
}
