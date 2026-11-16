import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, LayoutGrid, ListFilter, PackageOpen } from 'lucide-react';

export default function ProdukMobile({
  products = [],
  categories = [],
}) {
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('SEMUA');
  const [viewMode, setViewMode] = useState('etalase'); // 'etalase' | 'flat'
  const [expandedInduk, setExpandedInduk] = useState({});

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = productSearch.toLowerCase();
      const matchSearch =
        (p.namaProduk || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.skuInduk || '').toLowerCase().includes(q) ||
        (p.varian || '').toLowerCase().includes(q) ||
        (p.kategori || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (productCatFilter === 'SEMUA') return true;
      return p.kategori === productCatFilter || p.skuInduk === productCatFilter;
    });
  }, [products, productSearch, productCatFilter]);

  // Grouping per SKU Induk (Shopee Etalase)
  const groupedSkuInduk = useMemo(() => {
    const map = new Map();
    filteredProducts.forEach((p) => {
      const key = (p.skuInduk || p.kategori || p.namaProduk || 'LAINNYA').trim();
      if (!map.has(key)) {
        map.set(key, {
          skuInduk: key,
          namaProduk: p.namaProduk,
          kategori: p.kategori || '-',
          variants: [],
          totalStok: 0,
          minHarga: Infinity,
          maxHarga: -Infinity,
          colors: [],
        });
      }
      const grp = map.get(key);
      grp.variants.push(p);
      const stok = Number(p.stok || 0);
      const harga = Number(p.harga || 0);
      grp.totalStok += stok;
      if (harga < grp.minHarga) grp.minHarga = harga;
      if (harga > grp.maxHarga) grp.maxHarga = harga;
      if (p.varian && !grp.colors.some((c) => c.name === p.varian)) {
        grp.colors.push({ name: p.varian, hex: p.warnaHex || '#64748b' });
      }
    });

    return Array.from(map.values()).map((g) => ({
      ...g,
      minHarga: g.minHarga === Infinity ? 0 : g.minHarga,
      maxHarga: g.maxHarga === -Infinity ? 0 : g.maxHarga,
    }));
  }, [filteredProducts]);

  const toggleExpand = (key) => {
    setExpandedInduk((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const isExpanded = (key) => expandedInduk[key] !== false; // default open

  return (
    <div className="space-y-2.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Cari SKU Induk / Varian / Produk..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="w-full bg-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
        />
      </div>

      {/* View Switcher & Kategori */}
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg font-bold">
          <button
            type="button"
            onClick={() => setViewMode('etalase')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'etalase' ? 'bg-white text-[#0284c7] shadow-2xs' : 'text-slate-600'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Etalase ({groupedSkuInduk.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'flat' ? 'bg-white text-[#0284c7] shadow-2xs' : 'text-slate-600'
            }`}
          >
            <ListFilter className="w-3 h-3" />
            <span>Semua SKU ({filteredProducts.length})</span>
          </button>
        </div>
      </div>

      {/* Kategori Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setProductCatFilter('SEMUA')}
          className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
            productCatFilter === 'SEMUA'
              ? 'bg-[#0284c7] text-white shadow-xs'
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
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {c.nama}
          </button>
        ))}
      </div>

      {/* Mode Etalase SKU Induk (Shopee Style) */}
      {viewMode === 'etalase' ? (
        <div className="space-y-2">
          {groupedSkuInduk.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              <PackageOpen className="w-8 h-8 mx-auto mb-1 text-slate-300" />
              Tidak ada produk ditemukan
            </div>
          ) : (
            groupedSkuInduk.map((group) => {
              const expanded = isExpanded(group.skuInduk);

              return (
                <div
                  key={group.skuInduk}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  {/* Header Kartu SKU Induk */}
                  <div
                    onClick={() => toggleExpand(group.skuInduk)}
                    className="p-3 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between cursor-pointer border-b border-slate-100"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-black text-white bg-[#0369a1] px-2 py-0.2 rounded shadow-2xs">
                          {group.skuInduk}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {group.kategori}
                        </span>
                        <span className="text-[9.5px] font-extrabold text-[#0284c7] bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                          {group.variants.length} Varian
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                        {group.namaProduk}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {group.minHarga === group.maxHarga
                          ? `Rp ${group.minHarga.toLocaleString('id-ID')}`
                          : `Rp ${group.minHarga.toLocaleString('id-ID')} - ${group.maxHarga.toLocaleString('id-ID')}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block font-medium">Stok Total</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-black font-mono inline-block ${
                            group.totalStok > 10
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {group.totalStok} Pcs
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        {expanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Varian List di Dalam SKU Induk */}
                  {expanded && (
                    <div className="p-2 space-y-1.5 bg-[#f8fafc]">
                      {group.variants.map((v) => (
                        <div
                          key={v.id}
                          className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: v.warnaHex || '#111827' }}
                              />
                              <span className="font-bold text-slate-800 text-[11px]">
                                {v.varian || '-'}
                              </span>
                              <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                {v.ukuran || '-'}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-[#0284c7] font-semibold mt-0.5">
                              {v.sku}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-slate-900 text-[11px]">
                              Rp {Number(v.harga || 0).toLocaleString('id-ID')}
                            </div>
                            <span
                              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                Number(v.stok || 0) > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {v.stok || 0} Pcs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Mode Flat Semua Varian */
        <div className="space-y-2">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-[#0284c7] bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                    {p.sku}
                  </span>
                  {p.skuInduk && (
                    <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Induk: {p.skuInduk}
                    </span>
                  )}
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
      )}
    </div>
  );
}
