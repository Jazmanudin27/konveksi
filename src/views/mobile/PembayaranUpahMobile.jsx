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
  ChevronRight,
  Filter,
  Wallet,
  Users,
  ListFilter,
  CalendarDays,
  FileText,
  LayoutGrid,
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

export default function PembayaranUpahMobile({ onBack }) {
  const [dataList, setDataList] = useState([]);
  const [rekap, setRekap] = useState({
    totalTagihan: 0,
    totalLunas: 0,
    totalPending: 0,
    totalPcs: 0,
    perTahapan: {},
  });
  const [loading, setLoading] = useState(false);

  // View Mode: 'karyawan' (Default: Rekap Gaji Mingguan) | 'transaksi' (Semua Order)
  const [viewMode, setViewMode] = useState('karyawan');

  // Filter Tanggal Periode
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
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetItems, setTargetItems] = useState([]);
  const [payForm, setPayForm] = useState({
    tglBayar: new Date().toISOString().slice(0, 10),
    metodeBayar: 'Tunai / Cash',
    catatan: '',
  });

  // Slip Modal Single Order
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipItem, setSlipItem] = useState(null);

  // Slip Modal Karyawan (Format Emra Production)
  const [isSlipKaryawanModalOpen, setIsSlipKaryawanModalOpen] = useState(false);
  const [selectedKaryawanName, setSelectedKaryawanName] = useState('');

  // Kasbon State
  const [kasbonInfo, setKasbonInfo] = useState(null);
  const [potonganKasbon, setPotonganKasbon] = useState(0);

  // Fetch data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, rekapData, kasbonData] = await Promise.all([
        api.getPembayaranUpah(),
        api.getPembayaranUpahRekap().catch(() => null),
        api.getKasbon().catch(() => []),
      ]);
      if (Array.isArray(list)) setDataList(list);
      if (rekapData) setRekap(rekapData);
      if (Array.isArray(kasbonData)) setKasbonAll(kasbonData);
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
        text: 'Mengambil data upah dari tahapan antrean...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.syncUpahFromAntrean();
      await fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Selesai',
        text: res.message || 'Data upah berhasil diperbarui dari antrean!',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal sinkronisasi data', 'error');
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const statusBayar = item.statusBayar || item.status_bayar;
      if (activeTahapTab !== 'Semua' && item.tahapan !== activeTahapTab) return false;
      if (filterStatus === 'Belum Lunas' && statusBayar === 'Lunas') return false;
      if (filterStatus === 'Lunas' && statusBayar !== 'Lunas') return false;

      // Filter Tanggal Periode
      const itemDate = item.tglBayar || item.tgl_bayar || (item.createdAt ? String(item.createdAt).slice(0, 10) : '');
      if (startDate && itemDate && itemDate < startDate) return false;
      if (endDate && itemDate && itemDate > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noAntrian = (item.noAntrian || item.no_antrian || '').toLowerCase();
        const namaProduk = (item.namaProduk || item.nama_produk || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const petugas = (item.namaPetugas || item.nama_petugas || '').toLowerCase();
        const induk = (item.skuInduk || '').toLowerCase();
        if (!noAntrian.includes(q) && !namaProduk.includes(q) && !sku.includes(q) && !petugas.includes(q) && !induk.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [dataList, activeTahapTab, filterStatus, searchQuery, startDate, endDate]);

  // Rekap Payroll Per Karyawan / Tim
  const rekapKaryawanList = useMemo(() => {
    const map = new Map();

    filteredList.forEach((item) => {
      const pet = (item.namaPetugas || item.nama_petugas || 'Tanpa Nama').trim();
      const statusBayar = item.statusBayar || item.status_bayar;
      const totalUpah = Number(item.totalUpah || item.total_upah) || 0;
      const potonganKasbon = Number(item.potonganKasbon || item.potongan_kasbon) || 0;
      const totalBersih = Number(item.totalBersih || item.total_bersih) || Math.max(0, totalUpah - potonganKasbon);

      if (!map.has(pet)) {
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
      grp.totalKotor += totalUpah;
      grp.totalPotonganKasbon += potonganKasbon;
      grp.totalBersih += totalBersih;

      if (statusBayar === 'Lunas') {
        grp.lunasCount += 1;
      } else {
        grp.pendingCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalKotor - a.totalKotor);
  }, [filteredList, kasbonAll]);

  // Pisahkan Rekap Payroll Per Divisi / Tim (Cutting, Jahit, QC, Finishing)
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
        sublabel: 'Borongan Penjahit / CMT',
        recipientHeader: 'NAMA PENJAHIT',
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
          const teamName = (item.namaPetugas || item.nama_petugas || 'Tanpa Nama Tim').trim();
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
          grp.totalKotor += Number(item.totalUpah || item.total_upah || 0);
          grp.totalPotonganKasbon += Number(item.potonganKasbon || item.potongan_kasbon || 0);
          grp.totalBersih += Number(
            item.totalBersih ??
              (Number(item.totalUpah || item.total_upah || 0) -
                Number(item.potonganKasbon || item.potongan_kasbon || 0))
          );

          const statusBayar = item.statusBayar || item.status_bayar;
          if (statusBayar === 'Lunas') {
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

  // Open Bayar Modal (Single / Batch Karyawan)
  const handleOpenPay = async (items) => {
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) return;
    setTargetItems(list);
    setPayForm({
      tglBayar: new Date().toISOString().slice(0, 10),
      metodeBayar: 'Tunai / Cash',
      catatan: '',
    });

    const petugasName = (list[0].nama_petugas || list[0].namaPetugas || '').trim();
    const totalGross = list.reduce((acc, c) => acc + (Number(c.total_upah || c.totalUpah) || 0), 0);

    if (petugasName) {
      try {
        const saldoData = await api.getKasbonSaldo(petugasName);
        if (saldoData && saldoData.totalSisa > 0) {
          setKasbonInfo(saldoData);
          setPotonganKasbon(Math.min(totalGross, saldoData.totalSisa));
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

  // Submit Bayar
  const handleConfirmPay = async () => {
    if (!targetItems || targetItems.length === 0) return;
    try {
      const ids = targetItems.map((i) => i.id);
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
      setTargetItems([]);
      await fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Berhasil',
        text: `${ids.length} tagihan upah telah dibayar!${Number(potonganKasbon) > 0 ? ` (Dipotong Kasbon: Rp ${Number(potonganKasbon).toLocaleString('id-ID')})` : ''}`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal memproses pembayaran', 'error');
    }
  };

  // Batalkan Bayar
  const handleBatalBayar = async (item) => {
    const res = await Swal.fire({
      title: 'Batalkan Pembayaran?',
      text: `Status upah untuk ${item.nama_petugas} akan kembali menjadi Belum Lunas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Tutup',
    });

    if (res.isConfirmed) {
      try {
        await api.batalBayarUpah(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Dibatalkan',
          text: 'Status pembayaran telah dibatalkan.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal membatalkan status bayar', 'error');
      }
    }
  };

  // Buka Slip
  const handleOpenSlip = (item) => {
    setSlipItem(item);
    setIsSlipModalOpen(true);
  };

  const getTahapBadge = (tahapan) => {
    switch (tahapan) {
      case 'Cutting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scissors className="w-3 h-3" /> Pemotong
          </span>
        );
      case 'Jahit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shirt className="w-3 h-3" /> Penjahit
          </span>
        );
      case 'QC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3" /> Tim QC
          </span>
        );
      case 'Finishing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <PackageCheck className="w-3 h-3" /> Finishing
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {tahapan}
          </span>
        );
    }
  };

  const tahapTabs = ['Semua', 'Cutting', 'Jahit', 'QC', 'Finishing'];

  return (
    <div className="space-y-3 pb-8">
      {/* 1. KARTU REKAP TOTAL KPI */}
      <div className="grid grid-cols-2 gap-2">
        {/* Belum Lunas */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold">
            <span>Belum Lunas</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-base font-black text-amber-950 mt-1 leading-tight font-mono">
            Rp {(rekap.totalPending || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">
            Menunggu pembayaran
          </div>
        </div>

        {/* Sudah Lunas */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold">
            <span>Sudah Lunas</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-black text-emerald-950 mt-1 leading-tight font-mono">
            Rp {(rekap.totalLunas || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">
            Total tercatat terbayar
          </div>
        </div>
      </div>

      {/* 2. TOMBOL SINKRON DARI ANTREAN */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleSyncFromAntrean}
          disabled={loading}
          className="flex-1 py-2 px-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-transform cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Sinkron dari Antrean Produksi</span>
        </button>
      </div>

      {/* VIEW MODE SWITCHER (REKAP KARYAWAN vs ORDER) */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setViewMode('karyawan')}
          className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'karyawan'
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Rekap Per Karyawan</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('transaksi')}
          className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'transaksi'
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Rincian Order</span>
        </button>
      </div>

      {/* FILTER PERIODE TANGGAL GAJI */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
            <span>Periode Upah:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetPresetDate('minggu')}
              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200"
            >
              1 Minggu
            </button>
            <button
              type="button"
              onClick={() => handleSetPresetDate('bulan')}
              className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handleSetPresetDate('semua')}
              className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
            >
              Semua
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {viewMode === 'karyawan' ? (
        /* ================= MODE 1: REKAP GAJI DIPISAH PER DIVISI / TIM ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-extrabold text-slate-700">
              Total {rekapKaryawanList.length} Tenaga Kerja / Tim
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              {startDate && endDate ? `${startDate} s.d ${endDate}` : 'Semua Periode'}
            </span>
          </div>

          {groupedByTahap.map((group) => {
            const Icon = group.icon;
            const hasData = group.teams.length > 0;

            return (
              <div
                key={group.key}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-2 pb-2"
              >
                {/* Header Section Per Divisi */}
                <div className="p-3 bg-gradient-to-r from-slate-50 via-slate-100/60 to-white border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${group.gradient} text-white flex items-center justify-center font-black text-xs shadow-2xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs tracking-tight">
                        {group.label}
                      </h4>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {group.teams.length} {group.key === 'Jahit' ? 'Penjahit' : 'Tim'}
                      </div>
                    </div>
                  </div>

                  {hasData && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-mono">
                        {group.subtotalQty.toLocaleString('id-ID')} Pcs
                      </div>
                      <div className="text-xs font-mono font-black text-emerald-800">
                        Rp {group.subtotalBersih.toLocaleString('id-ID')}
                      </div>
                    </div>
                  )}
                </div>

                {/* List Kartu Tim / Karyawan di Divisi Ini */}
                <div className="p-2 space-y-2.5">
                  {!hasData ? (
                    <div className="py-4 text-center text-[11px] text-slate-400 font-medium">
                      Tidak ada data {group.label} pada periode ini
                    </div>
                  ) : (
                    group.teams.map((karyawan) => {
                      const hasPending = karyawan.pendingCount > 0;
                      const pendingItems = karyawan.items.filter(
                        (i) => (i.statusBayar || i.status_bayar) !== 'Lunas'
                      );

                      return (
                        <div
                          key={karyawan.namaPetugas}
                          className="bg-slate-50/60 rounded-xl p-3 border border-slate-200/80 space-y-2.5 transition-all"
                        >
                          {/* Header Petugas / Nama Tim */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${group.gradient} text-white flex items-center justify-center font-black text-xs shadow-2xs`}
                              >
                                {karyawan.namaPetugas.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-slate-900 leading-tight">
                                  {karyawan.namaPetugas}
                                </h5>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {karyawan.items.length} Order ({karyawan.totalQty.toLocaleString('id-ID')} Pcs)
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border ${
                                !hasPending
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {!hasPending ? 'Lunas' : `${karyawan.pendingCount} Belum Bayar`}
                            </span>
                          </div>

                          {/* Ringkasan Angka Gaji */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1 text-xs">
                            <div className="flex justify-between items-center text-slate-500 text-[10.5px]">
                              <span>Total Qty Selesai:</span>
                              <span className="font-bold text-slate-800 font-mono">
                                {karyawan.totalQty.toLocaleString('id-ID')} Pcs
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500 text-[10.5px]">
                              <span>Upah Kotor:</span>
                              <span className="font-bold text-slate-800 font-mono">
                                Rp {karyawan.totalKotor.toLocaleString('id-ID')}
                              </span>
                            </div>
                            {karyawan.totalPotonganKasbon > 0 && (
                              <div className="flex justify-between items-center text-amber-700 text-[10.5px]">
                                <span>Potongan Kasbon:</span>
                                <span className="font-bold font-mono">
                                  - Rp {karyawan.totalPotonganKasbon.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            {karyawan.sisaPinjamanAktif > 0 && (
                              <div className="flex justify-between items-center text-amber-600 text-[10px]">
                                <span className="flex items-center gap-1">
                                  <Wallet className="w-2.5 h-2.5" /> Sisa Kasbon:
                                </span>
                                <span className="font-bold font-mono">
                                  Rp {karyawan.sisaPinjamanAktif.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                              <span className="font-black text-slate-800 text-[11px]">Gaji Bersih:</span>
                              <span className="text-xs font-black text-[#064e3b] font-mono">
                                Rp {karyawan.totalBersih.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          {/* Tombol Aksi */}
                          <div className="pt-0.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSlipKaryawan(karyawan.namaPetugas)}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3 h-3 text-slate-600" />
                              <span>Slip Gaji</span>
                            </button>

                            {hasPending && (
                              <button
                                type="button"
                                onClick={() => handleOpenPay(pendingItems)}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#064e3b] hover:bg-[#043d2e] text-white text-[11px] font-black shadow-2xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                              >
                                <Coins className="w-3 h-3" />
                                <span>Bayar Gaji</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {rekapKaryawanList.length === 0 && (
            <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200">
              {loading ? 'Memuat rekap tim...' : 'Tidak ada data tenaga kerja pada periode ini.'}
            </div>
          )}
        </div>
      ) : (
        /* ================= MODE 2: RINCIAN PER TRANSAKSI ORDER ================= */
        <div className="space-y-3">
          {/* 3. SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari petugas / no antrean / produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white pl-9 pr-3 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          {/* 4. FILTER TABS TAHAPAN */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {tahapTabs.map((tab) => {
              const isSelected = activeTahapTab === tab;
              const count =
                tab === 'Semua'
                  ? dataList.length
                  : dataList.filter((d) => d.tahapan === tab).length;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTahapTab(tab)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 font-bold ${
                    isSelected
                      ? 'bg-[#064e3b] text-white shadow-xs font-extrabold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 5. FILTER STATUS (SEMUA / BELUM LUNAS / LUNAS) */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl text-[11px] font-bold">
            {['Semua', 'Belum Lunas', 'Lunas'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* 6. LIST ITEM UPAH */}
          <div className="space-y-2.5">
            {filteredList.map((item) => {
              const isLunas = item.status_bayar === 'Lunas';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 space-y-2.5 transition-all"
                >
                  {/* Baris Atas: Tahapan Badge & Status Bayar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getTahapBadge(item.tahapan)}
                      <span className="text-[10.5px] font-mono font-bold text-slate-500">
                        {item.no_antrian}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        isLunas
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isLunas ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </div>

                  {/* Baris Tengah: Petugas & Produk */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-black text-slate-900">
                        {item.nama_petugas || 'Belum ditugaskan'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.nama_produk} {item.sku ? `(${item.sku})` : ''}
                    </div>
                  </div>

                  {/* Baris Bawah: Rincian Hitungan Borongan & Aksi */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10.5px] text-slate-400">
                        {item.qty} Pcs × Rp {Number(item.tarif_per_pcs).toLocaleString('id-ID')}
                      </div>
                      <div className="text-sm font-black text-[#064e3b] font-mono leading-tight mt-0.5">
                        Rp {Number(item.total_upah || 0).toLocaleString('id-ID')}
                      </div>
                      {Number(item.potongan_kasbon) > 0 && (
                        <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                          Potong Kasbon: -Rp {Number(item.potongan_kasbon).toLocaleString('id-ID')}
                        </div>
                      )}
                      {Number(item.potongan_kasbon) > 0 && (
                        <div className="text-[10px] text-emerald-700 font-mono font-bold">
                          Bersih: Rp {Number(item.total_bersih || (Number(item.total_upah) - Number(item.potongan_kasbon))).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLunas ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenSlip(item)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Lihat Slip Upah"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-600" />
                            <span>Slip</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatalBayar(item)}
                            className="p-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Batalkan Status Bayar"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPay(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-black shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Bayar Upah</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info Tambahan Jika Lunas */}
                  {isLunas && (item.tgl_bayar || item.metode_bayar) && (
                    <div className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg flex items-center justify-between">
                      <span>Dibayar: {item.tgl_bayar || '-'}</span>
                      <span>{item.metode_bayar || 'Tunai'}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200">
                {loading ? 'Memuat data upah...' : 'Tidak ada data pembayaran upah yang sesuai.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: PROSES PEMBAYARAN UPAH (SINGLE / BATCH KARYAWAN) */}
      {isPayModalOpen && targetItems.length > 0 && (() => {
        const targetPetugas = targetItems[0]?.nama_petugas || targetItems[0]?.namaPetugas;
        const targetTahapan = targetItems[0]?.tahapan;
        const totalGross = targetItems.reduce((acc, c) => acc + (Number(c.total_upah || c.totalUpah) || 0), 0);
        const totalVolume = targetItems.reduce((acc, c) => acc + (Number(c.qty) || 0), 0);
        const isBatch = targetItems.length > 1;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {isBatch ? 'Bayar Gaji Karyawan' : 'Bayar Upah Borongan'}
                    </h3>
                    <p className="text-[10.5px] text-slate-400">
                      {isBatch ? `Pelunasan ${targetItems.length} order pekerjaan` : 'Konfirmasi pembayaran tenaga kerja'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rincian Petugas & Tagihan */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerima Upah:</span>
                  <span className="font-bold text-slate-900">{targetPetugas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bagian / Tahapan:</span>
                  <span className="font-bold text-slate-900">{targetTahapan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah Order:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {isBatch ? `${targetItems.length} Transaksi Order` : targetItems[0]?.no_antrian || targetItems[0]?.noAntrian}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Volume:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {totalVolume} Pcs
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Total Upah (Gross):</span>
                  <span className="text-sm font-black text-slate-800 font-mono">
                    Rp {totalGross.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* KASBON NOTIFICATION & DEDUCTION INPUT */}
                {kasbonInfo && kasbonInfo.totalSisa > 0 && (
                  <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-300 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-amber-600" /> Kasbon Belum Lunas
                      </span>
                      <span className="font-mono font-bold text-amber-800 text-[10px] bg-amber-200/80 px-1.5 py-0.2 rounded">
                        Sisa: Rp {Number(kasbonInfo.totalSisa).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Potong Kasbon (Rp)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(totalGross, Number(kasbonInfo.totalSisa))}
                          value={potonganKasbon}
                          onChange={(e) => setPotonganKasbon(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-2 py-1 rounded-lg border border-amber-300 font-mono font-bold text-xs bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPotonganKasbon(Math.min(totalGross, Number(kasbonInfo.totalSisa)))}
                          className="px-2 py-1 bg-amber-600 text-white rounded text-[9px] font-bold shrink-0 cursor-pointer"
                        >
                          Maks
                        </button>
                        <button
                          type="button"
                          onClick={() => setPotonganKasbon(0)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[9px] font-bold shrink-0 cursor-pointer"
                        >
                          Nol
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-amber-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Diterima Bersih:</span>
                      <span className="font-black text-[#064e3b] font-mono text-sm">
                        Rp {Math.max(0, totalGross - (Number(potonganKasbon) || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input Pembayaran */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    value={payForm.tglBayar}
                    onChange={(e) => setPayForm({ ...payForm, tglBayar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={payForm.metodeBayar}
                    onChange={(e) => setPayForm({ ...payForm, metodeBayar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                  >
                    <option value="Tunai / Cash">Tunai / Cash</option>
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="Transfer BRI">Transfer BRI</option>
                    <option value="Transfer BNI">Transfer BNI</option>
                    <option value="Transfer BSI">Transfer BSI</option>
                    <option value="E-Wallet">E-Wallet (GoPay/OVO/ShopeePay)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: Lunas gaji mingguan"
                    value={payForm.catatan}
                    onChange={(e) => setPayForm({ ...payForm, catatan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                  />
                </div>
              </div>

              {/* Tombol Konfirmasi */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  className="flex-1 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] font-black text-white shadow-md active:scale-95 transition-all"
                >
                  Simpan & Lunas
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: SLIP UPAH BORONGAN (SINGLE ORDER) */}
      {isSlipModalOpen && slipItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  Slip Upah Borongan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Kertas Slip */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-black text-sm text-slate-900 font-sans tracking-wide">
                  RUANG KONVEKSI
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  BUKTI PEMBAYARAN UPAH KERJA
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  No: {slipItem.no_pembayaran || `UPH-${slipItem.id}`}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Petugas:</span>
                  <span className="font-bold text-slate-900">{slipItem.nama_petugas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Divisi / Tahap:</span>
                  <span className="font-bold text-slate-900">{slipItem.tahapan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Antrean:</span>
                  <span className="font-bold text-slate-900">{slipItem.no_antrian}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item Produk:</span>
                  <span className="font-bold text-slate-900 text-right">{slipItem.nama_produk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Qty Selesai:</span>
                  <span className="font-bold text-slate-900">{slipItem.qty} Pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif Satuan:</span>
                  <span className="font-bold text-slate-900">
                    Rp {Number(slipItem.tarif_per_pcs).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-xs font-sans">
                {Number(slipItem.potongan_kasbon) > 0 ? (
                  <>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Subtotal Upah Kotor:</span>
                      <span className="font-mono font-bold text-slate-800">
                        Rp {Number(slipItem.total_upah).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-amber-700">
                      <span>Potongan Kasbon:</span>
                      <span className="font-mono font-bold">
                        - Rp {Number(slipItem.potongan_kasbon).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
                      <span className="font-black text-slate-800">TOTAL BERSIH DITERIMA:</span>
                      <span className="text-base font-black text-[#064e3b] font-mono">
                        Rp {Number(slipItem.total_bersih ?? (Number(slipItem.total_upah) - Number(slipItem.potongan_kasbon))).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">TOTAL DIBAYAR:</span>
                    <span className="text-base font-black text-[#064e3b] font-mono">
                      Rp {Number(slipItem.total_upah).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-200 space-y-0.5">
                <div>Tanggal Bayar: {slipItem.tgl_bayar || '-'}</div>
                <div>Metode Bayar: {slipItem.metode_bayar || 'Tunai'}</div>
                {slipItem.catatan && <div>Catatan: {slipItem.catatan}</div>}
              </div>

              <div className="pt-3 flex justify-between text-center text-[9px] text-slate-400 font-sans">
                <div>
                  <div className="mb-6">Yang Menyerahkan,</div>
                  <div className="font-bold text-slate-700 underline">Admin Produksi</div>
                </div>
                <div>
                  <div className="mb-6">Penerima Upah,</div>
                  <div className="font-bold text-slate-700 underline">{slipItem.nama_petugas}</div>
                </div>
              </div>
            </div>

            {/* Tombol Cetak / Tutup */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] font-black text-white text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SLIP GAJI KARYAWAN (FORMAT RESMI EMRA PRODUCTION) */}
      {isSlipKaryawanModalOpen && currentSlipKaryawan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Top Toolbar */}
            <div className="bg-[#0b1b36] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-xs text-white">
                  Slip Gaji Emra Production
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSlipKaryawanModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slip Paper View */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-white text-slate-800 text-xs">
              {/* Box Header Format Emra */}
              <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                      SLIP GAJI EMRA PRODUCTION
                    </h2>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Ruang Konveksi Payroll System
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl border border-amber-300 bg-amber-50 flex items-center justify-center font-serif text-lg font-black text-amber-700 shadow-2xs">
                    MR
                  </div>
                </div>

                <div className="space-y-1 text-[11px] pt-1 border-t border-slate-200">
                  <div className="flex">
                    <span className="w-24 text-slate-500">Tanggal Periode</span>
                    <span className="font-bold text-slate-800">
                      : {startDate || '-'} s.d {endDate || '-'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-slate-500">Nama Petugas</span>
                    <div className="flex-1">
                      <select
                        value={selectedKaryawanName}
                        onChange={(e) => setSelectedKaryawanName(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {rekapKaryawanList.map((k) => (
                          <option key={k.namaPetugas} value={k.namaPetugas}>
                            {k.namaPetugas} ({k.tahapan})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">Divisi Kerja</span>
                    <span className="font-bold text-emerald-800">: {currentSlipKaryawan.tahapan}</span>
                  </div>
                </div>

                {/* Box Rincian Gaji & Kasbon */}
                <div className="pt-2 border-t border-slate-300 space-y-1 text-xs">
                  <div className="font-bold text-slate-600 uppercase text-[10px] tracking-wide">
                    Rincian Pembayaran
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-600">Total Pembayaran (Gross)</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {currentSlipKaryawan.totalKotor.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-amber-700">
                    <span>Potongan Pinjaman (Kasbon)</span>
                    <span className="font-mono font-bold">
                      - Rp {currentSlipKaryawan.totalPotonganKasbon.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-y-2 border-slate-800 bg-emerald-50/70 px-2 rounded font-black text-slate-900">
                    <span className="uppercase text-[11px]">Total Gaji Bersih</span>
                    <span className="text-sm font-mono text-[#064e3b]">
                      Rp {currentSlipKaryawan.totalBersih.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-[11px] text-slate-500">
                    <span>Sisa Pinjaman (Kasbon Aktif)</span>
                    <span className="font-mono font-bold text-amber-800">
                      Rp {currentSlipKaryawan.sisaPinjamanAktif.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="pt-1 text-[10px] italic text-slate-600 bg-slate-100 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700 not-italic">Terbilang: </span>
                    {angkaTerbilang(currentSlipKaryawan.totalBersih)}
                  </div>
                </div>

                {/* Grand Total Qty Merah khas Emra */}
                <div className="pt-2 flex justify-between items-center">
                  <span className="font-black text-slate-800 uppercase text-xs">
                    Grand Total QTY :
                  </span>
                  <div className="flex items-center gap-1 font-mono font-black text-rose-600 text-sm">
                    <span>{currentSlipKaryawan.totalQty.toLocaleString('id-ID')}</span>
                    <span className="text-slate-500 font-sans text-xs">Pcs</span>
                  </div>
                </div>
              </div>

              {/* Tabel Rincian Pembayaran Model & Warna */}
              <div className="space-y-1">
                <div className="text-[11px] font-black text-slate-800 uppercase">
                  Rincian Pekerjaan:
                </div>
                <div className="border border-slate-300 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-[10.5px]">
                    <thead className="bg-[#1e293b] text-white uppercase font-black text-[9.5px]">
                      <tr>
                        <th className="p-2">Model</th>
                        <th className="p-2">Warna</th>
                        <th className="p-2 text-right">Harga</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentSlipKaryawan.items.map((it, idx) => {
                        const tarif = Number(it.tarifPerPcs || it.tarif_per_pcs) || 0;
                        const sub = Number(it.totalUpah || it.total_upah) || (Number(it.qty) * tarif);
                        const modelName = it.skuInduk || it.namaProduk || it.nama_produk || it.sku || '-';
                        const colorName = it.varian || it.warnaHex || '-';

                        return (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="p-2 font-bold text-slate-900 leading-tight">
                              {modelName}
                            </td>
                            <td className="p-2 text-slate-600 font-medium whitespace-nowrap">
                              {colorName}
                            </td>
                            <td className="p-2 text-right font-mono whitespace-nowrap">
                              Rp {tarif.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-slate-900">
                              {it.qty}
                            </td>
                            <td className="p-2 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                              Rp {sub.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-4 pt-3 text-center text-[10px] text-slate-500">
                <div>
                  <p>Diserahkan Oleh,</p>
                  <div className="h-12 flex items-end justify-center font-bold text-slate-800 underline">
                    Admin Produksi
                  </div>
                </div>
                <div>
                  <p>Penerima Upah,</p>
                  <div className="h-12 flex items-end justify-center font-bold text-slate-800 underline">
                    {currentSlipKaryawan.namaPetugas}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSlipKaryawanModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white text-xs cursor-pointer"
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

