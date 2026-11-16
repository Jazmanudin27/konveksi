import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import Produk from './views/desktop/Produk';
import Kategori from './views/desktop/Kategori';
import Karyawan from './views/desktop/Karyawan';
import Bahan from './views/desktop/Bahan';
import MutasiBahan from './views/desktop/MutasiBahan';
import MutasiGudangJadi from './views/desktop/MutasiGudangJadi';
import Antrean from './views/desktop/Antrean';
import LaporanStokGudang from './views/desktop/LaporanStokGudang';
import PembayaranUpah from './views/desktop/PembayaranUpah';
import Penjahit from './views/desktop/Penjahit';
import TimFinishing from './views/desktop/TimFinishing';
import DashboardWelcome from './views/desktop/DashboardWelcome';
import MobileApp from './views/mobile/MobileApp';
import CustomerTracking from './views/tracking/CustomerTracking';
import { api } from './services/api';
import { HARGA_POTONG_MAP } from './constants/appConstants';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Mode Tampilan: Mobile vs Desktop (Auto-detect layar smartphone < 768px atau pilihan manual)
  const [isMobileView, setIsMobileView] = useState(() => {
    try {
      const saved = localStorage.getItem('konveksi_view_mode');
      if (saved) return saved === 'mobile';
      return typeof window !== 'undefined' && window.innerWidth < 768;
    } catch (_) {
      return false;
    }
  });

  const toggleViewMode = (mobile) => {
    setIsMobileView(mobile);
    try {
      localStorage.setItem('konveksi_view_mode', mobile ? 'mobile' : 'desktop');
    } catch (_) {}
    // Sinkronisasi data real-time saat berpindah antara mobile & desktop
    api.getAntrean().then((fresh) => {
      if (Array.isArray(fresh)) setAntreanList(fresh);
    }).catch(() => {});
  };

  // Daftar menu navigasi yang valid
  const VALID_MENUS = [
    'dashboard',
    'products',
    'categories',
    'penjahit',
    'tim-finishing',
    'employees',
    'bahan',
    'mutasi-bahan',
    'mutasi-gudang-jadi',
    'antrean',
    'laporan-stok-gudang',
    'pembayaran-upah',
  ];

  // Ambil menu aktif terakhir dari URL hash atau localStorage agar tidak reset saat refresh
  const getTrackingInfoFromHash = () => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash.startsWith('track/') || hash.startsWith('tracking/')) {
        const parts = hash.split('/');
        return { isTracking: true, noAntrian: decodeURIComponent(parts.slice(1).join('/') || '') };
      }
      if (hash === 'track' || hash === 'tracking') {
        const urlParams = new URLSearchParams(window.location.search);
        return { isTracking: true, noAntrian: urlParams.get('no') || '' };
      }
    } catch (_) {}
    return { isTracking: false, noAntrian: '' };
  };

  const [trackingInfo, setTrackingInfo] = useState(getTrackingInfoFromHash);

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
      const track = getTrackingInfoFromHash();
      setTrackingInfo(track);
      if (track.isTracking) return;

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
      if (!window.location.hash && !trackingInfo.isTracking && activeMenu) {
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

    // Auto-sync polling setiap 6 detik & saat tab/jendela aktif agar Mobile & Desktop selalu realtime sinkron
    const syncInterval = setInterval(() => {
      api.getAntrean()
        .then((fresh) => {
          if (isMounted && Array.isArray(fresh)) {
            setAntreanList(fresh);
          }
        })
        .catch(() => {});
    }, 6000);

    const handleFocusSync = () => {
      api.getAntrean()
        .then((fresh) => {
          if (isMounted && Array.isArray(fresh)) {
            setAntreanList(fresh);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
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

  // Tampilan Khusus Live Tracking Pesanan Pelanggan (Public Customer Portal)
  if (trackingInfo.isTracking) {
    return (
      <CustomerTracking
        initialNoAntrian={trackingInfo.noAntrian}
        onBackToApp={() => {
          window.location.hash = '#dashboard';
          setTrackingInfo({ isTracking: false, noAntrian: '' });
        }}
      />
    );
  }

  if (isMobileView) {
    return (
      <MobileApp
        products={products}
        setProducts={setProducts}
        categories={categories}
        setCategories={setCategories}
        employees={employees}
        setEmployees={setEmployees}
        bahan={bahan}
        setBahan={setBahan}
        antreanList={antreanList}
        setAntreanList={setAntreanList}
        mutasiList={mutasiList}
        setMutasiList={setMutasiList}
        mutasiGudangJadiList={mutasiGudangJadiList}
        setMutasiGudangJadiList={setMutasiGudangJadiList}
        dbConnected={dbConnected}
        onSwitchToDesktop={() => toggleViewMode(false)}
      />
    );
  }

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
          onSwitchToMobile={() => toggleViewMode(true)}
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
          {activeMenu === 'penjahit' && <Penjahit />}
          {activeMenu === 'tim-finishing' && <TimFinishing />}
          {activeMenu === 'employees' && (
            <Karyawan
              employees={employees}
              setEmployees={setEmployees}
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
          {activeMenu === 'pembayaran-upah' && (
            <PembayaranUpah
              employees={employees}
              antreanList={antreanList}
            />
          )}
        </main>
      </div>
    </div>
  );
}
