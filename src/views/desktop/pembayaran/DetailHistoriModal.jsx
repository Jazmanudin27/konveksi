// g:\Konveksi\src\views\desktop\pembayaran\DetailHistoriModal.jsx
import React from 'react';
import { Receipt, X, Printer, RotateCcw } from 'lucide-react';

export default function DetailHistoriModal({
  isOpen,
  historiItem,
  onClose,
  onCetakSlip,
  onBatalHistori,
}) {
  if (!isOpen || !historiItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-emerald-300">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                Rincian Histori Pembayaran
              </h3>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Detail transaksi pembayaran upah yang telah diverifikasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Info */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                Penerima
              </span>
              <span className="font-black text-slate-900 text-sm">
                {historiItem.namaPetugas}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                {historiItem.tahapan}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                Tanggal Bayar
              </span>
              <span className="font-bold text-slate-800 text-xs font-mono">
                {historiItem.tglBayar}
              </span>
              <span className="text-[10.5px] text-slate-500 block">
                Metode: {historiItem.metodeBayar || 'Tunai'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                Periode Pengerjaan
              </span>
              <span className="font-bold text-slate-800 text-xs font-mono">
                {historiItem.periode}
              </span>
              <span className="text-[10.5px] text-slate-500 block">
                {(historiItem.items || []).length} Order
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                Total Dibayar
              </span>
              <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Rp {Number(historiItem.totalBersih || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tabel Order Items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1e293b] text-white font-extrabold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">NO</th>
                  <th className="py-2.5 px-3">NO. ORDER / ANTREAN</th>
                  <th className="py-2.5 px-3">MODEL & WARNA</th>
                  <th className="py-2.5 px-3 text-right">HARGA / PCS</th>
                  <th className="py-2.5 px-3 text-center">QTY</th>
                  <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(historiItem.items || []).map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono font-bold text-emerald-950 text-xs">
                        {it.noPembayaran}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {it.noAntrian || '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-900 block">
                        {it.namaProduk}
                      </span>
                      <span className="text-[10.5px] text-slate-500">
                        {it.warna || it.varian || '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      Rp {Number(it.tarifPerPcs || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">
                      {Number(it.qty || 0).toLocaleString('id-ID')} Pcs
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-800">
                      Rp {Number(it.totalUpah || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                <tr>
                  <td
                    colSpan="4"
                    className="py-2.5 px-3 text-right uppercase text-slate-700"
                  >
                    Grand Total Qty & Upah:
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700">
                    {Number(historiItem.totalQty || 0).toLocaleString('id-ID')} Pcs
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                    Rp {Number(historiItem.totalKotor || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                {Number(historiItem.totalPotonganKasbon || 0) > 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-1.5 px-3 text-right uppercase text-amber-800"
                    >
                      Potongan Pinjaman / Kasbon:
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-black text-amber-700">
                      - Rp{' '}
                      {Number(historiItem.totalPotonganKasbon).toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
                <tr className="bg-emerald-50/80 text-emerald-950 text-sm">
                  <td
                    colSpan="5"
                    className="py-2.5 px-3 text-right uppercase font-black"
                  >
                    Total Gaji Bersih Dibayar:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                    Rp {Number(historiItem.totalBersih || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onBatalHistori) onBatalHistori(historiItem);
            }}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Batalkan Pembayaran Ini</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onCetakSlip) onCetakSlip(historiItem);
              }}
              className="px-3.5 py-1.5 bg-[#2b3a4a] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Cetak Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

