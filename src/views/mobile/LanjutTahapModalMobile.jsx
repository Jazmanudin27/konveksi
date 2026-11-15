import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Scissors,
  Shirt,
  CheckCircle2,
  Sparkles,
  Warehouse,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  FileText,
  Boxes,
} from 'lucide-react';
import { api } from '../../services/api';

export default function LanjutTahapModalMobile({
  isOpen,
  item,
  employees = [],
  products = [],
  onClose,
  onSuccess,
}) {
  if (!isOpen || !item) return null;

  const currentStatus = item.status || item.statusTahapan || 'Menunggu Cutting';
  const qty = Number(item.qty ?? item.targetQty ?? 0);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Match info produk untuk default ongkos potong
  const matchedProduct = useMemo(() => {
    return products.find((p) => p.sku === item.sku) || null;
  }, [products, item.sku]);

  // Karyawan per bagian
  const cuttingEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || '').toLowerCase();
      return b.includes('cut') || b.includes('pola');
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  const jahitEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || '').toLowerCase();
      return b.includes('jahit') || b.includes('sew') || (e.kategori || '').toLowerCase() === 'makloon';
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  const qcEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || '').toLowerCase();
      return b.includes('qc') || b.includes('quality') || b.includes('control') || b.includes('periksa');
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  const finishingEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || '').toLowerCase();
      return b.includes('finish') || b.includes('pack') || b.includes('lipat');
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  // State Form
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Data Cutting
  const defaultTarifPotong = matchedProduct?.hargaPotong || matchedProduct?.harga_potong || item.tarifCutting || 1500;
  const [tglSerahCutting, setTglSerahCutting] = useState(todayStr);
  const [timCutting, setTimCutting] = useState(
    cuttingEmployees[0]?.nama || item.timCutting || 'Tim Cutting 1'
  );
  const [tarifCutting, setTarifCutting] = useState(defaultTarifPotong);
  const [catatanCutting, setCatatanCutting] = useState(item.catatanCutting || '');

  // 2. Data Jahit
  const [tglSerahJahit, setTglSerahJahit] = useState(todayStr);
  const [timJahit, setTimJahit] = useState(
    jahitEmployees[0]?.nama || item.timJahit || 'Tim Jahit 1'
  );
  const [tarifJahit, setTarifJahit] = useState(item.tarifJahit || 3500);
  const [catatanJahit, setCatatanJahit] = useState(item.catatanJahit || '');

  // 3. Data QC
  const [tglSerahQc, setTglSerahQc] = useState(todayStr);
  const [timQc, setTimQc] = useState(
    qcEmployees[0]?.nama || item.timQc || 'Tim QC 1'
  );
  const [catatanQc, setCatatanQc] = useState(item.catatanQc || '');

  // 4. Data Finishing
  const [qtyPassQc, setQtyPassQc] = useState(qty);
  const [qtyRejectQc, setQtyRejectQc] = useState(0);
  const [catatanRejectQc, setCatatanRejectQc] = useState('');
  const [tglSerahFinishing, setTglSerahFinishing] = useState(todayStr);
  const [timFinishing, setTimFinishing] = useState(
    finishingEmployees[0]?.nama || item.timFinishing || 'Tim Finishing 1'
  );
  const [catatanFinishing, setCatatanFinishing] = useState(item.catatanFinishing || '');

  // 5. Data Gudang Jadi
  const [lokasiRak, setLokasiRak] = useState('RAK-GUDANG-A1');
  const [petugasGudang, setPetugasGudang] = useState('Admin Gudang Jadi');
  const [catatanGudang, setCatatanGudang] = useState('');

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (currentStatus === 'Menunggu Cutting' || currentStatus === 'Draft') {
        await api.serahCutting({
          ids: [item.id],
          tglSerahCutting,
          timCutting,
          tarifCutting: Number(tarifCutting),
          catatanCutting,
        });
      } else if (currentStatus === 'Proses Cutting') {
        await api.serahJahit({
          ids: [item.id],
          tglSerahJahit,
          timJahit,
          tarifJahit: Number(tarifJahit),
          catatanJahit,
        });
      } else if (currentStatus === 'Proses Jahit') {
        await api.serahQc({
          ids: [item.id],
          tglSerahQc,
          timQc,
          catatanQc,
        });
      } else if (currentStatus === 'Proses QC') {
        await api.serahFinishing({
          ids: [item.id],
          qtyPassQc: Number(qtyPassQc),
          qtyRejectQc: Number(qtyRejectQc),
          catatanRejectQc,
          tglSerahFinishing,
          timFinishing,
          catatanFinishing,
        });
      } else if (currentStatus === 'Proses Finishing') {
        await api.selesaiFinishing({
          id: item.id,
          noAntrian: item.noAntrian || `ANT-${item.id}`,
          sku: item.sku,
          qty: Number(item.qtyPassQc || qty),
          lokasiRak,
          petugas: petugasGudang,
          catatan: catatanGudang,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses tahapan produksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal Melengkung Emerald */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#064e3b] via-[#046a52] to-[#0f766e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-200 shadow-xs">
              {currentStatus === 'Menunggu Cutting' && <Scissors className="w-5 h-5" />}
              {currentStatus === 'Proses Cutting' && <Shirt className="w-5 h-5" />}
              {currentStatus === 'Proses Jahit' && <CheckCircle2 className="w-5 h-5" />}
              {currentStatus === 'Proses QC' && <Sparkles className="w-5 h-5" />}
              {currentStatus === 'Proses Finishing' && <Warehouse className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide">
                {currentStatus === 'Menunggu Cutting' && 'Serah ke Tim Cutting (Tahap 2)'}
                {currentStatus === 'Proses Cutting' && 'Serah ke Tim Penjahit (Tahap 3)'}
                {currentStatus === 'Proses Jahit' && 'Serah ke Pemeriksaan QC (Tahap 4)'}
                {currentStatus === 'Proses QC' && 'Hasil QC & Serah Finishing (Tahap 5)'}
                {currentStatus === 'Proses Finishing' && 'Selesai & Masuk Gudang Jadi (Tahap 6)'}
              </h3>
              <p className="text-[10px] text-emerald-100/90 font-medium">
                No: {item.noAntrian || `ANT-${item.id}`} • {item.namaProduk} ({qty} Pcs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Singkat Kartu Order */}
        <div className="px-5 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-500">Model: </span>
            <span className="font-bold text-slate-800">{item.namaProduk}</span>
            <span className="text-slate-400 font-mono ml-1">({item.sku})</span>
          </div>
          <div className="font-bold text-[#064e3b] bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
            Volume: {qty} Pcs
          </div>
        </div>

        {/* Body Form Bertahap */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. TAHAP CUTTING */}
          {(currentStatus === 'Menunggu Cutting' || currentStatus === 'Draft') && (
            <>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Pilih Tim / Petugas Cutting:
                </label>
                <select
                  value={timCutting}
                  onChange={(e) => setTimCutting(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                >
                  {cuttingEmployees.map((e) => (
                    <option key={e.id || e.nik} value={e.nama}>
                      {e.nama} ({e.bagian || 'Cutting'})
                    </option>
                  ))}
                  <option value="Tim Cutting Luar / Makloon">Tim Cutting Luar / Makloon</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tgl Serah Cutting:
                  </label>
                  <input
                    type="date"
                    value={tglSerahCutting}
                    onChange={(e) => setTglSerahCutting(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tarif Potong / Pcs (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tarifCutting}
                    onChange={(e) => setTarifCutting(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Box Total Estimasi Biaya */}
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <span className="font-bold text-sky-800">Total Biaya Cutting:</span>
                <span className="font-mono font-black text-sm text-sky-950">
                  Rp {(qty * Number(tarifCutting)).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Catatan Pola / Cutting (Opsional):
                </label>
                <textarea
                  rows="2"
                  value={catatanCutting}
                  onChange={(e) => setCatatanCutting(e.target.value)}
                  placeholder="Misal: Sisipkan label size di kerah, pola agak longgar..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 2. TAHAP JAHIT */}
          {currentStatus === 'Proses Cutting' && (
            <>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Pilih Penjahit / Tim Jahit:
                </label>
                <select
                  value={timJahit}
                  onChange={(e) => setTimJahit(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                >
                  {jahitEmployees.map((e) => (
                    <option key={e.id || e.nik} value={e.nama}>
                      {e.nama} ({e.kategori || 'Internal'} - {e.bagian || 'Penjahit'})
                    </option>
                  ))}
                  <option value="Makloon Luar">Makloon Luar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tgl Serah Jahit:
                  </label>
                  <input
                    type="date"
                    value={tglSerahJahit}
                    onChange={(e) => setTglSerahJahit(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tarif Jahit / Pcs (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tarifJahit}
                    onChange={(e) => setTarifJahit(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Box Total Estimasi Biaya Jahit */}
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-800">Total Biaya Jahit:</span>
                <span className="font-mono font-black text-sm text-purple-950">
                  Rp {(qty * Number(tarifJahit)).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Catatan Jahit (Opsional):
                </label>
                <textarea
                  rows="2"
                  value={catatanJahit}
                  onChange={(e) => setCatatanJahit(e.target.value)}
                  placeholder="Misal: Jahitan stik balik, kerapian obras..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 3. TAHAP QC */}
          {currentStatus === 'Proses Jahit' && (
            <>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Pilih Petugas Pemeriksa QC:
                </label>
                <select
                  value={timQc}
                  onChange={(e) => setTimQc(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                >
                  {qcEmployees.map((e) => (
                    <option key={e.id || e.nik} value={e.nama}>
                      {e.nama} ({e.bagian || 'QC'})
                    </option>
                  ))}
                  <option value="Tim QC Standar">Tim QC Standar</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Tgl Serah QC:
                </label>
                <input
                  type="date"
                  value={tglSerahQc}
                  onChange={(e) => setTglSerahQc(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Catatan Pemeriksaan QC:
                </label>
                <textarea
                  rows="2"
                  value={catatanQc}
                  onChange={(e) => setCatatanQc(e.target.value)}
                  placeholder="Instruksi inspeksi pola, cacat benang, simetris..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 4. TAHAP FINISHING (PASCA QC) */}
          {currentStatus === 'Proses QC' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-emerald-800 mb-1">
                    Qty Lolos QC (Pass):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={qty}
                    value={qtyPassQc}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQtyPassQc(val);
                      setQtyRejectQc(Math.max(0, qty - val));
                    }}
                    className="w-full h-9 px-3 bg-emerald-50 border border-emerald-300 rounded-xl font-black text-emerald-950 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-rose-800 mb-1">
                    Qty Reject / BS:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qtyRejectQc}
                    onChange={(e) => setQtyRejectQc(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-rose-50 border border-rose-300 rounded-xl font-black text-rose-950 text-xs focus:bg-white focus:border-rose-600 focus:outline-none"
                  />
                </div>
              </div>

              {Number(qtyRejectQc) > 0 && (
                <div>
                  <label className="block text-[11px] font-extrabold text-rose-700 mb-1">
                    Alasan / Keterangan Reject:
                  </label>
                  <input
                    type="text"
                    value={catatanRejectQc}
                    onChange={(e) => setCatatanRejectQc(e.target.value)}
                    placeholder="Misal: noda oli, lubang kain, jahitan miring..."
                    className="w-full h-8 px-3 bg-rose-50/50 border border-rose-200 rounded-xl font-medium text-rose-900 text-xs focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Pilih Tim Finishing & Packing:
                </label>
                <select
                  value={timFinishing}
                  onChange={(e) => setTimFinishing(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                >
                  {finishingEmployees.map((e) => (
                    <option key={e.id || e.nik} value={e.nama}>
                      {e.nama} ({e.bagian || 'Finishing'})
                    </option>
                  ))}
                  <option value="Tim Packing & Uap 1">Tim Packing & Uap 1</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Tgl Serah Finishing:
                </label>
                <input
                  type="date"
                  value={tglSerahFinishing}
                  onChange={(e) => setTglSerahFinishing(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>
            </>
          )}

          {/* 5. TAHAP GUDANG JADI */}
          {currentStatus === 'Proses Finishing' && (
            <>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10.5px] font-bold text-emerald-800 block">
                  Siap Masuk Stok Gudang Jadi:
                </span>
                <span className="font-mono font-black text-base text-emerald-950">
                  {qtyPassQc || qty} Pcs ({item.namaProduk})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Lokasi Rak:
                  </label>
                  <input
                    type="text"
                    value={lokasiRak}
                    onChange={(e) => setLokasiRak(e.target.value)}
                    placeholder="RAK-A1"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Petugas Penerima:
                  </label>
                  <input
                    type="text"
                    value={petugasGudang}
                    onChange={(e) => setPetugasGudang(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Catatan Gudang (Opsional):
                </label>
                <textarea
                  rows="2"
                  value={catatanGudang}
                  onChange={(e) => setCatatanGudang(e.target.value)}
                  placeholder="Kondisi packing, plastik polybag rapi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#054338] hover:to-[#03694f] active:scale-95 text-white font-extrabold shadow-md shadow-emerald-950/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>
                    {currentStatus === 'Menunggu Cutting' && 'Serahkan ke Cutting'}
                    {currentStatus === 'Proses Cutting' && 'Serahkan ke Penjahit'}
                    {currentStatus === 'Proses Jahit' && 'Mulai QC'}
                    {currentStatus === 'Proses QC' && 'Serah Finishing'}
                    {currentStatus === 'Proses Finishing' && 'Simpan ke Gudang'}
                  </span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

