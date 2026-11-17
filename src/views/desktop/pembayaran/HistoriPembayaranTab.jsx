// g:\Konveksi\src\views\desktop\pembayaran\HistoriPembayaranTab.jsx
import React from 'react';
import {
  Search,
  Receipt,
  Calendar,
  Printer,
  Eye,
  RotateCcw,
} from 'lucide-react';

export default function HistoriPembayaranTab({
  historiBayarList = [],
  searchQuery = '',
  setSearchQuery,
  getTahapanBadge,
  onOpenSlipHistori,
  onOpenDetailHistori,
  onBatalHistori,
}) {
  const filteredList = historiBayarList.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (h.namaPetugas || '').toLowerCase().includes(q) ||
      (h.tahapan || '').toLowerCase().includes(q) ||
      (h.tglBayar || '').toLowerCase().includes(q) ||
      (h.periode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari penerima, nama tim, tanggal bayar, atau periode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0284c7]"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Total Histori: <strong className="text-slate-800">{filteredList.length}</strong> transaksi lunas
        </div>
      </div>

      {/* TABEL SPREADSHEET HISTORI PEMBAYARAN */}
      <div className="bg-white border-2 border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-800">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase border border-slate-800">
                <th className="py-2.5 px-3 text-center w-12 border border-slate-800 text-white font-bold">
                  NO
                </th>
                <th className="py-2.5 px-4 whitespace-nowrap border border-slate-800 text-white font-bold">
                  TANGGAL BAYAR & METODE
                </th>
                <th className="py-2.5 px-4 whitespace-nowrap border border-slate-800 text-white font-bold">
                  PERIODE KERJA
                </th>
                <th className="py-2.5 px-4 border border-slate-800 text-white font-bold">
                  PENERIMA UPAH & DIVISI
                </th>
                <th className="py-2.5 px-4 text-center whitespace-nowrap border border-slate-800 text-white font-bold">
                  VOLUME PEKERJAAN
                </th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap border border-slate-800 text-white font-bold">
                  JUMLAH BAYAR
                </th>
                <th className="py-2.5 px-4 text-center w-40 whitespace-nowrap border border-slate-800 text-white font-bold">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center text-slate-400 border border-slate-800"
                  >
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-600">
                      Belum ada histori pembayaran
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Lakukan input pembayaran pada tab "Input Pembayaran" untuk mencatat pembayaran baru
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((h, idx) => (
                  <tr
                    key={h.key || idx}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-800"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-700 font-bold font-mono border border-slate-800">
                      {idx + 1}
                    </td>

                    {/* Tanggal Pembayaran */}
                    <td className="py-2.5 px-4 border border-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{h.tglBayar}</span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 block mt-0.5 font-sans">
                        Metode: {h.metodeBayar || 'Tunai'}
                      </span>
                    </td>

                    {/* Periode */}
                    <td className="py-2.5 px-4 border border-slate-800 whitespace-nowrap font-mono text-slate-800 text-xs">
                      {h.periode}
                    </td>

                    {/* Tim / Penjahit */}
                    <td className="py-2.5 px-4 border border-slate-800">
                      <div className="font-bold text-slate-900 text-sm">
                        {h.namaPetugas}
                      </div>
                      <div className="mt-0.5">{getTahapanBadge(h.tahapan)}</div>
                    </td>

                    {/* Jumlah Order & Pcs */}
                    <td className="py-2.5 px-4 border border-slate-800 text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-rose-800 text-xs">
                        {h.totalQty.toLocaleString('id-ID')} Pcs
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        {h.items.length} Order Pekerjaan
                      </div>
                    </td>

                    {/* Jumlah Bayar */}
                    <td className="py-2.5 px-4 border border-slate-800 text-right whitespace-nowrap">
                      <span className="font-mono font-black text-sm text-[#064e3b]">
                        Rp {h.totalBersih.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Aksi: Cetak Slip, Show, dan Batal */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap border border-slate-800">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Tombol Cetak Slip (Khusus Sudah Bayar / Histori) */}
                        <button
                          type="button"
                          onClick={() => onOpenSlipHistori(h)}
                          className="px-2.5 py-1.5 bg-[#2b3a4a] hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          title="Cetak slip bukti pembayaran upah resmi"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" />
                          <span>Cetak Slip</span>
                        </button>

                        {/* Tombol Show (Rincian) */}
                        <button
                          type="button"
                          onClick={() => onOpenDetailHistori(h)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          title="Lihat rincian order yang dibayar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </button>

                        {/* Tombol Batal */}
                        <button
                          type="button"
                          onClick={() => onBatalHistori(h)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          title="Batalkan pembayaran dan kembalikan ke status belum lunas"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Batal</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

