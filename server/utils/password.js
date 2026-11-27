// Helper password: dukung hash bcrypt ($2y$ PHP / $2a$ / $2b$) & plain text lama.
// bcryptjs dimuat secara dinamis agar server TIDAK crash jika paket belum ter-install.
let bcryptPromise = null;
async function getBcrypt() {
  if (!bcryptPromise) {
    bcryptPromise = import('bcryptjs')
      .then((m) => m.default || m)
      .catch((err) => {
        console.error('⚠️ Paket "bcryptjs" belum ter-install. Jalankan: npm install bcryptjs', err.message);
        return null;
      });
  }
  return bcryptPromise;
}

const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;

export function isHashed(value) {
  return BCRYPT_PREFIX.test(String(value || ''));
}

// Hash password baru (bcrypt, cost 10). Fallback plain jika bcryptjs tidak tersedia.
export async function hashPassword(plain) {
  const bcrypt = await getBcrypt();
  if (!bcrypt) return String(plain);
  return bcrypt.hash(String(plain), 10);
}

export async function verifyPassword(input, stored) {
  const plain = String(input ?? '');
  const saved = String(stored ?? '').trim();
  if (!saved) return false;

  if (isHashed(saved)) {
    const bcrypt = await getBcrypt();
    if (!bcrypt) return false;
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
