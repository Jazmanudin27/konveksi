// g:\Konveksi\src\views\desktop\pembayaran\InputPembayaranTab.jsx
import React from "react";
import {
  Scissors,
  Shirt,
  ShieldCheck,
  PackageCheck,
  Calendar,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { angkaTerbilang } from "./utils";

export default function InputPembayaranTab({
  sheetTahap,
  setSheetTahap,
  sheetTeam,
  setSheetTeam,
  sheetTeamsList = [],
  activeSheetTeamData,
  groupedByTahap = [],
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleSetPresetDate,
  manualPotonganMap = {},
  setManualPotonganMap,
  displayTotalBersih = 0,
  currentManualPotongan = 0,
  handleOpenPay,
}) {
  const isJahit = sheetTahap === "Jahit";

  return (
    <div className="space-y-3">
      {/* 1. TOOLBAR FILTER & DIVISI SELECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Divisi Tabs (Pemotong, Penjahit, QC, Finishing) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "Cutting", label: "Pemotong (Cutting)", icon: Scissors },
            { key: "Jahit", label: "Penjahit (Sewing)", icon: Shirt },
            { key: "QC", label: "Quality Control (QC)", icon: ShieldCheck },
            {
              key: "Finishing",
              label: "Finishing & Packing",
              icon: PackageCheck,
            },
          ].map((tab) => {
            const isSelected = sheetTahap === tab.key;
            const matchedGroup = groupedByTahap.find((g) => g.key === tab.key);
            const countTeams = matchedGroup ? matchedGroup.teams.length : 0;
            const IconComponent = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSheetTahap(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {countTeams} {tab.key === "Jahit" ? "Penjahit" : "Tim"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Tanggal & Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">
              Periode:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-6 px-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none"
            />
            <span className="text-slate-400 text-xs font-bold">s.d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-6 px-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetPresetDate("minggu")}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors"
            >
              1 Minggu
            </button>
            <button
              type="button"
              onClick={() => handleSetPresetDate("bulan")}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handleSetPresetDate("semua")}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors"
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      {/* 2. KERTAS SLIP GAJI EMRA PRODUCTION (GOOGLE SHEETS STYLE) */}
      <div className="w-full max-w-4xl mx-auto bg-white border-2 border-sky-400 p-6 sm:p-8 shadow-sm font-mono text-black select-none">
        {/* Header Title & Monogram */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase text-black">
              INPUT GAJI EMRA PRODUCTION
            </h1>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide">
              * Mode Input Pembayaran Otomatis & Sinkronisasi Borongan
            </p>
          </div>

          <div className="flex flex-col items-center justify-center border border-amber-300/80 bg-amber-50/50 px-3 py-1.5 rounded-lg text-amber-800 shadow-2xs">
            <span className="font-serif font-black text-2xl tracking-tighter text-amber-600 leading-none">
              MR
            </span>
            <span className="text-[8px] font-bold tracking-widest text-amber-900 uppercase">
              PRODUCTION
            </span>
          </div>
        </div>

        {/* Informasi Karyawan / Tim */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-32 text-slate-800">Tanggal Priode</span>
              <span className="text-black">:</span>
              <span className="font-bold text-black border-b border-dotted border-black flex-1 pb-0.5">
                {startDate || "-"} s.d {endDate || "-"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-32 text-slate-800">
                {isJahit ? "Nama Penjahit" : "Nama Tim"}
              </span>
              <span className="text-black">:</span>
              <div className="flex-1 relative">
                <select
                  value={sheetTeam}
                  onChange={(e) => setSheetTeam(e.target.value)}
                  className="w-full bg-transparent border-b border-black font-black text-xs uppercase focus:outline-none appearance-none cursor-pointer pr-5 py-0.5"
                >
                  {sheetTeamsList.length === 0 ? (
                    <option value="">(Tidak ada tagihan {sheetTahap})</option>
                  ) : (
                    sheetTeamsList.map((t) => (
                      <option key={t.namaPetugas} value={t.namaPetugas}>
                        {t.namaPetugas} ({t.items.length} Order - Rp{" "}
                        {t.totalKotor.toLocaleString("id-ID")})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-3 h-3 text-black absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-32 text-slate-800">ID Karyawan</span>
              <span className="text-black">:</span>
              <span className="font-bold text-black border-b border-dotted border-black flex-1 pb-0.5">
                {activeSheetTeamData?.items[0]?.nikPetugas ||
                activeSheetTeamData?.items[0]?.idPetugas ||
                activeSheetTeamData
                  ? `KRY-${activeSheetTeamData.namaPetugas.length}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Kotak Rincian Pembayaran */}
        <div className="mt-6 space-y-2 text-xs">
          <div className="font-bold text-black underline tracking-wide text-xs">
            Rincian
          </div>

          <div className="flex items-center justify-between border-b border-dotted border-black pb-1">
            <span className="italic text-slate-800">Total Pembayaran</span>
            <div className="flex items-center gap-4">
              <span>: Rp</span>
              <span className="font-bold text-right min-w-[120px]">
                {activeSheetTeamData
                  ? Number(activeSheetTeamData.totalKotor || 0).toLocaleString(
                      "id-ID",
                    )
                  : "0"}
              </span>
            </div>
          </div>

          {/* KHUSUS PENJAHIT: BISA INPUT MANUAL POTONGAN PINJAMAN */}
          {isJahit && activeSheetTeamData && (
            <div className="flex items-center justify-between border-b-2 border-amber-400 bg-amber-50/60 p-2 rounded-md transition-all">
              <div className="flex flex-col">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>Potongan Pinjaman (Input Manual):</span>
                  {activeSheetTeamData.sisaPinjamanAktif > 0 && (
                    <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                      Saldo Kasbon: Rp{" "}
                      {activeSheetTeamData.sisaPinjamanAktif.toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  )}
                </span>
                <span className="text-[9.5px] text-slate-500 font-sans italic">
                  * Otomatis memotong saldo kasbon karyawan saat tombol bayar
                  dikonfirmasi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900">: Rp</span>
                <input
                  type="number"
                  min="0"
                  max={activeSheetTeamData.totalKotor}
                  placeholder="0"
                  value={
                    manualPotonganMap[sheetTeam] !== undefined
                      ? manualPotonganMap[sheetTeam]
                      : activeSheetTeamData.totalPotonganKasbon || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualPotonganMap((prev) => ({
                      ...prev,
                      [sheetTeam]: val,
                    }));
                  }}
                  className="w-32 h-7 px-2 bg-white border-2 border-amber-400 rounded text-right font-mono font-black text-xs text-amber-950 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Garis Tebal Pembatas */}
          <div className="h-0.5 bg-black my-2"></div>

          {/* Total GAJI */}
          <div className="flex items-center justify-between font-bold text-sm">
            <span className="text-black font-black tracking-wide">
              * Total GAJI
            </span>
            <div className="flex items-center gap-4">
              <span>: Rp</span>
              <span className="font-black text-right min-w-[120px] text-sm">
                {displayTotalBersih.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Sisa Pinjaman (Khusus Penjahit) */}
          {isJahit && activeSheetTeamData && (
            <div className="flex items-center justify-between text-xs border-b border-dotted border-black pb-1 pt-1">
              <span className="text-slate-800 font-semibold">
                * Sisa Pinjaman
              </span>
              <div className="flex items-center gap-4">
                <span>:</span>
                <span className="font-bold text-right min-w-[120px]">
                  {(() => {
                    const sisaAktif =
                      activeSheetTeamData.sisaPinjamanAktif || 0;
                    const sisaSetelahPotong = Math.max(
                      0,
                      sisaAktif - currentManualPotongan,
                    );
                    return sisaSetelahPotong > 0
                      ? `Rp ${sisaSetelahPotong.toLocaleString("id-ID")}`
                      : "-";
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Terbilang */}
          <div className="flex items-start gap-2 pt-1 text-xs">
            <span className="text-slate-800 shrink-0">* Terbilang</span>
            <span className="text-black">:</span>
            <span className="border-b border-dotted border-black flex-1 pb-1 font-semibold italic text-slate-800">
              {angkaTerbilang(displayTotalBersih)}
            </span>
          </div>
        </div>

        {/* Header Bagian Rincian Pembayaran */}
        <div className="mt-8 space-y-1.5">
          <div className="font-bold text-black underline tracking-wide text-xs">
            Rincian Pembayaran
          </div>

          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-bold text-black">* Grand Total QTY</span>
            <div className="flex items-center gap-3">
              <span>:</span>
              <span className="font-black text-rose-600 text-sm font-mono">
                {activeSheetTeamData ? activeSheetTeamData.totalQty : 0}
              </span>
              <span className="text-slate-500 font-sans">Pcs</span>
            </div>
          </div>
        </div>

        {/* TABEL KISI-KISI SPREADSHEET (PERSIS REFERENSI USER) */}
        <div className="mt-2 border border-black overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-black font-mono">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold uppercase tracking-wider text-center text-[11px] border border-black">
                <th className="py-1.5 px-3 border border-black text-left">
                  MODEL
                </th>
                <th className="py-1.5 px-3 border border-black w-32">Warna</th>
                <th className="py-1.5 px-3 border border-black w-28">Harga</th>
                <th className="py-1.5 px-3 border border-black w-20">Qty</th>
                <th className="py-1.5 px-3 border border-black w-36">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Data Baris Order */}
              {activeSheetTeamData &&
                activeSheetTeamData.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-amber-50/20 border-b border-black text-black"
                  >
                    <td
                      className="py-1.5 px-2.5 border border-black font-bold uppercase truncate max-w-[240px]"
                      title={item.namaProduk}
                    >
                      {item.skuInduk || item.namaProduk}
                    </td>
                    <td className="py-1.5 px-2.5 border border-black text-center font-medium">
                      {item.varian || "-"}
                    </td>
                    <td className="py-1.5 px-2.5 border border-black text-right font-medium">
                      Rp {Number(item.tarifPerPcs || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-1.5 px-2.5 border border-black text-center font-bold">
                      {Number(item.qty || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-1.5 px-2.5 border border-black text-right font-bold">
                      <div className="flex items-center justify-between">
                        <span>Rp</span>
                        <span>
                          {Number(item.totalUpah || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

              {/* Empty Grid Rows (Memberi tampilan persis kisi-kisi Google Sheet) */}
              {Array.from({
                length: Math.max(
                  3,
                  8 - (activeSheetTeamData?.items?.length || 0),
                ),
              }).map((_, emptyIdx) => (
                <tr
                  key={`empty-${emptyIdx}`}
                  className="h-6 border-b border-black"
                >
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER ACTION BUTTON */}
        {activeSheetTeamData && activeSheetTeamData.pendingCount > 0 && (
          <div className="mt-5 pt-3 border-t border-slate-300 flex items-center justify-end print:hidden">
            <button
              type="button"
              onClick={() => {
                const pendingItems = activeSheetTeamData.items.filter(
                  (i) => i.statusBayar !== "Lunas",
                );
                handleOpenPay(
                  pendingItems,
                  isJahit ? currentManualPotongan : 0,
                );
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
              <span>
                Bayar Gaji {isJahit ? "Penjahit" : "Tim"} Ini (Rp{" "}
                {displayTotalBersih.toLocaleString("id-ID")})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
