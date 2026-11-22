// src/views/desktop/antrean/CetakSpkModal.jsx
import React from 'react';
import {
  Printer,
  X,
  QrCode,
  Scissors,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Clock,
  Shirt,
  ShieldCheck,
  PackageCheck,
  Warehouse,
  Flame,
} from 'lucide-react';
import QRCode from '../../../components/common/QRCode';
import Barcode from '../../../components/common/Barcode';

export default function CetakSpkModal({
  isOpen,
  antrean,
  products = [],
  onClose,
}) {
  if (!isOpen || !antrean) return null;

  const handlePrint = () => {
    window.print();
  };

  const noAntrian = antrean.noAntrian || `ANT-${antrean.id}`;
  const prod = products.find((p) => p.sku === antrean.sku) || null;
  const isUrgent = antrean.prioritas === 'Urgent';

  const kebutuhanBahanList = React.useMemo(() => {
    if (!antrean.kebutuhanBahan) return [];
    if (Array.isArray(antrean.kebutuhanBahan)) return antrean.kebutuhanBahan;
    if (typeof antrean.kebutuhanBahan === 'string') {
      try {
        const parsed = JSON.parse(antrean.kebutuhanBahan);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  }, [antrean]);

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#track/${encodeURIComponent(noAntrian)}`
    : `https://konveksi.ruangtech.com/#track/${encodeURIComponent(noAntrian)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        {/* TOP TOOLBAR (HIDDEN ON PRINT) */}
        <div className="bg-[#0b1b36] text-white px-4 py-2.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-xs text-white">
              Lembar SPK & QR Code Barcode Produksi ({noAntrian})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Cetak PDF</span>
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

        {/* PRINTABLE SPK SHEET */}
        <div
          id="printable-spk"
          className="p-5 sm:p-7 overflow-y-auto space-y-3.5 bg-white text-slate-800 font-sans print:p-0 print:m-0"
        >
          {/* HEADER FORMAL SPK */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-slate-900 uppercase">
                  RUANG KONVEKSI • EMRA PRODUCTION
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Operasional Pabrik & Manajemen Antrean Produksi Garmen
              </p>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 mt-1 uppercase flex items-center gap-2">
                <span>SURAT PERINTAH KERJA (SPK) & KARTU KONTROL</span>
                {isUrgent && (
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3" /> URGENT
                  </span>
                )}
              </h1>
            </div>

            {/* BARCODE & QR CODE KANAN ATAS */}
            <div className="flex items-center gap-3 shrink-0 bg-slate-50 border border-slate-300 rounded-xl p-2.5">
              <div className="flex flex-col items-center">
                <Barcode value={noAntrian} height={36} width={150} showText={false} />
                <span className="font-mono font-bold text-[9px] text-slate-700 tracking-wider mt-0.5">
                  {noAntrian}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-2.5 flex flex-col items-center">
                <QRCode value={noAntrian} size={64} includeMargin={false} />
                <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                  Scan SPK
                </span>
              </div>
            </div>
          </div>

          {/* DOKUMEN & RINCIAN ORDER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 rounded-xl p-3 bg-slate-50/70">
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">
                No. SPK / Antrean
              </span>
              <span className="font-mono font-black text-sm text-slate-900 block mt-0.5">
                {noAntrian}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">
                Tgl Masuk SPK
              </span>
              <span className="font-bold text-slate-800 block mt-0.5">
                {antrean.tglMasuk || '-'}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">
                Target Deadline
              </span>
              <span className="font-bold text-rose-700 block mt-0.5">
                {antrean.deadline ? `${antrean.deadline}` : 'Sesuai Jadwal'}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">
                Sumber / No. Reff PO
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5 truncate">
                {antrean.sumberPermintaan || 'Stok Gudang'}{' '}
                {antrean.noReff && antrean.noReff !== '-' ? `(${antrean.noReff})` : ''}
              </span>
            </div>
          </div>

          {/* RINCIAN PRODUK KONVEKSI */}
          <div className="border border-slate-300 rounded-xl p-3 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">
                  Model & Varian Produk
                </span>
                <div className="text-sm font-black text-slate-900 leading-tight">
                  {antrean.namaProduk}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap font-medium">
                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                    SKU: {antrean.sku}
                  </span>
                  <span>•</span>
                  <span>Kategori: <strong>{antrean.kategori || prod?.kategori || '-'}</strong></span>
                  <span>•</span>
                  <span>Varian: <strong>{antrean.varian || 'Polos'}</strong></span>
                  <span>•</span>
                  <span>Ukuran: <strong>{antrean.ukuran || 'All Size'}</strong></span>
                </div>
              </div>

              {/* TOTAL TARGET JUMLAH (PCS) */}
              <div className="text-right shrink-0 bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2">
                <span className="text-[9.5px] uppercase font-black text-emerald-800 block">
                  Target Kuantitas
                </span>
                <span className="font-mono font-black text-xl text-emerald-700 block">
                  {Number(antrean.qty || 0).toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-bold text-emerald-900">Pcs</span>
                </span>
              </div>
            </div>
          </div>

          {/* RESEP KEBUTUHAN BAHAN BAKU & AKSESORIS (BOM) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                Resep / Kebutuhan Bahan Baku & Aksesoris Batch ({kebutuhanBahanList.length} Bahan)
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Diambil dari Gudang Bahan oleh Divisi Cutting
              </span>
            </div>

            {kebutuhanBahanList.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                Tidak ada rincian bahan baku tercatat pada SPK ini.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-[10.5px] font-bold text-slate-700">
                    <th className="py-1 px-2.5 w-8 text-center border-r border-slate-200">No</th>
                    <th className="py-1 px-2.5 border-r border-slate-200">Kode & Nama Bahan</th>
                    <th className="py-1 px-2.5 text-center w-24 border-r border-slate-200">Kebutuhan</th>
                    <th className="py-1 px-2.5 text-center w-16 border-r border-slate-200">Satuan</th>
                    <th className="py-1 px-2.5">Catatan Pemakaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {kebutuhanBahanList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-2.5 text-center font-mono text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-2.5 border-r border-slate-200">
                        <span className="font-bold text-slate-900 block">
                          {item.namaBahan || item.nama || '-'}
                        </span>
                        {item.kodeBahan && (
                          <span className="font-mono text-[10px] text-slate-500 block">
                            {item.kodeBahan}
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                        {Number(item.qty || item.qtyDibutuhkan || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-2.5 text-center text-slate-600 border-r border-slate-200">
                        {item.satuan || 'Pcs'}
                      </td>
                      <td className="py-1 px-2.5 text-slate-600 text-[11px]">
                        {item.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* CATATAN / SOP INTRUKSI PABRIK */}
          {antrean.catatan && (
            <div className="border border-slate-300 rounded-xl p-2.5 bg-amber-50/50 text-xs">
              <span className="text-[9.5px] font-black uppercase text-amber-800 tracking-wider block">
                Catatan Khusus / Instruksi SOP Produksi:
              </span>
              <p className="text-slate-800 font-medium mt-0.5 text-xs leading-relaxed">
                {antrean.catatan}
              </p>
            </div>
          )}

          {/* LEMBAR KONTROL CHECKPOINT & PARAF SETIAP DIVISI (SCAN SPK) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-xs">
              <span className="font-black uppercase tracking-wider text-[10.5px]">
                KARTU KONTROL & PARAF CEK FISIK DIVISI (CHECKPOINT SOP)
              </span>
              <span className="text-[9.5px] text-slate-300">
                Wajib di-scan barcode atau diparaf oleh setiap PIC Divisi
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10.5px] font-bold text-slate-800">
                  <th className="py-1.5 px-2.5 w-32 border-r border-slate-300">Tahapan Divisi</th>
                  <th className="py-1.5 px-2.5 w-32 border-r border-slate-300">Petugas / Penjahit</th>
                  <th className="py-1.5 px-2.5 w-24 border-r border-slate-300">Tanggal</th>
                  <th className="py-1.5 px-2.5 w-24 border-r border-slate-300 text-center">Qty Selesai</th>
                  <th className="py-1.5 px-2.5 w-28 text-center border-r border-slate-300">Status Tahapan</th>
                  <th className="py-1.5 px-2.5 w-24 text-center">Paraf PIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                {/* 1. CUTTING */}
                <tr className="h-10">
                  <td className="py-1.5 px-2.5 font-bold text-slate-900 border-r border-slate-300">
                    1. Divisi Cutting
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-slate-700">
                    {antrean.timCutting || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono text-[11px]">
                    {antrean.tglSerahCutting || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold">
                    {antrean.tglSerahCutting ? `${antrean.qty} Pcs` : ''}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center text-[10.5px]">
                    {antrean.tglSerahCutting ? 'Lolos Potong' : ''}
                  </td>
                  <td className="py-1.5 px-2.5 text-center"></td>
                </tr>

                {/* 2. JAHIT */}
                <tr className="h-10 bg-slate-50/60">
                  <td className="py-1.5 px-2.5 font-bold text-purple-900 border-r border-slate-300">
                    2. Divisi Jahit
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-purple-800">
                    {antrean.timJahit || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono text-[11px]">
                    {antrean.tglSerahJahit || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold">
                    {antrean.tglSerahJahit ? `${antrean.qty} Pcs` : ''}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center text-[10.5px]">
                    {antrean.tglSerahJahit ? 'Jahitan Lengkap' : ''}
                  </td>
                  <td className="py-1.5 px-2.5 text-center"></td>
                </tr>

                {/* 3. QC */}
                <tr className="h-10">
                  <td className="py-1.5 px-2.5 font-bold text-teal-900 border-r border-slate-300">
                    3. Divisi QC
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-teal-800">
                    {antrean.timQc || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono text-[11px]">
                    {antrean.tglSerahQc || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold">
                    {antrean.qtyPassQc ? `${antrean.qtyPassQc} Pcs` : ''}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center text-[10.5px]">
                    {antrean.statusQc || (antrean.tglSerahQc ? 'Lolos QC' : '')}
                  </td>
                  <td className="py-1.5 px-2.5 text-center"></td>
                </tr>

                {/* 4. FINISHING */}
                <tr className="h-10 bg-slate-50/60">
                  <td className="py-1.5 px-2.5 font-bold text-rose-900 border-r border-slate-300">
                    4. Finishing & Packing
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-rose-800">
                    {antrean.timFinishing || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono text-[11px]">
                    {antrean.tglSerahFinishing || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold">
                    {antrean.tglSerahFinishing ? `${antrean.qty} Pcs` : ''}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center text-[10.5px]">
                    {antrean.tglSerahFinishing ? 'Kemas Polybag' : ''}
                  </td>
                  <td className="py-1.5 px-2.5 text-center"></td>
                </tr>

                {/* 5. GUDANG JADI */}
                <tr className="h-10">
                  <td className="py-1.5 px-2.5 font-bold text-emerald-900 border-r border-slate-300">
                    5. Gudang Jadi (Opname)
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-emerald-800">
                    {antrean.petugasTerimaGudang || antrean.petugas || 'Admin Gudang'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono text-[11px]">
                    {antrean.tglSelesai || antrean.tglSerahGudang || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold text-emerald-700">
                    {antrean.status === 'Selesai' ? `${antrean.qty} Pcs` : ''}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-300 text-center text-[10.5px] font-bold text-emerald-700">
                    {antrean.status === 'Selesai' ? 'Disimpan di Rak' : ''}
                  </td>
                  <td className="py-1.5 px-2.5 text-center"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOOTER KETERANGAN PRINT */}
          <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200">
            <span>
              Dicetak pada: {new Date().toLocaleString('id-ID')} • Lembar Kerja Resmi Ruang Konveksi
            </span>
            <span className="font-mono">
              Live Tracking: {trackingUrl}
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION (SCREEN ONLY) */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak SPK Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
