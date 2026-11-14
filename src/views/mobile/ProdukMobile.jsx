import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function ProdukMobile({
  products = [],
  categories = [],
}) {
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('SEMUA');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        (p.namaProduk || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.varian || '').toLowerCase().includes(productSearch.toLowerCase());

      if (!matchSearch) return false;
      if (productCatFilter === 'SEMUA') return true;
      return p.kategori === productCatFilter;
    });
  }, [products, productSearch, productCatFilter]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Cari SKU / nama produk / varian..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="w-full bg-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Kategori Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setProductCatFilter('SEMUA')}
          className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
            productCatFilter === 'SEMUA'
              ? 'bg-[#0b1329] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Semua
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setProductCatFilter(c.nama)}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              productCatFilter === c.nama
                ? 'bg-[#0b1329] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {c.nama}
          </button>
        ))}
      </div>

      {/* List Kartu Produk */}
      <div className="space-y-2">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                  {p.sku}
                </span>
                <span className="text-[9.5px] text-slate-500">{p.kategori}</span>
              </div>
              <div className="font-bold text-xs text-slate-900 mt-0.5">{p.namaProduk}</div>
              <div className="text-[10.5px] text-slate-500">
                {p.varian} • Size {p.ukuran} • Rp {Number(p.harga || 0).toLocaleString('id-ID')}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {p.stok} Pcs
              </span>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            Tidak ada produk ditemukan
          </div>
        )}
      </div>
    </div>
  );
}

