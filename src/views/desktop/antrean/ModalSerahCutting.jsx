import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Scissors,
  Boxes,
  UserCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  Coins,
  TrendingUp
} from 'lucide-react';

export default function ModalSerahCutting({
  isOpen,
  targetItems = [],
  form,
  setForm,
  cuttingEmployees = [],
  products = [],
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  const totalVolume = targetItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const tarif = Number(form.tarifCutting) || 0;
  const totalBiaya = totalVolume * tarif;

  // State List Tim Cutting (Bisa Search, Edit & Tambah Baru, tersimpan di localStorage)
  const [customTeams, setCustomTeams] = useState(() => {
    try {
      const cached = localStorage.getItem('konveksi_custom_cutting_teams');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    const defaultList = [
      ...cuttingEmployees.map(e => `Tim ${e.nama} (${e.bagian || 'Cutting'})`),
      'Tim Meja Potong 1 (Internal)',
      'Tim Meja Potong 2 (Internal)',
      'Vendor Cutting Mitra (Eksternal)'
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

  const saveTeams = (teams) => {
    setCustomTeams(teams);
    try {
      localStorage.setItem('konveksi_custom_cutting_teams', JSON.stringify(teams));
    } catch (_) {}
  };

  const handleAddNewTeam = (e) => {
    e?.preventDefault();
    if (!newTeamInput.trim()) return;
    const name = newTeamInput.trim();
    if (!customTeams.includes(name)) {
      const next = [...customTeams, name];
      saveTeams(next);
    }
    setForm(prev => ({ ...prev, timCutting: name }));
    setNewTeamInput('');
    setIsAddingTeam(false);
    setIsTeamComboboxOpen(false);
  };

  const handleSaveEditTeam = (idx, e) => {
    e?.preventDefault();
    if (!editingInput.trim()) return;
    const next = [...customTeams];
    const oldName = next[idx];
    next[idx] = editingInput.trim();
    saveTeams(next);
    if (form.timCutting === oldName) {
      setForm(prev => ({ ...prev, timCutting: editingInput.trim() }));
    }
    setEditingIndex(null);
    setEditingInput('');
  };

  const handleDeleteTeam = (idx, teamName) => {
    const next = customTeams.filter((_, i) => i !== idx);
    saveTeams(next);
    if (form.timCutting === teamName) {
      setForm(prev => ({ ...prev, timCutting: next[0] || 'Tim Cutting' }));
    }
  };

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return customTeams;
    const q = teamSearchQuery.toLowerCase();
    return customTeams.filter(t => t.toLowerCase().includes(q));
  }, [customTeams, teamSearchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
            title="Kembali ke Daftar Antrean"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white shrink-0">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                  Penyerahan SPK Antrean ke Tim Cutting
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-white font-mono text-[9px] font-extrabold border border-white/25">
                  STEP 2 SOP KONVEKSI
                </span>
              </div>
              <p className="text-[10px] text-sky-100/90 mt-0.5 leading-none">
                Alokasi pengerjaan potong pola, penugasan tim meja potong, dan kalkulasi otomatis biaya jasa cutting
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

      {/* 2. BODY SCROLLABLE FULL SCREEN (CARDS DENGAN BORDER TEGAS) */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 w-full">
        <form id="form-serah-cutting-fullscreen" onSubmit={onSubmit} className="w-full space-y-2.5 text-xs">
          
          {/* SECTION 1: DAFTAR ANTREAN & SPESIFIKASI MODEL */}
          <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-[#0284c7]" />
                Daftar Antrean & Spesifikasi Model Produk Yang Diserahkan
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                  {targetItems.length} Batch Antrean
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] font-mono font-extrabold text-[10.5px] border border-emerald-200">
                  Total Target: {totalVolume.toLocaleString('id-ID')} Pcs
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#cbd5e1]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-600 font-extrabold text-[10.5px] uppercase border-b border-[#cbd5e1]">
                    <th className="py-2 px-2 text-center w-8 border-r border-[#cbd5e1]">NO</th>
                    <th className="py-2 px-2.5 w-36 border-r border-[#cbd5e1]">NO ANTREAN</th>
                    <th className="py-2 px-2.5 w-36 border-r border-[#cbd5e1]">SUMBER & REFF</th>
                    <th className="py-2 px-3 border-r border-[#cbd5e1]">MODEL PRODUK (SKU)</th>
                    <th className="py-2 px-2.5 w-44 border-r border-[#cbd5e1]">VARIAN & UKURAN</th>
                    <th className="py-2 px-2.5 w-40 border-r border-[#cbd5e1]">BAHAN UTAMA</th>
                    <th className="py-2 px-3 text-right w-28 border-r border-[#cbd5e1]">TARGET QTY</th>
                    <th className="py-2 px-3 w-48">CATATAN KHUSUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-700">
                  {targetItems.map((item, idx) => {
                    const prod = products.find(p => p.sku === item.sku);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 text-center text-slate-500 font-semibold border-r border-[#cbd5e1]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border-r border-[#cbd5e1]">
                          <span className="font-mono font-bold text-xs text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                            {item.noAntrian}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 border-r border-[#cbd5e1]">
                          <div className="font-semibold text-slate-800 truncate">{item.sumberPermintaan}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">Reff: {item.noReff || '-'}</div>
                        </td>
                        <td className="py-2 px-3 border-r border-[#cbd5e1]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                              {item.sku}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {item.namaProduk || prod?.nama || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 border-r border-[#cbd5e1] text-slate-600">
                          {(item.varian || prod?.varian || 'Polos')} ({item.ukuran || prod?.ukuran || 'All Size'})
                        </td>
                        <td className="py-2 px-2.5 font-mono text-cyan-800 font-semibold border-r border-[#cbd5e1]">
                          {item.skuBahan || prod?.skuBahan || prod?.sku_bahan || '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-xs text-[#059669] border-r border-[#cbd5e1]">
                          {Number(item.qty).toLocaleString('id-ID')} Pcs
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] truncate">
                          {item.catatan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2 & SECTION 3 (GRID 2 KOLOM BESAR) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {/* SECTION 2: ALOKASI TIM & TANGGAL */}
            <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                  Alokasi Penugasan Tim Cutting & Tanggal Serah
                </span>
                <span className="text-[10px] text-slate-400">Tahap 2 SOP</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Tanggal Penyerahan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Penyerahan SPK <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={form.tglSerahCutting}
                      onChange={e => setForm({ ...form, tglSerahCutting: e.target.value })}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Dicatat dalam riwayat alur produksi</span>
                </div>

                {/* Tim Cutting Combobox (Searchable & Editable / Addable) */}
                <div className="relative" ref={teamComboboxRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Tim Cutting Penerima <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTeamComboboxOpen(true);
                        setIsAddingTeam(true);
                      }}
                      className="text-[10px] font-extrabold text-[#0284c7] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Tim</span>
                    </button>
                  </div>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsTeamComboboxOpen(prev => !prev)}
                    className={`w-full h-8 px-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer bg-white ${
                      isTeamComboboxOpen
                        ? 'border-[#0284c7] ring-2 ring-[#0284c7]/20'
                        : 'border-slate-300 hover:border-[#0284c7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {form.timCutting || '-- Pilih Tim Cutting --'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                        isTeamComboboxOpen ? 'rotate-180 text-[#0284c7]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu dengan Search & Edit/Hapus */}
                  {isTeamComboboxOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                      {/* Search Bar Input */}
                      <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Cari tim cutting, meja potong..."
                          value={teamSearchQuery}
                          onChange={e => setTeamSearchQuery(e.target.value)}
                          className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
                        />
                        {teamSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTeamSearchQuery('')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Form Tambah Tim Baru */}
                      {isAddingTeam && (
                        <div className="p-2 bg-emerald-50/70 border-b border-emerald-200 flex items-center gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Ketik nama tim baru..."
                            value={newTeamInput}
                            onChange={e => setNewTeamInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddNewTeam(e);
                            }}
                            className="flex-1 h-7 px-2 text-xs bg-white border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewTeam}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingTeam(false);
                              setNewTeamInput('');
                            }}
                            className="h-7 px-1.5 hover:bg-slate-200 text-slate-500 rounded text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* List Opsi Tim */}
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 p-1">
                        {filteredTeams.length === 0 ? (
                          <div className="py-4 text-center text-slate-400 text-xs">
                            <p>Tim "{teamSearchQuery}" tidak ditemukan</p>
                            <button
                              type="button"
                              onClick={() => {
                                setNewTeamInput(teamSearchQuery);
                                setIsAddingTeam(true);
                              }}
                              className="mt-1 text-[11px] font-bold text-[#0284c7] hover:underline cursor-pointer"
                            >
                              + Tambah "{teamSearchQuery}" sebagai tim baru
                            </button>
                          </div>
                        ) : (
                          filteredTeams.map((teamName, idx) => {
                            const isSelected = form.timCutting === teamName;
                            const isEditingThis = editingIndex === idx;

                            if (isEditingThis) {
                              return (
                                <div key={idx} className="p-1.5 flex items-center gap-1 bg-amber-50 rounded-lg">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingInput}
                                    onChange={e => setEditingInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveEditTeam(idx, e);
                                    }}
                                    className="flex-1 h-6.5 px-2 text-xs bg-white border border-amber-300 rounded font-semibold text-slate-800 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => handleSaveEditTeam(idx, e)}
                                    className="h-6.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10.5px] font-bold cursor-pointer"
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingIndex(null);
                                      setEditingInput('');
                                    }}
                                    className="h-6.5 px-1 hover:bg-slate-200 text-slate-500 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={idx}
                                className={`group p-1.5 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 text-[#0284c7] font-bold'
                                    : 'hover:bg-slate-100 text-slate-700 font-medium'
                                }`}
                              >
                                <div
                                  className="flex items-center gap-2 min-w-0 flex-1"
                                  onClick={() => {
                                    setForm(prev => ({ ...prev, timCutting: teamName }));
                                    setIsTeamComboboxOpen(false);
                                  }}
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                                  <span className="text-xs truncate">{teamName}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isSelected && (
                                    <span className="text-[10px] font-bold text-[#0284c7] mr-1">Terpilih</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setEditingIndex(idx);
                                      setEditingInput(teamName);
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                    title="Edit Nama Tim"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteTeam(idx, teamName);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                    title="Hapus Tim Ini"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Combobox: Quick Add Button */}
                      {!isAddingTeam && (
                        <div className="p-1.5 bg-slate-50 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingTeam(true);
                              setNewTeamInput('');
                            }}
                            className="w-full py-1 text-center font-bold text-[#0284c7] hover:bg-white rounded border border-dashed border-[#bfdbfe] text-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Tambah Tim Cutting Baru</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan / Instruksi Pola */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Instruksi Khusus Meja Potong / Catatan SOP
                </label>
                <input
                  type="text"
                  placeholder="mis: Susun 4 layer kain combed 30s hitam, susun pola size L & XL, pisahkan sisa perca..."
                  value={form.catatanCutting}
                  onChange={e => setForm({ ...form, catatanCutting: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            {/* SECTION 3: TARIF & KALKULASI BIAYA REALTIME */}
            <div className="bg-white rounded-xl border border-[#cbd5e1] p-3 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#0284c7]" />
                    Tarif Jasa Cutting & Kalkulasi Biaya Produksi
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Kalkulasi Otomatis</span>
                </div>

                <div className="mt-2.5 space-y-2.5">
                  {/* Tarif Input Format Pemisah Angka & Posisi di Kanan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarif Jasa per Pcs (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-500 font-extrabold text-xs">Rp</span>
                      <input
                        type="text"
                        required
                        value={form.tarifCutting ? Number(form.tarifCutting).toLocaleString('id-ID') : ''}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setForm({ ...form, tarifCutting: raw ? Number(raw) : 0 });
                        }}
                        placeholder="0"
                        className="w-full h-9 pl-10 pr-3.5 text-right rounded-lg border border-slate-300 font-mono font-extrabold text-sm text-slate-900 focus:outline-none focus:border-[#0284c7] bg-white transition-all shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold">Pilihan Cepat:</span>
                      {[1200, 1500, 1800, 2000, 2500].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm({ ...form, tarifCutting: val })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            Number(form.tarifCutting) === val
                              ? 'bg-[#0284c7] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          Rp {val.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD SHOWCASE SIMULASI BIAYA */}
              <div className="bg-gradient-to-br from-[#eff6ff] via-[#f0f9ff] to-[#ecfdf5] border-2 border-[#93c5fd] rounded-xl p-3.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#0284c7]" />
                    Formula Perhitungan Jasa Potong:
                  </span>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {totalVolume.toLocaleString('id-ID')} Pcs × Rp {tarif.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-2 border-t border-blue-200/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-extrabold text-blue-900 block">Total Estimasi Biaya Cutting</span>
                    <span className="text-[10px] text-slate-500">Akan dicatat sebagai beban ongkos pengerjaan cutting</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-xl text-[#0284c7] drop-shadow-xs">
                      Rp {totalBiaya.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </form>
      </div>

      {/* 3. BOTTOM BAR FULL SCREEN (STICKY) */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0 w-full">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Batch Diserahkan: <strong className="text-slate-800">{targetItems.length} Antrean</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="text-slate-500 font-medium">
            Total Target: <strong className="text-slate-800">{totalVolume.toLocaleString('id-ID')} Pcs</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-slate-700">
            Total Biaya Jasa: <strong className="text-[#059669]">Rp {totalBiaya.toLocaleString('id-ID')}</strong>
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
            form="form-serah-cutting-fullscreen"
            className="h-8 px-5 rounded-lg bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1e40af] hover:from-[#0369a1] hover:to-[#1e3a8a] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer transition-all"
          >
            <Scissors className="w-4 h-4" />
            <span>Konfirmasi & Serahkan ke Tim Cutting</span>
          </button>
        </div>
      </div>
    </div>
  );
}

