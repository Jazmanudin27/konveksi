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
  // Tab Navigasi Aktif Mobile: 'home' | 'antrean' | 'mutasi' | 'produk' | 'menu'
  const [mobileTab, setMobileTab] = useState('home');

  // Sub-view untuk Menu Tambahan (misal: 'karyawan', 'bahan', 'kategori', 'laporan')
  const [activeSubView, setActiveSubView] = useState(null);

  // State Modal Drawer & Modal Tambah Antrean
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddAntreanOpen, setIsAddAntreanOpen] = useState(false);

  // Hitung jumlah order aktif & urgent
  const activeOrderCount = antreanList.filter(
    (a) => a.statusTahapan !== 'Selesai Gudang' && a.statusTahapan !== 'Selesai'
  ).length;

  const activeUrgentCount = antreanList.filter(
    (a) => (a.prioritas || '').toLowerCase() === 'urgent' && a.statusTahapan !== 'Selesai Gudang'
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
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans select-none">
      {/* 1. TOP BAR MOBILE (EMERALD GREEN CURVED PERSIS GAMBAR) */}
      <MobileHeader
        dbConnected={dbConnected}
        onSwitchToDesktop={onSwitchToDesktop}
        activeUrgentCount={activeUrgentCount}
      />

      {/* 2. BODY KONTEN (SCROLL MANDIRI) */}
      <main className="flex-1 overflow-y-auto px-3.5 pb-24 scrollbar-thin">
        {/* SUB VIEW JIKA DIPILIH DARI MENU SHEET / GRID */}
        {activeSubView ? (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                onClick={() => setActiveSubView(null)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
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
                categories={categories}
                onNavigate={(tab) => {
                  if (['karyawan', 'bahan', 'kategori', 'laporan'].includes(tab)) {
                    setActiveSubView(tab);
                  } else {
                    setActiveSubView(null);
                    setMobileTab(tab);
                  }
                }}
                onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
                onNextStatus={handleNextStatus}
                onSwitchToDesktop={onSwitchToDesktop}
              />
            )}

            {/* TAB UTAMA ANTREAN PRODUKSI */}
            {mobileTab === 'antrean' && (
              <div className="pt-3">
                <AntreanMobile
                  antreanList={antreanList}
                  onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
                  onNextStatus={handleNextStatus}
                />
              </div>
            )}

            {/* TAB UTAMA MUTASI */}
            {mobileTab === 'mutasi' && (
              <div className="pt-3">
                <MutasiMobile
                  mutasiList={mutasiList}
                  mutasiGudangJadiList={mutasiGudangJadiList}
                />
              </div>
            )}

            {/* TAB UTAMA KATALOG SKU */}
            {mobileTab === 'produk' && (
              <div className="pt-3">
                <ProdukMobile
                  products={products}
                  categories={categories}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION BAR DENGAN TOMBOL TENGAH FLOATING BESAR */}
      <MobileNavigation
        activeTab={activeSubView ? 'menu' : mobileTab}
        onSelectTab={(tab) => {
          setActiveSubView(null);
          setMobileTab(tab);
        }}
        onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        activeOrderCount={activeOrderCount}
      />

      {/* 4. MODAL BOTTOM SHEET PROFIL & MENU LENGKAP */}
      <MobileMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectSubView={(sub) => {
          setActiveSubView(sub);
          setIsMenuOpen(false);
        }}
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
