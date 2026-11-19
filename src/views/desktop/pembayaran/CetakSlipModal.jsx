// g:\Konveksi\src\views\desktop\pembayaran\CetakSlipModal.jsx
import React from "react";
import { Printer, X, FileText, CreditCard } from "lucide-react";
import { angkaTerbilang } from "./utils";

export default function CetakSlipModal({
  isOpen,
  slipData,
  startDate = "",
  endDate = "",
  onClose,
  onBayarKaryawan,
}) {
  if (!isOpen || !slipData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isJahit =
    slipData.tahapan === "Jahit" ||
    (slipData.tahapan || "").toLowerCase().includes("jahit");

  const potongKasbon = Number(slipData.totalPotonganKasbon || 0);
  const totalGajiBersih = Number(
    slipData.totalBersih ??
      Math.max(0, Number(slipData.totalKotor || 0) - potongKasbon),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Toolbar */}
        <div className="bg-[#0b1b36] text-white px-4 py-2.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-xs text-white">
              Slip Gaji Mingguan / Periode Karyawan
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slip Content Paper (Emra Production Layout) */}
        <div
          className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-white text-slate-800 font-sans"
          id="printable-slip"
        >
          {/* Slip Header Bordered Box */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
                  SLIP GAJI EMRA PRODUCTION
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Ruang Konveksi Management System
                </p>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-slate-500 font-medium">
                      Tanggal Periode
                    </span>
                    <span className="font-bold text-slate-800">
                      :{" "}
                      {slipData.periode ||
                        (startDate ? `${startDate} s.d ${endDate}` : "-")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-slate-500 font-medium">
                      {isJahit ? "Nama Penjahit" : "Nama Tim"}
                    </span>
                    <span className="font-black text-slate-900 text-xs">
                      : {slipData.namaPetugas}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-slate-500 font-medium">
                      Bagian / Divisi
                    </span>
                    <span className="font-bold text-slate-800">
                      : {slipData.tahapan || "Konveksi"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monogram / Logo Box */}
              <div className="w-16 h-16 rounded-xl border border-amber-300 bg-amber-50/60 flex flex-col items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                <span className="font-serif font-black text-2xl tracking-tighter text-amber-700">
                  EM
                </span>
                <span className="text-[8px] font-black tracking-widest text-amber-900 uppercase">
                  PROD
                </span>
              </div>
            </div>
          </div>

          {/* Rincian Finansial (Box Rincian Sesuai Spreadsheet Emra) */}
          <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-2 text-xs">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
              Rincian
            </span>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600 font-medium">
                Total Pembayaran
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                Rp {Number(slipData.totalKotor || 0).toLocaleString("id-ID")}
              </span>
            </div>

            {/* KHUSUS PENJAHIT: POTONGAN & SISA PINJAMAN DITAMPILKAN */}
            {isJahit && (
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-600 font-medium">
                  Potongan Pinjaman (Kasbon)
                </span>
                <span className="font-mono font-bold text-amber-700">
                  {potongKasbon > 0
                    ? `- Rp ${potongKasbon.toLocaleString("id-ID")}`
                    : "-"}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase text-xs">
                * Total GAJI (Bersih Diterima)
              </span>
              <span className="font-mono font-black text-base text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Rp {totalGajiBersih.toLocaleString("id-ID")}
              </span>
            </div>

            {isJahit && (
              <div className="flex items-center justify-between py-0.5 text-slate-600">
                <span className="text-[11px] font-medium">
                  * Sisa Pinjaman / Kasbon Aktif
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {Number(slipData.sisaPinjamanAktif || 0) > 0
                    ? `Rp ${Number(slipData.sisaPinjamanAktif).toLocaleString("id-ID")}`
                    : "-"}
                </span>
              </div>
            )}

            <div className="pt-1 text-[11px] text-slate-600">
              <span className="font-bold">* Terbilang : </span>
              <span className="font-semibold italic text-slate-800">
                "{angkaTerbilang(totalGajiBersih)}"
              </span>
            </div>
          </div>

          {/* Rincian Pembayaran Table (Grand Total Qty & Breakdown) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wide">
                Rincian Pembayaran
              </span>
              <div className="font-bold text-rose-600 text-xs flex items-center gap-1">
                <span>* Grand Total QTY :</span>
                <span className="font-mono font-black text-sm text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
                  {Number(slipData.totalQty || 0).toLocaleString("id-ID")} Pcs
                </span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#1e293b] text-white font-extrabold text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-700 w-10 text-center">
                      NO
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700">
                      MODEL
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700">
                      WARNA
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700 text-right">
                      HARGA
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700 text-center">
                      QTY
                    </th>
                    <th className="py-2 px-3 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {(slipData.items || []).map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {item.skuInduk || item.namaProduk}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">
                        {item.varian || "-"}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        Rp{" "}
                        {Number(item.tarifPerPcs || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono font-black text-slate-900">
                        {Number(item.qty || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-black text-slate-900">
                        Rp {Number(item.totalUpah || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td
                      colSpan="4"
                      className="py-2 px-3 text-right uppercase text-slate-700"
                    >
                      Total Qty & Total Upah:
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black text-rose-700">
                      {Number(slipData.totalQty || 0).toLocaleString("id-ID")}{" "}
                      Pcs
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                      Rp{" "}
                      {Number(slipData.totalKotor || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs">
            <div>
              <p className="text-slate-500 font-medium">
                Yang Menyerahkan (Admin / Kasir)
              </p>
              <div className="h-14 flex items-end justify-center font-bold text-slate-900">
                ( Admin Produksi )
              </div>
            </div>
            <div>
              <p className="text-slate-500 font-medium">
                Yang Menerima (Karyawan / Tim)
              </p>
              <div className="h-14 flex items-end justify-center font-bold text-slate-900">
                ( {slipData.namaPetugas} )
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Status:{" "}
            <strong
              className={
                slipData.pendingCount === 0
                  ? "text-emerald-700"
                  : "text-rose-600"
              }
            >
              {slipData.pendingCount === 0
                ? "Sudah Lunas"
                : `${slipData.pendingCount} Order Belum Lunas`}
            </strong>
          </span>

          <div className="flex items-center gap-2">
            {slipData.pendingCount > 0 && onBayarKaryawan && (
              <button
                type="button"
                onClick={() => onBayarKaryawan(slipData)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bayar Gaji Karyawan Ini</span>
              </button>
            )}
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
