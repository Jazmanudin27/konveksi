import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Scissors,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Calendar,
  AlertCircle,
  Shirt,
  UserCheck,
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Check,
  AlertTriangle,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { api } from '../../../services/api';
import { Swal } from '../../../utils/swal';

export default function DivisiJahit({
  antreanList = [],
  setAntreanList,
  products = [],
  employees = [],
  jasa = [],
  currentUser = null,
  userRole = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Filter daftar penjahit dari master karyawan
  const jahitWorkers = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'Aktif' &&
        (String(e.bagian || '').toLowerCase().includes('jahit') ||
          String(e.bagian || '').toLowerCase().includes('sew') ||
          String(e.kategori || '').toLowerCase().includes('borongan'))
    );
  }, [employees]);

  // Penjahit yang sedang aktif/mengambil pekerjaan
  const [selectedPenjahit, setSelectedPenjahit] = useState(() => {
    if (currentUser?.nama) return currentUser.nama;
    return '';
  });

  // Opsi daftar penjahit lengkap (User login + master karyawan jahit)
  const allPenjahitOptions = useMemo(() => {
    const list = [];
    if (currentUser?.nama) {
      list.push({
        id: 'me',
        nama: currentUser.nama,
        label: `${currentUser.nama} (Saya)`,
        kategori: 'User Login'
      });
    }
    jahitWorkers.forEach((w) => {
      if (!list.some((item) => item.nama === w.nama)) {
        list.push({
          id: w.id || w.nama,
          nama: w.nama,
          label: w.nama,
          nik: w.nik,
          bagian: w.bagian,
          kategori: w.kategori
        });
      }
    });
    if (list.length === 0) {
      list.push({ id: 'def1', nama: 'Tim Jahit 1', label: 'Tim Jahit 1' });
    }
    return list;
  }, [currentUser, jahitWorkers]);

  // State search & open dropdown penjahit di toolbar
  const [isPenjahitDropdownOpen, setIsPenjahitDropdownOpen] = useState(false);
  const [penjahitSearchQuery, setPenjahitSearchQuery] = useState('');
  const penjahitDropdownRef = useRef(null);

  // Close penjahit dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (penjahitDropdownRef.current && !penjahitDropdownRef.current.contains(event.target)) {
        setIsPenjahitDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPenjahitOptions = useMemo(() => {
    if (!penjahitSearchQuery.trim()) return allPenjahitOptions;
    const q = penjahitSearchQuery.toLowerCase();
    return allPenjahitOptions.filter(
      (opt) =>
        opt.nama.toLowerCase().includes(q) ||
        opt.label.toLowerCase().includes(q) ||
        (opt.nik && String(opt.nik).toLowerCase().includes(q))
    );
  }, [allPenjahitOptions, penjahitSearchQuery]);

  const currentSelectedPenjahitLabel = useMemo(() => {
    const found = allPenjahitOptions.find((o) => o.nama === selectedPenjahit);
    if (found) return found.label;
    return selectedPenjahit || 'Pilih Penjahit...';
  }, [allPenjahitOptions, selectedPenjahit]);

  // State search & open dropdown penjahit di modal Atur Penjahit (approvalModalItem)
  const [isApprovalPenjahitOpen, setIsApprovalPenjahitOpen] = useState(false);
  const [approvalPenjahitSearch, setApprovalPenjahitSearch] = useState('');
  const approvalPenjahitRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (approvalPenjahitRef.current && !approvalPenjahitRef.current.contains(event.target)) {
        setIsApprovalPenjahitOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredApprovalPenjahitOptions = useMemo(() => {
    if (!approvalPenjahitSearch.trim()) return allPenjahitOptions;
    const q = approvalPenjahitSearch.toLowerCase();
    return allPenjahitOptions.filter(
      (opt) =>
        opt.nama.toLowerCase().includes(q) ||
        opt.label.toLowerCase().includes(q) ||
        (opt.nik && String(opt.nik).toLowerCase().includes(q))
    );
  }, [allPenjahitOptions, approvalPenjahitSearch]);

  useEffect(() => {
    if (currentUser?.nama) {
      setSelectedPenjahit(currentUser.nama);
    } else if (!selectedPenjahit && jahitWorkers.length > 0) {
      setSelectedPenjahit(jahitWorkers[0].nama);
    }
  }, [currentUser, jahitWorkers]);

  // Tab aktif: default ke 'ambil' jika ada antrean dari cutting yang siap diambil
  const [activeTab, setActiveTab] = useState(() => {
    const hasAmbil = antreanList.some(
      (i) =>
        i.status === 'Proses Cutting' ||
        i.status === 'Sedang Diproses' ||
        i.status === 'Menunggu Jahit'
    );
    return hasAmbil ? 'ambil' : 'proses';
  });

  // Modal Approval (Terima & Tugaskan Penjahit Manual)
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    tglSerahJahit: new Date().toISOString().slice(0, 10),
    timJahit: '',
    tarifJahit: 3500,
    catatanJahit: ''
  });

  // Modal Selesaikan Jahit & Serahkan ke QC
  const [serahQcModalItem, setSerahQcModalItem] = useState(null);
  const [serahQcForm, setSerahQcForm] = useState({
    tglSerahQc: new Date().toISOString().slice(0, 10),
    timQc: 'Tim QC (Pemeriksaan)',
    tarifQc: 500,
    catatanQc: 'Jahitan selesai, siap inspeksi kualitas.'
  });

  // Filter tim/petugas QC dari master karyawan & localStorage (sinkron dengan ModalSerahQC SPK)
  const qcEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'Aktif' &&
        (String(e.bagian || '').toLowerCase().includes('qc') ||
          String(e.bagian || '').toLowerCase().includes('quality'))
    );
  }, [employees]);

  const [customQcTeams, setCustomQcTeams] = useState(() => {
    try {
      const cached = localStorage.getItem('konveksi_custom_qc_teams');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    const defaultList = [
      ...qcEmployees.map((e) => `Tim ${e.nama} (${e.bagian || 'QC'})`),
      'Tim QC 1 (Inspeksi Jahitan & Pola)',
      'Tim QC 2 (Inspeksi Finishing & Aksesoris)',
      'Supervisor QC Meja Utama'
    ];
    return Array.from(new Set(defaultList));
  });

  // Sinkronkan tim jika master karyawan memuat tim baru
  useEffect(() => {
    if (qcEmployees.length > 0) {
      setCustomQcTeams((prev) => {
        const empTeams = qcEmployees.map((e) => `Tim ${e.nama} (${e.bagian || 'QC'})`);
        return Array.from(new Set([...empTeams, ...prev]));
      });
    }
  }, [qcEmployees]);

  const [isQcComboboxOpen, setIsQcComboboxOpen] = useState(false);
  const [qcSearchQuery, setQcSearchQuery] = useState('');
  const [isAddingQcTeam, setIsAddingQcTeam] = useState(false);
  const [newQcTeamInput, setNewQcTeamInput] = useState('');
  const [editingQcIndex, setEditingQcIndex] = useState(null);
  const [editingQcInput, setEditingQcInput] = useState('');
  const qcComboboxRef = useRef(null);

  // Close combobox saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (qcComboboxRef.current && !qcComboboxRef.current.contains(event.target)) {
        setIsQcComboboxOpen(false);
        setIsAddingQcTeam(false);
        setEditingQcIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveQcTeamsToStorage = (updated) => {
    setCustomQcTeams(updated);
    try {
      localStorage.setItem('konveksi_custom_qc_teams', JSON.stringify(updated));
    } catch (_) {}
  };

  const filteredQcTeams = useMemo(() => {
    if (!qcSearchQuery.trim()) return customQcTeams;
    const q = qcSearchQuery.toLowerCase();
    return customQcTeams.filter((t) => t.toLowerCase().includes(q));
  }, [customQcTeams, qcSearchQuery]);

  const handleAddNewQcTeam = (e) => {
    e?.preventDefault?.();
    const val = newQcTeamInput.trim();
    if (!val) return;
    if (customQcTeams.includes(val)) {
      setSerahQcForm((prev) => ({ ...prev, timQc: val }));
      setIsAddingQcTeam(false);
      setNewQcTeamInput('');
      setIsQcComboboxOpen(false);
      return;
    }
    const updated = [...customQcTeams, val];
    saveQcTeamsToStorage(updated);
    setSerahQcForm((prev) => ({ ...prev, timQc: val }));
    setIsAddingQcTeam(false);
    setNewQcTeamInput('');
    setIsQcComboboxOpen(false);
  };

  const handleSaveEditQcTeam = (idx, oldVal) => {
    const val = editingQcInput.trim();
    if (!val) {
      setEditingQcIndex(null);
      return;
    }
    const updated = [...customQcTeams];
    updated[idx] = val;
    saveQcTeamsToStorage(updated);
    if (serahQcForm.timQc === oldVal) {
      setSerahQcForm((prev) => ({ ...prev, timQc: val }));
    }
    setEditingQcIndex(null);
    setEditingQcInput('');
  };

  const handleDeleteQcTeam = (valToDelete, e) => {
    e.stopPropagation();
    const updated = customQcTeams.filter((t) => t !== valToDelete);
    saveQcTeamsToStorage(updated);
    if (serahQcForm.timQc === valToDelete) {
      setSerahQcForm((prev) => ({ ...prev, timQc: updated[0] || 'Tim QC' }));
    }
  };

  // Filter Data Khusus Divisi Jahit
  const jahitData = useMemo(() => {
    return antreanList.filter((item) => {
      const isReturQc =
        item.status === 'Proses Jahit' &&
        (Number(item.qtyRejectQc) > 0 ||
          String(item.statusQc || '').includes('Reject') ||
          String(item.statusQc || '').includes('Perbaikan'));

      if (activeTab === 'ambil') {
        // Tampilkan antrean yang sedang proses cutting & siap diambil penjahit
        return (
          item.status === 'Proses Cutting' ||
          item.status === 'Sedang Diproses' ||
          item.status === 'Menunggu Jahit'
        );
      }
      if (activeTab === 'proses') {
        return item.status === 'Proses Jahit' && !isReturQc;
      }
      if (activeTab === 'retur') {
        return isReturQc;
      }
      if (activeTab === 'riwayat') {
        return (
          item.status === 'Proses QC' ||
          item.status === 'Proses Finishing' ||
          item.status === 'Selesai'
        );
      }
      return false;
    });
  }, [antreanList, activeTab]);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return jahitData;
    const q = searchTerm.toLowerCase();
    return jahitData.filter(
      (item) =>
        (item.noAntrian || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.namaProduk || '').toLowerCase().includes(q) ||
        (item.timJahit || '').toLowerCase().includes(q) ||
        (item.noReff || '').toLowerCase().includes(q)
    );
  }, [jahitData, searchTerm]);

  // Statistik KPI Divisi Jahit
  const stats = useMemo(() => {
    const ambil = antreanList.filter(
      (i) =>
        i.status === 'Proses Cutting' ||
        i.status === 'Sedang Diproses' ||
        i.status === 'Menunggu Jahit'
    );
    const proses = antreanList.filter(
      (i) =>
        i.status === 'Proses Jahit' &&
        !(
          Number(i.qtyRejectQc) > 0 ||
          String(i.statusQc || '').includes('Reject') ||
          String(i.statusQc || '').includes('Perbaikan')
        )
    );
    const retur = antreanList.filter(
      (i) =>
        i.status === 'Proses Jahit' &&
        (Number(i.qtyRejectQc) > 0 ||
          String(i.statusQc || '').includes('Reject') ||
          String(i.statusQc || '').includes('Perbaikan'))
    );
    const riwayat = antreanList.filter((i) =>
      ['Proses QC', 'Proses Finishing', 'Selesai'].includes(i.status)
    );
    const totalPcsAmbil = ambil.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const totalPcsJahit = proses.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    return {
      ambilCount: ambil.length,
      totalPcsAmbil,
      prosesCount: proses.length,
      returCount: retur.length,
      riwayatCount: riwayat.length,
      totalPcsJahit
    };
  }, [antreanList]);

  // Aksi Cepat 1-Klik: Ambil Jahitan dari Cutting
  const handleAmbilJahit = async (item) => {
    const finalTim =
      selectedPenjahit ||
      currentUser?.nama ||
      (jahitWorkers.length > 0 ? jahitWorkers[0].nama : 'Tim Jahit 1');

    const matchedProd = products.find((p) => p.sku === item.sku);
    const matchedJasa = (jasa || []).find((j) => {
      const n = (j.namaJasa || '').toLowerCase();
      return n.includes('jahit') || n.includes('sew');
    });
    const tarif =
      Number(item.tarifJahit) ||
      Number(matchedProd?.hargaJahit || matchedProd?.tarifJahit) ||
      Number(matchedJasa?.harga) ||
      3500;
    const qtyVal = Number(item.qty) || 1;
    const totalBiaya = qtyVal * tarif;
    const tglToday = new Date().toISOString().slice(0, 10);

    try {
      setLoading(true);
      const payload = {
        ids: [item.id],
        tglSerahJahit: tglToday,
        timJahit: finalTim,
        tarifJahit: tarif,
        catatanJahit: item.catatanJahit || `Diambil langsung dari cutting oleh ${finalTim}`,
      };

      await api.serahJahit(payload);

      // Otomatis selesai cutting & update status jadi 'Proses Jahit'
      setAntreanList((prev) => {
        const next = prev.map((ant) =>
          ant.id === item.id
            ? {
                ...ant,
                status: 'Proses Jahit',
                tglSerahJahit: tglToday,
                timJahit: finalTim,
                tarifJahit: tarif,
                totalBiayaJahit: totalBiaya,
                catatanJahit: payload.catatanJahit,
              }
            : ant
        );
        try {
          localStorage.setItem('konveksi_antrean_list', JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      Swal.fire({
        icon: 'success',
        title: 'Jahitan Berhasil Diambil!',
        text: `SPK ${item.noAntrian} (${item.namaProduk} - ${qtyVal} Pcs) telah diambil oleh ${finalTim}. Status kini: Proses Jahit.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.error('Gagal Mengambil', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Ambil Semua Antrean Siap Diambil Sekaligus
  const handleAmbilSemua = async () => {
    if (filteredData.length === 0) return;
    const finalTim =
      selectedPenjahit ||
      currentUser?.nama ||
      (jahitWorkers.length > 0 ? jahitWorkers[0].nama : 'Tim Jahit 1');

    try {
      setLoading(true);
      const tglToday = new Date().toISOString().slice(0, 10);
      const ids = filteredData.map((d) => d.id);

      const payload = {
        ids,
        tglSerahJahit: tglToday,
        timJahit: finalTim,
        tarifJahit: 3500,
        catatanJahit: `Diambil sekaligus oleh ${finalTim}`,
      };

      await api.serahJahit(payload);

      setAntreanList((prev) => {
        const next = prev.map((ant) => {
          if (ids.includes(ant.id)) {
            const matchedProd = products.find((p) => p.sku === ant.sku);
            const tarif =
              Number(ant.tarifJahit) ||
              Number(matchedProd?.hargaJahit || matchedProd?.tarifJahit) ||
              3500;
            return {
              ...ant,
              status: 'Proses Jahit',
              tglSerahJahit: tglToday,
              timJahit: finalTim,
              tarifJahit: tarif,
              totalBiayaJahit: (Number(ant.qty) || 1) * tarif,
              catatanJahit: `Diambil sekaligus oleh ${finalTim}`,
            };
          }
          return ant;
        });
        try {
          localStorage.setItem('konveksi_antrean_list', JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      Swal.fire({
        icon: 'success',
        title: 'Semua Jahitan Berhasil Diambil!',
        text: `${ids.length} batch SPK berhasil diambil oleh ${finalTim} dan masuk ke pengerjaan jahit.`,
        timer: 2000,
        showConfirmButton: false,
      });
      setActiveTab('proses');
    } catch (err) {
      Swal.error('Gagal Mengambil', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Approval Terima / Atur Penjahit
  const handleOpenApproval = (item) => {
    setApprovalForm({
      tglSerahJahit: item.tglSerahJahit || new Date().toISOString().slice(0, 10),
      timJahit: item.timJahit || (allPenjahitOptions.length > 0 ? allPenjahitOptions[0].nama : 'Tim Jahit 1'),
      tarifJahit: Number(item.tarifJahit) || 3500,
      catatanJahit: item.catatanJahit || 'Jahit rapih sesuai standar sample'
    });
    setApprovalModalItem(item);
    setIsApprovalPenjahitOpen(false);
    setApprovalPenjahitSearch('');
  };

  // Submit Approval Terima Order Jahit
  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!approvalModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [approvalModalItem.id],
        tglSerahJahit: approvalForm.tglSerahJahit,
        timJahit: approvalForm.timJahit,
        tarifJahit: Number(approvalForm.tarifJahit) || 0,
        catatanJahit: approvalForm.catatanJahit
      };

      await api.serahJahit(payload);

      // Update state lokal
      setAntreanList((prev) =>
        prev.map((ant) =>
          ant.id === approvalModalItem.id
            ? {
                ...ant,
                status: 'Proses Jahit',
                tglSerahJahit: approvalForm.tglSerahJahit,
                timJahit: approvalForm.timJahit,
                tarifJahit: Number(approvalForm.tarifJahit) || 0,
                totalBiayaJahit: (Number(ant.qty) || 1) * (Number(approvalForm.tarifJahit) || 0),
                catatanJahit: approvalForm.catatanJahit
              }
            : ant
        )
      );

      Swal.success(
        'Penjahit Ditugaskan!',
        `Antrean ${approvalModalItem.noAntrian} berhasil dialokasikan ke ${approvalForm.timJahit}.`
      );
      setApprovalModalItem(null);
      setActiveTab('proses');
    } catch (err) {
      Swal.error('Gagal Simpan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Serah ke QC
  const handleOpenSerahQc = (item) => {
    const defaultTim =
      item.timQc ||
      (customQcTeams.length > 0 ? customQcTeams[0] : 'Tim QC (Pemeriksaan)');
    const matchedProd = products.find((p) => p.sku === item.sku);
    const matchedJasa = jasa.find((j) => (j.namaJasa || '').toLowerCase().includes('qc'));
    const finalTarifQc =
      Number(item.tarifQc) ||
      Number(matchedProd?.hargaQc || matchedProd?.tarifQc) ||
      Number(matchedJasa?.harga) ||
      500;

    setSerahQcForm({
      tglSerahQc: new Date().toISOString().slice(0, 10),
      timQc: defaultTim,
      tarifQc: finalTarifQc,
      catatanQc: item.catatanQc || 'Jahitan selesai lengkap, siap diinspeksi QC.'
    });
    setSerahQcModalItem(item);
    setIsQcComboboxOpen(false);
    setIsAddingQcTeam(false);
    setEditingQcIndex(null);
    setQcSearchQuery('');
  };

  // Submit Selesai Jahit & Serahkan ke QC
  const handleSubmitSerahQc = async (e) => {
    e.preventDefault();
    if (!serahQcModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [serahQcModalItem.id],
        tglSerahQc: serahQcForm.tglSerahQc,
        timQc: serahQcForm.timQc,
        tarifQc: Number(serahQcForm.tarifQc) || 500,
        catatanQc: serahQcForm.catatanQc,
        statusQc: 'Pemeriksaan'
      };

      await api.serahQc(payload);

      // Update state lokal
      setAntreanList((prev) =>
        prev.map((ant) =>
          ant.id === serahQcModalItem.id
            ? {
                ...ant,
                status: 'Proses QC',
                statusQc: 'Pemeriksaan',
                tglSerahQc: serahQcForm.tglSerahQc,
                timQc: serahQcForm.timQc,
                tarifQc: Number(serahQcForm.tarifQc) || 500,
                totalBiayaQc: (Number(ant.qty) || 1) * (Number(serahQcForm.tarifQc) || 500),
                catatanQc: serahQcForm.catatanQc
              }
            : ant
        )
      );

      Swal.success(
        'Jahit Selesai!',
        `Antrean ${serahQcModalItem.noAntrian} telah diserahkan ke Divisi QC untuk inspeksi.`
      );
      setSerahQcModalItem(null);
    } catch (err) {
      Swal.error('Gagal Serahkan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. HEADER BANNER KHUSUS DIVISI JAHIT */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 text-white rounded-xl p-4 sm:px-6 shadow-sm border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <Shirt className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Divisi Jahit (Sewing)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-purple-100 border border-white/25">
                Admin Jahit
              </span>
            </div>
            <p className="text-xs text-purple-100/90 mt-0.5">
              Kelola antrean menjahit pakaian, alokasi penjahit borongan/tetap, perbaikan retur QC, dan serah terima ke QC.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            api.getAntrean()
              .then((fresh) => {
                if (Array.isArray(fresh)) setAntreanList(fresh);
                Swal.toast('Data jahit diperbarui');
              })
              .finally(() => setLoading(false));
          }}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 active:scale-95 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('ambil')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'ambil'
              ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-purple-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Siap Diambil (Cutting)
            </span>
            <Scissors className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.ambilCount}
          </div>
          <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
            {stats.totalPcsAmbil.toLocaleString('id-ID')} Pcs Siap Dijahit
          </p>
        </div>

        <div
          onClick={() => setActiveTab('proses')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'proses'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sedang Dijahit
            </span>
            <Shirt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.prosesCount}
          </div>
          <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
            {stats.totalPcsJahit.toLocaleString('id-ID')} Pcs Dikerjakan
          </p>
        </div>

        <div
          onClick={() => setActiveTab('retur')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'retur'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Retur Revisi QC
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.returCount}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
            Perlu Perbaikan Jahit
          </p>
        </div>

        <div
          onClick={() => setActiveTab('riwayat')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'riwayat'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Selesai Jahit
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.riwayatCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Diserahkan ke QC / Finishing
          </p>
        </div>
      </div>

      {/* 3. TABS NAVIGASI WORKFLOW & PENCARIAN */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('ambil')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ambil'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Siap Diambil (Cutting)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'ambil'
                  ? 'bg-white/25 text-white'
                  : 'bg-purple-200 text-purple-900'
              }`}
            >
              {stats.ambilCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('proses')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'proses'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Sedang Jahit</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'proses' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.prosesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('retur')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'retur'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Perbaikan Retur QC</span>
            {stats.returCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-rose-700">
                {stats.returCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'riwayat'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Riwayat Selesai</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'riwayat' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.riwayatCount}
            </span>
          </button>
        </div>

        {/* CONTROLS: PILIH PENJAHIT & SEARCH */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {/* SEARCHABLE SELECT PENJAHIT DI TOOLBAR */}
          <div className="relative" ref={penjahitDropdownRef}>
            <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              <UserCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="text-[11px] font-bold text-purple-900 whitespace-nowrap">
                Penjahit:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsPenjahitDropdownOpen((prev) => !prev);
                  setPenjahitSearchQuery('');
                }}
                className="min-w-[150px] max-w-[220px] h-7 bg-white border border-purple-300 hover:border-purple-500 rounded px-2 text-xs font-bold text-purple-950 flex items-center justify-between gap-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer shadow-2xs transition-all"
              >
                <span className="truncate text-left">{currentSelectedPenjahitLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-purple-600 shrink-0 transition-transform duration-200 ${
                    isPenjahitDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* DROPDOWN MENU WITH SEARCH BAR */}
            {isPenjahitDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs font-sans">
                {/* Search Box */}
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cari nama penjahit..."
                    value={penjahitSearchQuery}
                    onChange={(e) => setPenjahitSearchQuery(e.target.value)}
                    className="w-full text-xs bg-white h-7 px-2 rounded-md border border-slate-200 focus:outline-none focus:border-purple-600 font-medium text-slate-800 placeholder-slate-400"
                  />
                  {penjahitSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPenjahitSearchQuery('')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* List Items */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
                  {filteredPenjahitOptions.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      Penjahit tidak ditemukan.
                    </div>
                  ) : (
                    filteredPenjahitOptions.map((opt) => {
                      const isSelected = selectedPenjahit === opt.nama;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setSelectedPenjahit(opt.nama);
                            setIsPenjahitDropdownOpen(false);
                            setPenjahitSearchQuery('');
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-purple-50 text-purple-800 font-black'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="truncate">
                            <span className="block truncate">{opt.label}</span>
                            {opt.nik && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                NIK: {opt.nik}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 ml-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {activeTab === 'ambil' && filteredData.length > 1 && (
            <button
              type="button"
              onClick={handleAmbilSemua}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Ambil Semua ({filteredData.length})</span>
            </button>
          )}

          {/* SEARCH BOX */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No Antrian / SKU..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>
      </div>

      {/* 4. TABEL DATA WORKFLOW JAHIT */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-700">NO</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">NO ANTREAN & PO</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-700">PRODUK & SKU</th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">TARGET QTY</th>
                <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-700">NAMA PENJAHIT</th>
                <th className="py-2.5 px-3 text-right w-28 border-r border-slate-700">TARIF JAHIT</th>
                <th className="py-2.5 px-3 text-center w-32 border-r border-slate-700">STATUS</th>
                <th className="py-2.5 px-3 text-center min-w-[150px]">AKSI DIVISI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Shirt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">
                      {activeTab === 'ambil'
                        ? 'Tidak ada antrean dari cutting yang menunggu diambil'
                        : 'Tidak ada antrean jahit pada filter ini'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activeTab === 'ambil'
                        ? 'Semua kain yang dipotong sudah diambil oleh penjahit atau belum ada SPK di proses cutting.'
                        : 'Semua order jahit telah selesai atau belum ada pekerjaan masuk.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const qtyVal = Number(item.qty) || 0;
                  const tarifVal = Number(item.tarifJahit) || 0;
                  const totalOngkos = Number(item.totalBiayaJahit) || qtyVal * tarifVal;
                  const isReturQc =
                    Number(item.qtyRejectQc) > 0 ||
                    String(item.statusQc || '').includes('Reject') ||
                    String(item.statusQc || '').includes('Perbaikan');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isReturQc ? 'bg-rose-50/40' : activeTab === 'ambil' ? 'bg-purple-50/20' : ''
                      }`}
                    >
                      {/* NO */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO ANTREAN & PO */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-mono font-bold text-xs text-purple-600">
                          {item.noAntrian}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-normal">
                          {item.noReff || 'Internal'} • {item.tglMasuk || '-'}
                        </div>
                        {isReturQc && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                            <RotateCcw className="w-2.5 h-2.5 stroke-[3]" />
                            <span>RETUR QC ({item.qtyRejectQc || item.qty} Pcs)</span>
                          </span>
                        )}
                      </td>

                      {/* PRODUK & SKU */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.namaProduk || item.sku}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold border border-slate-200">
                            {item.sku}
                          </span>
                          {item.varian && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({item.varian} - {item.ukuran || 'All Size'})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TARGET QTY */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200/60">
                        {qtyVal.toLocaleString('id-ID')} Pcs
                      </td>

                      {/* NAMA PENJAHIT */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        {activeTab === 'ambil' ? (
                          <div className="flex flex-col">
                            <span className="text-[10.5px] text-purple-700 font-bold flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>Diambil: {selectedPenjahit || currentUser?.nama || 'Penjahit'}</span>
                            </span>
                            {item.timCutting && (
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Potong: {item.timCutting}
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>{item.timJahit || '- Belum Ditugaskan -'}</span>
                            </div>
                            {item.tglSerahJahit && (
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                Mulai: {item.tglSerahJahit}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* TARIF & TOTAL ONGKOS */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-200/60 font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          Rp {tarifVal.toLocaleString('id-ID')}/pc
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Total: Rp {totalOngkos.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200/60">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            activeTab === 'ambil'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : isReturQc
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : item.status === 'Proses Jahit'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {activeTab === 'ambil' ? 'Siap Diambil' : item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* TOMBOL AMBIL DI TAB SIAP DIAMBIL */}
                          {activeTab === 'ambil' && (
                            <button
                              onClick={() => handleAmbilJahit(item)}
                              disabled={loading}
                              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                              title="Ambil pekerjaan ini langsung untuk dijahit"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Ambil</span>
                            </button>
                          )}

                          {/* ATUR / UBAH PENJAHIT & SERAH QC PADA TAB PROSES JAHIT */}
                          {activeTab !== 'ambil' && item.status === 'Proses Jahit' && (
                            <>
                              <button
                                onClick={() => handleOpenApproval(item)}
                                className="w-7.5 h-7.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                                title="Atur / Tugaskan Penjahit"
                              >
                                <UserCheck className="w-4 h-4 text-white stroke-[2.2]" />
                              </button>

                              <button
                                onClick={() => handleOpenSerahQc(item)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                                title="Selesaikan Jahitan & Serahkan ke Divisi QC"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>Serah ke QC</span>
                              </button>
                            </>
                          )}

                          {/* DETAIL BUTTON */}
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="w-7.5 h-7.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                            title="Lihat Rincian Antrean"
                          >
                            <Eye className="w-4 h-4 text-white stroke-[2.2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SUMMARY FOOTER */}
        <div className="bg-[#f8fafc] border-t border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredData.length}</span> antrean jahit
          </div>
          <div className="font-semibold text-slate-700">
            Divisi Jahit • Terhubung Database MySQL
          </div>
        </div>
      </div>

      {/* 5. MODAL ATUR PENJAHIT */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Tugaskan Penjahit (Sewing)
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {approvalModalItem.noAntrian} • Qty: {approvalModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Produk / Model
                </label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800">
                  {approvalModalItem.namaProduk} ({approvalModalItem.sku})
                </div>
              </div>

              {/* PILIH PENJAHIT (SEARCHABLE COMBOBOX) */}
              <div className="relative" ref={approvalPenjahitRef}>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Penjahit *
                </label>
                <div
                  onClick={() => setIsApprovalPenjahitOpen((prev) => !prev)}
                  className={`w-full h-9 px-3 rounded-lg border text-xs flex items-center justify-between bg-white cursor-pointer transition-all ${
                    isApprovalPenjahitOpen
                      ? 'border-purple-600 ring-2 ring-purple-600/20'
                      : 'border-slate-300 hover:border-purple-600'
                  }`}
                >
                  <span className="font-semibold text-slate-800 truncate">
                    {approvalForm.timJahit || 'Pilih Penjahit...'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isApprovalPenjahitOpen ? 'rotate-180 text-purple-600' : ''
                    }`}
                  />
                </div>

                {isApprovalPenjahitOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs font-sans">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Cari nama penjahit..."
                        value={approvalPenjahitSearch}
                        onChange={(e) => setApprovalPenjahitSearch(e.target.value)}
                        className="w-full text-xs bg-white h-7 px-2 rounded-md border border-slate-200 focus:outline-none focus:border-purple-600 font-medium text-slate-800 placeholder-slate-400"
                      />
                      {approvalPenjahitSearch && (
                        <button
                          type="button"
                          onClick={() => setApprovalPenjahitSearch('')}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 p-1">
                      {filteredApprovalPenjahitOptions.length === 0 ? (
                        <div className="py-3 text-center text-slate-400 text-xs">
                          Penjahit tidak ditemukan.
                        </div>
                      ) : (
                        filteredApprovalPenjahitOptions.map((opt) => {
                          const isSelected = approvalForm.timJahit === opt.nama;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                setApprovalForm((prev) => ({ ...prev, timJahit: opt.nama }));
                                setIsApprovalPenjahitOpen(false);
                                setApprovalPenjahitSearch('');
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-50 text-purple-800 font-black'
                                  : 'hover:bg-slate-50 text-slate-700 font-medium'
                              }`}
                            >
                              <div className="truncate">
                                <span className="block truncate">{opt.label}</span>
                                {opt.nik && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    NIK: {opt.nik} {opt.kategori ? `• ${opt.kategori}` : ''}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 ml-1" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Mulai Jahit *
                  </label>
                  <input
                    type="date"
                    required
                    value={approvalForm.tglSerahJahit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, tglSerahJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ongkos Jahit / Pcs (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={approvalForm.tarifJahit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, tarifJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-purple-600 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Jahit
                </label>
                <textarea
                  rows="2"
                  value={approvalForm.catatanJahit}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, catatanJahit: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600"
                  placeholder="Instruksi jahitan..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Alokasi Penjahit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SERAHKAN KE DIVISI QC */}
      {serahQcModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Selesaikan Jahit & Serahkan ke QC
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {serahQcModalItem.noAntrian} • Target: {serahQcModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSerahQcModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSerahQc} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Masuk Meja QC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={serahQcForm.tglSerahQc}
                    onChange={(e) =>
                      setSerahQcForm({ ...serahQcForm, tglSerahQc: e.target.value })
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tarif Upah QC (per Pcs) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400 select-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={Number(serahQcForm.tarifQc || 0).toLocaleString('id-ID')}
                      className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 bg-slate-100 font-mono font-black text-slate-700 text-xs text-right cursor-not-allowed select-none shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* TIM / PETUGAS QC (SEARCHABLE SELECT COMBOBOX DENGAN DATABASE KARYAWAN & SEARCH) */}
              <div className="relative" ref={qcComboboxRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Tim / Petugas QC Pemeriksa <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQcComboboxOpen(true);
                      setIsAddingQcTeam(true);
                    }}
                    className="text-[10.5px] text-teal-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Petugas</span>
                  </button>
                </div>

                {/* Combobox Trigger Box */}
                <div
                  onClick={() => setIsQcComboboxOpen((prev) => !prev)}
                  className={`w-full h-9 px-3 rounded-lg border text-xs flex items-center justify-between bg-white cursor-pointer transition-all ${
                    isQcComboboxOpen
                      ? 'border-teal-600 ring-2 ring-teal-600/20'
                      : 'border-slate-300 hover:border-teal-600'
                  }`}
                >
                  <span className="font-semibold text-slate-800 truncate">
                    {serahQcForm.timQc || 'Pilih Tim QC...'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isQcComboboxOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </div>

                {/* Combobox Popover Dropdown */}
                {isQcComboboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs font-sans">
                    {/* Search Bar Input */}
                    <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Cari nama tim / petugas QC..."
                        value={qcSearchQuery}
                        onChange={(e) => setQcSearchQuery(e.target.value)}
                        className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
                      />
                      {qcSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setQcSearchQuery('')}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Mode Tambah Tim Baru */}
                    {isAddingQcTeam && (
                      <div className="p-2 bg-teal-50 border-b border-teal-200 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Ketik nama tim / petugas QC baru..."
                          value={newQcTeamInput}
                          onChange={(e) => setNewQcTeamInput(e.target.value)}
                          className="flex-1 h-7 px-2 bg-white rounded border border-teal-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddNewQcTeam(e);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddNewQcTeam}
                          className="px-2.5 h-7 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-[11px] cursor-pointer shrink-0"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingQcTeam(false)}
                          className="px-2 h-7 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-[11px] cursor-pointer shrink-0"
                        >
                          Batal
                        </button>
                      </div>
                    )}

                    {/* List Items */}
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 p-1">
                      {filteredQcTeams.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-xs">
                          Petugas QC tidak ditemukan.
                        </div>
                      ) : (
                        filteredQcTeams.map((teamName, idx) => {
                          const isSelected = serahQcForm.timQc === teamName;
                          const isEditing = editingQcIndex === idx;

                          if (isEditing) {
                            return (
                              <div
                                key={idx}
                                className="p-1.5 flex items-center gap-1 bg-amber-50"
                              >
                                <input
                                  type="text"
                                  value={editingQcInput}
                                  onChange={(e) => setEditingQcInput(e.target.value)}
                                  className="flex-1 h-6 px-1.5 bg-white rounded border border-amber-300 text-xs text-slate-800"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter')
                                      handleSaveEditQcTeam(idx, teamName);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditQcTeam(idx, teamName)}
                                  className="px-2 h-6 bg-emerald-600 text-white rounded font-bold text-[10px] cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingQcIndex(null)}
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
                                setSerahQcForm((prev) => ({ ...prev, timQc: teamName }));
                                setIsQcComboboxOpen(false);
                              }}
                              className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer group ${
                                isSelected
                                  ? 'bg-teal-50 font-bold text-teal-700'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                )}
                                <span className="truncate">{teamName}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingQcIndex(idx);
                                    setEditingQcInput(teamName);
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-white"
                                  title="Edit Nama Tim"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteQcTeam(teamName, e)}
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

              {/* ESTIMASI TOTAL UPAH QC BANNER */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Total Estimasi Upah QC ({serahQcModalItem.qty || 1} Pcs):
                </span>
                <span className="font-mono font-black text-slate-800">
                  Rp{' '}
                  {(
                    (Number(serahQcModalItem.qty) || 1) *
                    (Number(serahQcForm.tarifQc) || 0)
                  ).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan / Instruksi Khusus Pemeriksaan QC
                </label>
                <textarea
                  rows="2"
                  placeholder="mis: Cek jahitan kerah O-neck 1.5cm, toleransi ukuran lingkar dada +-1cm..."
                  value={serahQcForm.catatanQc}
                  onChange={(e) =>
                    setSerahQcForm({ ...serahQcForm, catatanQc: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSerahQcModalItem(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{loading ? 'Memproses...' : 'Konfirmasi & Serahkan ke Tim QC'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL DETAIL ITEM */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Detail Antrean: {selectedItemDetail.noAntrian}
              </h3>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Produk</span>
                <span className="font-bold text-slate-900">{selectedItemDetail.namaProduk}</span>
                <span className="text-slate-500 block text-[11px] font-mono">{selectedItemDetail.sku}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Qty</span>
                <span className="font-black text-purple-600 text-sm">{selectedItemDetail.qty} Pcs</span>
                <span className="text-slate-500 block text-[11px]">Deadline: {selectedItemDetail.deadline || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Penjahit</span>
                <span className="font-bold text-slate-800">{selectedItemDetail.timJahit || '-'}</span>
                <span className="text-slate-500 block text-[10.5px]">Tgl Serah: {selectedItemDetail.tglSerahJahit || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Ongkos Jahit</span>
                <span className="font-bold text-emerald-700">Rp {Number(selectedItemDetail.totalBiayaJahit || 0).toLocaleString('id-ID')}</span>
                <span className="text-slate-500 block text-[10.5px]">Tarif: Rp {Number(selectedItemDetail.tarifJahit || 0).toLocaleString('id-ID')}/pc</span>
              </div>
            </div>

            {selectedItemDetail.catatanJahit && (
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Catatan Pengerjaan Jahit</span>
                <p className="text-slate-700 italic">{selectedItemDetail.catatanJahit}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

