import React, { useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Scissors
} from 'lucide-react';

export default function ModalHistoriCutting({ isOpen, antreanList = [], onClose }) {
  if (!isOpen) return null;

  const historyItems = useMemo(() => {
    return (antreanList || []).filter(item => Boolean(item.tglSerahCutting));
  }, [antreanList]);

  const totalVolume = historyItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalBiaya = historyItems.reduce((acc, curr) => {
    const itemTarif = Number(curr.tarifCutting) || 1500;
    const itemTotal = Number(curr.totalBiayaCutting) || ((Number(curr.qty) || 0) * itemTarif);
    return acc + itemTotal;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-[#4338ca] via-[#3730a3] to-[#1e1b4b] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
            title="Kembali ke Daftar Antrean"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white shrink-0">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                  Histori & Log Penyerahan Tim Cutting
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-white font-mono text-[9px] font-extrabold border border-white/25">
                  REKAP BIAYA JASA
                </span>
              </div>
              <p className="text-[10px] text-indigo-200/90 mt-0.5 leading-none">
                Daftar semua antrean yang sudah dialokasikan ke Tim Potong beserta rincian tarif dan total beban biaya
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
          title="Tutup Halaman Penuh"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BODY SCROLLABLE FULL SCREEN */}
      <div className="flex-1 overflow-y-auto p-3 w-full">
        <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-sm overflow-hidden">
          <div className="p-3 border-b border-[#cbd5e1] bg-[#f8fafc] flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Tabel Rekapitulasi Alokasi Potong Pola
            </span>
            <span className="text-xs font-bold text-[#0284c7] font-mono">
              {historyItems.length} Batch Ditemukan
            </span>
          </div>

          <div className="overflow-x-auto">
            {historyItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Scissors className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">Belum ada riwayat penyerahan ke Tim Cutting</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih atau centang antrean lalu klik "Tim Cutting" untuk menyerahkan antrean ke tahap cutting
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-600 font-extrabold text-[10.5px] uppercase border-b border-[#cbd5e1]">
                    <th className="py-2.5 px-2 text-center w-8 border-r border-[#cbd5e1]">NO</th>
                    <th className="py-2.5 px-2.5 w-36 border-r border-[#cbd5e1]">NO ANTREAN</th>
                    <th className="py-2.5 px-2.5 w-28 border-r border-[#cbd5e1]">TGL SERAH</th>
                    <th className="py-2.5 px-3 w-48 border-r border-[#cbd5e1]">TIM CUTTING</th>
                    <th className="py-2.5 px-3 border-r border-[#cbd5e1]">MODEL PRODUK (SKU)</th>
                    <th className="py-2.5 px-3 text-right w-24 border-r border-[#cbd5e1]">QTY (PCS)</th>
                    <th className="py-2.5 px-3 text-right w-28 border-r border-[#cbd5e1]">TARIF / PCS</th>
                    <th className="py-2.5 px-3 text-right w-32 border-r border-[#cbd5e1]">TOTAL BIAYA</th>
                    <th className="py-2.5 px-2.5 text-center w-32 border-r border-[#cbd5e1]">STATUS</th>
                    <th className="py-2.5 px-3 w-48">CATATAN KHUSUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-700">
                  {historyItems.map((item, idx) => {
                    const tarifItem = Number(item.tarifCutting) || 1500;
                    const totalItem = Number(item.totalBiayaCutting) || ((Number(item.qty) || 0) * tarifItem);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 text-center text-slate-500 font-semibold border-r border-[#cbd5e1]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono font-bold text-[#0284c7] border-r border-[#cbd5e1]">
                          {item.noAntrian}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-700 border-r border-[#cbd5e1]">
                          {item.tglSerahCutting}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-[#cbd5e1]">
                          {item.timCutting || 'Tim Cutting'}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#cbd5e1]">
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 mr-1.5">
                            {item.sku}
                          </span>
                          <span className="text-slate-900 font-semibold">{item.namaProduk || '-'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-[#cbd5e1]">
                          {Number(item.qty).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-[#cbd5e1]">
                          Rp {tarifItem.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#059669] border-r border-[#cbd5e1]">
                          Rp {totalItem.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-2.5 text-center border-r border-[#cbd5e1]">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#0284c7] border border-[#bae6fd]">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate">
                          {item.catatanCutting || item.catatan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR FULL SCREEN */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0 w-full">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Total Tercatat: <strong className="text-slate-800">{historyItems.length} Batch</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="text-slate-500 font-medium">
            Total Volume: <strong className="text-slate-800">{totalVolume.toLocaleString('id-ID')} Pcs</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-slate-700">
            Total Akumulasi Biaya: <strong className="text-[#059669]">Rp {totalBiaya.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Antrean</span>
        </button>
      </div>
    </div>
  );
}

