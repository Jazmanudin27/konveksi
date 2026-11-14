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
  deleteMutasiGudangJadi: (id) => request(`/mutasi-gudang-jadi/${id}`, { method: 'DELETE' }),
};


