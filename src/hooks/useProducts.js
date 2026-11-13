import { useState, useMemo } from 'react';
import { initialProducts } from '../data/mockProducts';

/**
 * Custom hook sentral manajemen data & filter produk
 */
export function useProducts() {
  const [products, setProducts] = useState(initialProducts);

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBahan, setFilterBahan] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUkuran, setFilterUkuran] = useState('');

  // Active Modals
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Hitung jumlah per tab filter
  const counts = useMemo(() => {
    return {
      all: products.length,
      kaos: products.filter((p) => p.kategori === 'Kaos / T-Shirt').length,
      kemeja: products.filter((p) => p.kategori === 'Kemeja & PDL').length,
      jaket: products.filter((p) => p.kategori === 'Jaket & Hoodie').length,
      sample: products.filter((p) => p.status === 'Sample' || p.status === 'Habis').length,
    };
  }, [products]);

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // 1. Tab kategori
      if (activeTab === 'Sample') {
        if (item.status !== 'Sample' && item.status !== 'Habis') return false;
      } else if (activeTab !== 'ALL' && item.kategori !== activeTab) {
        return false;
      }

      // 2. Search keyword (SKU / Nama / Bahan / Varian)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          item.sku.toLowerCase().includes(q) ||
          item.skuBahan.toLowerCase().includes(q) ||
          item.namaProduk.toLowerCase().includes(q) ||
          item.varian.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 3. Dropdown Bahan
      if (filterBahan && !item.skuBahan.includes(filterBahan)) return false;

      // 4. Dropdown Kategori
      if (filterKategori && item.kategori !== filterKategori) return false;

      // 5. Dropdown Status
      if (filterStatus && item.status !== filterStatus) return false;

      // 6. Dropdown Ukuran
      if (filterUkuran) {
        const hasSize = Array.isArray(item.ukuran)
          ? item.ukuran.includes(filterUkuran)
          : item.ukuran === filterUkuran;
        if (!hasSize) return false;
      }

      return true;
    });
  }, [products, activeTab, searchTerm, filterBahan, filterKategori, filterStatus, filterUkuran]);

  // CRUD Actions
  const handleCreate = () => {
    setSelectedProduct(null);
    setModalMode('create');
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setModalMode('edit');
  };

  const handleSave = (formData) => {
    if (modalMode === 'edit' && selectedProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...formData, id: p.id } : p))
      );
      showToast('Perubahan data produk berhasil disimpan.');
    } else {
      const newEntry = {
        ...formData,
        id: Date.now(),
      };
      setProducts((prev) => [newEntry, ...prev]);
      showToast('Produk baru berhasil ditambahkan.');
    }
    setModalMode(null);
    setSelectedProduct(null);
  };

  const handleDeleteConfirm = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteProduct(null);
    showToast('Produk berhasil dihapus dari sistem.');
  };

  return {
    products,
    filteredProducts,
    counts,
    filters: {
      activeTab,
      setActiveTab,
      searchTerm,
      setSearchTerm,
      filterBahan,
      setFilterBahan,
      filterKategori,
      setFilterKategori,
      filterStatus,
      setFilterStatus,
      filterUkuran,
      setFilterUkuran,
    },
    modals: {
      modalMode,
      setModalMode,
      selectedProduct,
      viewProduct,
      setViewProduct,
      deleteProduct,
      setDeleteProduct,
    },
    toast,
    showToast,
    actions: {
      handleCreate,
      handleEdit,
      handleSave,
      handleDeleteConfirm,
    },
  };
}

