import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import Produk from './views/desktop/Produk';
import Kategori from './views/desktop/Kategori';
import Karyawan from './views/desktop/Karyawan';
import Tahapan from './views/desktop/Tahapan';
import Jasa from './views/desktop/Jasa';
import Bahan from './views/desktop/Bahan';
import MutasiBahan from './views/desktop/MutasiBahan';
import MutasiGudangJadi from './views/desktop/MutasiGudangJadi';
import Antrean from './views/desktop/Antrean';
import LaporanStokGudang from './views/desktop/LaporanStokGudang';
import DashboardWelcome from './views/desktop/DashboardWelcome';
import { api } from './services/api';
import { HARGA_POTONG_MAP } from './constants/appConstants';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  // Daftar menu navigasi yang valid
  const VALID_MENUS = [
    'dashboard',
    'products',
    'categories',
    'employees',
    'jasa',
    'bahan',
    'mutasi-bahan',
    'mutasi-gudang-jadi',
    'antrean',
    'laporan-stok-gudang',
    'tahapan',
  ];

  // Ambil menu aktif terakhir dari URL hash atau localStorage agar tidak reset saat refresh
  const getInitialMenu = () => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_MENUS.includes(hash)) return hash;
      const saved = localStorage.getItem('konveksi_active_menu');
      if (saved && VALID_MENUS.includes(saved)) return saved;
    } catch (_) {}
    return 'dashboard';
  };

  const [activeMenu, setActiveMenuState] = useState(getInitialMenu);

  const setActiveMenu = (menuKey) => {
    if (!VALID_MENUS.includes(menuKey)) return;
    setActiveMenuState(menuKey);
    try {
      localStorage.setItem('konveksi_active_menu', menuKey);
      if (window.location.hash !== `#${menuKey}`) {
        window.location.hash = menuKey;
      }
    } catch (_) {}
  };

  // Sinkronisasi event navigasi URL Hash & tombol Back/Forward browser
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_MENUS.includes(hash)) {
        setActiveMenuState(hash);
        try {
          localStorage.setItem('konveksi_active_menu', hash);
        } catch (_) {}
      }
    };

    window.addEventListener('hashchange', onHashChange);

    try {
      if (!window.location.hash && activeMenu) {
        window.history.replaceState(null, '', `#${activeMenu}`);
      }
      localStorage.setItem('konveksi_active_menu', activeMenu);
    } catch (_) {}

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Central Shared State Relasi Produk & Kategori & Karyawan & Master Baru & Mutasi & Antrean
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jasa, setJasa] = useState([]);
  const [bahan, setBahan] = useState([]);
  const [mutasiList, setMutasiList] = useState([]);
  const [mutasiGudangJadiList, setMutasiGudangJadiList] = useState([]);
  const [antreanList, setAntreanList] = useState([]);

  // Ambil data real-time dari SQLite Database Backend saat aplikasi dibuka
  useEffect(() => {
    let isMounted = true;
    async function fetchFromDatabase() {
      try {
        const [
          cats,
          bhns,
          prds,
          emps,
          jsas,
          muts,
          mgj,
          ants,
        ] = await Promise.all([
          api.getCategories().catch(() => null),
          api.getBahan().catch(() => null),
          api.getProducts().catch(() => null),
          api.getEmployees().catch(() => null),
          api.getJasa().catch(() => null),
          api.getMutasiBahan().catch(() => null),
          api.getMutasiGudangJadi().catch(() => null),
          api.getAntrean().catch(() => null),
        ]);

        if (!isMounted) return;

        let hasData = false;
        if (Array.isArray(cats)) {
          const mergedCats = cats.map((c) => ({
            ...c,
            hargaPotong:
              c.hargaPotong !== undefined && c.hargaPotong !== null && Number(c.hargaPotong) > 0
                ? Number(c.hargaPotong)
                : (HARGA_POTONG_MAP[c.nama?.toUpperCase()] || 0),
          }));
          setCategories(mergedCats);
          hasData = true;
        }
        if (Array.isArray(bhns)) {
          setBahan(bhns);
          hasData = true;
        }
        if (Array.isArray(prds)) {
          const mergedPrds = prds.map((p) => {
            const catPotong = HARGA_POTONG_MAP[p.kategori?.toUpperCase()] || 0;
            return {
              ...p,
              hargaPotong:
                p.hargaPotong !== undefined && p.hargaPotong !== null && Number(p.hargaPotong) > 0
                  ? Number(p.hargaPotong)
                  : catPotong,
            };
          });
          setProducts(mergedPrds);
          hasData = true;
        }
        if (Array.isArray(emps)) { setEmployees(emps); hasData = true; }
        if (Array.isArray(jsas)) { setJasa(jsas); hasData = true; }
        if (Array.isArray(muts)) {
          setMutasiList(muts);
          hasData = true;
        }
        if (Array.isArray(mgj)) { setMutasiGudangJadiList(mgj); hasData = true; }
        if (Array.isArray(ants)) {
          setAntreanList(ants);
          hasData = true;
        }

        setDbConnected(hasData);
        if (hasData) {
          console.log('✅ Terhubung ke database SQLite (konveksi.db)');
        }
      } catch (err) {
        console.warn('Backend SQLite belum aktif / offline, menggunakan mock lokal:', err);
        if (isMounted) setDbConnected(false);
      }
    }

    fetchFromDatabase();
    return () => {
      isMounted = false;
    };
  }, []);


  // Tambah Kategori Baru (State + API SQLite)
  const handleAddCategory = (newCat) => {
    setCategories((prev) => [newCat, ...prev]);
    api.createCategory(newCat).catch((e) => console.warn('Gagal simpan kategori ke API SQLite:', e));
  };

  // Update Kategori & Sinkronkan Nama Kategori ke Produk yang Berelasi (State + API SQLite)
  const handleUpdateCategory = (updatedCat, oldName) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? { ...updatedCat, id: c.id } : c))
    );
    api.updateCategory(updatedCat.id, updatedCat).catch((e) => console.warn('Gagal update kategori ke API SQLite:', e));

    if (oldName && oldName !== updatedCat.nama) {
      setProducts((prev) =>
        prev.map((p) => (p.kategori === oldName ? { ...p, kategori: updatedCat.nama } : p))
      );
    }
  };

  // Hapus Kategori (State + API SQLite)
  const handleDeleteCategory = (catId, catName) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    api.deleteCategory(catId).catch((e) => console.warn('Gagal hapus kategori dari API SQLite:', e));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#edf1f7] font-sans text-slate-800">
      {/* Sidebar Drawer Navigasi (Slide-over, Fullscreen default) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeMenu={activeMenu}
        onSelectMenu={(menuKey) => setActiveMenu(menuKey)}
      />

      {/* Main Content Area (Area Scroll Mandiri) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          dbConnected={dbConnected}
        />

        <main className="flex-1 p-2.5 sm:p-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {activeMenu === 'dashboard' && (
            <DashboardWelcome
              products={products}
              categories={categories}
              employees={employees}
              bahan={bahan}
              antreanList={antreanList}
              mutasiList={mutasiList}
              mutasiGudangJadiList={mutasiGudangJadiList}
              onNavigate={(menu) => setActiveMenu(menu)}
            />
          )}
          {activeMenu === 'products' && (
            <Produk
              products={products}
              setProducts={setProducts}
              categories={categories}
            />
          )}
          {activeMenu === 'categories' && (
            <Kategori
              categories={categories}
              products={products}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
          {activeMenu === 'employees' && (
            <Karyawan
              employees={employees}
              setEmployees={setEmployees}
            />
          )}
          {activeMenu === 'tahapan' && (
            <Tahapan onRedirect={setActiveMenu} />
          )}
          {activeMenu === 'jasa' && (
            <Jasa
              jasa={jasa}
              setJasa={setJasa}
            />
          )}
          {activeMenu === 'bahan' && (
            <Bahan
              bahan={bahan}
              setBahan={setBahan}
            />
          )}
          {activeMenu === 'mutasi-bahan' && (
            <MutasiBahan
              mutasiList={mutasiList}
              setMutasiList={setMutasiList}
              bahanList={bahan}
              setBahanList={setBahan}
            />
          )}
          {activeMenu === 'mutasi-gudang-jadi' && (
            <MutasiGudangJadi
              mutasiList={mutasiGudangJadiList}
              setMutasiList={setMutasiGudangJadiList}
              products={products}
            />
          )}
          {activeMenu === 'antrean' && (
            <Antrean
              antreanList={antreanList}
              setAntreanList={setAntreanList}
              products={products}
              employees={employees}
              jasa={jasa}
            />
          )}
          {activeMenu === 'laporan-stok-gudang' && (
            <LaporanStokGudang
              products={products}
              mutasiGudangJadiList={mutasiGudangJadiList}
              categories={categories}
            />
          )}
        </main>
      </div>
    </div>
  );
}
