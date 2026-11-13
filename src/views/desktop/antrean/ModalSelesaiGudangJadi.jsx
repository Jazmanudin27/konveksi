import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Warehouse,
  Boxes,
  CheckCircle2,
  UserCheck,
  Calendar,
  ClipboardCheck,
  Sparkles,
  ShieldCheck,
  FileText,
  Send,
  Clock,
  Check
} from 'lucide-react';

export default function ModalSelesaiGudangJadi({
  isOpen,
  item,
  products = [],
  onClose,
  onSubmit
}) {
  if (!isOpen || !item) return null;

  const finalQty = Number(item.qtyPassQc) || Number(item.qty) || 0;
  const matchedProd = products.find(p => p.sku === item.sku);
  const prodName = item.namaProduk || matchedProd?.nama || item.sku;

  const [tglDiserahkan, setTglDiserahkan] = useState(new Date().toISOString().slice(0, 10));
  const [petugasSerah, setPetugasSerah] = useState(item.timFinishing || 'Tim Finishing & Packing');
  const [catatan, setCatatan] = useState('');
  const [checklist, setChecklist] = useState({
    plastikOpp: true,
    hangtag: true,
    lipatanUap: true,
    bebasNoda: true
  });

  useEffect(() => {
    if (item) {
      setTglDiserahkan(new Date().toISOString().slice(0, 10));
      setPetugasSerah(item.timFinishing || 'Tim Finishing & Packing');
      setCatatan('');
    }
  }, [item]);

  const toggleChecklist = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecklistPass = Object.values(checklist).every(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        tglDiserahkan,
        petugasSerah: petugasSerah.trim() || 'Tim Finishing',
        catatan: catatan.trim() || ''
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-[#0284c7] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
            title="Kembali ke Antrean"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white shrink-0">
              <Send className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                  Penyerahan Barang Jadi ke Tim Gudang
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-white font-mono text-[9px] font-extrabold border border-white/25">
                  STEP 6 SOP • SERAH TERIMA
                </span>
              </div>
              <p className="text-[10px] text-emerald-100/90 mt-0.5 leading-none">
                Serahkan hasil pengerjaan finishing & packing ke tim gudang jadi untuk dilakukan pemeriksaan & approval masuk rak
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
          title="Tutup Form Halaman Penuh"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BODY CONTAINER FULL SCREEN */}
      <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto min-h-0 flex flex-col justify-start">
        <form id="form-serah-gudang-fullscreen" onSubmit={handleSubmit} className="w-full text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            {/* KOLOM KIRI (5 COLS): RINGKASAN PRODUK & CHECKLIST SOP FINISHING */}
            <div className="lg:col-span-5 space-y-2.5 flex flex-col">
              {/* KARTU IDENTITAS PRODUK & QUANTITY SIAP SERAH */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                    Barang Jadi yang Diserahkan
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Finishing Selesai
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[10px] text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200 shadow-2xs">
                          {item.noAntrian}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {prodName}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-600 mt-1 flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-700">SKU: {item.sku}</span>
                        <span>•</span>
                        <span>{item.varian || 'Polos'} ({item.ukuran || 'All Size'})</span>
                      </div>
                    </div>
                  </div>

                  {/* HIGHLIGHT KUANTITAS */}
                  <div className="bg-white rounded-lg p-2.5 border border-emerald-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Volume Diserahkan</span>
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        +{finalQty.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-600">Pcs</span>
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <div>Finishing: <b className="text-slate-700">{item.timFinishing || 'Tim Finishing'}</b></div>
                      <div className="mt-0.5 text-emerald-700 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        100% Lolos QC
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORI ALUR PRODUKSI */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1 border-t border-slate-100">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Cutting</span>
                    <span className="font-bold text-slate-700 truncate block mt-0.5">{item.timCutting || 'Selesai'}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Jahit</span>
                    <span className="font-bold text-slate-700 truncate block mt-0.5">{item.timJahit || 'Selesai'}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">QC</span>
                    <span className="font-bold text-slate-700 truncate block mt-0.5">{item.timQc || 'Lolos'}</span>
                  </div>
                </div>
              </div>

              {/* KARTU STANDAR CHECKLIST PACKING */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                    Checklist Kerapian & SOP Sebelum Diserahkan
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[9.5px] font-bold border ${allChecklistPass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {allChecklistPass ? 'Semua Standar OK' : 'Periksa Fisik'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { key: 'plastikOpp', label: '1. Pengemasan Plastik OPP Rapi & Tertutup Rapat' },
                    { key: 'hangtag', label: '2. Hangtag Brand, Barcode SKU & Label Size Terpasang' },
                    { key: 'lipatanUap', label: '3. Kerapian Setrika Uap & Standar Lipatan Sesuai SOP' },
                    { key: 'bebasNoda', label: '4. Bebas Debu, Noda Minyak Mesin & Sisa Benang' }
                  ].map(chk => {
                    const isChecked = checklist[chk.key];
                    return (
                      <button
                        key={chk.key}
                        type="button"
                        onClick={() => toggleChecklist(chk.key)}
                        className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs'
                            : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-semibold text-[11px]">{chk.label}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (7 COLS): FORM PENYERAHAN KE TIM GUDANG */}
            <div className="lg:col-span-7 space-y-2.5 flex flex-col">
              {/* KARTU FORM PARAMETER PENYERAHAN */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    Parameter Penyerahan Hasil Finishing
                  </span>
                  <span className="text-[10px] text-slate-400">Step 6 SOP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Tanggal Diserahkan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Tanggal Diserahkan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={tglDiserahkan}
                      onChange={e => setTglDiserahkan(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-emerald-600 transition-all font-mono"
                    />
                  </div>

                  {/* Tim Finishing yang Menyerahkan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      Tim Finishing yang Menyerahkan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={petugasSerah}
                      onChange={e => setPetugasSerah(e.target.value)}
                      placeholder="Nama tim / petugas finishing..."
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-emerald-600 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Catatan Penyerahan */}
                <div className="pt-1 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-500" />
                    Catatan Penyerahan ke Gudang
                  </label>
                  <input
                    type="text"
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                    placeholder="mis: 95 Pcs sudah packing plastik OPP rapi, ada 2 ikat box..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* KARTU ALUR KERJA APPROVAL GUDANG JADI */}
              <div className="bg-gradient-to-br from-amber-50 via-teal-50 to-sky-50 rounded-xl border border-amber-200 p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Alur Approval Gudang Jadi
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                    STATUS: MENUNGGU PENERIMAAN
                  </span>
                </div>

                <div className="text-[11px] text-slate-700 leading-relaxed space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                    <span>Setelah diserahkan, status antrean menjadi <b>Menunggu Penerimaan Gudang</b> dengan tanggal penyerahan tercatat.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5"></span>
                    <span>Data otomatis masuk ke menu <b>Mutasi Gudang Jadi</b> sebagai barang <b>Menunggu Diterima (Pending Approval)</b>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                    <span>Petugas Gudang Jadi akan memeriksa fisik barang, <b>meng-Approve</b> penerimaan, dan menentukan <b>Lokasi Rak Penyimpanan</b> beserta tanggal diterima.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 3. BOTTOM ACTION BAR FULL SCREEN */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">
            No. Antrean: <b className="font-mono text-slate-800">{item.noAntrian}</b>
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 font-medium">
            Diserahkan Oleh: <b className="text-teal-700">{petugasSerah}</b>
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-bold text-slate-800">
            Total Diserahkan: <span className="font-mono text-emerald-600 font-black">+{finalQty.toLocaleString('id-ID')} Pcs</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="form-serah-gudang-fullscreen"
            className="h-8 px-5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>Konfirmasi & Serahkan ke Gudang Jadi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
