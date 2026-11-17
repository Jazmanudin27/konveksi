// g:\Konveksi\src\views\desktop\pembayaran\KonfirmasiBayarModal.jsx
import React from 'react';
import { CreditCard, X, Check, Wallet } from 'lucide-react';

export default function KonfirmasiBayarModal({
  isOpen,
  targetPayItems = [],
  payForm,
  setPayForm,
  kasbonInfo,
  potonganKasbon,
  setPotonganKasbon,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  const totalGross = targetPayItems.reduce(
    (acc, c) => acc + (Number(c.totalUpah) || 0),
    0
  );
  const potongVal = Number(potonganKasbon) || 0;
  const netPay = Math.max(0, totalGross - potongVal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#064e3b] to-[#04362d] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <CreditCard className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Konfirmasi Pembayaran Upah
              </h3>
              <p className="text-[10.5px] text-emerald-200/90">
                {targetPayItems.length === 1
                  ? `Bayar upah ke: ${targetPayItems[0].namaPetugas}`
                  : `Bayar sekaligus ${targetPayItems.length} transaksi upah`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Ringkasan Total yang Harus Dibayar */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  UPAH KOTOR (GROSS)
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {targetPayItems.length} Tagihan •{' '}
                  {targetPayItems.reduce((acc, c) => acc + (Number(c.qty) || 0), 0)} Pcs
                </span>
              </div>
              <div className="font-mono font-black text-lg text-emerald-800">
                Rp {totalGross.toLocaleString('id-ID')}
              </div>
            </div>

            {/* ALERT & INPUT POTONG KASBON JIKA ADA SALDO KASBON AKTIF */}
            {kasbonInfo && kasbonInfo.totalSisa > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>Ada Kasbon Belum Lunas</span>
                  </div>
                  <span className="font-mono font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                    Sisa: Rp {Number(kasbonInfo.totalSisa).toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Potongan Kasbon Periode Ini (Rp)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={Math.min(totalGross, Number(kasbonInfo.totalSisa))}
                      value={potonganKasbon}
                      onChange={(e) =>
                        setPotonganKasbon(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full h-8 px-2.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPotonganKasbon(
                          Math.min(totalGross, Number(kasbonInfo.totalSisa))
                        )
                      }
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold whitespace-nowrap cursor-pointer"
                      title="Potong penuh sesuai sisa kasbon atau maksimal upah"
                    >
                      Potong Maksimal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPotonganKasbon(0)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer"
                      title="Jangan potong kasbon sekarang"
                    >
                      Lewati
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Total Gaji Bersih */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                  TOTAL DIBAYARKAN (NET)
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {potongVal > 0 ? `Sudah dipotong kasbon Rp ${potongVal.toLocaleString('id-ID')}` : 'Tidak ada potongan kasbon'}
                </span>
              </div>
              <div className="font-mono font-black text-xl text-emerald-300">
                Rp {netPay.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Form Fields: Tanggal & Metode Bayar */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                required
                value={payForm.tglBayar}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, tglBayar: e.target.value }))
                }
                className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={payForm.metodeBayar}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, metodeBayar: e.target.value }))
                }
                className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
              >
                <option value="Tunai / Cash">Tunai / Cash</option>
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>
          </div>

          {/* Catatan / No Reff Transfer */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan / Bukti Ref (Opsional)
            </label>
            <input
              type="text"
              placeholder="Misal: Sudah ditransfer via BCA, titip via mandor, dll..."
              value={payForm.catatan}
              onChange={(e) =>
                setPayForm((p) => ({ ...p, catatan: e.target.value }))
              }
              className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Konfirmasi Lunas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

