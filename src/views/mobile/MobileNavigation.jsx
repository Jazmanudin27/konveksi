import React from 'react';
import { Home, Scissors, ArrowLeftRight, User, Plus, Sparkles } from 'lucide-react';

export default function MobileNavigation({
  activeTab,
  onSelectTab,
  onOpenAddAntrean,
  onOpenMenu,
  activeOrderCount = 0,
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#064e3b] text-emerald-200/80 border-t border-emerald-800/60 flex items-center justify-around px-2 z-40 shadow-2xl select-none">
      {/* 1. Tab Beranda */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          activeTab === 'home' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-emerald-300 stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Beranda</span>
      </button>

      {/* 2. Tab Antrean */}
      <button
        onClick={() => onSelectTab('antrean')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors relative cursor-pointer ${
          activeTab === 'antrean' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <Scissors className={`w-5 h-5 ${activeTab === 'antrean' ? 'text-emerald-300 stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Antrean</span>
        {activeOrderCount > 0 && (
          <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#064e3b]" />
        )}
      </button>

      {/* 3. TOMBOL TENGAH FLOATING BESAR DENGAN RING PUTIH (PERSIS SEPERTI GAMBAR) */}
      <div className="-mt-6 relative flex flex-col items-center">
        <button
          onClick={onOpenAddAntrean}
          className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center border-2 border-white shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
          title="Tambah Antrean Baru (Quick Action)"
        >
          <Scissors className="w-6 h-6 text-white stroke-[2.2]" />
        </button>
      </div>

      {/* 4. Tab Mutasi */}
      <button
        onClick={() => onSelectTab('mutasi')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          activeTab === 'mutasi' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'mutasi' ? 'text-emerald-300 stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Mutasi</span>
      </button>

      {/* 5. Tab Profil / Menu */}
      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          activeTab === 'menu' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'menu' ? 'text-emerald-300 stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Profil</span>
      </button>
    </nav>
  );
}
