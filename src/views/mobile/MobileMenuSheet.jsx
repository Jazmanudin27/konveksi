import React from 'react';
import {
  Users,
  Boxes,
  Tag,
  Warehouse,
  Monitor,
  X,
  Shirt,
} from 'lucide-react';

export default function MobileMenuSheet({
  isOpen,
  onClose,
  onSelectSubView,
  onSwitchToDesktop,
  employeeCount = 0,
  bahanCount = 0,
  categoryCount = 0,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="relative bg-[#0b1329] text-slate-200 rounded-t-3xl border-t border-slate-800 p-4 pb-6 space-y-4 shadow-2xl z-10 animate-slide-up">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">Menu Ruang Konveksi</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              onSelectSubView('karyawan');
              onClose();
            }}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center gap-2.5 text-left text-slate-200 cursor-pointer"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-bold">Tim Karyawan</div>
              <div className="text-[10px] text-slate-400">{employeeCount} Anggota</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectSubView('bahan');
              onClose();
            }}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center gap-2.5 text-left text-slate-200 cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-bold">Stok Bahan</div>
              <div className="text-[10px] text-slate-400">{bahanCount} Jenis</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectSubView('kategori');
              onClose();
            }}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center gap-2.5 text-left text-slate-200 cursor-pointer"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-bold">Kategori Produk</div>
              <div className="text-[10px] text-slate-400">{categoryCount} Kategori</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectSubView('laporan');
              onClose();
            }}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center gap-2.5 text-left text-slate-200 cursor-pointer"
          >
            <Warehouse className="w-4 h-4 text-purple-400" />
            <div>
              <div className="font-bold">Stok Gudang Jadi</div>
              <div className="text-[10px] text-slate-400">Laporan Fisik</div>
            </div>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onSwitchToDesktop();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span>Beralih ke Tampilan Penuh Desktop</span>
          </button>
        </div>
      </div>
    </div>
  );
}

