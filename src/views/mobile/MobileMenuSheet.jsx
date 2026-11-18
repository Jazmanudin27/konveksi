import React from 'react';
import {
  Users,
  Boxes,
  Tag,
  Warehouse,
  Monitor,
  X,
  User,
  ShieldCheck,
  Coins,
  Wallet,
  LogOut,
  PackageCheck,
  ClipboardList,
} from 'lucide-react';
import { USER_ROLES } from '../../constants/userRoles';

export default function MobileMenuSheet({
  isOpen,
  onClose,
  onSelectSubView,
  onSwitchToDesktop,
  employeeCount = 0,
  bahanCount = 0,
  categoryCount = 0,
  userRole = 'superadmin',
  currentUser = null,
  onLogout = () => {},
  isGudang = false,
}) {
  if (!isOpen) return null;

  const roleCfg = USER_ROLES[userRole] || USER_ROLES.superadmin;
  const displayName = currentUser?.nama || (isGudang ? 'Operator Gudang Jadi' : 'Super Admin');
  const roleLabel = roleCfg?.title || (isGudang ? 'Admin Gudang Jadi' : 'Super Admin');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="relative bg-white text-slate-800 rounded-t-3xl border-t border-slate-200 p-4 pb-8 space-y-4 shadow-2xl z-10 animate-slide-up">
        {/* Header Profil Pengguna & Tombol Tutup */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xs ${
              isGudang ? 'bg-amber-600' : 'bg-[#064e3b]'
            }`}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">{displayName}</div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{roleLabel} • Ruang Konveksi</span>
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

        {/* Menu Pilihan Sesuai Role (Gudang Jadi vs Super Admin) */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Menu Stok Gudang Jadi (Semua Role) */}
          <button
            onClick={() => {
              onSelectSubView('laporan');
              onClose();
            }}
            className="p-3 bg-blue-50/70 hover:bg-blue-100 rounded-2xl border border-blue-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Stok Gudang Jadi</div>
              <div className="text-[10px] text-slate-500">Persediaan Fisik Siap Jual</div>
            </div>
          </button>

          {/* Menu Stok Bahan Baku (Semua Role) */}
          <button
            onClick={() => {
              onSelectSubView('bahan');
              onClose();
            }}
            className="p-3 bg-cyan-50/70 hover:bg-cyan-100 rounded-2xl border border-cyan-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Stok Bahan Baku</div>
              <div className="text-[10px] text-slate-500">{bahanCount} Jenis Kain & Material</div>
            </div>
          </button>

          {/* HANYA MUNCUL JIKA BUKAN GUDANG (SUPER ADMIN): Tim Jahit, Kategori, Upah Kerja, Kasbon */}
          {!isGudang && (
            <>
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
                  onSelectSubView('pembayaran-upah');
                  onClose();
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100/80 rounded-2xl border border-emerald-200/80 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900">Upah Kerja</div>
                  <div className="text-[10px] text-slate-500">Gajian Borongan</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectSubView('kasbon');
                  onClose();
                }}
                className="p-3 bg-amber-50 hover:bg-amber-100/80 rounded-2xl border border-amber-200/80 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900">Kasbon Karyawan</div>
                  <div className="text-[10px] text-slate-500">Pinjam & Potong Upah</div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Action Buttons Bawah: Switch Desktop & Logout Akun */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            onClick={() => {
              onClose();
              onSwitchToDesktop();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span>Beralih ke Tampilan Layar Lebar (PC)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
