import React from 'react';
import { Home, Scissors, ArrowLeftRight, Package, Menu } from 'lucide-react';

export default function MobileNavigation({
  activeTab,
  onSelectTab,
  onOpenMenu,
  activeOrderCount = 0,
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0b1329] text-slate-400 border-t border-slate-800 flex items-center justify-around px-2 z-40 shadow-lg select-none">
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'home' ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Beranda</span>
      </button>

      <button
        onClick={() => onSelectTab('antrean')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors relative cursor-pointer ${
          activeTab === 'antrean' ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Scissors className="w-5 h-5" />
        <span className="text-[10px]">Antrean</span>
        {activeOrderCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </button>

      <button
        onClick={() => onSelectTab('mutasi')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'mutasi' ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span className="text-[10px]">Mutasi</span>
      </button>

      <button
        onClick={() => onSelectTab('produk')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'produk' ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Package className="w-5 h-5" />
        <span className="text-[10px]">Katalog</span>
      </button>

      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'menu' ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px]">Menu</span>
      </button>
    </nav>
  );
}

