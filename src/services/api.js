const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:3001/api' : '/api');

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      let errorMsg = `API Error: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.error) {
          errorMsg = errorData.error;
        }
      } catch (_) {
        // Abaikan jika bukan json
      }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Gagal fetch ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Bahan
  getBahan: () => request('/bahan'),
  createBahan: (data) => request('/bahan', { method: 'POST', body: JSON.stringify(data) }),
  updateBahan: (id, data) => request(`/bahan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBahan: (id) => request(`/bahan/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: () => request('/products'),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  saveResepBahan: (sku, kebutuhanBahan, applyToCategory = true) =>
    request(`/products/resep-bahan/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      body: JSON.stringify({ kebutuhanBahan, applyToCategory }),
    }),

  // Employees
  getEmployees: () => request('/employees'),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Tahapan (Deprecated - Safe Empty Fallback)
  getTahapan: () => Promise.resolve([]),

  // Jasa
  getJasa: () => request('/jasa'),
  createJasa: (data) => request('/jasa', { method: 'POST', body: JSON.stringify(data) }),
  updateJasa: (id, data) => request(`/jasa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJasa: (id) => request(`/jasa/${id}`, { method: 'DELETE' }),

  // Mutasi Bahan
  getMutasiBahan: () => request('/mutasi-bahan'),
  createMutasiBahan: (data) => request('/mutasi-bahan', { method: 'POST', body: JSON.stringify(data) }),
  deleteMutasiBahan: (id) => request(`/mutasi-bahan/${id}`, { method: 'DELETE' }),
  clearAllMutasiBahan: () => request('/mutasi-bahan/all', { method: 'DELETE' }),

  // Antrean Produksi (Tahap 1 SOP)
  getAntrean: () => request('/antrean'),
  getAntreanById: (id) => request(`/antrean/${id}`),
  trackOrder: (noAntrian) => request(`/antrean/track/${encodeURIComponent(noAntrian)}`),
  createAntrean: (data) => request('/antrean', { method: 'POST', body: JSON.stringify(data) }),
  updateAntrean: (id, data) => request(`/antrean/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAntrean: (id) => request(`/antrean/${id}`, { method: 'DELETE' }),
  serahCutting: (data) => request('/antrean/serah-cutting', { method: 'POST', body: JSON.stringify(data) }),
  serahJahit: (data) => request('/antrean/serah-jahit', { method: 'POST', body: JSON.stringify(data) }),
  serahQc: (data) => request('/antrean/serah-qc', { method: 'POST', body: JSON.stringify(data) }),
  serahFinishing: (data) => request('/antrean/serah-finishing', { method: 'POST', body: JSON.stringify(data) }),
  selesaiFinishing: (data) => request('/antrean/selesai-finishing', { method: 'POST', body: JSON.stringify(data) }),
  rollbackAntrean: (id) => request('/antrean/rollback', { method: 'POST', body: JSON.stringify({ id }) }),
  getSumberPermintaan: () => request('/antrean/sumber-permintaan'),
  addSumberPermintaan: (nama) => request('/antrean/sumber-permintaan', { method: 'POST', body: JSON.stringify({ nama }) }),
  deleteSumberPermintaan: (nama) => request(`/antrean/sumber-permintaan/${encodeURIComponent(nama)}`, { method: 'DELETE' }),

  // Mutasi Gudang Jadi (Finished Goods)
  getMutasiGudangJadi: () => request('/mutasi-gudang-jadi'),
  createMutasiGudangJadi: (data) => request('/mutasi-gudang-jadi', { method: 'POST', body: JSON.stringify(data) }),
  approveMutasiGudangJadi: (data) => request('/mutasi-gudang-jadi/approve', { method: 'POST', body: JSON.stringify(data) }),
  rejectMutasiGudangJadi: (data) => request('/mutasi-gudang-jadi/reject', { method: 'POST', body: JSON.stringify(data) }),
  deleteMutasiGudangJadi: (id) => request(`/mutasi-gudang-jadi/${id}`, { method: 'DELETE' }),

  // Master Ukuran / Sizes (Dinamis Tambah, Edit, Hapus)
  getSizes: () => request('/sizes'),
  createSize: (data) => request('/sizes', { method: 'POST', body: JSON.stringify(data) }),
  updateSize: (id, data) => request(`/sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSize: (id) => request(`/sizes/${id}`, { method: 'DELETE' }),

  // Penjahit (Terpisah dari Tim Finishing)
  getPenjahit: () => request('/penjahit'),
  createPenjahit: (data) => request('/penjahit', { method: 'POST', body: JSON.stringify(data) }),
  updatePenjahit: (id, data) => request(`/penjahit/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePenjahit: (id) => request(`/penjahit/${id}`, { method: 'DELETE' }),

  // Tim Finishing & Packing (Terpisah Murni dari Penjahit)
  getTimFinishing: () => request('/tim-finishing'),
  createTimFinishing: (data) => request('/tim-finishing', { method: 'POST', body: JSON.stringify(data) }),
  updateTimFinishing: (id, data) => request(`/tim-finishing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimFinishing: (id) => request(`/tim-finishing/${id}`, { method: 'DELETE' }),

  // Pembayaran Upah Pemotong, Penjahit, QC & Finishing
  getPembayaranUpah: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/pembayaran-upah${q ? `?${q}` : ''}`);
  },
  getPembayaranUpahRekap: () => request('/pembayaran-upah/rekap'),
  bayarUpah: (data) => request('/pembayaran-upah/bayar', { method: 'POST', body: JSON.stringify(data) }),
  batalBayarUpah: (id) => request('/pembayaran-upah/batal-bayar', { method: 'POST', body: JSON.stringify({ id }) }),
  syncUpahFromAntrean: () => request('/pembayaran-upah/sync-from-antrean', { method: 'POST' }),

  // Kasbon & Pinjaman Karyawan / Penjahit (Potong Otomatis Saat Upah)
  getKasbon: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/kasbon${q ? `?${q}` : ''}`);
  },
  getKasbonRekap: () => request('/kasbon/rekap'),
  getKasbonSaldo: (petugas) => request(`/kasbon/saldo/${encodeURIComponent(petugas)}`),
  createKasbon: (data) => request('/kasbon', { method: 'POST', body: JSON.stringify(data) }),
  updateKasbon: (id, data) => request(`/kasbon/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKasbon: (id) => request(`/kasbon/${id}`, { method: 'DELETE' }),
  getKasbonRiwayat: (id) => request(`/kasbon/${id}/riwayat`),

  // Users & Role Management (Pengaturan Akun & Login)
  login: (data) => request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => request('/users'),
  getUserById: (id) => request(`/users/${id}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  syncPenjahitUsers: () => request('/users/sync-penjahit', { method: 'POST' }),
};


