import React, { useState, useMemo } from 'react';
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
import LanjutTahapModalMobile from './LanjutTahapModalMobile';
import MobileNotificationModal from './MobileNotificationModal';

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

  // State Modal Drawer, Tambah Antrean & Pusat Notifikasi
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddAntreanOpen, setIsAddAntreanOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Hitung jumlah order aktif & urgent
  const activeOrderCount = useMemo(() => {
    return antreanList.filter(
      (a) => (a.status || a.statusTahapan) !== 'Selesai Gudang' && (a.status || a.statusTahapan) !== 'Selesai'
    ).length;
  }, [antreanList]);

  const activeUrgentCount = useMemo(() => {
    return antreanList.filter(
      (a) =>
        ((a.prioritas || '').toLowerCase() === 'urgent' ||
          (a.prioritas || '').toLowerCase() === 'tinggi') &&
        (a.status || a.statusTahapan) !== 'Selesai Gudang' &&
        (a.status || a.statusTahapan) !== 'Selesai'
    ).length;
  }, [antreanList]);

  // Perhitungan Notifikasi Peringatan Operasional Menyeluruh
  const notificationCount = useMemo(() => {
    let count = 0;
    // 1. Order urgent atau siap potong
    count += antreanList.filter(
      (a) =>
        (a.status || a.statusTahapan) !== 'Selesai Gudang' &&
        (a.status || a.statusTahapan) !== 'Selesai' &&
        (((a.prioritas || '').toLowerCase() === 'urgent' ||
          (a.prioritas || '').toLowerCase() === 'tinggi') ||
          (a.status || a.statusTahapan) === 'Menunggu Cutting' ||
          (a.status || a.statusTahapan) === 'Draft')
    ).length;

    // 2. Bahan baku menipis
    count += bahan.filter(
      (b) => Number(b.stokSaatIni ?? b.stok ?? 0) <= Number(b.stokMinimum ?? 20)
    ).length;

    // 3. Produk habis
    count += products.filter(
      (p) => Number(p.stok || 0) === 0 || p.status === 'Habis'
    ).length;

    return count;
  }, [antreanList, bahan, products]);

  // State Modal Lanjut Tahap Produksi SOP Mobile
  const [selectedNextStatusItem, setSelectedNextStatusItem] = useState(null);

  // Handler Buka Modal Serah Tahapan Produksi (Cutting, Jahit, QC, Finishing, Gudang)
  const handleOpenNextStatus = (item) => {
    setSelectedNextStatusItem(item);
  };

  // Handler Refresh Data Antrean setelah Serah Tahapan
  const handleRefreshAntrean = async () => {
    try {
      const data = await api.getAntrean();
      if (Array.isArray(data)) {
        setAntreanList(data);
      }
    } catch (err) {
      console.warn('Gagal refresh antrean:', err);
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
      {/* 1. STICKY SUB-HEADER UNTUK MENU NON-BERANDA DENGAN NOTIFIKASI BELL */}
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
          onOpenNotifications={() => setIsNotificationOpen(true)}
          notificationCount={notificationCount}
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
                onOpenNotifications={() => setIsNotificationOpen(true)}
                notificationCount={notificationCount}
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
                onOpenNotifications={() => setIsNotificationOpen(true)}
                notificationCount={notificationCount}
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
                onOpenNotifications={() => setIsNotificationOpen(true)}
                notificationCount={notificationCount}
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
                  notificationCount={notificationCount}
                  onOpenNotifications={() => setIsNotificationOpen(true)}
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
                    onNextStatus={handleOpenNextStatus}
                    onSwitchToDesktop={onSwitchToDesktop}
                  />
                </div>
              </div>
            )}

            {/* TAB ANTREAN PRODUKSI */}
            {mobileTab === 'antrean' && (
              <div className="p-3.5">
                <AntreanMobile
                  antreanList={antreanList}
                  onOpenAddAntrean={() => setIsAddAntreanOpen(true)}
                  onNextStatus={handleOpenNextStatus}
                />
              </div>
            )}

            {/* TAB MUTASI STOK BAHAN & GUDANG JADI */}
            {mobileTab === 'mutasi' && (
              <div className="p-3.5">
                <MutasiMobile
                  mutasiList={mutasiList}
                  mutasiGudangJadiList={mutasiGudangJadiList}
                />
              </div>
            )}

            {/* TAB KATALOG PRODUK */}
            {mobileTab === 'produk' && (
              <div className="p-3.5">
                <ProdukMobile products={products} categories={categories} />
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

      {/* 6. MODAL SERAH TAHAPAN PRODUKSI SOP MOBILE */}
      {selectedNextStatusItem && (
        <LanjutTahapModalMobile
          isOpen={Boolean(selectedNextStatusItem)}
          item={selectedNextStatusItem}
          employees={employees}
          products={products}
          onClose={() => setSelectedNextStatusItem(null)}
          onSuccess={handleRefreshAntrean}
        />
      )}

      {/* 7. MODAL PUSAT NOTIFIKASI OPERASIONAL MOBILE */}
      <MobileNotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        antreanList={antreanList}
        bahan={bahan}
        products={products}
        onNavigateToAntrean={() => {
          setActiveSubView(null);
          setMobileTab('antrean');
        }}
        onNavigateToBahan={() => {
          setMobileTab('menu');
          setActiveSubView('bahan');
        }}
        onNavigateToProduk={() => {
          setActiveSubView(null);
          setMobileTab('produk');
        }}
      />
    </div>
  );
}
