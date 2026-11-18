import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Warehouse } from 'lucide-react';

export default function MutasiMobile({
  mutasiList = [],
  mutasiGudangJadiList = [],
  isGudang = false,
}) {
  const [mutasiTab, setMutasiTab] = useState(isGudang ? 'gudang' : 'bahan');

  return (
    <div className="space-y-3 pb-6 select-none">
      {/* Banner Khusus Gudang Jadi jika role Gudang */}
      {isGudang ? (
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 text-white rounded-2xl p-3 shadow-sm border border-blue-500/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Warehouse className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight leading-tight">
                Mutasi Gudang Jadi
              </h2>
              <p className="text-[10px] text-blue-100 font-medium mt-0.5">
                Penerimaan stok dari Finishing & pengeluaran barang jadi siap jual
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Switcher Tab Bahan vs Gudang untuk Super Admin */
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
      )}

      {/* Konten Mutasi Bahan Baku (Hanya jika bukan Admin Gudang) */}
      {!isGudang && mutasiTab === 'bahan' && (
        <div className="space-y-2">
          {mutasiList.map((m) => (
            <div
              key={m.id || m.noBukti}
              className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1.5"
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
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              Belum ada riwayat mutasi bahan
            </div>
          )}
        </div>
      )}

      {/* Konten Mutasi Gudang Jadi (Selalu Tampil untuk Admin Gudang) */}
      {(isGudang || mutasiTab === 'gudang') && (
        <div className="space-y-2">
          {mutasiGudangJadiList.map((g) => (
            <div
              key={g.id || g.noBukti || g.noMutasi}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {g.noMutasi || g.noBukti}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    g.jenisMutasi === 'MASUK'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {g.jenisMutasi === 'MASUK' ? '+ MASUK' : '- KELUAR'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">
                {g.namaProduk || g.keterangan || 'Stok Gudang Jadi'}
              </div>
              <div className="text-[10.5px] text-slate-500">
                Sumber: {g.sumber || g.noAntrian || '-'} • {g.tglDiserahkan || g.tglMutasi?.slice(0, 10) || '-'}
              </div>
              {g.qty ? (
                <div className="pt-1.5 border-t border-slate-100 text-xs flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">
                    {g.varian ? `${g.varian} • Size ${g.ukuran || 'All Size'}` : 'Varian Standar'}
                  </span>
                  <span className="font-mono font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {Number(g.qty).toLocaleString('id-ID')} Pcs
                  </span>
                </div>
              ) : Array.isArray(g.items) && g.items.length > 0 ? (
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
              ) : null}
            </div>
          ))}

          {mutasiGudangJadiList.length === 0 && (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              Belum ada riwayat mutasi stok gudang jadi
            </div>
          )}
        </div>
      )}
    </div>
  );
}
