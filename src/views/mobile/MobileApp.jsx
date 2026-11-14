import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Scissors,
  ArrowLeftRight,
  Package,
  Users,
  Boxes,
  Tag,
  Warehouse,
  Plus,
} from 'lucide-react';

// Komponen modular terpisah untuk setiap menu & fitur Mobile
import MobileHeader from './MobileHeader';
import MobileSubHeader from './MobileSubHeader';
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
    (a) => (a.status || a.statusTahapan) !== 'Selesai Gudang' && (a.status || a.statusTahapan) !== 'Selesai'
  ).length;

  const activeUrgentCount = antreanList.filter(
    (a) => (a.prioritas || '').toLowerCase() === 'urgent' && (a.status || a.statusTahapan) !== 'Selesai Gudang'
  ).length;

  // Handler Geser Status Antrean Cepat di HP
  const handleNextStatus = async (item) => {
    const curStatus = item.status || item.statusTahapan || 'Menunggu Cutting';
    let nextStatus = '';
    if (curStatus === 'Menunggu Cutting' || curStatus === 'Draft') {
      nextStatus = 'Proses Cutting';
    } else if (curStatus === 'Proses Cutting') {
      nextStatus = 'Proses Jahit';
    } else if (curStatus === 'Proses Jahit') {
      nextStatus = 'Proses QC';
    } else if (curStatus === 'Proses QC') {
      nextStatus = 'Proses Finishing';
    } else if (curStatus === 'Proses Finishing') {
      nextStatus = 'Selesai Gudang';
    } else {
      return;
    }

    try {
      const updated = { ...item, status: nextStatus, statusTahapan: nextStatus };
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
      {/* 1. STICKY SUB-HEADER HANYA UNTUK MENU NON-BERANDA */}
      {activeSubView ? (
        <MobileSubHeader
          title={
            activeSubView === 'karyawan'
              ? 'Tim & Penjahit'
              : activeSubView === 'bahan'
              ? 'Stok Bahan Baku'
              : activeSubView === 'kategori'
              ? 'Kategori Produk'
              : 'Laporan Gudang Jadi'
          }
          subtitle={
            activeSubView === 'karyawan'
              ? 'Tenaga Kerja Produksi'
              : activeSubView === 'bahan'
              ? 'Kain, Benang & Material'
              : activeSubView === 'kategori'
              ? 'Master Kelompok & Ongkos'
              : 'Stok Fisik Siap Jual'
          }
          icon={
            activeSubView === 'karyawan'
              ? Users
              : activeSubView === 'bahan'
              ? Boxes
              : activeSubView === 'kategori'
              ? Tag
              : Warehouse
          }
          badgeText={
            activeSubView === 'karyawan'
              ? `${employees.length} Orang`
              : activeSubView === 'bahan'
              ? `${bahan.length} Jenis`
              : activeSubView === 'kategori'
              ? `${categories.length} Kategori`
              : `${products.length} SKU`
          }
          onBack={() => setActiveSubView(null)}
          onSwitchToDesktop={onSwitchToDesktop}
        />
      ) : (
        mobileTab !== 'home' && (
          <>
            {mobileTab === 'antrean' && (
              <MobileSubHeader
                title="Antrean Produksi"
                subtitle={`${activeOrderCount} order aktif berjalan`}
                icon={Scissors}
                badgeText={`${antreanList.length} Total`}
                onBack={() => setMobileTab('home')}
                onSwitchToDesktop={onSwitchToDesktop}
                rightAction={
                  <button
                    onClick={() => setIsAddAntreanOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-[#064e3b] text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Tambah</span>
                  </button>
                }
              />
            )}

            {mobileTab === 'mutasi' && (
              <MobileSubHeader
                title="Mutasi Stok"
                subtitle="Riwayat Keluar & Masuk Fisik"
                icon={ArrowLeftRight}
                badgeText={`${mutasiList.length + mutasiGudangJadiList.length} Mutasi`}
                onBack={() => setMobileTab('home')}
                onSwitchToDesktop={onSwitchToDesktop}
              />
            )}

            {mobileTab === 'produk' && (
              <MobileSubHeader
                title="Katalog Produk"
                subtitle="Master SKU, Varian & Ukuran"
                icon={Package}
                badgeText={`${products.length} SKU`}
                onBack={() => setMobileTab('home')}
                onSwitchToDesktop={onSwitchToDesktop}
              />
            )}
          </>
        )
      )}

      {/* 2. BODY KONTEN (SCROLL MANDIRI) */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-thin">
        {/* SUB VIEW JIKA DIPILIH DARI MENU SHEET / GRID */}
        {activeSubView ? (
          <div className="space-y-3 p-3.5">
            {activeSubView === 'karyawan' && <KaryawanMobile employees={employees} />}
            {activeSubView === 'bahan' && <BahanMobile bahan={bahan} />}
            {activeSubView === 'kategori' && <KategoriMobile categories={categories} />}
            {activeSubView === 'laporan' && <LaporanMobile products={products} />}
          </div>
        ) : (
          <>
            {/* TAB UTAMA BERANDA: HEADER MENYATU DI ATAS DENGAN LENGKUNG SEMPURNA */}
            {mobileTab === 'home' && (
              <div>
                <MobileHeader
                  dbConnected={dbConnected}
                  onSwitchToDesktop={onSwitchToDesktop}
                  activeUrgentCount={activeUrgentCount}
                />
                <div className="px-3.5">
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
                </div>
              </div>
            )}

            {/* TAB UTAMA ANTREAN PRODUKSI */}
            {mobileTab === 'antrean' && (
              <div className="p-3.5">
                <AntreanMobile
                  antreanList={antreanList}
                  onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
                  onNextStatus={handleNextStatus}
                />
              </div>
            )}

            {/* TAB UTAMA MUTASI */}
            {mobileTab === 'mutasi' && (
              <div className="p-3.5">
                <MutasiMobile
                  mutasiList={mutasiList}
                  mutasiGudangJadiList={mutasiGudangJadiList}
                />
              </div>
            )}

            {/* TAB UTAMA KATALOG SKU */}
            {mobileTab === 'produk' && (
              <div className="p-3.5">
                <ProdukMobile
                  products={products}
                  categories={categories}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION BAR DENGAN TOMBOL FINGERPRINT BESAR */}
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
