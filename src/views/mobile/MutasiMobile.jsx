import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function MutasiMobile({
  mutasiList = [],
  mutasiGudangJadiList = [],
}) {
  const [mutasiTab, setMutasiTab] = useState('bahan');

  return (
    <div className="space-y-3">
      {/* Switcher Tab Bahan vs Gudang */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
        <button
          onClick={() => setMutasiTab('bahan')}
          className={`py-1.5 rounded-lg transition-all cursor-pointer ${
            mutasiTab === 'bahan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Bahan Baku ({mutasiList.length})
        </button>
        <button
          onClick={() => setMutasiTab('gudang')}
          className={`py-1.5 rounded-lg transition-all cursor-pointer ${
            mutasiTab === 'gudang' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Gudang Jadi ({mutasiGudangJadiList.length})
        </button>
      </div>

      {/* Konten Mutasi Bahan Baku */}
      {mutasiTab === 'bahan' && (
        <div className="space-y-2">
          {mutasiList.map((m) => (
            <div
              key={m.id || m.noBukti}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {m.noBukti}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                    m.jenisMutasi === 'MASUK'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {m.jenisMutasi === 'MASUK' ? (
                    <ArrowDownLeft className="w-3 h-3" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3" />
                  )}
                  <span>{m.jenisMutasi}</span>
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">{m.keterangan || 'Mutasi Bahan'}</div>
              <div className="text-[10.5px] text-slate-500">
                Reff: {m.noReff || '-'} • {m.tgl || m.tanggal || '-'}
              </div>
              {Array.isArray(m.items) && m.items.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 text-[10.5px] text-slate-600 space-y-0.5">
                  {m.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">{it.namaBahan || it.nama_bahan}</span>
                      <span className="font-bold text-slate-800">
                        {it.qty} {it.satuan}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {mutasiList.length === 0 && (
            <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              Belum ada riwayat mutasi bahan
            </div>
          )}
        </div>
      )}

      {/* Konten Mutasi Gudang Jadi */}
      {mutasiTab === 'gudang' && (
        <div className="space-y-2">
          {mutasiGudangJadiList.map((g) => (
            <div
              key={g.id || g.noBukti}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {g.noBukti}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    g.jenisMutasi === 'MASUK'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {g.jenisMutasi}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">{g.keterangan || 'Stok Gudang Jadi'}</div>
              <div className="text-[10.5px] text-slate-500">
                Reff: {g.noReff || '-'} • {g.tgl || g.tanggal || '-'}
              </div>
              {Array.isArray(g.items) && g.items.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 text-[10.5px] text-slate-600 space-y-0.5">
                  {g.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">
                        {it.namaProduk} ({it.sku})
                      </span>
                      <span className="font-bold text-slate-800">{it.qty} Pcs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {mutasiGudangJadiList.length === 0 && (
            <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              Belum ada riwayat stok gudang jadi
            </div>
          )}
        </div>
      )}
    </div>
  );
}

