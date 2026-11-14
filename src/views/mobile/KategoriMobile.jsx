import React from 'react';

export default function KategoriMobile({ categories = [] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-700">Kategori Produk ({categories.length})</div>
      {categories.map((c) => (
        <div
          key={c.id}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-xs text-slate-900">{c.nama}</div>
            <div className="text-[10px] text-slate-500">
              {c.kode} • Ongkos Potong: Rp {Number(c.hargaPotong || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {c.totalProduk || 0} SKU
          </span>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
          Belum ada data kategori
        </div>
      )}
    </div>
  );
}

