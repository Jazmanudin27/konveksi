import React from 'react';
import {
  Users,
  Boxes,
  Tag,
  Warehouse,
  Monitor,
  X,
  Shirt,
  User,
  ShieldCheck,
  ChevronRight,
  Database,
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
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="relative bg-white text-slate-800 rounded-t-3xl border-t border-slate-200 p-4 pb-8 space-y-4 shadow-2xl z-10 animate-slide-up">
        {/* Header Profil & Tombol Tutup */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-800">Admin Produksi</div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin • Ruang Konveksi</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Lengkap */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              onSelectSubView('karyawan');
              onClose();
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Tim Jahit</div>
              <div className="text-[10px] text-slate-400">{employeeCount} Karyawan</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectSubView('bahan');
              onClose();
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Stok Bahan</div>
              <div className="text-[10px] text-slate-400">{bahanCount} Item Kain</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectSubView('kategori');
              onClose();
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Kategori</div>
              <div className="text-[10px] text-slate-400">{categoryCount} Kategori</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectSubView('laporan');
              onClose();
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Gudang Jadi</div>
              <div className="text-[10px] text-slate-400">Laporan Fisik</div>
            </div>
          </button>
        </div>

        {/* Switch Desktop */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onSwitchToDesktop();
            }}
            className="w-full py-2.5 rounded-2xl bg-[#064e3b] hover:bg-[#043e2f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span>Beralih ke Tampilan Layar Lebar (PC)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
