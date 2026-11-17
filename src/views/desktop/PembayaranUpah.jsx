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
  History,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';
import { getSmartColorHex } from './Produk';

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

function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parts[2];
    return `${day} ${month} ${year}`;
  }
  return dateStr;
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

  // Main Tab Navigasi: 'input' (Input Pembayaran / Slip Emra) | 'histori' (Histori Pembayaran)
  const [activeMainTab, setActiveMainTab] = useState('input');

  // Modal Detail Rincian Histori Pembayaran
  const [historiDetailItem, setHistoriDetailItem] = useState(null);
  const [isHistoriDetailOpen, setIsHistoriDetailOpen] = useState(false);

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

  // Filtered List hanya untuk tagihan yang BELUM LUNAS (Input Pembayaran)
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      // Yang sudah lunas jangan ditampilkan lagi di Input Pembayaran!
      const isLunas = item.statusBayar === 'Lunas' || item.status_bayar === 'Lunas';
      if (isLunas) return false;

      if (activeTahapTab !== 'Semua' && item.tahapan !== activeTahapTab) return false;
      if (
        filterPetugas &&
        !item.namaPetugas?.toLowerCase().includes(filterPetugas.toLowerCase())
      ) {
        return false;
      }

      // Filter Tanggal Periode
      const itemDate = item.createdAt ? String(item.createdAt).slice(0, 10) : '';
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
  }, [dataList, activeTahapTab, filterPetugas, searchQuery, startDate, endDate]);

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
          const rawName = (item.namaPetugas || 'Tanpa Nama').trim();
          // Bersihkan nama tim dari embel-embel seperti (QC), (Cutting), dll
          let teamName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
          if (cat.key === 'Jahit') {
            // Untuk penjahit jangan ada kata "Tim", cukup nama penjahitnya
            teamName = teamName.replace(/^tim\s+/i, '').trim();
          }
          if (!teamName) teamName = rawName;

          if (!teamMap.has(teamName)) {
            const employeeKasbons = kasbonAll.filter(
              (k) => (k.namaPetugas || '').trim().toLowerCase() === rawName.toLowerCase() ||
                     (k.namaPetugas || '').trim().toLowerCase() === teamName.toLowerCase()
            );
            const sisaPinjamanAktif = employeeKasbons.reduce(
              (acc, k) => acc + Number(k.sisa || 0),
              0
            );

            teamMap.set(teamName, {
              namaPetugas: teamName,
              rawNamaPetugas: rawName,
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

  // Daftar Histori Pembayaran yang sudah diinput/dibayarkan (Lunas)
  // Dikelompokkan per transaksi pembayaran (tgl_bayar + namaPetugas + tahapan)
  const historiBayarList = useMemo(() => {
    const lunasItems = dataList.filter(
      (i) => i.statusBayar === 'Lunas' || i.status_bayar === 'Lunas'
    );
    const groups = new Map();

    lunasItems.forEach((item) => {
      const tgl = item.tglBayar || (item.createdAt ? String(item.createdAt).slice(0, 10) : '-');
      const pet = (item.namaPetugas || 'Tanpa Nama').trim();
      const thp = item.tahapan || 'Konveksi';
      // Group key per tanggal bayar + nama petugas + tahap
      const key = `${tgl}_${pet}_${thp}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          tglBayar: tgl,
          namaPetugas: pet,
          tahapan: thp,
          metodeBayar: item.metodeBayar || 'Tunai',
          catatan: item.catatan || '',
          items: [],
          totalQty: 0,
          totalKotor: 0,
          totalPotonganKasbon: 0,
          totalBersih: 0,
        });
      }

      const g = groups.get(key);
      g.items.push(item);
      g.totalQty += Number(item.qty || 0);
      g.totalKotor += Number(item.totalUpah || 0);
      g.totalPotonganKasbon += Number(item.potonganKasbon || 0);
      g.totalBersih += Number(
        item.totalBersih ?? (Number(item.totalUpah || 0) - Number(item.potonganKasbon || 0))
      );
    });

    return Array.from(groups.values())
      .map((g) => {
        const dates = g.items
          .map((i) => (i.createdAt ? String(i.createdAt).slice(0, 10) : ''))
          .filter(Boolean)
          .sort();
        const minDate = dates[0] || g.tglBayar;
        const maxDate = dates[dates.length - 1] || g.tglBayar;
        const periode = minDate === maxDate ? minDate : `${minDate} s.d ${maxDate}`;
        return {
          ...g,
          periode,
        };
      })
      .sort((a, b) => (b.tglBayar || '').localeCompare(a.tglBayar || ''));
  }, [dataList]);

  // Handle Batal Bayar Sekaligus untuk Seluruh Item dalam 1 Record Histori
  const handleBatalHistori = async (historiGroup) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Batalkan Pembayaran Ini?',
      html: `
        <div class="text-xs text-left space-y-1">
          <p>Yakin ingin membatalkan pembayaran upah untuk:</p>
          <p>• <strong>${historiGroup.namaPetugas}</strong> (${historiGroup.tahapan})</p>
          <p>• Tanggal: <strong>${historiGroup.tglBayar}</strong></p>
          <p>• Total Bayar: <strong>Rp ${historiGroup.totalBersih.toLocaleString('id-ID')}</strong> (${historiGroup.items.length} Order)</p>
          <p class="text-rose-600 mt-2 font-semibold">* Status seluruh order ini akan dikembalikan menjadi Belum Lunas.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan Lunas',
      cancelButtonText: 'Kembali',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
    });

    if (res.isConfirmed) {
      try {
        Swal.fire({
          title: 'Membatalkan...',
          text: 'Mengembalikan status tagihan upah...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        // Batal bayar untuk setiap item di histori ini
        await Promise.all(historiGroup.items.map((i) => api.batalBayarUpah(i.id)));
        await fetchData();

        Swal.fire({
          icon: 'success',
          title: 'Pembayaran Dibatalkan',
          text: `${historiGroup.items.length} order tagihan dikembalikan ke status Belum Lunas.`,
          timer: 1800,
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

  // Open Detail Rincian Histori Modal
  const handleOpenDetailHistori = (historiGroup) => {
    setHistoriDetailItem(historiGroup);
    setIsHistoriDetailOpen(true);
  };

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
      {/* 1. HEADER TITLE (DATA MASTER KATEGORI & PRODUK STYLE) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg p-2.5 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">
                Pembayaran Upah Produksi
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[10px] font-extrabold uppercase">
                PAYROLL BORONGAN
              </span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Pencatatan slip pembayaran upah per tim Pemotong, Penjahit, QC, dan Finishing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncFromAntrean}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/20"
            title="Tarik & sinkronkan data penyerahan tahap antrean menjadi tagihan upah"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync dari Antrean</span>
          </button>
        </div>
      </div>

      {/* 2. DUA TAB UTAMA: INPUT PEMBAYARAN & HISTORI PEMBAYARAN */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('input')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'input'
              ? 'bg-[#0284c7] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Input Pembayaran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('histori')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'histori'
              ? 'bg-[#0284c7] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histori Pembayaran</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              activeMainTab === 'histori'
                ? 'bg-white/25 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {historiBayarList.length}
          </span>
        </button>
      </div>

      {/* 3. KONTEN TAB: INPUT PEMBAYARAN (GOOGLE SHEET SLIP GAJI EMRA PRODUCTION) */}
      {activeMainTab === 'input' && (
        <div className="space-y-3">
          {/* TOOLBAR FILTER & DIVISI SELECTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Divisi Tabs (Pemotong, Penjahit, QC, Finishing) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'Cutting', label: 'Pemotong (Cutting)', icon: Scissors },
                { key: 'Jahit', label: 'Penjahit (Sewing)', icon: Shirt },
                { key: 'QC', label: 'Quality Control (QC)', icon: ShieldCheck },
                { key: 'Finishing', label: 'Finishing & Packing', icon: PackageCheck },
              ].map((tab) => {
                const isSelected = sheetTahap === tab.key;
                const matchedGroup = groupedByTahap.find((g) => g.key === tab.key);
                const countTeams = matchedGroup ? matchedGroup.teams.length : 0;
                const IconComponent = tab.icon;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSheetTahap(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#0284c7] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
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

            {/* Filter Tanggal & Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500">Periode:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-6 px-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400 text-xs font-bold">s.d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-6 px-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetPresetDate('minggu')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors"
                >
                  1 Minggu
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetDate('bulan')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetDate('semua')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Semua
                </button>
              </div>

              {activeSheetTeamData && (
                <button
                  type="button"
                  onClick={() => handleOpenSlipKaryawan(activeSheetTeamData.namaPetugas)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Cetak Slip</span>
                </button>
              )}
            </div>
          </div>

          {/* KERTAS SLIP GAJI EMRA PRODUCTION (PERSIS GAMBAR GOOGLE SHEET USER) */}
          <div className="w-full max-w-4xl mx-auto bg-white border-2 border-sky-400 p-6 sm:p-8 shadow-sm font-mono text-black select-none">
            {/* 1. TITLE & MONOGRAM LOGO ROW */}
            <div className="flex items-start justify-between pb-1">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-black font-mono">
                  SLIP GAJI EMRA PRODUCTION
                </h1>
                <div className="border-b-[2.5px] border-black mt-2 w-full"></div>
              </div>

              {/* Monogram Logo MR Gold Elegance */}
              <div className="w-24 h-20 -mt-2 shrink-0 flex items-center justify-end">
                <svg viewBox="0 0 120 100" className="w-24 h-20">
                  <defs>
                    <linearGradient id="goldMonogramMR" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c59b27" />
                      <stop offset="35%" stopColor="#f7e7a9" />
                      <stop offset="70%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#9a7116" />
                    </linearGradient>
                  </defs>
                  <text
                    x="25"
                    y="65"
                    fontFamily="Cinzel, 'Times New Roman', Georgia, serif"
                    fontSize="52"
                    fontWeight="bold"
                    fill="url(#goldMonogramMR)"
                    letterSpacing="-2"
                  >
                    M
                  </text>
                  <text
                    x="54"
                    y="72"
                    fontFamily="Cinzel, 'Times New Roman', Georgia, serif"
                    fontSize="52"
                    fontWeight="bold"
                    fill="url(#goldMonogramMR)"
                  >
                    R
                  </text>
                  <path
                    d="M 18 80 Q 60 92 102 80"
                    fill="none"
                    stroke="url(#goldMonogramMR)"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                </svg>
              </div>
            </div>

            {/* 2. TOP INFO (Tanggal Priode, Nama, ID Karyawan) DENGAN DOTTED UNDERLINE */}
            <div className="mt-3 space-y-1.5 text-[13px] text-black">
              <div className="flex items-end">
                <span className="w-40 shrink-0 font-bold">Tanggal Priode</span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5">
                  <span className="font-bold">
                    {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-end">
                <span className="w-40 shrink-0 font-bold">
                  {sheetTahap === 'Jahit' ? 'Nama' : 'Nama Tim'}
                </span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5 flex items-center justify-between">
                  <select
                    value={sheetTeam}
                    onChange={(e) => setSheetTeam(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-black cursor-pointer font-mono text-[13px] w-full"
                  >
                    {sheetTeamsList.length === 0 ? (
                      <option value="">(Semua tim/penjahit sudah lunas)</option>
                    ) : (
                      sheetTeamsList.map((t) => (
                        <option key={t.namaPetugas} value={t.namaPetugas}>
                          {t.namaPetugas}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 font-sans print:hidden">▼</span>
                </div>
              </div>

              <div className="flex items-end">
                <span className="w-40 shrink-0 font-bold">ID Karyawan</span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5">
                  <span className="font-mono text-black">
                    {activeSheetTeamData?.items?.[0]?.nik || (activeSheetTeamData?.items?.[0]?.id ? `KRY-${activeSheetTeamData?.items?.[0]?.id}` : '')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. SECTION RINCIAN */}
            <div className="mt-4 space-y-1.5 text-[13px] text-black">
              <div className="font-bold text-sm">Rincian</div>

              <div className="flex items-end">
                <span className="w-48 shrink-0 italic text-slate-800">Total Pembayaran</span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5 flex items-center justify-between">
                  <span className="font-bold">Rp</span>
                  <span className="font-bold font-mono">
                    {(activeSheetTeamData?.totalKotor || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex items-end">
                <span className="w-48 shrink-0 italic text-slate-800">Potongan Pinjaman</span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5 flex items-center justify-between">
                  <span className="font-bold">
                    {(activeSheetTeamData?.totalPotonganKasbon || 0) > 0 ? 'Rp' : ''}
                  </span>
                  <span className="font-bold font-mono">
                    {(activeSheetTeamData?.totalPotonganKasbon || 0) > 0
                      ? (activeSheetTeamData.totalPotonganKasbon).toLocaleString('id-ID')
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. SOLID THICK BLACK DIVIDER BAR */}
            <div className="h-2 bg-black my-2.5"></div>

            {/* 5. TOTAL GAJI & SISA PINJAMAN (DENGAN ASTERISK MERAH) */}
            <div className="space-y-1.5 text-[13px] text-black">
              <div className="flex items-end">
                <span className="w-48 shrink-0 font-bold">
                  <span className="text-red-600 font-bold mr-1">*</span>Total GAJI
                </span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5 flex items-center justify-between">
                  <span className="font-bold">Rp</span>
                  <span className="font-black font-mono text-base">
                    {(activeSheetTeamData?.totalBersih || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex items-end">
                <span className="w-48 shrink-0 font-bold">
                  <span className="text-red-600 font-bold mr-1">*</span>Sisa Pinjaman
                </span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5 flex items-center justify-between">
                  <span className="font-bold">
                    {(activeSheetTeamData?.sisaPinjamanAktif || 0) > 0 ? 'Rp' : ''}
                  </span>
                  <span className="font-bold font-mono">
                    {(activeSheetTeamData?.sisaPinjamanAktif || 0) > 0
                      ? (activeSheetTeamData.sisaPinjamanAktif).toLocaleString('id-ID')
                      : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-end">
                <span className="w-48 shrink-0 font-bold">
                  <span className="text-red-600 font-bold mr-1">*</span>Terbilang
                </span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5">
                  <span className="italic font-sans text-xs text-slate-800">
                    {activeSheetTeamData ? angkaTerbilang(activeSheetTeamData.totalBersih || 0) : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. SUBTITLE RINCIAN PEMBAYARAN & GRAND TOTAL QTY */}
            <div className="mt-5 space-y-1.5">
              <div className="font-bold underline text-sm text-black">
                Rincian Pembayaran
              </div>

              <div className="flex items-end text-[13px] text-black">
                <span className="w-48 shrink-0 font-bold">
                  <span className="text-red-600 font-bold mr-1">*</span>Grand Total QTY
                </span>
                <span className="w-4 shrink-0 text-center font-bold">:</span>
                <div className="flex-1 border-b border-dotted border-black pb-0.5 flex items-center justify-end gap-2">
                  <span className="font-black font-mono text-red-600 text-sm">
                    {activeSheetTeamData ? (activeSheetTeamData.totalQty || 0).toLocaleString('id-ID') : 0}
                  </span>
                  <span className="font-bold text-slate-600 text-xs">Pcs</span>
                </div>
              </div>
            </div>

            {/* 7. TABEL PERSIS GOOGLE SHEET (BORDER HITAM RAPAT & HEADER GELAP) */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs font-mono">
                <thead>
                  <tr className="bg-[#334155] text-white font-bold uppercase text-center border-b border-black">
                    <th className="py-1.5 px-3 border border-black text-left">MODEL</th>
                    <th className="py-1.5 px-3 border border-black w-32">Warna</th>
                    <th className="py-1.5 px-3 border border-black w-28">Harga</th>
                    <th className="py-1.5 px-3 border border-black w-20">Qty</th>
                    <th className="py-1.5 px-3 border border-black w-36">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Data Baris Order */}
                  {activeSheetTeamData && activeSheetTeamData.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-amber-50/20 border-b border-black text-black">
                      <td className="py-1.5 px-2.5 border border-black font-bold uppercase truncate max-w-[240px]" title={item.namaProduk}>
                        {item.skuInduk || item.namaProduk}
                      </td>
                      <td className="py-1.5 px-2.5 border border-black text-center font-medium">
                        {item.varian || '-'}
                      </td>
                      <td className="py-1.5 px-2.5 border border-black text-right font-medium">
                        Rp {Number(item.tarifPerPcs || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2.5 border border-black text-center font-bold">
                        {Number(item.qty || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2.5 border border-black text-right font-bold">
                        <div className="flex items-center justify-between">
                          <span>Rp</span>
                          <span>{Number(item.totalUpah || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty Grid Rows (Memberi tampilan persis kisi-kisi Google Sheet) */}
                  {Array.from({ length: Math.max(3, 8 - (activeSheetTeamData?.items?.length || 0)) }).map((_, emptyIdx) => (
                    <tr key={`empty-${emptyIdx}`} className="h-6 border-b border-black">
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 8. FOOTER ACTION BUTTONS */}
            {activeSheetTeamData && (
              <div className="mt-5 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => handleOpenSlipKaryawan(activeSheetTeamData.namaPetugas)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Cetak Slip ({activeSheetTeamData.namaPetugas})</span>
                </button>

                {activeSheetTeamData.pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const pendingItems = activeSheetTeamData.items.filter((i) => i.statusBayar !== 'Lunas');
                      handleOpenPay(pendingItems);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <CreditCard className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      Bayar Gaji {sheetTahap === 'Jahit' ? 'Penjahit' : 'Tim'} Ini (Rp {activeSheetTeamData.totalBersih.toLocaleString('id-ID')})
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* 4. KONTEN TAB: HISTORI PEMBAYARAN */}
      {activeMainTab === 'histori' && (
        <div className="space-y-3">
          {/* Search Header */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari tim, penjahit, atau tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Total <strong className="text-emerald-800 font-mono font-black">{historiBayarList.length}</strong> transaksi pembayaran tersimpan
            </div>
          </div>

          {/* Tabel Histori Pembayaran */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-700 font-extrabold text-[11px] tracking-wide uppercase border-b border-slate-200">
                    <th className="py-3 px-3 text-center w-12 border-r border-slate-200">NO</th>
                    <th className="py-3 px-4 border-r border-slate-200 whitespace-nowrap">TANGGAL PEMBAYARAN</th>
                    <th className="py-3 px-4 border-r border-slate-200 whitespace-nowrap">PERIODE</th>
                    <th className="py-3 px-4 border-r border-slate-200">TIM / PENJAHIT</th>
                    <th className="py-3 px-4 border-r border-slate-200 text-center whitespace-nowrap">VOLUME & ORDER</th>
                    <th className="py-3 px-4 border-r border-slate-200 text-right whitespace-nowrap bg-emerald-50/50 text-emerald-950">
                      JUMLAH BAYAR
                    </th>
                    <th className="py-3 px-4 text-center w-40 whitespace-nowrap">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {historiBayarList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-slate-600">Belum ada histori pembayaran</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Lakukan input pembayaran pada tab "Input Pembayaran" untuk mencatat pembayaran baru
                        </p>
                      </td>
                    </tr>
                  ) : (
                    historiBayarList
                      .filter((h) => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          (h.namaPetugas || '').toLowerCase().includes(q) ||
                          (h.tahapan || '').toLowerCase().includes(q) ||
                          (h.tglBayar || '').toLowerCase().includes(q) ||
                          (h.periode || '').toLowerCase().includes(q)
                        );
                      })
                      .map((h, idx) => (
                        <tr key={h.key || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 font-bold font-mono border-r border-slate-200">
                            {idx + 1}
                          </td>

                          {/* Tanggal Pembayaran */}
                          <td className="py-3 px-4 border-r border-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{h.tglBayar}</span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 block mt-0.5 font-sans">
                              Metode: {h.metodeBayar || 'Tunai'}
                            </span>
                          </td>

                          {/* Periode */}
                          <td className="py-3 px-4 border-r border-slate-200 whitespace-nowrap font-mono text-slate-700 text-xs">
                            {h.periode}
                          </td>

                          {/* Tim / Penjahit */}
                          <td className="py-3 px-4 border-r border-slate-200">
                            <div className="font-black text-slate-900 text-sm">{h.namaPetugas}</div>
                            <div className="mt-0.5">{getTahapanBadge(h.tahapan)}</div>
                          </td>

                          {/* Jumlah Order & Pcs */}
                          <td className="py-3 px-4 border-r border-slate-200 text-center whitespace-nowrap">
                            <div className="font-mono font-black text-rose-700 text-xs">
                              {h.totalQty.toLocaleString('id-ID')} Pcs
                            </div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              {h.items.length} Order Pekerjaan
                            </div>
                          </td>

                          {/* Jumlah Bayar */}
                          <td className="py-3 px-4 border-r border-slate-200 text-right bg-emerald-50/30 whitespace-nowrap">
                            <span className="font-mono font-black text-sm text-[#064e3b] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs inline-block">
                              Rp {h.totalBersih.toLocaleString('id-ID')}
                            </span>
                          </td>

                          {/* Aksi: Show dan Batal */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Tombol Show (Rincian) */}
                              <button
                                type="button"
                                onClick={() => handleOpenDetailHistori(h)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Lihat rincian order yang dibayar"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Show</span>
                              </button>

                              {/* Tombol Batal */}
                              <button
                                type="button"
                                onClick={() => handleBatalHistori(h)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Batalkan pembayaran dan kembalikan ke status belum lunas"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL RINCIAN HISTORI PEMBAYARAN (SHOW) */}
      {isHistoriDetailOpen && historiDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-emerald-300">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Rincian Histori Pembayaran</h3>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    Detail transaksi pembayaran upah yang telah diverifikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoriDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Info */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Penerima</span>
                  <span className="font-black text-slate-900 text-sm">{historiDetailItem.namaPetugas}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold block">{historiDetailItem.tahapan}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Tanggal Bayar</span>
                  <span className="font-bold text-slate-800 text-xs font-mono">{historiDetailItem.tglBayar}</span>
                  <span className="text-[10.5px] text-slate-500 block">Metode: {historiDetailItem.metodeBayar || 'Tunai'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Periode Pengerjaan</span>
                  <span className="font-bold text-slate-800 text-xs font-mono">{historiDetailItem.periode}</span>
                  <span className="text-[10.5px] text-slate-500 block">{historiDetailItem.items.length} Order</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Dibayar</span>
                  <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    Rp {historiDetailItem.totalBersih.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Tabel Order Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#1e293b] text-white font-extrabold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">NO</th>
                      <th className="py-2.5 px-3">NO. ORDER / ANTREAN</th>
                      <th className="py-2.5 px-3">MODEL & WARNA</th>
                      <th className="py-2.5 px-3 text-right">HARGA / PCS</th>
                      <th className="py-2.5 px-3 text-center">QTY</th>
                      <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {historiDetailItem.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold text-emerald-950 text-xs">{it.noPembayaran}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{it.noAntrian || '-'}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 block">{it.namaProduk}</span>
                          <span className="text-[10.5px] text-slate-500">{it.warna || it.varian || '-'}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          Rp {Number(it.tarifPerPcs || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">
                          {Number(it.qty || 0).toLocaleString('id-ID')} Pcs
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-800">
                          Rp {Number(it.totalUpah || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan="4" className="py-2.5 px-3 text-right uppercase text-slate-700">
                        Grand Total Qty & Upah:
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700">
                        {historiDetailItem.totalQty.toLocaleString('id-ID')} Pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                        Rp {historiDetailItem.totalKotor.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    {historiDetailItem.totalPotonganKasbon > 0 && (
                      <tr>
                        <td colSpan="5" className="py-1.5 px-3 text-right uppercase text-amber-800">
                          Potongan Pinjaman / Kasbon:
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-black text-amber-700">
                          - Rp {historiDetailItem.totalPotonganKasbon.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/80 text-emerald-950 text-sm">
                      <td colSpan="5" className="py-2.5 px-3 text-right uppercase font-black">
                        Total Gaji Bersih Dibayar:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                        Rp {historiDetailItem.totalBersih.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsHistoriDetailOpen(false);
                  handleBatalHistori(historiDetailItem);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batalkan Pembayaran Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHistoriDetailOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-all"
              >
                Tutup
              </button>
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
                                {k.namaPetugas}
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

