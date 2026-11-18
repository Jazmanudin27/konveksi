import React from 'react';
import {
  X,
  ArrowLeft,
  Scissors,
  Pencil,
  ReceiptText,
  Calendar,
  Shirt,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  Warehouse,
  Send,
  Share2,
  Layers,
} from 'lucide-react';
import SewingMachineIcon from './SewingMachineIcon';
import ShareTrackingModal from '../../../components/common/ShareTrackingModal';

export default function ModalShowAntrean({
  antrean,
  products = [],
  onClose,
  onEdit,
  onSerahCutting,
  onSerahJahit,
  onSerahQc,
  onSerahFinishing,
  onSelesaiFinishing,
  onRollbackTahap
}) {
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  if (!antrean) return null;
  const isUrgent = antrean.prioritas === 'Urgent';
  const prod = products.find(p => p.sku === antrean.sku) || null;

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
  }, [antrean.kebutuhanBahan]);

  // Kalkulasi HPP Otomatis untuk tampilan detail antrean
  const hppShowData = React.useMemo(() => {
    const qtyTarget = Math.max(1, Number(antrean.qty) || 1);

    // Total Biaya Bahan
    const totalBahan = kebutuhanBahanList.reduce((acc, curr) => {
      const q = Number(curr.qty) || 0;
      const h = Number(curr.hargaSatuan) || 0;
      return acc + q * h;
    }, 0);

    // Upah Borongan (Cutting, Jahit, Finishing)
    const biayaCut = Number(
      antrean.totalBiayaCutting ||
        qtyTarget * (Number(antrean.tarifCutting) || 1500)
    );
    const biayaJht = Number(
      antrean.totalBiayaJahit ||
        qtyTarget * (Number(antrean.tarifJahit) || 3500)
    );
    const biayaFin = Number(
      antrean.totalBiayaFinishing ||
        qtyTarget * (Number(antrean.tarifFinishing) || 1000)
    );
    const totalUpah = biayaCut + biayaJht + biayaFin;

    // Total HPP & HPP Per Pcs
    const totalHpp = Number(antrean.totalHpp) || totalBahan + totalUpah;
    const hppPerPcs =
      Number(antrean.hppPerPcs) || Math.round(totalHpp / qtyTarget);

    // Profit & Margin jika ada harga produk
    const hargaJual = Number(prod?.harga || 0);
    const profitPerPcs = hargaJual > 0 ? hargaJual - hppPerPcs : 0;
    const marginPersen =
      hargaJual > 0 ? Math.round((profitPerPcs / hargaJual) * 100) : 0;

    return {
      totalBahan,
      biayaCut,
      biayaJht,
      biayaFin,
      totalUpah,
      totalHpp,
      hppPerPcs,
      hargaJual,
      profitPerPcs,
      marginPersen,
    };
  }, [antrean, kebutuhanBahanList, prod]);

  // Logika Visibilitas: Sembunyikan tahap yang belum saatnya / belum diserahkan
  const showCutting = Boolean(
    antrean.tglSerahCutting ||
    antrean.status === 'Menunggu Cutting' ||
    antrean.status === 'Proses Cutting'
  );

  const showJahit = Boolean(
    antrean.tglSerahJahit ||
    (antrean.tglSerahCutting && (antrean.status === 'Proses Cutting' || antrean.status === 'Proses Jahit'))
  );

  const showQc = Boolean(
    antrean.tglSerahQc ||
    (antrean.tglSerahJahit && (antrean.status === 'Proses Jahit' || antrean.status === 'Proses QC'))
  );

  const showFinishing = Boolean(
    antrean.tglSerahFinishing ||
    (antrean.tglSerahQc && (antrean.status === 'Proses QC' || antrean.status === 'Proses Finishing'))
  );

  const showGudangJadi = Boolean(
    antrean.tglSerahGudang ||
    antrean.status === 'Selesai' ||
    antrean.status === 'Menunggu Penerimaan Gudang'
  );

  const visibleCardsCount = [showCutting, showJahit, showQc, showFinishing].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
            title="Kembali ke Daftar Antrean"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-white" />
            <h3 className="font-extrabold text-sm tracking-tight text-white">
              Detail Lembar Antrean Permintaan Produksi
            </h3>
            <span className="font-mono font-bold text-xs bg-white/20 px-2 py-0.5 rounded border border-white/25 text-white">
              {antrean.noAntrian}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Serahkan Cutting */}
          {antrean.status === 'Menunggu Cutting' && (
            <button
              type="button"
              onClick={() => {
                if (onSerahCutting) onSerahCutting(antrean);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{antrean.tglSerahCutting ? 'Update Cutting' : 'Serahkan Cutting'}</span>
            </button>
          )}

          {/* Tombol Serahkan Jahit */}
          {(antrean.status === 'Proses Cutting' || (antrean.tglSerahCutting && !antrean.tglSerahJahit)) && (
            <button
              type="button"
              onClick={() => {
                if (onSerahJahit) onSerahJahit(antrean);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <SewingMachineIcon className="w-3.5 h-3.5" />
              <span>{antrean.tglSerahJahit ? 'Update Jahit' : 'Serahkan Jahit'}</span>
            </button>
          )}

          {/* Tombol Serahkan ke QC */}
          {antrean.status === 'Proses Jahit' && (
            <button
              type="button"
              onClick={() => {
                if (onSerahQc) onSerahQc(antrean);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Serahkan ke QC</span>
            </button>
          )}

          {/* Tombol Serahkan ke Tim Gudang Jadi */}
          {antrean.status === 'Proses Finishing' ? (
            <button
              type="button"
              onClick={() => {
                if (onSelesaiFinishing) onSelesaiFinishing(antrean);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Serahkan Hasil Pengerjaan Finishing ke Tim Gudang Jadi (Step 6 SOP)"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Serahkan ke Gudang Jadi</span>
            </button>
          ) : (antrean.status === 'Proses QC' || antrean.tglSerahFinishing) && (
            <button
              type="button"
              onClick={() => {
                if (onSerahFinishing) onSerahFinishing(antrean);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Hasil QC & Finishing</span>
            </button>
          )}

          {antrean.status === 'Menunggu Cutting' ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Antrean</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onRollbackTahap) onRollbackTahap(antrean);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Batalkan ke Tahap Sebelumnya (Undo jika salah proses)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batalkan Tahap (Undo)</span>
            </button>
          )}
          {/* Tombol Bagikan Link Tracking */}
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Bagikan Tautan Tracking Live ke Customer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan Tracking PO</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            title="Tutup Halaman Penuh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BODY CONTAINER FULL SCREEN */}
      <div className="flex-1 p-2 sm:p-2.5 overflow-y-auto space-y-2 flex flex-col min-h-0">
        {/* 1. RINCIAN SPESIFIKASI PRODUK & BAHAN (PALING ATAS) */}
        <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xs shrink-0 overflow-hidden">
          <div className="p-2 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#0284c7]" />
              <h4 className="font-bold text-xs text-slate-800">
                Spesifikasi Model Pakaian & Alokasi Kebutuhan Bahan
              </h4>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Target Deadline: <strong className="text-slate-800">{antrean.deadline}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-500 text-[10px] font-extrabold uppercase border-b border-[#cbd5e1]">
                  <th className="py-1.5 px-2 text-center w-10 border-r border-[#cbd5e1]">NO</th>
                  <th className="py-1.5 px-2 border-r border-[#cbd5e1]">KODE SKU</th>
                  <th className="py-1.5 px-2 border-r border-[#cbd5e1]">NAMA MODEL PRODUK</th>
                  <th className="py-1.5 px-2 border-r border-[#cbd5e1]">KATEGORI & VARIAN</th>
                  <th className="py-1.5 px-2 border-r border-[#cbd5e1]">BAHAN BAKU UTAMA</th>
                  <th className="py-1.5 px-2 text-right border-r border-[#cbd5e1]">TARGET QTY</th>
                  <th className="py-1.5 px-2 text-slate-600 text-[11px]">CATATAN KHUSUS</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-700">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-1.5 px-2 text-center text-slate-400 font-semibold text-[11px] border-r border-[#cbd5e1]">
                    1
                  </td>
                  <td className="py-1.5 px-2 border-r border-[#cbd5e1]">
                    <span className="font-mono font-bold text-xs text-[#0284c7] bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 inline-block">
                      {antrean.sku}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-bold text-[#0f172a] text-xs border-r border-[#cbd5e1]">
                    {antrean.namaProduk || prod?.nama || '-'}
                  </td>
                  <td className="py-1.5 px-2 text-slate-700 border-r border-[#cbd5e1]">
                    {(antrean.kategori || prod?.kategori || '-') + ' • ' + (antrean.varian || prod?.varian || 'Polos')}
                  </td>
                  <td className="py-1.5 px-2 font-mono font-semibold text-cyan-800 border-r border-[#cbd5e1]">
                    {antrean.skuBahan || prod?.skuBahan || prod?.sku_bahan || '-'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-extrabold text-xs text-[#059669] border-r border-[#cbd5e1]">
                    {Number(antrean.qty).toLocaleString('id-ID')} Pcs
                  </td>
                  <td className="py-1.5 px-2 text-slate-600 text-[11px]">
                    {antrean.catatan || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 1.1 KEBUTUHAN BAHAN & AKSESORIS PRODUKSI (Kancing, Resleting, Kain, dll.) */}
        <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xs shrink-0 overflow-hidden">
          <div className="p-2 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0284c7]" />
              <h4 className="font-bold text-xs text-slate-800">
                Kebutuhan Bahan & Aksesoris Produksi (Kancing, Resleting, Benang, dll.)
              </h4>
            </div>
            <div className="text-[11px] font-bold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {kebutuhanBahanList.length} Bahan Terdaftar
            </div>
          </div>

          <div className="overflow-x-auto">
            {kebutuhanBahanList.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-xs">
                Tidak ada rincian bahan/aksesoris khusus.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-500 text-[10px] font-extrabold uppercase border-b border-[#cbd5e1]">
                    <th className="py-1.5 px-2 text-center w-10 border-r border-[#cbd5e1]">NO</th>
                    <th className="py-1.5 px-3 border-r border-[#cbd5e1]">NAMA BAHAN / AKSESORIS</th>
                    <th className="py-1.5 px-3 text-center w-20 border-r border-[#cbd5e1]">QTY</th>
                    <th className="py-1.5 px-3 w-24 border-r border-[#cbd5e1]">SATUAN</th>
                    <th className="py-1.5 px-3 text-right w-28 border-r border-[#cbd5e1]">HARGA SATUAN</th>
                    <th className="py-1.5 px-3 text-right w-28 border-r border-[#cbd5e1]">SUBTOTAL</th>
                    <th className="py-1.5 px-3 text-slate-600 text-[11px]">CATATAN / SPEK</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-slate-700 divide-y divide-slate-100">
                  {kebutuhanBahanList.map((item, idx) => {
                    const q = Number(item.qty || 0);
                    const h = Number(item.hargaSatuan || 0);
                    const sub = q * h;
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2 text-center text-slate-400 font-semibold text-[11px] border-r border-[#cbd5e1]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-[#cbd5e1]">
                          {item.namaBahan || '-'}
                        </td>
                        <td className="py-1.5 px-3 text-center font-mono font-bold text-xs text-slate-800 border-r border-[#cbd5e1]">
                          {q.toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 px-3 border-r border-[#cbd5e1]">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[11px]">
                            {item.satuan || 'Pcs'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-700 border-r border-[#cbd5e1]">
                          Rp {h.toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-xs text-[#0284c7] border-r border-[#cbd5e1] bg-sky-50/30">
                          Rp {sub.toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 text-[11px]">
                          {item.catatan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* RINGKASAN HPP OTOMATIS */}
          <div className="p-2.5 bg-slate-900 text-white border-t border-[#cbd5e1]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/10 rounded p-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-300 block">
                  Total Biaya Bahan
                </span>
                <span className="font-mono font-bold text-sm text-sky-300 block mt-0.5">
                  Rp {hppShowData.totalBahan.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="bg-white/10 rounded p-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-300 block">
                  Upah Borongan (Cut+Jht+Fin)
                </span>
                <span className="font-mono font-bold text-sm text-amber-300 block mt-0.5">
                  Rp {hppShowData.totalUpah.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="bg-white/10 rounded p-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-300 block">
                  Total HPP Batch ({antrean.qty} Pcs)
                </span>
                <span className="font-mono font-bold text-sm text-white block mt-0.5">
                  Rp {hppShowData.totalHpp.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="bg-emerald-500/20 rounded p-2 border border-emerald-400">
                <span className="text-[9.5px] uppercase font-black text-emerald-300 block">
                  ★ HPP / PCS
                </span>
                <span className="font-mono font-black text-base text-emerald-400 block mt-0.5">
                  Rp {hppShowData.hppPerPcs.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            {hppShowData.hargaJual > 0 && (
              <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-between text-xs flex-wrap gap-2 text-slate-300">
                <span>Harga Jual: <strong className="text-white font-mono">Rp {hppShowData.hargaJual.toLocaleString('id-ID')}</strong></span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${hppShowData.profitPerPcs >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  Margin: {hppShowData.profitPerPcs >= 0 ? '+' : ''}Rp {hppShowData.profitPerPcs.toLocaleString('id-ID')} ({hppShowData.marginPersen}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. INFO HEADER CARD NO ANTREAN DLL (DI BAWAHNYA) */}
        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-2xs shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div>
              <div className="text-[9.5px] uppercase font-bold text-slate-400">No Antrian</div>
              <div className="font-mono font-bold text-xs text-[#0284c7] mt-0.5 bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe] inline-block">
                {antrean.noAntrian}
              </div>
            </div>

            <div>
              <div className="text-[9.5px] uppercase font-bold text-slate-400">Tgl Masuk</div>
              <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{antrean.tglMasuk}</span>
              </div>
            </div>

            <div>
              <div className="text-[9.5px] uppercase font-bold text-slate-400">Sumber Permintaan</div>
              <div className="font-semibold text-slate-800 mt-0.5 truncate">
                {antrean.sumberPermintaan}
              </div>
            </div>

            <div>
              <div className="text-[9.5px] uppercase font-bold text-slate-400">No Referensi / PO</div>
              <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                {antrean.noReff || '-'}
              </div>
            </div>

            <div>
              <div className="text-[9.5px] uppercase font-bold text-slate-400">Prioritas</div>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                    isUrgent
                      ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]'
                      : 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]'
                  }`}
                >
                  {antrean.prioritas}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[9.5px] uppercase font-bold text-slate-400">Status Tahapan</div>
              <div className="mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                    antrean.status === 'Menunggu Cutting'
                      ? 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'
                      : antrean.status === 'Proses Cutting' || antrean.status === 'Sedang Diproses'
                      ? 'bg-[#eff6ff] text-[#0284c7] border-[#bae6fd]'
                      : antrean.status === 'Proses Jahit'
                      ? 'bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]'
                      : antrean.status === 'Proses QC'
                      ? 'bg-[#f0fdfa] text-[#0f766e] border-[#99f6e4]'
                      : antrean.status === 'Proses Finishing'
                      ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]'
                      : antrean.status === 'Selesai' || antrean.status === 'Menunggu Penerimaan Gudang'
                      ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]'
                      : 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]'
                  }`}
                >
                  {antrean.status === 'Sedang Diproses' ? 'Proses Cutting' : antrean.status === 'Menunggu Penerimaan Gudang' ? 'Selesai' : antrean.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GRID TAHAPAN PROSES AKTIF & SUDAH DISERAHKAN (TAHAP BELUM DISERAHKAN DI-HIDDEN) */}
        {visibleCardsCount > 0 && (
          <div className={`grid gap-2 ${visibleCardsCount === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {/* TAHAP 2: CUTTING */}
            {showCutting && (
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-2xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-[#0284c7]" />
                      Tahap 2: Potong / Cutting
                    </span>
                    {antrean.tglSerahCutting ? (
                      <span className="px-2 py-0.2 rounded-full bg-blue-100 text-[#0284c7] text-[9.5px] font-extrabold border border-blue-200">
                        Sudah Diserahkan
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9.5px] font-extrabold border border-amber-200">
                        Menunggu Penyerahan
                      </span>
                    )}
                  </div>

                  {antrean.tglSerahCutting ? (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#f8fafc] p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tgl Serah</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">{antrean.tglSerahCutting}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tim Potong</span>
                        <span className="font-bold text-[#0284c7] block text-[11px] mt-0.5 truncate">{antrean.timCutting || 'Tim Cutting'}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tarif/Pcs</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">
                          Rp {(Number(antrean.tarifCutting) || 1500).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Biaya</span>
                        <span className="font-mono font-extrabold text-[#059669] text-xs block mt-0.5">
                          Rp {(Number(antrean.totalBiayaCutting) || ((antrean.qty || 0) * (antrean.tarifCutting || 1500))).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {antrean.catatanCutting && (
                        <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200 text-slate-600 text-[10.5px]">
                          <strong>Catatan:</strong> {antrean.catatanCutting}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs gap-2">
                      <div className="text-amber-800 text-[11px]">
                        Status: <strong>Antrean Baru</strong>. Siap dialokasikan ke Tim Potong.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSerahCutting) onSerahCutting(antrean);
                        }}
                        className="px-2.5 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Serahkan ke Cutting</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAHAP 3: JAHIT */}
            {showJahit && (
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-2xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <SewingMachineIcon className="w-3.5 h-3.5 text-[#4f46e5]" />
                      Tahap 3: Perakitan / Jahit
                    </span>
                    {antrean.tglSerahJahit ? (
                      <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-[#4338ca] text-[9.5px] font-extrabold border border-indigo-200">
                        Sudah Diserahkan
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9.5px] font-extrabold border border-amber-200">
                        Menunggu Penyerahan
                      </span>
                    )}
                  </div>

                  {antrean.tglSerahJahit ? (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#f8fafc] p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tgl Serah</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">{antrean.tglSerahJahit}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tim Jahit</span>
                        <span className="font-bold text-[#4338ca] block text-[11px] mt-0.5 truncate">{antrean.timJahit || 'Tim Jahit'}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tarif/Pcs</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">
                          Rp {(Number(antrean.tarifJahit) || 3500).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Biaya</span>
                        <span className="font-mono font-extrabold text-[#059669] text-xs block mt-0.5">
                          Rp {(Number(antrean.totalBiayaJahit) || ((antrean.qty || 0) * (antrean.tarifJahit || 3500))).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {antrean.catatanJahit && (
                        <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200 text-slate-600 text-[10.5px]">
                          <strong>Catatan:</strong> {antrean.catatanJahit}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2">
                      <div className="text-slate-600 text-[11px]">
                        Cutting berjalan/selesai. Siap perakitan Sewing.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSerahJahit) onSerahJahit(antrean);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
                      >
                        <SewingMachineIcon className="w-3 h-3" />
                        <span>Serahkan ke Jahit</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAHAP 4: QC */}
            {showQc && (
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-2xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      Tahap 4: Quality Control (QC)
                    </span>
                    {antrean.tglSerahQc ? (
                      <span className="px-2 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[9.5px] font-extrabold border border-teal-200">
                        Dalam Pengecekan
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9.5px] font-extrabold border border-amber-200">
                        Menunggu Penyerahan
                      </span>
                    )}
                  </div>

                  {antrean.tglSerahQc ? (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs bg-[#f8fafc] p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tgl Masuk QC</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">{antrean.tglSerahQc}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tim / Petugas</span>
                        <span className="font-bold text-teal-700 block text-[11px] mt-0.5 truncate">{antrean.timQc || 'Tim QC'}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Status Cek</span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block text-[10.5px] mt-0.5">
                          {antrean.statusQc || 'Pemeriksaan'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Target QC</span>
                        <span className="font-mono font-extrabold text-[#0284c7] text-xs block mt-0.5">
                          {Number(antrean.qty).toLocaleString('id-ID')} Pcs
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tarif QC</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">
                          Rp {(Number(antrean.tarifQc) || 500).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Upah QC</span>
                        <span className="font-mono font-extrabold text-[#0f766e] text-xs block mt-0.5">
                          Rp {(Number(antrean.totalBiayaQc) || ((antrean.qty || 0) * (antrean.tarifQc || 500))).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {antrean.catatanQc && (
                        <div className="col-span-2 sm:col-span-6 pt-1 border-t border-slate-200 text-slate-600 text-[10.5px]">
                          <strong>Catatan:</strong> {antrean.catatanQc}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2">
                      <div className="text-slate-600 text-[11px]">
                        Jahit berjalan/selesai. Siap dialokasikan ke QC.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSerahQc) onSerahQc(antrean);
                        }}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Serahkan ke QC</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAHAP 5: FINISHING & PACKING */}
            {showFinishing && (
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-2xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Tahap 5: Finishing & Packing
                    </span>
                    {antrean.tglSerahFinishing ? (
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9.5px] font-extrabold border border-emerald-200">
                        Dalam Finishing
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9.5px] font-extrabold border border-amber-200">
                        Menunggu Penyerahan
                      </span>
                    )}
                  </div>

                  {antrean.tglSerahFinishing ? (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs bg-[#f8fafc] p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tgl Masuk</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">{antrean.tglSerahFinishing}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tim Finishing</span>
                        <span className="font-bold text-emerald-700 block text-[11px] mt-0.5 truncate">{antrean.timFinishing || 'Tim Finishing'}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Lolos QC</span>
                        <span className="font-mono font-extrabold text-emerald-700 text-xs block mt-0.5">
                          ✅ {Number(antrean.qtyPassQc || (antrean.qty || 0)).toLocaleString('id-ID')} Pcs
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Reject QC</span>
                        <span className={`font-mono font-extrabold text-xs block mt-0.5 ${Number(antrean.qtyRejectQc) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {Number(antrean.qtyRejectQc) > 0 ? `❌ ${Number(antrean.qtyRejectQc).toLocaleString('id-ID')} Pcs` : '0 Pcs'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Tarif Finishing</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">
                          Rp {(Number(antrean.tarifFinishing) || 1000).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Upah</span>
                        <span className="font-mono font-extrabold text-[#047857] text-xs block mt-0.5">
                          Rp {(Number(antrean.totalBiayaFinishing) || ((Number(antrean.qtyPassQc) || antrean.qty || 0) * (antrean.tarifFinishing || 1000))).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {antrean.catatanRejectQc && (
                        <div className="col-span-2 sm:col-span-6 pt-1 border-t border-slate-200 text-rose-700 text-[10.5px]">
                          <strong>Reject:</strong> {antrean.catatanRejectQc}
                        </div>
                      )}
                      {antrean.catatanFinishing && (
                        <div className="col-span-2 sm:col-span-6 pt-1 border-t border-slate-200 text-slate-600 text-[10.5px]">
                          <strong>Catatan:</strong> {antrean.catatanFinishing}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2">
                      <div className="text-slate-600 text-[11px]">
                        Dalam inspeksi QC. Siap verifikasi jumlah & ke Finishing.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSerahFinishing) onSerahFinishing(antrean);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
                      >
                        <PackageCheck className="w-3 h-3" />
                        <span>Cek QC & Serahkan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAHAP 6: HISTORI PENYERAHAN GUDANG JADI (JIKA SELESAI) */}
        {showGudangJadi && (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-2.5 shadow-2xs space-y-1.5 shrink-0">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                Tahap 6: Serah Terima Gudang Jadi (Selesai Produksi)
              </span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-200/80 text-emerald-800 text-[9.5px] font-extrabold border border-emerald-300">
                Selesai Produksi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Tgl Diserahkan</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5">{antrean.tglSerahGudang || '-'}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Diserahkan Oleh</span>
                <span className="font-bold text-emerald-700 block mt-0.5">{antrean.timFinishing || 'Tim Finishing'}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Status Gudang</span>
                <span className="font-bold text-emerald-800 block mt-0.5">
                  Tersimpan di Mutasi Gudang Jadi
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. BOTTOM BAR */}
      <div className="bg-white border-t border-[#cbd5e1] px-3 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            No Antrean: <span className="font-mono font-bold text-slate-800">{antrean.noAntrian}</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-slate-700">
            Total Target: <strong className="text-[#059669]">{Number(antrean.qty).toLocaleString('id-ID')} Pcs</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-md shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Antrean</span>
        </button>
      </div>

      {/* Modal Share Tracking */}
      <ShareTrackingModal
        isOpen={isShareOpen}
        item={antrean}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}

