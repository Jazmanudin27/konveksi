// g:\Konveksi\src\views\desktop\pembayaran\index.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Coins,
  RefreshCw,
  CreditCard,
  History,
  Scissors,
  Shirt,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";
import { api } from "../../../services/api";
import { Swal } from "../../../utils/swal";

import InputPembayaranTab from "./InputPembayaranTab";
import HistoriPembayaranTab from "./HistoriPembayaranTab";
import CetakSlipModal from "./CetakSlipModal";
import DetailHistoriModal from "./DetailHistoriModal";
import KonfirmasiBayarModal from "./KonfirmasiBayarModal";

export default function PembayaranUpah({ employees = [], antreanList = [] }) {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Main Tab: 'input' (Input Pembayaran / Slip Emra) | 'histori' (Histori Pembayaran)
  const [activeMainTab, setActiveMainTab] = useState("input");

  // Modal Detail Rincian Histori Pembayaran
  const [historiDetailItem, setHistoriDetailItem] = useState(null);
  const [isHistoriDetailOpen, setIsHistoriDetailOpen] = useState(false);

  // Sheet Mode (Cutting, Jahit, QC, Finishing)
  const [sheetTahap, setSheetTahap] = useState("Cutting");
  const [sheetTeam, setSheetTeam] = useState("");

  // Filter Tanggal Periode Mingguan
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }, []);
  const defaultEndDate = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Data Kasbon untuk deteksi pinjaman aktif
  const [kasbonAll, setKasbonAll] = useState([]);
  const [manualPotonganMap, setManualPotonganMap] = useState({});

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Bayar State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetPayItems, setTargetPayItems] = useState([]);
  const [payForm, setPayForm] = useState({
    tglBayar: new Date().toISOString().slice(0, 10),
    metodeBayar: "Tunai / Cash",
    catatan: "",
  });

  // Modal Cetak Slip
  const [isSlipKaryawanModalOpen, setIsSlipKaryawanModalOpen] = useState(false);
  const [slipCustomData, setSlipCustomData] = useState(null);

  // Kasbon State saat Modal Bayar
  const [kasbonInfo, setKasbonInfo] = useState(null);
  const [potonganKasbon, setPotonganKasbon] = useState(0);

  // Fetch Data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, kasbonData] = await Promise.all([
        api.getPembayaranUpah(),
        api.getKasbon().catch(() => []),
      ]);

      if (Array.isArray(list)) {
        setDataList(list);
      }
      if (Array.isArray(kasbonData)) {
        setKasbonAll(kasbonData);
      }
    } catch (err) {
      console.warn("Gagal memuat pembayaran upah:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetPresetDate = (type) => {
    const today = new Date();
    if (type === "minggu") {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (type === "bulan") {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      setStartDate(`${y}-${m}-01`);
      setEndDate(today.toISOString().slice(0, 10));
    } else if (type === "semua") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Sync dari Antrean Produksi
  const handleSyncFromAntrean = async () => {
    try {
      Swal.fire({
        title: "Menyinkronkan...",
        text: "Mengambil data upah dari seluruh tahapan antrean produksi...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.syncPembayaranUpah();
      await fetchData();

      Swal.fire({
        icon: "success",
        title: "Sinkronisasi Selesai",
        text:
          res?.message ||
          "Data upah berhasil disinkronkan dengan antrean produksi.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Sinkronisasi Gagal",
        text: err.message || "Terjadi kesalahan saat menyinkronkan data.",
      });
    }
  };

  // Filter Data List Utama
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      if (startDate) {
        const itemDate = item.createdAt
          ? String(item.createdAt).slice(0, 10)
          : "";
        if (itemDate && itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = item.createdAt
          ? String(item.createdAt).slice(0, 10)
          : "";
        if (itemDate && itemDate > endDate) return false;
      }
      return true;
    });
  }, [dataList, startDate, endDate]);

  // Pisahkan Tabel Rekap Payroll Per Divisi / Tim (Cutting, Jahit, QC, Finishing)
  const groupedByTahap = useMemo(() => {
    const categories = [
      {
        key: "Cutting",
        label: "Tim Pemotong (Cutting)",
        sublabel: "Borongan Per Tim Potong",
        recipientHeader: "NAMA TIM PEMOTONG",
        icon: Scissors,
        gradient: "from-blue-600 to-indigo-700",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      },
      {
        key: "Jahit",
        label: "Penjahit Konveksi (Sewing)",
        sublabel: "Borongan Penjahit / Mitra CMT",
        recipientHeader: "NAMA PENJAHIT / MITRA JAHIT",
        icon: Shirt,
        gradient: "from-purple-600 to-violet-700",
        badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      },
      {
        key: "QC",
        label: "Tim Quality Control (QC)",
        sublabel: "Borongan Per Tim QC",
        recipientHeader: "NAMA TIM QC",
        icon: ShieldCheck,
        gradient: "from-teal-600 to-cyan-700",
        badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      },
      {
        key: "Finishing",
        label: "Tim Finishing & Packing",
        sublabel: "Borongan Per Tim Finishing",
        recipientHeader: "NAMA TIM FINISHING",
        icon: PackageCheck,
        gradient: "from-emerald-600 to-teal-800",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      },
    ];

    return categories.map((cat) => {
      const itemsInTahap = filteredList.filter((i) => i.tahapan === cat.key);
      const teamMap = new Map();

      itemsInTahap.forEach((item) => {
        const rawName = (item.namaPetugas || "Tanpa Nama").trim();
        let teamName = rawName.replace(/\s*\([^)]*\)/g, "").trim();
        if (cat.key === "Jahit") {
          teamName = teamName.replace(/^tim\s+/i, "").trim();
        }
        if (!teamName) teamName = rawName;

        if (!teamMap.has(teamName)) {
          const employeeKasbons = kasbonAll.filter(
            (k) =>
              (k.namaPetugas || "").trim().toLowerCase() ===
                rawName.toLowerCase() ||
              (k.namaPetugas || "").trim().toLowerCase() ===
                teamName.toLowerCase(),
          );
          const sisaPinjamanAktif = employeeKasbons.reduce(
            (acc, k) => acc + Number(k.sisa || 0),
            0,
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
          item.totalBersih ??
            Number(item.totalUpah) - Number(item.potonganKasbon || 0),
        );

        if (item.statusBayar === "Lunas") {
          grp.lunasCount += 1;
        } else {
          grp.pendingCount += 1;
        }
      });

      const teams = Array.from(teamMap.values()).sort(
        (a, b) => b.totalKotor - a.totalKotor,
      );
      const subtotalQty = teams.reduce((a, c) => a + c.totalQty, 0);
      const subtotalKotor = teams.reduce((a, c) => a + c.totalKotor, 0);
      const subtotalPotongan = teams.reduce(
        (a, c) => a + c.totalPotonganKasbon,
        0,
      );
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
  }, [filteredList, kasbonAll]);

  // Data Tim dan Rincian untuk Sheet Google Style
  const sheetTeamsList = useMemo(() => {
    const matchedGroup = groupedByTahap.find((g) => g.key === sheetTahap);
    return matchedGroup ? matchedGroup.teams : [];
  }, [groupedByTahap, sheetTahap]);

  // Auto-select first team jika team aktif kosong atau tidak ditemukan
  useEffect(() => {
    if (sheetTeamsList.length > 0) {
      if (
        !sheetTeam ||
        !sheetTeamsList.some((t) => t.namaPetugas === sheetTeam)
      ) {
        setSheetTeam(sheetTeamsList[0].namaPetugas);
      }
    } else {
      setSheetTeam("");
    }
  }, [sheetTeamsList, sheetTeam]);

  // Data Tim yang sedang aktif di Sheet
  const activeSheetTeamData = useMemo(() => {
    if (!sheetTeam) return null;
    return sheetTeamsList.find((t) => t.namaPetugas === sheetTeam) || null;
  }, [sheetTeamsList, sheetTeam]);

  // Nominal Potongan Kasbon Manual (Khusus Penjahit)
  const currentManualPotongan = useMemo(() => {
    if (sheetTahap !== "Jahit" || !sheetTeam) return 0;
    if (
      manualPotonganMap[sheetTeam] !== undefined &&
      manualPotonganMap[sheetTeam] !== ""
    ) {
      return Number(manualPotonganMap[sheetTeam]) || 0;
    }
    return Number(activeSheetTeamData?.totalPotonganKasbon || 0);
  }, [sheetTahap, sheetTeam, manualPotonganMap, activeSheetTeamData]);

  // Total Gaji Bersih yang ditampilkan
  const displayTotalBersih = useMemo(() => {
    if (!activeSheetTeamData) return 0;
    if (sheetTahap !== "Jahit") {
      return activeSheetTeamData.totalKotor;
    }
    return Math.max(0, activeSheetTeamData.totalKotor - currentManualPotongan);
  }, [activeSheetTeamData, sheetTahap, currentManualPotongan]);

  // Daftar Histori Pembayaran yang sudah diinput/dibayarkan (Lunas)
  const historiBayarList = useMemo(() => {
    const lunasItems = dataList.filter(
      (i) => i.statusBayar === "Lunas" || i.status_bayar === "Lunas",
    );
    const groups = new Map();

    lunasItems.forEach((item) => {
      const tgl =
        item.tglBayar ||
        (item.createdAt ? String(item.createdAt).slice(0, 10) : "-");
      const pet = (item.namaPetugas || "Tanpa Nama").trim();
      const thp = item.tahapan || "Konveksi";
      const key = `${tgl}_${pet}_${thp}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          tglBayar: tgl,
          namaPetugas: pet,
          tahapan: thp,
          metodeBayar: item.metodeBayar || "Tunai",
          catatan: item.catatan || "",
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
        item.totalBersih ??
          Number(item.totalUpah || 0) - Number(item.potonganKasbon || 0),
      );
    });

    return Array.from(groups.values())
      .map((g) => {
        const dates = g.items
          .map((i) => (i.createdAt ? String(i.createdAt).slice(0, 10) : ""))
          .filter(Boolean)
          .sort();
        const minDate = dates[0] || g.tglBayar;
        const maxDate = dates[dates.length - 1] || g.tglBayar;
        const periode =
          minDate === maxDate ? minDate : `${minDate} s.d ${maxDate}`;
        return {
          ...g,
          periode,
        };
      })
      .sort((a, b) => (b.tglBayar || "").localeCompare(a.tglBayar || ""));
  }, [dataList]);

  // Handle Batal Bayar Sekaligus untuk Seluruh Item dalam 1 Record Histori
  const handleBatalHistori = async (historiGroup) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "Batalkan Pembayaran Ini?",
      html: `
        <div class="text-xs text-left space-y-1">
          <p>Yakin ingin membatalkan pembayaran upah untuk:</p>
          <p>• <strong>${historiGroup.namaPetugas}</strong> (${historiGroup.tahapan})</p>
          <p>• Tanggal: <strong>${historiGroup.tglBayar}</strong></p>
          <p>• Total Bayar: <strong>Rp ${historiGroup.totalBersih.toLocaleString("id-ID")}</strong> (${historiGroup.items.length} Order)</p>
          <p class="text-rose-600 mt-2 font-semibold">* Status seluruh order ini akan dikembalikan menjadi Belum Lunas.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan Lunas",
      cancelButtonText: "Kembali",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
    });

    if (res.isConfirmed) {
      try {
        Swal.fire({
          title: "Membatalkan...",
          text: "Mengembalikan status tagihan upah...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await Promise.all(
          historiGroup.items.map((i) => api.batalBayarUpah(i.id)),
        );
        await fetchData();

        Swal.fire({
          icon: "success",
          title: "Pembayaran Dibatalkan",
          text: `${historiGroup.items.length} order tagihan dikembalikan ke status Belum Lunas.`,
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal Membatalkan",
          text: err.message || "Terjadi kesalahan sistem.",
        });
      }
    }
  };

  // Open Detail Rincian Histori Modal
  const handleOpenDetailHistori = (historiGroup) => {
    setHistoriDetailItem(historiGroup);
    setIsHistoriDetailOpen(true);
  };

  // Open Pay Modal (Single / Batch)
  const handleOpenPay = async (items, initialPotong = null) => {
    if (!items || items.length === 0) return;
    setTargetPayItems(items);
    setPayForm({
      tglBayar: new Date().toISOString().slice(0, 10),
      metodeBayar: "Tunai / Cash",
      catatan: "",
    });

    const totalGross = items.reduce(
      (acc, c) => acc + (Number(c.totalUpah) || 0),
      0,
    );
    const uniquePetugas = [
      ...new Set(
        items.map((i) => (i.namaPetugas || i.nama_petugas || "").trim()),
      ),
    ].filter(Boolean);

    // Selain Penjahit (Pemotong, QC, Finishing), tidak ada potongan kasbon
    if (sheetTahap !== "Jahit") {
      setKasbonInfo(null);
      setPotonganKasbon(0);
      setIsPayModalOpen(true);
      return;
    }

    // Khusus Penjahit:
    if (initialPotong !== null && initialPotong !== undefined) {
      setPotonganKasbon(initialPotong);
      if (uniquePetugas.length === 1) {
        try {
          const saldoData = await api.getKasbonSaldo(uniquePetugas[0]);
          setKasbonInfo(saldoData);
        } catch (_) {}
      }
    } else if (uniquePetugas.length === 1) {
      try {
        const saldoData = await api.getKasbonSaldo(uniquePetugas[0]);
        if (saldoData && saldoData.totalSisa > 0) {
          setKasbonInfo(saldoData);
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
      await fetchData();

      Swal.fire({
        icon: "success",
        title: "Pembayaran Berhasil Dicatat!",
        text: `${ids.length} tagihan upah telah ditandai Lunas.${
          Number(potonganKasbon) > 0
            ? ` (Dipotong Kasbon: Rp ${Number(potonganKasbon).toLocaleString("id-ID")})`
            : ""
        }`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Memproses Pembayaran",
        text: err.message || "Terjadi kesalahan sistem.",
      });
    }
  };

  // Open Slip Modal khusus Histori
  const handleOpenSlipHistori = (historiGroup) => {
    setSlipCustomData(historiGroup);
    setIsSlipKaryawanModalOpen(true);
  };

  // Helper Badge Tahapan
  const getTahapanBadge = (tahap) => {
    switch (tahap) {
      case "Cutting":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scissors className="w-3.5 h-3.5" />
            <span>Pemotong (Cutting)</span>
          </span>
        );
      case "Jahit":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shirt className="w-3.5 h-3.5" />
            <span>Penjahit (Sewing)</span>
          </span>
        );
      case "QC":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quality Control (QC)</span>
          </span>
        );
      case "Finishing":
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
      {/* 1. HEADER TITLE */}
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
              Pencatatan slip pembayaran upah per tim Pemotong, Penjahit, QC,
              dan Finishing
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
          onClick={() => setActiveMainTab("input")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === "input"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Input Pembayaran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("histori")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === "histori"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histori Pembayaran</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              activeMainTab === "histori"
                ? "bg-white/25 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {historiBayarList.length}
          </span>
        </button>
      </div>

      {/* 3. KONTEN TAB: INPUT PEMBAYARAN */}
      {activeMainTab === "input" && (
        <InputPembayaranTab
          sheetTahap={sheetTahap}
          setSheetTahap={setSheetTahap}
          sheetTeam={sheetTeam}
          setSheetTeam={setSheetTeam}
          sheetTeamsList={sheetTeamsList}
          activeSheetTeamData={activeSheetTeamData}
          groupedByTahap={groupedByTahap}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          handleSetPresetDate={handleSetPresetDate}
          manualPotonganMap={manualPotonganMap}
          setManualPotonganMap={setManualPotonganMap}
          displayTotalBersih={displayTotalBersih}
          currentManualPotongan={currentManualPotongan}
          handleOpenPay={handleOpenPay}
        />
      )}

      {/* 4. KONTEN TAB: HISTORI PEMBAYARAN */}
      {activeMainTab === "histori" && (
        <HistoriPembayaranTab
          historiBayarList={historiBayarList}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getTahapanBadge={getTahapanBadge}
          onOpenSlipHistori={handleOpenSlipHistori}
          onOpenDetailHistori={handleOpenDetailHistori}
          onBatalHistori={handleBatalHistori}
        />
      )}

      {/* 5. MODAL FORM KONFIRMASI BAYAR */}
      <KonfirmasiBayarModal
        isOpen={isPayModalOpen}
        targetPayItems={targetPayItems}
        payForm={payForm}
        setPayForm={setPayForm}
        kasbonInfo={kasbonInfo}
        potonganKasbon={potonganKasbon}
        setPotonganKasbon={setPotonganKasbon}
        onSubmit={handleConfirmPay}
        onClose={() => setIsPayModalOpen(false)}
      />

      {/* 6. MODAL DETAIL RINCIAN HISTORI PEMBAYARAN */}
      <DetailHistoriModal
        isOpen={isHistoriDetailOpen}
        historiItem={historiDetailItem}
        onClose={() => setIsHistoriDetailOpen(false)}
        onCetakSlip={handleOpenSlipHistori}
        onBatalHistori={handleBatalHistori}
      />

      {/* 7. MODAL CETAK SLIP GAJI EMRA PRODUCTION */}
      <CetakSlipModal
        isOpen={isSlipKaryawanModalOpen}
        slipData={slipCustomData}
        startDate={startDate}
        endDate={endDate}
        onClose={() => {
          setIsSlipKaryawanModalOpen(false);
          setSlipCustomData(null);
        }}
      />
    </div>
  );
}
