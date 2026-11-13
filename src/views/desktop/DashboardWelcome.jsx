import React from 'react';
import {
  Sparkles,
  Package,
  Layers,
  Scissors,
  Warehouse,
  Boxes,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function DashboardWelcome({
  products = [],
  categories = [],
  employees = [],
  bahan = [],
  antreanList = [],
  onNavigate
}) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 font-sans animate-fade-in pb-10">
      {/* 1. HERO BANNER SELAMAT DATANG */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f4c81] via-[#0284c7] to-[#0369a1] text-white p-6 sm:p-8 shadow-xl border border-sky-400/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-sky-100 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sistem Manajemen Konveksi & Garment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Selamat Datang di Ruang Konveksi!
            </h1>
            <p className="text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              Halo <span className="font-bold text-white">Admin Produksi</span>, kelola seluruh alur produksi konveksi mulai dari master produk, bahan baku, penyerahan cutting, jahit, hingga stok gudang jadi secara terintegrasi.
            </p>
            <div className="pt-1 text-xs text-sky-200/80 font-medium">
              📅 {currentDate} • Server & Database SQLite Aktif
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => onNavigate('products')}
              className="px-4 py-2.5 bg-white text-[#0f4c81] hover:bg-sky-50 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-[#0284c7]" />
              <span>Buka Produk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('antrean')}
              className="px-4 py-2.5 bg-sky-900/40 hover:bg-sky-900/60 text-white rounded-xl text-xs font-black border border-white/20 shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Scissors className="w-4 h-4 text-sky-300" />
              <span>Antrean Produksi</span>
            </button>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
      </div>

      {/* 2. STATS RINGKAS SISTEM */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('products')}
          className="bg-white rounded-xl p-4 border border-[#cbd5e1] shadow-2xs hover:shadow-md hover:border-[#0284c7] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Master Produk</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2">
            {products.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>SKU Aktif Siap Jual</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('categories')}
          className="bg-white rounded-xl p-4 border border-[#cbd5e1] shadow-2xs hover:shadow-md hover:border-[#0284c7] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Kategori</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2">
            {categories.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Kategori Produk Terdata</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('bahan')}
          className="bg-white rounded-xl p-4 border border-[#cbd5e1] shadow-2xs hover:shadow-md hover:border-[#0284c7] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Bahan Baku</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2">
            {bahan.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Material Kain & Benang</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('employees')}
          className="bg-white rounded-xl p-4 border border-[#cbd5e1] shadow-2xs hover:shadow-md hover:border-[#0284c7] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Karyawan / Tim</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2">
            {employees.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Penjahit Internal & Makloon</span>
          </div>
        </div>
      </div>

      {/* 3. MENU PINTAS CEPAT (SHORTCUT TILES) */}
      <div className="bg-white rounded-2xl p-6 border border-[#cbd5e1] shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wide">
            Akses Cepat Modul Utama
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih menu operasional untuk mulai memproses data konveksi:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigate('products')}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0f172a] group-hover:text-[#0284c7] transition-colors">
                Katalog Produk & Varian
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Kelola SKU, harga potong, varian warna & ukuran
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('antrean')}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0f172a] group-hover:text-emerald-700 transition-colors">
                Antrean & SOP Produksi
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Alur potong kain, jahit, QC hingga finishing
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('laporan-stok-gudang')}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0f172a] group-hover:text-indigo-700 transition-colors">
                Stok Gudang Jadi & Cetak
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Laporan stok fisik, cetak dokumen, margin Rp & %
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

