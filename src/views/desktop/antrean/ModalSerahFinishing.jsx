import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  CheckCircle2,
  Boxes,
  UserCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  ClipboardList,
  Check,
  AlertTriangle,
  PackageCheck,
  Layers
} from 'lucide-react';

export default function ModalSerahFinishing({
  isOpen,
  targetItems = [],
  form,
  setForm,
  finishingEmployees = [],
  products = [],
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  const totalVolume = targetItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  // Standar Checklist QC
  const [checkpoints, setCheckpoints] = useState({
    polaUkuran: true,
    kerapianJahit: true,
    aksesorisKancing: true,
    kebersihanBenang: true
  });

  const toggleCheckpoint = (key) => {
    setCheckpoints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // State List Tim Finishing (Bisa Search, Edit & Tambah Baru, tersimpan di localStorage)
  const [customTeams, setCustomTeams] = useState(() => {
    const defaultList = [
      ...finishingEmployees.map(e => e.nama || e.namaTim),
      'Tim Finishing & Packing 1 (Uap & Lipat)',
      'Tim Finishing 2 (Hangtag & Plastik OPP)',
      'Gudang Packing Akhir'
    ].filter(Boolean);

    try {
      const cached = localStorage.getItem('konveksi_custom_finishing_teams');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Buang data lama yang mengandung nama penjahit (seperti CEPI) agar tidak tercampur
        const cleaned = parsed.filter(name => !name.toUpperCase().includes('CEPI') && !name.toLowerCase().includes('jahit'));
        if (cleaned.length > 0) return Array.from(new Set([...cleaned, ...defaultList]));
      }
    } catch (_) {}
    return Array.from(new Set(defaultList));
  });

  const [isTeamComboboxOpen, setIsTeamComboboxOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamInput, setNewTeamInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingInput, setEditingInput] = useState('');
  const teamComboboxRef = useRef(null);

  // Close combobox saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (teamComboboxRef.current && !teamComboboxRef.current.contains(event.target)) {
        setIsTeamComboboxOpen(false);
        setIsAddingTeam(false);
        setEditingIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveTeamsToStorage = (updated) => {
    setCustomTeams(updated);
    try {
      localStorage.setItem('konveksi_custom_finishing_teams', JSON.stringify(updated));
    } catch (_) {}
  };

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return customTeams;
    const q = teamSearchQuery.toLowerCase();
    return customTeams.filter(t => t.toLowerCase().includes(q));
  }, [customTeams, teamSearchQuery]);

  const handleAddNewTeam = (e) => {
    e.preventDefault();
    const val = newTeamInput.trim();
    if (!val) return;
    if (customTeams.includes(val)) {
      setForm(prev => ({ ...prev, timFinishing: val }));
      setIsAddingTeam(false);
      setNewTeamInput('');
      setIsTeamComboboxOpen(false);
      return;
    }
    const updated = [...customTeams, val];
    saveTeamsToStorage(updated);
    setForm(prev => ({ ...prev, timFinishing: val }));
    setIsAddingTeam(false);
    setNewTeamInput('');
    setIsTeamComboboxOpen(false);
  };

  const handleSaveEditTeam = (idx, oldVal) => {
    const val = editingInput.trim();
    if (!val) {
      setEditingIndex(null);
      return;
    }
    const updated = [...customTeams];
    updated[idx] = val;
    saveTeamsToStorage(updated);
    if (form.timFinishing === oldVal) {
      setForm(prev => ({ ...prev, timFinishing: val }));
    }
    setEditingIndex(null);
    setEditingInput('');
  };

  const handleDeleteTeam = (valToDelete, e) => {
    e.stopPropagation();
    const updated = customTeams.filter(t => t !== valToDelete);
    saveTeamsToStorage(updated);
    if (form.timFinishing === valToDelete) {
      setForm(prev => ({ ...prev, timFinishing: updated[0] || 'Tim Finishing' }));
    }
  };

  // Kalkulasi Qty Lolos vs Reject
  const qtyReject = Number(form.qtyRejectQc) || 0;
  const qtyPass = Math.max(0, totalVolume - qtyReject);

  const handleRejectChange = (val) => {
    const num = Math.max(0, Math.min(totalVolume, Number(val) || 0));
    setForm(prev => ({
      ...prev,
      qtyRejectQc: num,
      qtyPassQc: totalVolume - num
    }));
  };

  const handlePassChange = (val) => {
    const num = Math.max(0, Math.min(totalVolume, Number(val) || 0));
    setForm(prev => ({
      ...prev,
      qtyPassQc: num,
      qtyRejectQc: totalVolume - num
    }));
  };

  const passRate = totalVolume > 0 ? ((qtyPass / totalVolume) * 100).toFixed(1) : 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-[#0369a1] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
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
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                  Hasil Pengecekan QC & Serahkan ke Finishing
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-white font-mono text-[9px] font-extrabold border border-white/25">
                  STEP 5 SOP
                </span>
              </div>
              <p className="text-[10px] text-teal-100/90 mt-0.5 leading-none">
                Verifikasi jumlah lolos vs reject, checklist standar kualitas, lalu teruskan ke tahap finishing & packing
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

      {/* 2. BODY CONTAINER FULL SCREEN */}
      <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto min-h-0 flex flex-col justify-start">
        <form id="form-serah-finishing-fullscreen" onSubmit={onSubmit} className="w-full text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            {/* KOLOM KIRI (5 COLS): BATCH ANTREAN & STANDAR CHECKLIST KUALITAS */}
            <div className="lg:col-span-5 space-y-2.5 flex flex-col">
              {/* KARTU BATCH ANTREAN */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-[#0284c7]" />
                    Antrean Dalam QC ({targetItems.length} Batch)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0284c7] text-[10.5px] font-extrabold border border-blue-200">
                    Total: {totalVolume.toLocaleString('id-ID')} Pcs
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto p-0.5">
                  {targetItems.map(item => {
                    const matched = products.find(p => p.sku === item.sku);
                    const prodName = item.namaProduk || matched?.nama || '-';
                    return (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg border border-slate-200 bg-[#f8fafc] flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[10px] text-[#0284c7] bg-white px-1.5 py-0.2 rounded border border-sky-200">
                              {item.noAntrian}
                            </span>
                            <span className="font-bold text-xs text-slate-900 truncate" title={prodName}>
                              {prodName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            SKU: {item.sku} • {item.varian || 'Polos'} ({item.ukuran || 'All Size'})
                          </div>
                          {item.timQc && (
                            <div className="text-[9.5px] text-teal-700 font-medium mt-0.5">
                              🔍 Petugas QC: {item.timQc}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-extrabold text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 block">
                            {Number(item.qty).toLocaleString('id-ID')} Pcs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STANDAR CHECKLIST KUALITAS */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                    Standar Checklist Kualitas (QA)
                  </span>
                  <span className="text-[9.5px] text-teal-700 font-bold bg-teal-50 px-2 py-0.2 rounded-full border border-teal-200">
                    Wajib Diperiksa
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'polaUkuran', label: '1. Pola & Ukuran Sesuai' },
                    { id: 'kerapianJahit', label: '2. Kerapian Jahitan' },
                    { id: 'aksesorisKancing', label: '3. Aksesoris/Kancing' },
                    { id: 'kebersihanBenang', label: '4. Bersih Sisa Benang' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCheckpoint(item.id)}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        checkpoints[item.id]
                          ? 'bg-teal-50/90 border-teal-300 text-teal-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                          checkpoints[item.id]
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checkpoints[item.id] && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="text-[10.5px] leading-tight font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (7 COLS): REKAP HASIL QC & PENYERAHAN FINISHING */}
            <div className="lg:col-span-7 space-y-2.5 flex flex-col">
              {/* REKAP KUANTITAS LOLOS QC VS REJECT */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Rekap Kuantitas: Lolos QC vs Reject
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-600">
                    Tingkat Kelayakan: <strong className={Number(passRate) >= 90 ? 'text-emerald-600' : 'text-amber-600'}>{passRate}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* INPUT LOLOS QC */}
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-extrabold text-[#065f46] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Lolos QC (Good/Pass)</span>
                      </label>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                        Siap Finishing
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={totalVolume}
                        value={qtyPass}
                        onChange={e => handlePassChange(e.target.value)}
                        className="w-full h-8 px-2.5 text-right rounded-lg border border-emerald-300 font-mono font-extrabold text-sm text-emerald-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">Pcs:</span>
                    </div>
                    <p className="text-[9.5px] text-emerald-700 leading-tight">
                      Barang memenuhi standar, lanjut finishing.
                    </p>
                  </div>

                  {/* INPUT REJECT QC */}
                  <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-extrabold text-[#9f1239] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Reject (Cacat/Afkir)</span>
                      </label>
                      <span className="text-[9px] font-mono font-bold text-rose-700 bg-white px-1.5 py-0.2 rounded border border-rose-200">
                        Retur / Afkir
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={totalVolume}
                        value={qtyReject}
                        onChange={e => handleRejectChange(e.target.value)}
                        className="w-full h-8 px-2.5 text-right rounded-lg border border-rose-300 font-mono font-extrabold text-sm text-rose-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">Pcs:</span>
                    </div>
                    <p className="text-[9.5px] text-rose-700 leading-tight">
                      Barang cacat perlu diperbaiki/dipisahkan.
                    </p>
                  </div>
                </div>

                {/* KETERANGAN REJECT JIKA ADA & PEMBERITAHUAN RETUR KE JAHIT */}
                {qtyReject > 0 && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10.5px] font-bold text-rose-800">
                        Rincian Cacat / Alasan Reject QC <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-amber-900 font-extrabold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        ⏩ {qtyReject} Pcs Otomatis Balik ke Proses Jahit
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={form.catatanRejectQc || ''}
                      onChange={e => setForm(prev => ({ ...prev, catatanRejectQc: e.target.value }))}
                      placeholder="mis: 3 pcs jahitan obras leher lepas, 2 pcs noda oli di dada..."
                      className="w-full h-7 px-2.5 rounded-lg border border-rose-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* PARAMETER PENYERAHAN KE FINISHING */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                    Penyerahan ke Tim Finishing & Packing
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-bold">Step 5 SOP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* TANGGAL PENYERAHAN FINISHING */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Tanggal Masuk Finishing <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.tglSerahFinishing || new Date().toISOString().slice(0, 10)}
                      onChange={e => setForm(prev => ({ ...prev, tglSerahFinishing: e.target.value }))}
                      className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>

                  {/* TIM FINISHING */}
                  <div className="relative" ref={teamComboboxRef}>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10.5px] font-bold text-slate-700">
                        Tim Finishing Penerima <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTeamComboboxOpen(true);
                          setIsAddingTeam(true);
                        }}
                        className="text-[10px] text-[#0284c7] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Tim</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setIsTeamComboboxOpen(prev => !prev)}
                      className={`w-full h-7.5 px-2.5 rounded-lg border text-xs flex items-center justify-between bg-white cursor-pointer transition-all ${
                        isTeamComboboxOpen
                          ? 'border-[#0284c7] ring-2 ring-[#0284c7]/20'
                          : 'border-slate-300 hover:border-[#0284c7]'
                      }`}
                    >
                      <span className="font-semibold text-slate-800 truncate">
                        {form.timFinishing || 'Pilih Tim Finishing...'}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isTeamComboboxOpen ? 'rotate-180 text-[#0284c7]' : ''
                        }`}
                      />
                    </div>

                    {/* Combobox Popover Menu */}
                    {isTeamComboboxOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in text-xs font-sans">
                        <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Cari nama tim finishing..."
                            value={teamSearchQuery}
                            onChange={e => setTeamSearchQuery(e.target.value)}
                            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
                          />
                          {teamSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTeamSearchQuery('')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {isAddingTeam && (
                          <div className="p-2 bg-sky-50 border-b border-sky-200 flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Ketik nama tim baru..."
                              value={newTeamInput}
                              onChange={e => setNewTeamInput(e.target.value)}
                              className="flex-1 h-7 px-2 bg-white rounded border border-sky-300 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAddNewTeam(e);
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddNewTeam}
                              className="px-2.5 h-7 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold text-[11px] cursor-pointer shrink-0"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingTeam(false)}
                              className="px-2 h-7 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-[11px] cursor-pointer shrink-0"
                            >
                              Batal
                            </button>
                          </div>
                        )}

                        <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 p-1">
                          {filteredTeams.length === 0 ? (
                            <div className="py-3 text-center text-slate-400 text-xs">
                              Tim finishing tidak ditemukan.
                            </div>
                          ) : (
                            filteredTeams.map((teamName, idx) => {
                              const isSelected = form.timFinishing === teamName;
                              const isEditing = editingIndex === idx;

                              if (isEditing) {
                                return (
                                  <div key={idx} className="p-1.5 flex items-center gap-1 bg-amber-50">
                                    <input
                                      type="text"
                                      value={editingInput}
                                      onChange={e => setEditingInput(e.target.value)}
                                      className="flex-1 h-6 px-1.5 bg-white rounded border border-amber-300 text-xs text-slate-800"
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleSaveEditTeam(idx, teamName);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditTeam(idx, teamName)}
                                      className="px-2 h-6 bg-emerald-600 text-white rounded font-bold text-[10px] cursor-pointer"
                                    >
                                      OK
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingIndex(null)}
                                      className="px-1.5 h-6 bg-slate-200 text-slate-600 rounded text-[10px] cursor-pointer"
                                    >
                                      X
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setForm(prev => ({ ...prev, timFinishing: teamName }));
                                    setIsTeamComboboxOpen(false);
                                  }}
                                  className={`w-full p-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer group ${
                                    isSelected ? 'bg-sky-50 font-bold text-[#0284c7]' : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <span className="truncate">{teamName}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setEditingIndex(idx);
                                        setEditingInput(teamName);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-white"
                                      title="Edit Nama Tim"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={e => handleDeleteTeam(teamName, e)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-white"
                                      title="Hapus Dari Daftar"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TARIF UPAH FINISHING */}
                <div className="grid grid-cols-2 gap-3 p-2 bg-teal-50/60 rounded-xl border border-teal-100">
                  <div>
                    <label className="block text-[10.5px] font-bold text-teal-900 mb-0.5">
                      Tarif Upah Finishing (per Pcs)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1 text-xs font-bold text-teal-500">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={form.tarifFinishing ?? 1000}
                        onChange={e => setForm(prev => ({ ...prev, tarifFinishing: Number(e.target.value) }))}
                        className="w-full h-7 pl-8 pr-2 rounded-lg border border-teal-200 text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-teal-900 mb-0.5">
                      Total Estimasi Upah Finishing ({qtyPass} Pcs)
                    </label>
                    <div className="h-7 flex items-center px-2.5 rounded-lg bg-white border border-teal-200 font-mono font-black text-xs text-teal-800">
                      Rp {(qtyPass * (Number(form.tarifFinishing ?? 1000) || 0)).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* CATATAN FINISHING */}
                <div className="pt-1.5 border-t border-slate-200">
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                    Catatan / Instruksi Pengerjaan Finishing & Packing
                  </label>
                  <input
                    type="text"
                    value={form.catatanFinishing || ''}
                    onChange={e => setForm(prev => ({ ...prev, catatanFinishing: e.target.value }))}
                    placeholder="mis: Setrika uap gantung, pasang hangtag barcode, kemas plastik OPP..."
                    className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 3. BOTTOM BAR FULL SCREEN */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0 w-full">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Total Target: <strong className="text-slate-800">{totalVolume.toLocaleString('id-ID')} Pcs</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-emerald-700">
            Lolos QC: <strong>{qtyPass.toLocaleString('id-ID')} Pcs</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-rose-600">
            Reject: <strong>{qtyReject.toLocaleString('id-ID')} Pcs</strong>
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
            form="form-serah-finishing-fullscreen"
            className="h-8 px-5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer transition-all"
          >
            <PackageCheck className="w-4 h-4 stroke-[2.5]" />
            <span>
              {qtyReject > 0 && qtyPass > 0
                ? `Konfirmasi (${qtyPass} Pcs Finishing • ${qtyReject} Pcs Kembali Jahit)`
                : qtyReject > 0 && qtyPass === 0
                ? `Kembalikan ${qtyReject} Pcs ke Proses Jahit`
                : 'Konfirmasi Hasil QC & Serahkan ke Finishing'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

