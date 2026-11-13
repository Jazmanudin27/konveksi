import { useState, useMemo } from 'react';
import { initialCategories } from '../data/mockCategories';

export function useCategories() {
  const [categories, setCategories] = useState(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modals
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          cat.kode.toLowerCase().includes(q) ||
          cat.nama.toLowerCase().includes(q) ||
          cat.deskripsi.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus && cat.status !== filterStatus) return false;
      return true;
    });
  }, [categories, searchTerm, filterStatus]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalMode('create');
  };

  const handleEdit = (cat) => {
    setSelectedCategory(cat);
    setModalMode('edit');
  };

  const handleSave = (formData) => {
    if (modalMode === 'edit' && selectedCategory) {
      setCategories((prev) =>
        prev.map((c) => (c.id === selectedCategory.id ? { ...formData, id: c.id } : c))
      );
      showToast('Kategori produk berhasil diperbarui.');
    } else {
      const newCat = {
        ...formData,
        id: Date.now(),
        totalProduk: 0,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setCategories((prev) => [newCat, ...prev]);
      showToast('Kategori baru berhasil ditambahkan.');
    }
    setModalMode(null);
    setSelectedCategory(null);
  };

  const handleDeleteConfirm = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteCategory(null);
    showToast('Kategori produk berhasil dihapus.');
  };

  return {
    categories,
    filteredCategories,
    filters: {
      searchTerm,
      setSearchTerm,
      filterStatus,
      setFilterStatus,
    },
    modals: {
      modalMode,
      setModalMode,
      selectedCategory,
      deleteCategory,
      setDeleteCategory,
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

