import React from 'react';

export default function BahanMobile({ bahan = [] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-700">Stok Bahan Baku Kain & Benang ({bahan.length})</div>
      {bahan.map((b) => (
        <div key={b.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
              {b.kodeBahan}
            </span>
            <span className="text-xs font-extrabold text-emerald-700">
              {b.stok} {b.satuan}
            </span>
          </div>
          <div className="font-bold text-xs text-slate-900 mt-1">{b.namaBahan}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Rp {Number(b.harga || 0).toLocaleString('id-ID')} / {b.satuan}
          </div>
        </div>
      ))}

      {bahan.length === 0 && (
        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
          Belum ada data bahan baku
        </div>
      )}
    </div>
  );
}

