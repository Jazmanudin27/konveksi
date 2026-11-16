import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  Scissors,
  Shirt,
  ShieldCheck,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  User,
  Check,
  X,
  CreditCard,
  Banknote,
  Receipt,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  Eye,
  Filter,
  Wallet,
  LayoutGrid,
  ListFilter,
  Users,
  Building2,
  FileText,
  CalendarDays,
  ChevronRight,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

function angkaTerbilang(nilai) {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];
  const angka = Math.floor(Math.abs(Number(nilai) || 0));
  if (angka === 0) return 'Nol Rupiah';

  function sebut(x) {
    if (x < 12) return bilangan[x];
    if (x < 20) return sebut(x - 10) + ' Belas';
    if (x < 100) return sebut(Math.floor(x / 10)) + ' Puluh ' + sebut(x % 10);
    if (x < 200) return 'Seratus ' + sebut(x - 100);
    if (x < 1000) return sebut(Math.floor(x / 100)) + ' Ratus ' + sebut(x % 100);
    if (x < 2000) return 'Seribu ' + sebut(x - 1000);
    if (x < 1000000) return sebut(Math.floor(x / 1000)) + ' Ribu ' + sebut(x % 1000);
    if (x < 1000000000) return sebut(Math.floor(x / 1000000)) + ' Juta ' + sebut(x % 1000000);
    if (x < 1000000000000) return sebut(Math.floor(x / 1000000000)) + ' Miliar ' + sebut(x % 1000000000);
    return '';
  }

  return sebut(angka).replace(/\s+/g, ' ').trim() + ' Rupiah';
}

export default function PembayaranUpah({ employees = [], antreanList = [] }) {
  const [dataList, setDataList] = useState([]);
  const [rekap, setRekap] = useState({
    totalTagihan: 0,
    totalLunas: 0,
    totalPending: 0,
    totalPcs: 0,
    perTahapan: {},
  });
  const [loading, setLoading] = useState(false);

  // View Mode: 'sheet' (Default: Input Slip Gaji Emra Production) | 'karyawan' (Rekap Per Tim) | 'transaksi' (Rincian Order)
  const [viewMode, setViewMode] = useState('sheet');

  // State Pilihan Sheet Mode (Potong, Jahit, QC, Finishing)
  const [sheetTahap, setSheetTahap] = useState('Cutting'); // 'Cutting' | 'Jahit' | 'QC' | 'Finishing'
  const [sheetTeam, setSheetTeam] = useState('');

  // Filter Tanggal Periode Mingguan
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }, []);
  const defaultEndDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Data Kasbon untuk deteksi pinjaman aktif
  const [kasbonAll, setKasbonAll] = useState([]);

  // Filter State
  const [activeTahapTab, setActiveTahapTab] = useState('Semua'); // 'Semua' | 'Cutting' | 'Jahit' | 'QC' | 'Finishing'
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Belum Lunas' | 'Lunas'
  const [filterPetugas, setFilterPetugas] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Modal State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetPayItems, setTargetPayItems] = useState([]);
  const [payForm, setPayForm] = useState({
    tglBayar: new Date().toISOString().slice(0, 10),
    metodeBayar: 'Tunai / Cash',
    catatan: '',
  });

  // Slip Modal Single Order
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipItem, setSlipItem] = useState(null);

  // Slip Modal Karyawan / Tim Mingguan (Format Emra Production)
  const [isSlipKaryawanModalOpen, setIsSlipKaryawanModalOpen] = useState(false);
  const [selectedKaryawanName, setSelectedKaryawanName] = useState('');

  // Kasbon State saat Modal Bayar
  const [kasbonInfo, setKasbonInfo] = useState(null);
  const [potonganKasbon, setPotonganKasbon] = useState(0);

  // Fetch Data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, rekapData, kasbonData] = await Promise.all([
        api.getPembayaranUpah(),
        api.getPembayaranUpahRekap().catch(() => null),
        api.getKasbon().catch(() => []),
      ]);

      if (Array.isArray(list)) {
        setDataList(list);
      }
      if (rekapData) {
        setRekap(rekapData);
      }
      if (Array.isArray(kasbonData)) {
        setKasbonAll(kasbonData);
      }
    } catch (err) {
      console.warn('Gagal memuat pembayaran upah:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetPresetDate = (type) => {
    const today = new Date();
    if (type === 'minggu') {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (type === 'bulan') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      setEndDate(today.toISOString().slice(0, 10));
    } else if (type === 'semua') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Sync dari Antrean Produksi
  const handleSyncFromAntrean = async () => {
    try {
      Swal.fire({
        title: 'Menyinkronkan...',
        text: 'Mengambil data upah dari seluruh tahapan antrean produksi...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.syncUpahFromAntrean();
      await fetchData();

      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Selesai!',
        text: res.message || 'Data tagihan upah berhasil diperbarui dari antrean.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Sinkronisasi',
        text: err.message || 'Terjadi kesalahan sistem saat sinkronisasi.',
      });
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      if (activeTahapTab !== 'Semua' && item.tahapan !== activeTahapTab) return false;
      if (filterStatus !== 'Semua' && item.statusBayar !== filterStatus) return false;
      if (
        filterPetugas &&
        !item.namaPetugas?.toLowerCase().includes(filterPetugas.toLowerCase())
      ) {
        return false;
      }

      // Filter Tanggal Periode
      const itemDate = item.tglBayar || (item.createdAt ? String(item.createdAt).slice(0, 10) : '');
      if (startDate && itemDate && itemDate < startDate) return false;
      if (endDate && itemDate && itemDate > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = item.noPembayaran?.toLowerCase().includes(q);
        const matchAnt = item.noAntrian?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchProd = item.namaProduk?.toLowerCase().includes(q);
        const matchPet = item.namaPetugas?.toLowerCase().includes(q);
        const matchInduk = item.skuInduk?.toLowerCase().includes(q);
        if (!matchNo && !matchAnt && !matchSku && !matchProd && !matchPet && !matchInduk) return false;
      }
      return true;
    });
  }, [dataList, activeTahapTab, filterStatus, filterPetugas, searchQuery, startDate, endDate]);

  // Rekap Payroll Per Karyawan / Tim
  const rekapKaryawanList = useMemo(() => {
    const map = new Map();

    filteredList.forEach((item) => {
      const pet = (item.namaPetugas || 'Tanpa Nama').trim();
      if (!map.has(pet)) {
        // Cek pinjaman / kasbon aktif karyawan ini
        const employeeKasbons = kasbonAll.filter(
          (k) => (k.namaPetugas || '').trim().toLowerCase() === pet.toLowerCase()
        );
        const sisaPinjamanAktif = employeeKasbons.reduce(
          (acc, k) => acc + Number(k.sisa || 0),
          0
        );

        map.set(pet, {
          namaPetugas: pet,
          tahapan: item.tahapan,
          items: [],
          totalQty: 0,
          totalKotor: 0,
          totalPotonganKasbon: 0,
          totalBersih: 0,
          pendingCount: 0,
          lunasCount: 0,
          sisaPinjamanAktif,
        });
      }

      const grp = map.get(pet);
      grp.items.push(item);
      grp.totalQty += Number(item.qty || 0);
      grp.totalKotor += Number(item.totalUpah || 0);
      grp.totalPotonganKasbon += Number(item.potonganKasbon || 0);
      grp.totalBersih += Number(
        item.totalBersih ?? (Number(item.totalUpah) - Number(item.potonganKasbon || 0))
      );

      if (item.statusBayar === 'Lunas') {
        grp.lunasCount += 1;
      } else {
        grp.pendingCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalKotor - a.totalKotor);
  }, [filteredList, kasbonAll]);

  // Pisahkan Tabel Rekap Payroll Per Divisi / Tim (Cutting, Jahit, QC, Finishing)
  const groupedByTahap = useMemo(() => {
    const categories = [
      {
        key: 'Cutting',
        label: 'Tim Pemotong (Cutting)',
        sublabel: 'Borongan Per Tim Potong',
        recipientHeader: 'NAMA TIM PEMOTONG',
        icon: Scissors,
        gradient: 'from-blue-600 to-indigo-700',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      },
      {
        key: 'Jahit',
        label: 'Penjahit Konveksi (Sewing)',
        sublabel: 'Borongan Penjahit / Mitra CMT',
        recipientHeader: 'NAMA PENJAHIT / MITRA JAHIT',
        icon: Shirt,
        gradient: 'from-purple-600 to-violet-700',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      },
      {
        key: 'QC',
        label: 'Tim Quality Control (QC)',
        sublabel: 'Borongan Per Tim QC',
        recipientHeader: 'NAMA TIM QC',
        icon: ShieldCheck,
        gradient: 'from-teal-600 to-cyan-700',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      },
      {
        key: 'Finishing',
        label: 'Tim Finishing & Packing',
        sublabel: 'Borongan Per Tim Finishing',
        recipientHeader: 'NAMA TIM FINISHING',
        icon: PackageCheck,
        gradient: 'from-emerald-600 to-teal-800',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      },
    ];

    return categories
      .filter((cat) => activeTahapTab === 'Semua' || activeTahapTab === cat.key)
      .map((cat) => {
        const itemsInTahap = filteredList.filter((i) => i.tahapan === cat.key);
        const teamMap = new Map();

        itemsInTahap.forEach((item) => {
          const teamName = (item.namaPetugas || 'Tanpa Nama Tim').trim();
          if (!teamMap.has(teamName)) {
            const employeeKasbons = kasbonAll.filter(
              (k) => (k.namaPetugas || '').trim().toLowerCase() === teamName.toLowerCase()
            );
            const sisaPinjamanAktif = employeeKasbons.reduce(
              (acc, k) => acc + Number(k.sisa || 0),
              0
            );

            teamMap.set(teamName, {
              namaPetugas: teamName,
              tahapan: cat.key,
              items: [],
              totalQty: 0,
              totalKotor: 0,
              totalPotonganKasbon: 0,
              totalBersih: 0,
              pendingCount: 0,
              lunasCount: 0,
              sisaPinjamanAktif,
            });
          }

          const grp = teamMap.get(teamName);
          grp.items.push(item);
          grp.totalQty += Number(item.qty || 0);
          grp.totalKotor += Number(item.totalUpah || 0);
          grp.totalPotonganKasbon += Number(item.potonganKasbon || 0);
          grp.totalBersih += Number(
            item.totalBersih ?? (Number(item.totalUpah) - Number(item.potonganKasbon || 0))
          );

          if (item.statusBayar === 'Lunas') {
            grp.lunasCount += 1;
          } else {
            grp.pendingCount += 1;
          }
        });

        const teams = Array.from(teamMap.values()).sort((a, b) => b.totalKotor - a.totalKotor);
        const subtotalQty = teams.reduce((a, c) => a + c.totalQty, 0);
        const subtotalKotor = teams.reduce((a, c) => a + c.totalKotor, 0);
        const subtotalPotongan = teams.reduce((a, c) => a + c.totalPotonganKasbon, 0);
        const subtotalBersih = teams.reduce((a, c) => a + c.totalBersih, 0);

        return {
          ...cat,
          teams,
          subtotalQty,
          subtotalKotor,
          subtotalPotongan,
          subtotalBersih,
        };
      });
  }, [filteredList, kasbonAll, activeTahapTab]);

  // Data Tim dan Rincian untuk Sheet Google Style
  const sheetTeamsList = useMemo(() => {
    const matchedGroup = groupedByTahap.find((g) => g.key === sheetTahap);
    return matchedGroup ? matchedGroup.teams : [];
  }, [groupedByTahap, sheetTahap]);

  // Auto-select first team jika team aktif kosong atau tidak ditemukan
  useEffect(() => {
    if (sheetTeamsList.length > 0) {
      if (!sheetTeam || !sheetTeamsList.some((t) => t.namaPetugas === sheetTeam)) {
        setSheetTeam(sheetTeamsList[0].namaPetugas);
      }
    } else {
      setSheetTeam('');
    }
  }, [sheetTeamsList, sheetTeam]);

  // Data Tim yang sedang aktif di Sheet
  const activeSheetTeamData = useMemo(() => {
    if (!sheetTeam) return null;
    return sheetTeamsList.find((t) => t.namaPetugas === sheetTeam) || null;
  }, [sheetTeamsList, sheetTeam]);

  // Data Karyawan yang sedang dibuka slipnya
  const currentSlipKaryawan = useMemo(() => {
    if (!selectedKaryawanName) return null;
    for (const g of groupedByTahap) {
      const match = g.teams.find((k) => k.namaPetugas === selectedKaryawanName);
      if (match) return match;
    }
    return rekapKaryawanList.find((k) => k.namaPetugas === selectedKaryawanName) || null;
  }, [selectedKaryawanName, groupedByTahap, rekapKaryawanList]);

  const handleOpenSlipKaryawan = (namaPetugas) => {
    setSelectedKaryawanName(namaPetugas);
    setIsSlipKaryawanModalOpen(true);
  };

  // Handle Multi-Select
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredList.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Pay Modal (Single / Batch)
  const handleOpenPay = async (items) => {
    if (!items || items.length === 0) return;
    setTargetPayItems(items);
    setPayForm({
      tglBayar: new Date().toISOString().slice(0, 10),
      metodeBayar: 'Tunai / Cash',
      catatan: '',
    });

    const totalGross = items.reduce((acc, c) => acc + (Number(c.totalUpah) || 0), 0);
    const uniquePetugas = [...new Set(items.map(i => (i.namaPetugas || i.nama_petugas || '').trim()))].filter(Boolean);

    // Cek saldo kasbon petugas jika bayar untuk 1 orang petugas
    if (uniquePetugas.length === 1) {
      try {
        const saldoData = await api.getKasbonSaldo(uniquePetugas[0]);
        if (saldoData && saldoData.totalSisa > 0) {
          setKasbonInfo(saldoData);
          // Default otomatis potong sebesar sisa kasbon atau maksimal total upah
          const defaultPotong = Math.min(totalGross, saldoData.totalSisa);
          setPotonganKasbon(defaultPotong);
        } else {
          setKasbonInfo(null);
          setPotonganKasbon(0);
        }
      } catch (_) {
        setKasbonInfo(null);
        setPotonganKasbon(0);
      }
    } else {
      setKasbonInfo(null);
      setPotonganKasbon(0);
    }

    setIsPayModalOpen(true);
  };

  // Submit Pay
  const handleConfirmPay = async (e) => {
    e.preventDefault();
    if (!targetPayItems || targetPayItems.length === 0) return;

    try {
      const ids = targetPayItems.map((i) => i.id);
      await api.bayarUpah({
        ids,
        tglBayar: payForm.tglBayar,
        metodeBayar: payForm.metodeBayar,
        catatan: payForm.catatan,
        potonganKasbon: Number(potonganKasbon) || 0,
      });

      setIsPayModalOpen(false);
      setKasbonInfo(null);
      setPotonganKasbon(0);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await fetchData();

      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Berhasil Dicatat!',
        text: `${ids.length} tagihan upah telah ditandai Lunas.${Number(potonganKasbon) > 0 ? ` (Dipotong Kasbon: Rp ${Number(potonganKasbon).toLocaleString('id-ID')})` : ''}`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses Pembayaran',
        text: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  // Batal Bayar (Rollback to Belum Lunas)
  const handleBatalBayar = async (item) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Batalkan Pembayaran?',
      text: `Kembalikan tagihan ${item.noPembayaran} (${item.namaPetugas} - Rp ${Number(item.totalUpah).toLocaleString('id-ID')}) ke status "Belum Lunas"?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan Lunas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
    });

    if (res.isConfirmed) {
      try {
        await api.batalBayarUpah(item.id);
        await fetchData();

        Swal.fire({
          icon: 'success',
          title: 'Status Dibatalkan',
          text: 'Tagihan upah dikembalikan ke status Belum Lunas.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membatalkan',
          text: err.message || 'Terjadi kesalahan sistem.',
        });
      }
    }
  };

  // Open Slip Modal
  const handleOpenSlip = (item) => {
    setSlipItem(item);
    setIsSlipModalOpen(true);
  };

  // Print Slip
  const handlePrintSlip = () => {
    window.print();
  };

  // Helper Badge Tahapan
  const getTahapanBadge = (tahap) => {
    switch (tahap) {
      case 'Cutting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scissors className="w-3.5 h-3.5" />
            <span>Pemotong (Cutting)</span>
          </span>
        );
      case 'Jahit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shirt className="w-3.5 h-3.5" />
            <span>Penjahit (Sewing)</span>
          </span>
        );
      case 'QC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quality Control (QC)</span>
          </span>
        );
      case 'Finishing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Finishing & Packing</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {tahap}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-3 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white rounded-2xl py-3 px-4 sm:px-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 text-white shadow-inner border border-white/20">
            <Coins className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Pembayaran Upah Produksi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-black border border-emerald-400/30">
                PAYROLL BORONGAN
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1 leading-tight font-medium">
              Manajemen & pencatatan pembayaran upah kerja tim Pemotong, Penjahit, QC, dan Finishing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Tombol Sinkronisasi dari Antrean */}
          <button
            onClick={handleSyncFromAntrean}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/25 active:scale-95"
            title="Tarik & sinkronkan data penyerahan tahap antrean menjadi tagihan upah"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync dari Antrean</span>
          </button>

          {/* Tombol Bayar Terpilih (Batch Action) */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                const selectedItems = dataList.filter((i) => selectedIds.includes(i.id));
                handleOpenPay(selectedItems);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 animate-in zoom-in-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar Terpilih ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. REKAP KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Tagihan Upah */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Tagihan</span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            Rp {Number(rekap.totalTagihan || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            {rekap.totalPcs || 0} Pcs dikerjakan
          </span>
        </div>

        {/* Sudah Dibayar (Lunas) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-200/90 shadow-2xs bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Sudah Dibayar (Lunas)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-800 mt-1 font-mono">
            Rp {Number(rekap.totalLunas || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
            Terverifikasi Lunas
          </span>
        </div>

        {/* Sisa Belum Dibayar (Pending) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-rose-200/90 shadow-2xs bg-gradient-to-b from-rose-50/40 to-white">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Belum Dibayar (Sisa)</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-800 mt-1 font-mono">
            Rp {Number(rekap.totalPending || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-rose-700 font-bold mt-0.5 block">
            Tagihan Menunggu Bayar
          </span>
        </div>

        {/* Total Transaksi Upah */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Transaksi</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            {dataList.length} <span className="text-xs font-semibold text-slate-500">Record</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            Dari seluruh tahapan SOP
          </span>
        </div>
      </div>

      {/* 3. TABS FILTER TAHAPAN & KONTROL PENCARIAN */}
      <div className="space-y-2">
        {/* Horizontal Tabs Tahapan */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {[
            { key: 'Semua', label: 'Semua Tahapan', count: dataList.length },
            {
              key: 'Cutting',
              label: 'Pemotong (Cutting)',
              count: dataList.filter((i) => i.tahapan === 'Cutting').length,
            },
            {
              key: 'Jahit',
              label: 'Penjahit (Sewing)',
              count: dataList.filter((i) => i.tahapan === 'Jahit').length,
            },
            {
              key: 'QC',
              label: 'Tim QC',
              count: dataList.filter((i) => i.tahapan === 'QC').length,
            },
            {
              key: 'Finishing',
              label: 'Finishing & Packing',
              count: dataList.filter((i) => i.tahapan === 'Finishing').length,
            },
          ].map((tab) => {
            const isSelected = activeTahapTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTahapTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-[#064e3b] text-white font-extrabold shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher & Filter Periode Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
          {/* Baris 1: Mode Switcher & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Input Slip Gaji (Mode Google Sheet)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('karyawan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'karyawan'
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tabel Rekap Divisi</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    viewMode === 'karyawan' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rekapKaryawanList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('transaksi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'transaksi'
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Rincian Transaksi Order</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    viewMode === 'transaksi' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {filteredList.length}
                </span>
              </button>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-slate-400 mr-1 hidden sm:inline">Pilih Periode:</span>
              <button
                type="button"
                onClick={() => handleSetPresetDate('minggu')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                1 Minggu Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate('bulan')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate('semua')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Semua
              </button>
            </div>
          </div>

          {/* Baris 2: Date Range Picker, Search, Status */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1 border-t border-slate-100">
            {/* Date Range Inputs */}
            <div className="md:col-span-5 flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <CalendarDays className="w-4 h-4 text-emerald-700 shrink-0 ml-1.5" />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-7 px-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600 flex-1"
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">s.d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-7 px-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600 flex-1"
              />
            </div>

            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama karyawan / tim / SKU / produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Status Bayar */}
            <div className="md:col-span-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-9 px-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Belum Lunas">🔴 Belum Lunas</option>
                <option value="Lunas">🟢 Lunas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KONTEN VIEW MODE */}
      {viewMode === 'sheet' ? (
        /* =================================================================== */
        /* MODE SHEET GOOGLE: INPUT & TAMPILAN SLIP GAJI EMRA PRODUCTION      */
        /* =================================================================== */
        <div className="space-y-4">
          {/* TAB PEMISAH DIVISI (POTONG, JAHIT, QC, FINISHING) */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'Cutting', label: '✂️ Pemotong (Cutting)', icon: Scissors },
                { key: 'Jahit', label: '🪡 Penjahit (Sewing)', icon: Shirt },
                { key: 'QC', label: '🛡️ Quality Control (QC)', icon: ShieldCheck },
                { key: 'Finishing', label: '📦 Finishing & Packing', icon: PackageCheck },
              ].map((tab) => {
                const isSelected = sheetTahap === tab.key;
                const matchedGroup = groupedByTahap.find((g) => g.key === tab.key);
                const countTeams = matchedGroup ? matchedGroup.teams.length : 0;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSheetTahap(tab.key)}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#064e3b] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {countTeams} {tab.key === 'Jahit' ? 'Penjahit' : 'Tim'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {activeSheetTeamData && (
                <button
                  type="button"
                  onClick={() => handleOpenSlipKaryawan(activeSheetTeamData.namaPetugas)}
                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip Resmi</span>
                </button>
              )}
            </div>
          </div>

          {/* MAIN SPREADSHEET CARD (MIRIP GOOGLE SHEET SLIP GAJI EMRA) */}
          <div className="bg-[#cbd5e1]/40 border-2 border-slate-300 rounded-2xl p-3 sm:p-5 shadow-sm">
            {/* PAPER CANVAS */}
            <div className="bg-white border-2 border-slate-300 rounded-xl max-w-4xl mx-auto shadow-md p-4 sm:p-6 space-y-4">
              {/* TOP HEADER SPREADSHEET: KOP & FILTER PERIODE TANGGAL */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b-2 border-slate-300">
                {/* KIRI: SLIP GAJI INFO & SELECT NAMA TIM */}
                <div className="md:col-span-7 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex flex-col items-center justify-center font-serif font-black shadow-xs shrink-0">
                      <span className="text-xl leading-none">EM</span>
                      <span className="text-[7.5px] tracking-widest uppercase font-sans">PROD</span>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
                        SLIP GAJI EMRA PRODUCTION
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Divisi: <strong className="text-emerald-800 uppercase">{sheetTahap === 'Jahit' ? 'Penjahit (Sewing)' : `Tim ${sheetTahap}`}</strong>
                      </p>
                    </div>
                  </div>

                  {/* FORM PILIH TIM / KARYAWAN */}
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-slate-500 font-bold">
                        {sheetTahap === 'Jahit' ? 'Nama Penjahit' : 'Nama Tim'}
                      </span>
                      <span className="text-slate-400 font-bold">:</span>
                      <div className="flex-1">
                        <select
                          value={sheetTeam}
                          onChange={(e) => setSheetTeam(e.target.value)}
                          className="w-full h-8 px-2.5 bg-amber-50/80 border-2 border-amber-300 rounded-lg text-xs font-black text-amber-950 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {sheetTeamsList.length === 0 ? (
                            <option value="">(Tidak ada tim pada periode ini)</option>
                          ) : (
                            sheetTeamsList.map((t) => (
                              <option key={t.namaPetugas} value={t.namaPetugas}>
                                {t.namaPetugas} — {t.totalQty} Pcs (Rp {t.totalBersih.toLocaleString('id-ID')}) {t.pendingCount > 0 ? `[${t.pendingCount} Belum Bayar]` : '[Lunas]'}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-28 text-slate-500 font-bold">Tanggal Periode</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-mono font-black text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {startDate || 'Awal'} s.d {endDate || 'Sekarang'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KANAN: KOTAK FILTER TANGGAL MIRIP GOOGLE SHEET (Filter Tanggal vvv) */}
                <div className="md:col-span-5 flex flex-col justify-between bg-amber-50/60 border-2 border-amber-200 rounded-xl p-3">
                  <div>
                    <div className="bg-amber-600 text-white text-center py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-2xs">
                      Filter Tanggal vvv
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-[10px] text-amber-900 font-bold block mb-0.5">Dari:</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full h-7 px-1.5 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-900 font-bold block mb-0.5">Sampai:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full h-7 px-1.5 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => handleSetPresetDate('minggu')}
                        className="flex-1 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-amber-900 font-bold text-center cursor-pointer"
                      >
                        1 Minggu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPresetDate('bulan')}
                        className="flex-1 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-amber-900 font-bold text-center cursor-pointer"
                      >
                        Bulan Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPresetDate('semua')}
                        className="flex-1 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-amber-900 font-bold text-center cursor-pointer"
                      >
                        Semua
                      </button>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-amber-800 italic text-center mt-1">
                    * Klik input tanggal di atas untuk mengubah rentang laporan upah
                  </p>
                </div>
              </div>

              {!activeSheetTeamData ? (
                /* EMPTY STATE JIKA TIDAK ADA DATA TIM */
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-bold text-slate-600">
                    Tidak ada transaksi upah untuk tahap {sheetTahap} pada periode {startDate || '-'} s.d {endDate || '-'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Pilih periode tanggal lain atau klik "Sync dari Antrean" di pojok kanan atas.
                  </p>
                </div>
              ) : (
                /* KONTEN RINCIAN KEUANGAN & TABEL ITEM */
                <div className="space-y-4">
                  {/* KOTAK RINCIAN FINANSIAL */}
                  <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3.5 space-y-2 text-xs">
                    <span className="font-black text-slate-700 block uppercase tracking-wider text-[11px] pb-1 border-b border-slate-300">
                      Rincian
                    </span>

                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-600 font-semibold">Total Pembayaran (Upah Kotor)</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        Rp {activeSheetTeamData.totalKotor.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-600 font-semibold">Potongan Pinjaman (Kasbon)</span>
                      <span className="font-mono font-bold text-amber-700">
                        {activeSheetTeamData.totalPotonganKasbon > 0
                          ? `- Rp ${activeSheetTeamData.totalPotonganKasbon.toLocaleString('id-ID')}`
                          : '-'}
                      </span>
                    </div>

                    <div className="pt-2 border-t-2 border-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 uppercase text-xs">
                          * Total GAJI (Bersih)
                        </span>
                        {activeSheetTeamData.pendingCount === 0 ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-300">
                            Lunas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full border border-rose-300">
                            {activeSheetTeamData.pendingCount} Belum Bayar
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-black text-lg text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded border border-emerald-300 shadow-2xs">
                        Rp {activeSheetTeamData.totalBersih.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-0.5 text-slate-600">
                      <span className="text-[11px] font-medium">* Sisa Pinjaman / Kasbon Aktif</span>
                      <span className="font-mono font-bold text-slate-700">
                        {activeSheetTeamData.sisaPinjamanAktif > 0
                          ? `Rp ${activeSheetTeamData.sisaPinjamanAktif.toLocaleString('id-ID')}`
                          : '-'}
                      </span>
                    </div>

                    <div className="pt-1 text-[11px] text-slate-600">
                      <span className="font-bold">* Terbilang : </span>
                      <span className="font-semibold italic text-slate-800">
                        "{angkaTerbilang(activeSheetTeamData.totalBersih)}"
                      </span>
                    </div>
                  </div>

                  {/* KOTAK RINCIAN PEMBAYARAN: BREAKDOWN MODEL & WARNA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900 uppercase tracking-wide">
                        Rincian Pembayaran
                      </span>
                      <div className="font-bold text-rose-700 text-xs flex items-center gap-1.5">
                        <span>* Grand Total QTY :</span>
                        <span className="font-mono font-black text-sm text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                          {activeSheetTeamData.totalQty.toLocaleString('id-ID')} Pcs
                        </span>
                      </div>
                    </div>

                    {/* TABEL RINCIAN MIRIP GOOGLE SHEET (NO, MODEL, WARNA, HARGA, QTY, TOTAL) */}
                    <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#1e293b] text-white font-extrabold text-[11px] uppercase">
                          <tr>
                            <th className="py-2 px-3 border-r border-slate-700 w-10 text-center">NO</th>
                            <th className="py-2 px-3 border-r border-slate-700">MODEL</th>
                            <th className="py-2 px-3 border-r border-slate-700">WARNA</th>
                            <th className="py-2 px-3 border-r border-slate-700 text-right w-28">HARGA</th>
                            <th className="py-2 px-3 border-r border-slate-700 text-center w-20">QTY</th>
                            <th className="py-2 px-3 text-right w-32 border-r border-slate-700">TOTAL</th>
                            <th className="py-2 px-2 text-center w-24">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium">
                          {activeSheetTeamData.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                                <div>{item.skuInduk || item.namaProduk}</div>
                                <div className="text-[10px] text-slate-400 font-mono font-normal">
                                  {item.noAntrian} • {item.sku}
                                </div>
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[10.5px]">
                                  {item.varian || '-'}
                                </span>
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                                Rp {Number(item.tarifPerPcs || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-black text-slate-900">
                                {Number(item.qty || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                                Rp {Number(item.totalUpah || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {item.statusBayar === 'Lunas' ? (
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                    Lunas
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                                    Belum
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                          <tr>
                            <td colSpan="4" className="py-2.5 px-3 text-right uppercase text-slate-700 border-r border-slate-300">
                              Total Qty & Total Upah:
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700 border-r border-slate-300">
                              {activeSheetTeamData.totalQty.toLocaleString('id-ID')} Pcs
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 text-sm border-r border-slate-300">
                              Rp {activeSheetTeamData.totalKotor.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {activeSheetTeamData.pendingCount === 0 ? '✅ Lunas' : '⏳ Pending'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR PADA SHEET: TOMBOL BAYAR SEKALIGUS & CETAK */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-600">
                      Penerima: <strong className="text-slate-900">{activeSheetTeamData.namaPetugas}</strong> ({sheetTahap}) •{' '}
                      Sisa Belum Dibayar:{' '}
                      <strong className="text-rose-700 font-mono">
                        Rp {activeSheetTeamData.items
                          .filter((i) => i.statusBayar !== 'Lunas')
                          .reduce((a, c) => a + Number(c.totalUpah || 0), 0)
                          .toLocaleString('id-ID')}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSlipKaryawan(activeSheetTeamData.namaPetugas)}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Format Cetak Emra</span>
                      </button>

                      {activeSheetTeamData.pendingCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const pendingItems = activeSheetTeamData.items.filter(
                              (i) => i.statusBayar !== 'Lunas'
                            );
                            handleOpenPay(pendingItems);
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar Gaji Tim Ini</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'karyawan' ? (
        /* =================================================================== */
        /* TABEL 1: REKAP GAJI DIPISAH PER DIVISI / TIM (POTONG, JAHIT, QC, FINISHING) */
        /* =================================================================== */
        <div className="space-y-4">
          {groupedByTahap.map((group) => {
            const Icon = group.icon;
            const hasData = group.teams.length > 0;

            return (
              <div
                key={group.key}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Header Section Per Divisi */}
                <div className="p-3.5 bg-gradient-to-r from-slate-50 via-slate-100/60 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${group.gradient} text-white flex items-center justify-center font-black text-xs shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">
                          {group.label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black border ${group.badgeColor}`}>
                          {group.sublabel}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {group.teams.length} {group.key === 'Jahit' ? 'Penjahit' : 'Tim'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subtotal Mini Stats Header */}
                  {hasData && (
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                      <span>
                        Total Qty: <strong className="text-rose-700 font-mono font-black">{group.subtotalQty.toLocaleString('id-ID')} Pcs</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Total Gaji: <strong className="text-emerald-700 font-mono font-black">Rp {group.subtotalBersih.toLocaleString('id-ID')}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Tabel Per Divisi (6 Kolom Ringkas, Tanpa Scroll Horizontal) */}
                <div className="w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc] text-slate-700 font-extrabold text-[11px] tracking-wide uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">NO</th>
                        <th className="py-2.5 px-4 border-r border-slate-200">{group.recipientHeader}</th>
                        <th className="py-2.5 px-4 border-r border-slate-200 text-right w-44 bg-rose-50/40 text-rose-900">
                          VOLUME & UPAH KOTOR
                        </th>
                        <th className="py-2.5 px-4 border-r border-slate-200 text-right w-40 text-amber-900 bg-amber-50/30">
                          POTONGAN KASBON
                        </th>
                        <th className="py-2.5 px-4 border-r border-slate-200 text-right w-48 bg-emerald-50/50 text-emerald-950">
                          TOTAL GAJI BERSIH
                        </th>
                        <th className="py-2.5 px-4 text-center w-48">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-slate-700 divide-y divide-slate-200">
                      {!hasData ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            <p className="text-xs font-semibold text-slate-500">
                              Tidak ada pembayaran untuk {group.label} pada periode ini.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        group.teams.map((k, idx) => {
                          const isAllLunas = k.pendingCount === 0;

                          return (
                            <tr key={k.namaPetugas} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 text-center text-slate-400 font-bold font-mono border-r border-slate-200">
                                {idx + 1}
                              </td>

                              <td className="py-3 px-4 border-r border-slate-200">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${group.gradient} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                                    {k.namaPetugas.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-black text-slate-900 text-sm leading-tight">
                                      {k.namaPetugas}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                      {k.items.length} Order Pekerjaan
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 border-r border-slate-200 text-right bg-rose-50/20">
                                <div className="font-mono font-black text-sm sm:text-base text-rose-700">
                                  {k.totalQty.toLocaleString('id-ID')} Pcs
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                  Kotor: <strong className="text-slate-800">Rp {k.totalKotor.toLocaleString('id-ID')}</strong>
                                </div>
                              </td>

                              <td className="py-3 px-4 border-r border-slate-200 text-right font-mono">
                                {k.totalPotonganKasbon > 0 ? (
                                  <div>
                                    <div className="font-bold text-amber-700 text-xs">
                                      - Rp {k.totalPotonganKasbon.toLocaleString('id-ID')}
                                    </div>
                                    {k.sisaPinjamanAktif > 0 && (
                                      <div className="text-[10px] text-amber-600 mt-0.5 font-sans">
                                        Sisa: Rp {k.sisaPinjamanAktif.toLocaleString('id-ID')}
                                      </div>
                                    )}
                                  </div>
                                ) : k.sisaPinjamanAktif > 0 ? (
                                  <div>
                                    <span className="text-slate-400 text-xs">-</span>
                                    <div className="text-[10.5px] text-amber-600 font-sans font-semibold mt-0.5">
                                      Kasbon aktif: Rp {k.sisaPinjamanAktif.toLocaleString('id-ID')}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 border-r border-slate-200 text-right bg-emerald-50/30">
                                <div>
                                  <span className="font-mono font-black text-sm sm:text-base text-[#064e3b] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs inline-block">
                                    Rp {k.totalBersih.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  {isAllLunas ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Lunas</span>
                                    </span>
                                  ) : k.lunasCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                      <span>Sebagian ({k.pendingCount} Belum)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <Clock className="w-3 h-3 text-rose-500" />
                                      <span>Belum Dibayar</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                  {!isAllLunas && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const pendingItems = k.items.filter((i) => i.statusBayar !== 'Lunas');
                                        handleOpenPay(pendingItems);
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                      title="Bayar semua tagihan upah tim ini dalam periode ini"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Bayar Gaji</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenSlipKaryawan(k.namaPetugas)}
                                    className="px-2.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    title="Buka & Cetak Slip Gaji Resmi (Format Emra Production)"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Slip Gaji</span>
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

                {/* Subtotal Footer Per Divisi */}
                {hasData && (
                  <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                    <div>
                      Subtotal <strong>{group.label}</strong> ({group.teams.length} {group.key === 'Jahit' ? 'Penjahit' : 'Tim'})
                    </div>
                    <div className="flex items-center gap-4 font-semibold text-slate-700">
                      <span>
                        Total Qty: <strong className="text-rose-700 font-mono font-bold">{group.subtotalQty.toLocaleString('id-ID')} Pcs</strong>
                      </span>
                      <span>
                        Kotor: <strong className="font-mono text-slate-900 font-bold">Rp {group.subtotalKotor.toLocaleString('id-ID')}</strong>
                      </span>
                      <span>
                        Bersih: <strong className="text-emerald-700 font-mono font-bold">Rp {group.subtotalBersih.toLocaleString('id-ID')}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* GRAND TOTAL SUMMARY BAR */}
          <div className="bg-[#0b1b36] text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm gap-2">
            <div>
              <span className="font-bold text-amber-400 uppercase tracking-wide text-xs">Grand Total Seluruh Divisi</span>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Periode: <strong className="text-white">{startDate || 'Awal'} s.d {endDate || 'Sekarang'}</strong>
              </div>
            </div>
            <div className="flex items-center gap-5 font-bold">
              <span>
                Grand Total QTY:{' '}
                <strong className="text-rose-400 font-mono text-base">
                  {rekapKaryawanList.reduce((acc, c) => acc + c.totalQty, 0).toLocaleString('id-ID')} Pcs
                </strong>
              </span>
              <span>
                Total Seluruh Gaji Bersih:{' '}
                <strong className="text-emerald-400 font-mono text-base font-black">
                  Rp {rekapKaryawanList.reduce((acc, c) => acc + c.totalBersih, 0).toLocaleString('id-ID')}
                </strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* TABEL 2: RINCIAN PER TRANSAKSI ORDER (FLAT LIST)                   */
        /* =================================================================== */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-200">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-extrabold text-xs tracking-wider uppercase">
                  <th className="py-2.5 px-2 text-center w-9 min-w-[36px] border border-slate-200">
                    <input
                      type="checkbox"
                      checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer w-4 h-4"
                      title="Pilih Semua Tagihan"
                    />
                  </th>
                  <th className="py-2.5 px-2 text-center w-10 min-w-[40px] border border-slate-200">NO</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px] border border-slate-200">NO. BAYAR & TANGGAL</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px] border border-slate-200">ANTREAN & PRODUK</th>
                  <th className="py-2.5 px-3 min-w-[200px] border border-slate-200">BAGIAN & PETUGAS</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[120px] border border-slate-200">QTY & TARIF</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[130px] border border-slate-200">TOTAL UPAH</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[140px] border border-slate-200">STATUS BAYAR</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[140px] border border-slate-200">AKSI</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-700 divide-y divide-slate-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 border border-slate-200">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-600">Tidak ada data tagihan upah</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Klik "Sync dari Antrean" untuk memuat tagihan upah dari order yang sudah diserahkan
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isLunas = item.statusBayar === 'Lunas';

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-2 text-center border border-slate-200">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                        </td>

                        {/* No */}
                        <td className="py-2 px-2 text-center text-slate-500 font-bold text-xs sm:text-sm border border-slate-200">
                          {idx + 1}
                        </td>

                        {/* No. Bayar & Tanggal Buat */}
                        <td className="py-2 px-3 border border-slate-200 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-xs text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-fit">
                              {item.noPembayaran}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.createdAt ? String(item.createdAt).slice(0, 10) : '-'}
                            </span>
                          </div>
                        </td>

                        {/* No. Antrean & Model Produk */}
                        <td className="py-2 px-3 border border-slate-200">
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono font-bold text-xs text-blue-700">
                              {item.noAntrian}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.namaProduk}>
                              {item.namaProduk}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                              <span>SKU: {item.sku}</span>
                              {item.varian && item.varian !== '-' && (
                                <span className="text-slate-700 font-semibold">• {item.varian}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Bagian & Petugas */}
                        <td className="py-2 px-3 border border-slate-200">
                          <div className="flex flex-col gap-1 items-start">
                            {getTahapanBadge(item.tahapan)}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.namaPetugas}</span>
                            </div>
                          </div>
                        </td>

                        {/* Qty & Tarif */}
                        <td className="py-2 px-3 text-center border border-slate-200 whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                              {Number(item.qty).toLocaleString('id-ID')} Pcs
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              @ Rp {Number(item.tarifPerPcs).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </td>

                        {/* Total Upah */}
                        <td className="py-2 px-3 text-right border border-slate-200 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 inline-block">
                              Rp {Number(item.totalUpah || 0).toLocaleString('id-ID')}
                            </span>
                            {Number(item.potonganKasbon) > 0 && (
                              <span className="text-[10px] text-amber-700 font-mono mt-0.5">
                                (Potong Kasbon: -Rp {Number(item.potonganKasbon).toLocaleString('id-ID')})
                              </span>
                            )}
                            {Number(item.potonganKasbon) > 0 && (
                              <span className="text-[10px] text-emerald-700 font-mono font-bold">
                                Bersih: Rp {Number(item.totalBersih || (Number(item.totalUpah) - Number(item.potonganKasbon))).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Bayar */}
                        <td className="py-2 px-3 text-center border border-slate-200 whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            {isLunas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lunas</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-rose-500" />
                                <span>Belum Lunas</span>
                              </span>
                            )}

                            {isLunas && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                <span>{item.tglBayar}</span>
                                {item.metodeBayar && (
                                  <span className="block text-slate-400">({item.metodeBayar})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-2 px-2.5 text-center border border-slate-200 whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {/* Tombol Bayar Sekarang (jika Belum Lunas) */}
                            {!isLunas ? (
                              <button
                                onClick={() => handleOpenPay([item])}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Bayar tagihan upah ini"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Bayar</span>
                              </button>
                            ) : (
                              /* Tombol Batalkan Lunas (Undo) */
                              <button
                                onClick={() => handleBatalBayar(item)}
                                className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                                title="Batalkan status lunas (Undo jika salah klik bayar)"
                              >
                                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            )}

                            {/* Tombol Lihat Slip */}
                            <button
                              onClick={() => handleOpenSlip(item)}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Tampilkan & Cetak Slip Upah"
                            >
                              <Receipt className="w-4 h-4 text-slate-600" />
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

          {/* BOTTOM SUMMARY FOOTER TRANSAKSI */}
          <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-600 gap-2">
            <div>
              Menampilkan <span className="font-bold text-slate-800">{filteredList.length}</span> dari{' '}
              <span className="font-bold text-slate-800">{dataList.length}</span> data upah
            </div>
            <div className="flex items-center gap-4 font-semibold text-slate-700">
              <span>
                Total Qty: <strong className="text-slate-900">{filteredList.reduce((acc, c) => acc + (Number(c.qty) || 0), 0).toLocaleString('id-ID')} Pcs</strong>
              </span>
              <span>
                Total Upah: <strong className="text-emerald-700 font-bold">Rp {filteredList.reduce((acc, c) => acc + (Number(c.totalUpah) || 0), 0).toLocaleString('id-ID')}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL FORM PEMBAYARAN UPAH */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#064e3b] to-[#04362d] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <CreditCard className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Konfirmasi Pembayaran Upah</h3>
                  <p className="text-[10.5px] text-emerald-200/90">
                    {targetPayItems.length === 1
                      ? `Bayar upah ke: ${targetPayItems[0].namaPetugas}`
                      : `Bayar sekaligus ${targetPayItems.length} transaksi upah`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirmPay} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Ringkasan Total yang Harus Dibayar */}
              {(() => {
                const totalGross = targetPayItems.reduce((acc, c) => acc + (Number(c.totalUpah) || 0), 0);
                const potongVal = Number(potonganKasbon) || 0;
                const netPay = Math.max(0, totalGross - potongVal);

                return (
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                          UPAH KOTOR (GROSS)
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {targetPayItems.length} Tagihan • {targetPayItems.reduce((acc, c) => acc + (Number(c.qty) || 0), 0)} Pcs
                        </span>
                      </div>
                      <div className="font-mono font-black text-lg text-emerald-800">
                        Rp {totalGross.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* ALERT & INPUT POTONG KASBON JIKA ADA SALDO KASBON AKTIF */}
                    {kasbonInfo && kasbonInfo.totalSisa > 0 && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                            <Wallet className="w-4 h-4 text-amber-600" />
                            <span>Ada Kasbon Belum Lunas</span>
                          </div>
                          <span className="font-mono font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                            Sisa: Rp {Number(kasbonInfo.totalSisa).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Potongan Kasbon Periode Ini (Rp)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={Math.min(totalGross, Number(kasbonInfo.totalSisa))}
                              value={potonganKasbon}
                              onChange={(e) => setPotonganKasbon(Math.max(0, Number(e.target.value) || 0))}
                              className="w-full h-8 px-2.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setPotonganKasbon(Math.min(totalGross, Number(kasbonInfo.totalSisa)))}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold whitespace-nowrap cursor-pointer"
                              title="Potong penuh sesuai sisa kasbon atau maksimal upah"
                            >
                              Potong Maksimal
                            </button>
                            <button
                              type="button"
                              onClick={() => setPotonganKasbon(0)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer"
                              title="Jangan potong kasbon sekarang"
                            >
                              Nol (0)
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-800 mt-1">
                            * Nilai ini akan langsung dipotong dari total upah dan mengurangi sisa saldo kasbon karyawan.
                          </p>
                        </div>

                        {/* RINGKASAN NET PAY */}
                        <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between font-bold">
                          <span className="text-slate-700 text-xs uppercase">Upah Bersih Diterima:</span>
                          <span className="font-mono font-black text-base text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                            Rp {netPay.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tanggal Bayar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  required
                  value={payForm.tglBayar}
                  onChange={(e) => setPayForm((p) => ({ ...p, tglBayar: e.target.value }))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={payForm.metodeBayar}
                  onChange={(e) => setPayForm((p) => ({ ...p, metodeBayar: e.target.value }))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="Tunai / Cash">💵 Tunai / Cash Langsung</option>
                  <option value="Transfer Bank BCA">🏦 Transfer Bank BCA</option>
                  <option value="Transfer Bank BRI">🏦 Transfer Bank BRI</option>
                  <option value="Transfer Bank Mandiri">🏦 Transfer Bank Mandiri</option>
                  <option value="E-Wallet / DANA / OVO / GoPay">📱 E-Wallet (DANA / OVO / GoPay)</option>
                </select>
              </div>

              {/* Catatan / No Reff Transfer */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Bukti Ref (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Sudah ditransfer via BCA, titip via mandor, dll..."
                  value={payForm.catatan}
                  onChange={(e) => setPayForm((p) => ({ ...p, catatan: e.target.value }))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Konfirmasi Lunas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SLIP GAJI / PEMBAYARAN UPAH BORONGAN (PRINTABLE) */}
      {isSlipModalOpen && slipItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between shrink-0 shadow-md print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Slip Pembayaran Upah Borongan</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setIsSlipModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slip Paper View (Formal Slip Design) */}
            <div className="p-6 overflow-y-auto space-y-4 bg-white text-slate-800 font-sans" id="printable-slip">
              {/* Slip Kop */}
              <div className="text-center pb-3 border-b-2 border-slate-800 space-y-0.5">
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  RUANG KONVEKSI
                </h2>
                <p className="text-xs text-slate-600 font-semibold">
                  Sistem Manajemen Operasional & Payroll Produksi
                </p>
                <div className="inline-block mt-1 font-mono text-[11px] font-black bg-slate-100 text-slate-800 px-3 py-0.5 rounded-full border border-slate-300">
                  SLIP PEMBAYARAN UPAH KERJA
                </div>
              </div>

              {/* Meta Informasi Slip */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">No. Bukti Upah:</span>
                  <span className="font-mono font-black text-slate-900">{slipItem.noPembayaran}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tanggal Cetak:</span>
                  <span className="font-mono text-slate-700 font-bold">{new Date().toISOString().slice(0, 10)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Penerima Upah:</span>
                  <span className="font-black text-slate-900 text-sm">{slipItem.namaPetugas}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Bagian / Tahap:</span>
                  <span className="font-bold text-emerald-800">{slipItem.tahapan}</span>
                </div>
              </div>

              {/* Tabel Rincian Upah */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">Rincian Pekerjaan & No. Antrean</th>
                      <th className="p-2.5 text-center">Volume</th>
                      <th className="p-2.5 text-right">Tarif / Pcs</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{slipItem.namaProduk}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {slipItem.noAntrian} • SKU: {slipItem.sku}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        {slipItem.qty} Pcs
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        Rp {Number(slipItem.tarifPerPcs).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        Rp {Number(slipItem.totalUpah).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-300 font-black">
                    {Number(slipItem.potonganKasbon) > 0 ? (
                      <>
                        <tr className="border-b border-slate-200">
                          <td colSpan="3" className="p-2 text-right uppercase text-slate-500 font-semibold text-[11px]">
                            Subtotal Upah Kotor:
                          </td>
                          <td className="p-2 text-right font-mono text-slate-700 text-xs">
                            Rp {Number(slipItem.totalUpah).toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td colSpan="3" className="p-2 text-right uppercase text-amber-700 font-bold text-[11px]">
                            Potongan Kasbon / Pinjaman:
                          </td>
                          <td className="p-2 text-right font-mono text-amber-700 text-xs">
                            - Rp {Number(slipItem.potonganKasbon).toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="p-2.5 text-right uppercase text-emerald-800">
                            Total Upah Bersih Diterima:
                          </td>
                          <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">
                            Rp {Number(slipItem.totalBersih ?? (Number(slipItem.totalUpah) - Number(slipItem.potonganKasbon))).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-2.5 text-right uppercase text-slate-600">
                          Total Upah Bersih:
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">
                          Rp {Number(slipItem.totalUpah).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Status Pembayaran & Catatan */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Status Pembayaran:</span>
                  <span className={`font-black ${slipItem.statusBayar === 'Lunas' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {slipItem.statusBayar === 'Lunas' ? '✅ LUNAS (Sudah Dibayarkan)' : '⏳ PENDING (Belum Lunas)'}
                  </span>
                </div>
                {slipItem.tglBayar && (
                  <div className="text-right">
                    <span className="text-slate-500 font-semibold block">Tgl & Metode:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {slipItem.tglBayar} ({slipItem.metodeBayar || 'Tunai'})
                    </span>
                  </div>
                )}
              </div>

              {/* Kolom Tanda Tangan */}
              <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
                <div>
                  <p className="text-slate-500">Diserahkan oleh (Admin/Kasir):</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                    ( Admin Produksi )
                  </div>
                </div>
                <div>
                  <p className="text-slate-500">Diterima oleh Petugas:</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                    ( {slipItem.namaPetugas} )
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL SLIP GAJI KARYAWAN (FORMAT RESMI EMRA PRODUCTION) */}
      {isSlipKaryawanModalOpen && currentSlipKaryawan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Top Toolbar */}
            <div className="bg-[#0b1b36] text-white px-4 py-2.5 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-xs text-white">
                  Slip Gaji Mingguan / Periode Karyawan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSlipKaryawanModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slip Content Paper (Emra Production Layout) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-white text-slate-800 font-sans" id="printable-slip">
              {/* Slip Header Bordered Box */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
                      SLIP GAJI EMRA PRODUCTION
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ruang Konveksi Management System
                    </p>

                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-28 text-slate-500 font-medium">Tanggal Periode</span>
                        <span className="font-bold text-slate-800">
                          : {startDate || '-'} s.d {endDate || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-28 text-slate-500 font-medium">
                          {currentSlipKaryawan.tahapan === 'Jahit' ? 'Nama Penjahit' : 'Nama Tim'}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <span>:</span>
                          <select
                            value={selectedKaryawanName}
                            onChange={(e) => setSelectedKaryawanName(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-extrabold text-[#0369a1] cursor-pointer focus:outline-none print:appearance-none print:border-none print:p-0"
                          >
                            {rekapKaryawanList.map((k) => (
                              <option key={k.namaPetugas} value={k.namaPetugas}>
                                {k.namaPetugas} ({k.tahapan})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-28 text-slate-500 font-medium">Bagian / Divisi</span>
                        <span className="font-bold text-slate-800">
                          : {currentSlipKaryawan.tahapan || 'Konveksi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monogram / Logo Box */}
                  <div className="w-16 h-16 rounded-xl border border-amber-300 bg-amber-50/60 flex flex-col items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                    <span className="font-serif font-black text-2xl tracking-tighter text-amber-700">
                      EM
                    </span>
                    <span className="text-[8px] font-black tracking-widest text-amber-900 uppercase">
                      PROD
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Finansial (Box Rincian Sesuai Spreadsheet Emra) */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-2 text-xs">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Rincian
                </span>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Total Pembayaran</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    Rp {currentSlipKaryawan.totalKotor.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Potongan Pinjaman (Kasbon)</span>
                  <span className="font-mono font-bold text-amber-700">
                    {currentSlipKaryawan.totalPotonganKasbon > 0
                      ? `- Rp ${currentSlipKaryawan.totalPotonganKasbon.toLocaleString('id-ID')}`
                      : '-'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-300 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 uppercase text-xs">
                    * Total GAJI (Bersih Diterima)
                  </span>
                  <span className="font-mono font-black text-base text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Rp {currentSlipKaryawan.totalBersih.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5 text-slate-600">
                  <span className="text-[11px] font-medium">* Sisa Pinjaman / Kasbon Aktif</span>
                  <span className="font-mono font-bold text-slate-700">
                    {currentSlipKaryawan.sisaPinjamanAktif > 0
                      ? `Rp ${currentSlipKaryawan.sisaPinjamanAktif.toLocaleString('id-ID')}`
                      : '-'}
                  </span>
                </div>

                <div className="pt-1 text-[11px] text-slate-600">
                  <span className="font-bold">* Terbilang : </span>
                  <span className="font-semibold italic text-slate-800">
                    "{angkaTerbilang(currentSlipKaryawan.totalBersih)}"
                  </span>
                </div>
              </div>

              {/* Rincian Pembayaran Table (Grand Total Qty & Breakdown) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wide">
                    Rincian Pembayaran
                  </span>
                  <div className="font-bold text-rose-600 text-xs flex items-center gap-1">
                    <span>* Grand Total QTY :</span>
                    <span className="font-mono font-black text-sm text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
                      {currentSlipKaryawan.totalQty.toLocaleString('id-ID')} Pcs
                    </span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#1e293b] text-white font-extrabold text-[11px] uppercase">
                      <tr>
                        <th className="py-2 px-3 border-r border-slate-700 w-10 text-center">NO</th>
                        <th className="py-2 px-3 border-r border-slate-700">MODEL</th>
                        <th className="py-2 px-3 border-r border-slate-700">WARNA</th>
                        <th className="py-2 px-3 border-r border-slate-700 text-right">HARGA</th>
                        <th className="py-2 px-3 border-r border-slate-700 text-center">QTY</th>
                        <th className="py-2 px-3 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {currentSlipKaryawan.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                            {item.skuInduk || item.namaProduk}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">
                            {item.varian || '-'}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                            Rp {Number(item.tarifPerPcs || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono font-black text-slate-900">
                            {Number(item.qty || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-black text-slate-900">
                            Rp {Number(item.totalUpah || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                      <tr>
                        <td colSpan="4" className="py-2 px-3 text-right uppercase text-slate-700">
                          Total Qty & Total Upah:
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-black text-rose-700">
                          {currentSlipKaryawan.totalQty.toLocaleString('id-ID')} Pcs
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                          Rp {currentSlipKaryawan.totalKotor.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs">
                <div>
                  <p className="text-slate-500 font-medium">Yang Menyerahkan (Admin / Kasir)</p>
                  <div className="h-14 flex items-end justify-center font-bold text-slate-900">
                    ( Admin Produksi )
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Yang Menerima (Karyawan / Tim)</p>
                  <div className="h-14 flex items-end justify-center font-bold text-slate-900">
                    ( {currentSlipKaryawan.namaPetugas} )
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500">
                Status:{' '}
                <strong
                  className={
                    currentSlipKaryawan.pendingCount === 0
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }
                >
                  {currentSlipKaryawan.pendingCount === 0
                    ? 'Sudah Lunas'
                    : `${currentSlipKaryawan.pendingCount} Order Belum Lunas`}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                {currentSlipKaryawan.pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlipKaryawanModalOpen(false);
                      handleOpenPay(
                        currentSlipKaryawan.items.filter(
                          (i) => i.statusBayar !== 'Lunas',
                        ),
                      );
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bayar Gaji Karyawan Ini</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSlipKaryawanModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

