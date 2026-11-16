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
  Check
} from 'lucide-react';

export default function ModalSerahQC({
  isOpen,
  targetItems = [],
  form,
  setForm,
  qcEmployees = [],
  products = [],
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  const totalVolume = targetItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  // State List Tim / Petugas QC (Bisa Search, Edit & Tambah Baru, tersimpan di localStorage)
  const [customTeams, setCustomTeams] = useState(() => {
    try {
      const cached = localStorage.getItem('konveksi_custom_qc_teams');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    const defaultList = [
      ...qcEmployees.map(e => `Tim ${e.nama} (${e.bagian || 'QC'})`),
      'Tim QC 1 (Inspeksi Jahitan & Pola)',
      'Tim QC 2 (Inspeksi Finishing & Aksesoris)',
      'Supervisor QC Meja Utama'
    ];
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
      localStorage.setItem('konveksi_custom_qc_teams', JSON.stringify(updated));
    } catch (_) {}
  };

  // Filter List Tim Berdasarkan Pencarian
  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return customTeams;
    const q = teamSearchQuery.toLowerCase();
    return customTeams.filter(t => t.toLowerCase().includes(q));
  }, [customTeams, teamSearchQuery]);

  // Tambah Tim Baru
  const handleAddNewTeam = (e) => {
    e.preventDefault();
    const val = newTeamInput.trim();
    if (!val) return;
    if (customTeams.includes(val)) {
      setForm(prev => ({ ...prev, timQc: val }));
      setIsAddingTeam(false);
      setNewTeamInput('');
      setIsTeamComboboxOpen(false);
      return;
    }
    const updated = [...customTeams, val];
    saveTeamsToStorage(updated);
    setForm(prev => ({ ...prev, timQc: val }));
    setIsAddingTeam(false);
    setNewTeamInput('');
    setIsTeamComboboxOpen(false);
  };

  // Simpan Edit Tim
  const handleSaveEditTeam = (idx, oldVal) => {
    const val = editingInput.trim();
    if (!val) {
      setEditingIndex(null);
      return;
    }
    const updated = [...customTeams];
    updated[idx] = val;
    saveTeamsToStorage(updated);
    if (form.timQc === oldVal) {
      setForm(prev => ({ ...prev, timQc: val }));
    }
    setEditingIndex(null);
    setEditingInput('');
  };

  // Hapus Tim
  const handleDeleteTeam = (valToDelete, e) => {
    e.stopPropagation();
    const updated = customTeams.filter(t => t !== valToDelete);
    saveTeamsToStorage(updated);
    if (form.timQc === valToDelete) {
      setForm(prev => ({ ...prev, timQc: updated[0] || 'Tim QC' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#0f766e] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
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
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                  Penyerahan SPK Antrean ke Tim Quality Control (QC)
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-white font-mono text-[9px] font-extrabold border border-white/25">
                  STEP 4 SOP
                </span>
              </div>
              <p className="text-[10px] text-sky-100/90 mt-0.5 leading-none">
                Pemeriksaan kualitas hasil jahitan, toleransi ukuran, kerapian benang & kelayakan sebelum finishing
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
      <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3 flex flex-col min-h-0">
        <form id="form-serah-qc-fullscreen" onSubmit={onSubmit} className="w-full space-y-3 text-xs">
          {/* SECTION 1: KARTU BATCH ANTREAN YANG AKAN DISERAHKAN KE QC */}
          <div className="bg-white rounded-xl border border-[#cbd5e1] p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-[#0284c7]" />
                Antrean Yang Siap Dicek Tim QC ({targetItems.length} Batch)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-extrabold border border-teal-200">
                Total Target: {totalVolume.toLocaleString('id-ID')} Pcs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-0.5">
              {targetItems.map(item => {
                const matched = products.find(p => p.sku === item.sku);
                const prodName = item.namaProduk || matched?.nama || '-';
                return (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg border border-slate-200 bg-[#f8fafc] flex items-center justify-between gap-2 shadow-2xs hover:border-[#0284c7] transition-all"
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
                      {item.timJahit && (
                        <div className="text-[9.5px] text-indigo-700 font-medium mt-0.5">
                          🧵 Dari Tim Jahit: {item.timJahit}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-xs text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200 block">
                        {Number(item.qty).toLocaleString('id-ID')} Pcs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: FORM PARAMETER PENYERAHAN QC */}
          <div className="bg-white rounded-xl border border-[#cbd5e1] p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                Parameter & Tim Pemeriksa QC
              </span>
              <span className="text-[10.5px] text-slate-400">Tahap Inspeksi SOP</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* TANGGAL PENYERAHAN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tanggal Masuk Meja QC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.tglSerahQc || new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(prev => ({ ...prev, tglSerahQc: e.target.value }))}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>

              {/* TIM / PETUGAS QC (SEARCHABLE, ADDABLE, EDITABLE COMBOBOX) */}
              <div className="relative" ref={teamComboboxRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Tim / Petugas QC Pemeriksa <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamComboboxOpen(true);
                      setIsAddingTeam(true);
                    }}
                    className="text-[10.5px] text-[#0284c7] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Petugas</span>
                  </button>
                </div>

                {/* Combobox Trigger Box */}
                <div
                  onClick={() => setIsTeamComboboxOpen(prev => !prev)}
                  className={`w-full h-8 px-2.5 rounded-lg border text-xs flex items-center justify-between bg-white cursor-pointer transition-all ${
                    isTeamComboboxOpen
                      ? 'border-[#0284c7] ring-2 ring-[#0284c7]/20'
                      : 'border-slate-300 hover:border-[#0284c7]'
                  }`}
                >
                  <span className="font-semibold text-slate-800 truncate">
                    {form.timQc || 'Pilih Tim QC...'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isTeamComboboxOpen ? 'rotate-180 text-[#0284c7]' : ''
                    }`}
                  />
                </div>

                {/* Combobox Popover Menu */}
                {isTeamComboboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in text-xs font-sans">
                    {/* Search Bar Input */}
                    <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Cari nama tim / petugas QC..."
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

                    {/* Mode Tambah Tim Baru */}
                    {isAddingTeam && (
                      <div className="p-2 bg-sky-50 border-b border-sky-200 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Ketik nama tim / petugas QC baru..."
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

                    {/* List Items */}
                    <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 p-1">
                      {filteredTeams.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-xs">
                          Petugas QC tidak ditemukan.
                        </div>
                      ) : (
                        filteredTeams.map((teamName, idx) => {
                          const isSelected = form.timQc === teamName;
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
                                setForm(prev => ({ ...prev, timQc: teamName }));
                                setIsTeamComboboxOpen(false);
                              }}
                              className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer group ${
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

            {/* TARIF UPAH QC */}
            <div className="grid grid-cols-2 gap-3 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                  Tarif Upah QC (per Pcs)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-indigo-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={form.tarifQc ?? 500}
                    onChange={e => setForm(prev => ({ ...prev, tarifQc: Number(e.target.value) }))}
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-indigo-200 text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                  Total Estimasi Upah QC ({totalVolume} Pcs)
                </label>
                <div className="h-8 flex items-center px-3 rounded-lg bg-white border border-indigo-200 font-mono font-black text-sm text-indigo-800">
                  Rp {(totalVolume * (Number(form.tarifQc ?? 500) || 0)).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* CATATAN / INSTRUKSI INSPEKSI */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Catatan / Instruksi Khusus Pemeriksaan QC
              </label>
              <input
                type="text"
                value={form.catatanQc || ''}
                onChange={e => setForm(prev => ({ ...prev, catatanQc: e.target.value }))}
                placeholder="mis: Cek jahitan kerah O-neck 1.5cm, toleransi ukuran lingkar dada +- 1cm, laporkan jika ada reject kain..."
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          </div>
        </form>
      </div>

      {/* 3. BOTTOM BAR FULL SCREEN */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0 w-full">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Total Batch: <strong className="text-slate-800">{targetItems.length} Antrean</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-slate-700">
            Total Target QC: <strong className="text-teal-700">{totalVolume.toLocaleString('id-ID')} Pcs</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="text-slate-500 font-medium">
            Petugas: <strong className="text-[#0284c7]">{form.timQc || 'Belum dipilih'}</strong>
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
            form="form-serah-qc-fullscreen"
            className="h-8 px-5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-teal-900/20 cursor-pointer transition-all"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Konfirmasi & Serahkan ke Tim QC</span>
          </button>
        </div>
      </div>
    </div>
  );
}

