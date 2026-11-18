import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Maximize2,
  Minimize2,
  Smartphone,
  Database,
  Shirt,
  Sparkles,
  Warehouse,
  UserCheck,
  Scissors,
  CheckCircle2,
  PackageCheck,
  ChevronDown,
  Check,
  ShieldCheck,
  Layers,
  LogOut
} from 'lucide-react';
import { useClock } from '../../hooks/useClock';
import { USER_ROLES } from '../../constants/userRoles';

export default function TopHeader({
  onToggleSidebar,
  dbConnected,
  onSwitchToMobile,
  userRole = 'superadmin',
  onRoleChange,
  currentUser = null,
  onLogout = null,
}) {
  const timeStr = useClock();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRoleConfig = USER_ROLES[userRole] || USER_ROLES.superadmin;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const getRoleIcon = (roleKey, className = "w-3.5 h-3.5") => {
    switch (roleKey) {
      case 'superadmin':
        return <ShieldCheck className={className} />;
      case 'gudang':
        return <Warehouse className={className} />;
      case 'cutting':
        return <Scissors className={className} />;
      case 'jahit':
        return <Layers className={className} />;
      case 'qc':
        return <CheckCircle2 className={className} />;
      case 'finishing':
        return <PackageCheck className={className} />;
      default:
        return <UserCheck className={className} />;
    }
  };

  return (
    <header className="h-12 bg-[#0b1329] text-slate-300 border-b border-slate-800/90 px-3 md:px-4 flex items-center justify-between shadow-md sticky top-0 z-30 select-none">
      {/* Tombol Sidebar, Brand Logo, & Layar Penuh */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/70 flex items-center justify-center shadow-xs"
          title="Buka / Tutup Menu"
        >
          <Menu className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Brand Logo di Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-600 p-0.5 shadow-sm shadow-cyan-950/50 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[6px] bg-[#0b1329]/60 flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5 text-cyan-200" />
            </div>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-white text-xs tracking-wide">RUANG KONVEKSI</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[9px] font-semibold text-cyan-400/80 uppercase tracking-widest leading-none">
              Sistem Manajemen
            </p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60 hidden md:flex items-center justify-center ml-1"
          title="Layar Penuh"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-300" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bagian Kanan Header */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Role Switcher Dropdown (6 Roles: Super Admin, Gudang, Cutting, Jahit, QC, Finishing) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 shadow-xs`}
            title="Klik untuk mengganti Role / Hak Akses Pengguna"
          >
            <span className={`w-5 h-5 rounded-md bg-gradient-to-r ${currentRoleConfig.themeGradient} text-white flex items-center justify-center text-[10px] font-black shrink-0`}>
              {getRoleIcon(userRole, "w-3 h-3")}
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-black text-white flex items-center gap-1">
                {currentRoleConfig.name}
              </span>
              <span className="text-[9px] text-slate-400 hidden sm:inline">
                {currentRoleConfig.badgeText}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {/* Popover Dropdown Menu 6 Role */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fadeIn">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Pilih Hak Akses (Role)</span>
                <span className="text-cyan-400 font-mono">6 Role</span>
              </div>

              <div className="p-1 space-y-0.5">
                {Object.values(USER_ROLES).map((role) => {
                  const isSelected = userRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => {
                        if (onRoleChange) onRoleChange(role.key);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? `bg-gradient-to-r ${role.themeGradient} text-white shadow-sm`
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {getRoleIcon(role.key, "w-3.5 h-3.5")}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                            {role.name}
                          </div>
                          <div className={`text-[10px] truncate leading-tight mt-0.5 ${isSelected ? 'text-white/80 font-medium' : 'text-slate-400'}`}>
                            {role.division}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/80 text-[9.5px] text-slate-500 text-center font-medium">
                Setiap role memfilter menu & fitur otomatis
              </div>
            </div>
          )}
        </div>

        {/* Status Database MySQL */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
            dbConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
          }`}
          title={
            dbConnected
              ? 'Terhubung ke Database MySQL (konveksi@localhost)'
              : 'Server backend offline / belum terhubung'
          }
        >
          <Database className="w-3 h-3 text-cyan-400" />
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{dbConnected ? 'MySQL Online' : 'MySQL Offline'}</span>
        </div>

        {/* Tombol Beralih ke Versi Mobile */}
        <button
          onClick={onSwitchToMobile}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700/80 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
          title="Beralih ke Tampilan Mobile Smartphone"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Versi Mobile</span>
        </button>

        {/* Tombol Logout Akun */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            title={currentUser ? `Keluar dari akun @${currentUser.username}` : 'Keluar dari Akun'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}

        {/* Jam Real-time */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/60 text-[11px] font-medium font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
