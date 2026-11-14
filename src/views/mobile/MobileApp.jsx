import React, { useState } from 'react';
import { api } from '../../services/api';

// Komponen modular terpisah untuk setiap menu & fitur Mobile
import MobileHeader from './MobileHeader';
import MobileNavigation from './MobileNavigation';
import DashboardMobile from './DashboardMobile';
import AntreanMobile from './AntreanMobile';
import MutasiMobile from './MutasiMobile';
import ProdukMobile from './ProdukMobile';
import KaryawanMobile from './KaryawanMobile';
import BahanMobile from './BahanMobile';
import KategoriMobile from './KategoriMobile';
import LaporanMobile from './LaporanMobile';
import MobileMenuSheet from './MobileMenuSheet';
import AddAntreanModalMobile from './AddAntreanModalMobile';

export default function MobileApp({
  products,
  setProducts,
  categories,
  setCategories,
  employees,
  setEmployees,
  bahan,
  setBahan,
  antreanList,
  setAntreanList,
  mutasiList,
  setMutasiList,
  mutasiGudangJadiList,
  setMutasiGudangJadiList,
  dbConnected,
  onSwitchToDesktop,
}) {
  // Tab Navigasi Aktif Mobile: 'home' | 'antrean' | 'mutasi' | 'produk'
  const [mobileTab, setMobileTab] = useState('home');

  // Sub-view untuk Menu Tambahan (misal: 'karyawan', 'bahan', 'kategori', 'laporan')
  const [activeSubView, setActiveSubView] = useState(null);

  // State Modal Drawer & Modal Tambah Antrean
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddAntreanOpen, setIsAddAntreanOpen] = useState(false);

  // Hitung jumlah order aktif untuk badge di tab Antrean
  const activeOrderCount = antreanList.filter(
    (a) => a.statusTahapan !== 'Selesai Gudang' && a.statusTahapan !== 'Selesai'
  ).length;

  // Handler Geser Status Antrean Cepat di HP
  const handleNextStatus = async (item) => {
    let nextStatus = '';
    if (!item.statusTahapan || item.statusTahapan === 'Menunggu Cutting') {
      nextStatus = 'Proses Cutting';
    } else if (item.statusTahapan === 'Proses Cutting') {
      nextStatus = 'Proses Jahit';
    } else if (item.statusTahapan === 'Proses Jahit') {
      nextStatus = 'Proses QC';
    } else if (item.statusTahapan === 'Proses QC') {
      nextStatus = 'Proses Finishing';
    } else if (item.statusTahapan === 'Proses Finishing') {
      nextStatus = 'Selesai Gudang';
    } else {
      return;
    }

    try {
      const updated = { ...item, statusTahapan: nextStatus };
      await api.updateAntrean(item.id, updated);
      setAntreanList((prev) => prev.map((a) => (a.id === item.id ? updated : a)));
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  };

  // Handler setelah Antrean baru dibuat
  const handleAntreanCreated = (newItem) => {
    setAntreanList((prev) => [newItem, ...prev]);
    setMobileTab('antrean');
    setActiveSubView(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f1f5f9] text-slate-800 overflow-hidden font-sans select-none">
      {/* 1. TOP BAR MOBILE */}
      <MobileHeader
        dbConnected={dbConnected}
        onSwitchToDesktop={onSwitchToDesktop}
      />

      {/* 2. BODY KONTEN (SCROLL MANDIRI) */}
      <main className="flex-1 overflow-y-auto px-3 py-3 pb-20 scrollbar-thin">
        {/* SUB VIEW JIKA DIPILIH DARI MENU SHEET (KARYAWAN, BAHAN, KATEGORI, LAPORAN) */}
        {activeSubView ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                onClick={() => setActiveSubView(null)}
                className="flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-800 cursor-pointer"
              >
                ← Kembali ke Beranda
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeSubView}
              </span>
            </div>

            {activeSubView === 'karyawan' && <KaryawanMobile employees={employees} />}
            {activeSubView === 'bahan' && <BahanMobile bahan={bahan} />}
            {activeSubView === 'kategori' && <KategoriMobile categories={categories} />}
            {activeSubView === 'laporan' && <LaporanMobile products={products} />}
          </div>
        ) : (
          <>
            {/* TAB UTAMA BERANDA */}
            {mobileTab === 'home' && (
              <DashboardMobile
                antreanList={antreanList}
                products={products}
                bahan={bahan}
                employees={employees}
                onNavigate={(tab) => {
                  setActiveSubView(null);
                  setMobileTab(tab);
                }}
                onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
                onNextStatus={handleNextStatus}
              />
            )}

            {/* TAB UTAMA ANTREAN PRODUKSI */}
            {mobileTab === 'antrean' && (
              <AntreanMobile
                antreanList={antreanList}
                onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
                onNextStatus={handleNextStatus}
              />
            )}

            {/* TAB UTAMA MUTASI */}
            {mobileTab === 'mutasi' && (
              <MutasiMobile
                mutasiList={mutasiList}
                mutasiGudangJadiList={mutasiGudangJadiList}
              />
            )}

            {/* TAB UTAMA KATALOG SKU */}
            {mobileTab === 'produk' && (
              <ProdukMobile
                products={products}
                categories={categories}
              />
            )}
          </>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION BAR */}
      <MobileNavigation
        activeTab={activeSubView ? 'menu' : mobileTab}
        onSelectTab={(tab) => {
          setActiveSubView(null);
          setMobileTab(tab);
        }}
        onOpenMenu={() => setIsMenuOpen(true)}
        activeOrderCount={activeOrderCount}
      />

      {/* 4. MODAL DRAWER MENU SELENGKAPNYA */}
      <MobileMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectSubView={(sub) => setActiveSubView(sub)}
        onSwitchToDesktop={onSwitchToDesktop}
        employeeCount={employees.length}
        bahanCount={bahan.length}
        categoryCount={categories.length}
      />

      {/* 5. MODAL FORM TAMBAH ANTREAN */}
      <AddAntreanModalMobile
        isOpen={isAddAntreanOpen}
        onClose={() => setIsAddAntreanOpen(false)}
        products={products}
        onAntreanCreated={handleAntreanCreated}
      />
    </div>
  );
}
