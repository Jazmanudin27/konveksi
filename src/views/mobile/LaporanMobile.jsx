import React from 'react';

export default function LaporanMobile({ products = [] }) {
  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-xs text-slate-900">{p.namaProduk}</div>
            <div className="text-[10.5px] text-slate-500">
              {p.sku} • {p.varian} ({p.ukuran})
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-extrabold text-emerald-700">{p.stok} Pcs</div>
            <div className="text-[10px] text-slate-500">
              Rp {Number(p.harga || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
          Belum ada data stok produk
        </div>
      )}
    </div>
  );
}

