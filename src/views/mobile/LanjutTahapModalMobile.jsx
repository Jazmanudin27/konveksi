import React, { useState, useMemo } from "react";
import {
  X,
  Scissors,
  Shirt,
  CheckCircle2,
  Sparkles,
  Warehouse,
  Search,
  ChevronDown,
  Check,
  Plus,
  User,
  AlertCircle,
  Boxes,
  Coins,
  CalendarDays,
} from "lucide-react";
import { api } from "../../services/api";

// Sub-komponen Input Format Rupiah Rata Kanan
function RupiahInput({
  label,
  value,
  onChange,
  placeholder = "0",
  required = false,
  disabled = false,
  badge = null,
}) {
  const displayValue = Number(value || 0).toLocaleString("id-ID");

  const handleChange = (e) => {
    if (disabled) return;
    const rawVal = e.target.value.replace(/\D/g, "");
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    onChange(num);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-extrabold text-slate-700">
          {label}
        </label>
        {badge}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400 select-none">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          readOnly={disabled}
          disabled={disabled}
          className={`w-full h-9 pl-9 pr-3 border rounded-xl font-mono font-black text-sm text-right focus:outline-none transition-colors ${
            disabled
              ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none"
              : "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          }`}
        />
      </div>
    </div>
  );
}

// Sub-komponen Select Dropdown dengan Pencarian (Searchable Select)
function SearchableSelectMobile({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Pilih petugas...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        (opt.nama || opt.label || "").toLowerCase().includes(q) ||
        (opt.bagian || "").toLowerCase().includes(q) ||
        (opt.kategori || "").toLowerCase().includes(q),
    );
  }, [options, search]);

  const selectedItem = options.find((opt) => (opt.nama || opt.value) === value);

  return (
    <div className="relative">
      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
        {label}
      </label>

      {/* Tombol Pemilih (Trigger) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors cursor-pointer text-left shadow-2xs"
      >
        <div className="flex items-center gap-2 truncate">
          <User className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="truncate">{value || placeholder}</span>
          {selectedItem?.bagian && (
            <span className="text-[9.5px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded shrink-0">
              {selectedItem.bagian}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu Pencarian */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-60">
            {/* Kotak Input Search */}
            <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama untuk mencari..."
                className="w-full bg-white h-7 px-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 font-medium"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Daftar Hasil Filter */}
            <div className="overflow-y-auto divide-y divide-slate-50 flex-1">
              {filteredOptions.map((opt) => {
                const optVal = opt.nama || opt.value;
                const isSelected = value === optVal;
                return (
                  <button
                    type="button"
                    key={opt.id || opt.nik || optVal}
                    onClick={() => {
                      onChange(optVal);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50/80 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold">{optVal}</span>
                      {(opt.bagian || opt.kategori) && (
                        <span className="text-[10px] text-slate-400">
                          {opt.kategori ? `${opt.kategori} • ` : ""}
                          {opt.bagian || ""}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    )}
                  </button>
                );
              })}

              {/* Opsi Gunakan Nama Custom jika tidak ada di list */}
              {search.trim() &&
                !filteredOptions.some(
                  (o) =>
                    (o.nama || o.value || "").toLowerCase() ===
                    search.toLowerCase(),
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-amber-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gunakan nama: "{search.trim()}"</span>
                  </button>
                )}

              {filteredOptions.length === 0 && !search.trim() && (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Tidak ada data karyawan
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function LanjutTahapModalMobile({
  isOpen,
  item,
  employees = [],
  products = [],
  currentUser = null,
  onClose,
  onSuccess,
}) {
  if (!isOpen || !item) return null;

  const currentStatus = item.status || item.statusTahapan || "Menunggu Cutting";
  const qty = Number(item.qty ?? item.targetQty ?? 0);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Ekstrak alokasi bahan baku SPK
  const bahanList = useMemo(() => {
    if (!item.kebutuhanBahan) return [];
    if (Array.isArray(item.kebutuhanBahan)) return item.kebutuhanBahan;
    if (typeof item.kebutuhanBahan === 'string') {
      try {
        return JSON.parse(item.kebutuhanBahan);
      } catch (_) {
        return [];
      }
    }
    return [];
  }, [item.kebutuhanBahan]);

  // Tema Visual per Tahap (Cutting Biru, Jahit Ungu, QC Emerald, Finishing Amber, Gudang Rose)
  const isCuttingStage = currentStatus === "Menunggu Cutting" || currentStatus === "Draft";
  const isJahitStage = currentStatus === "Proses Cutting";
  const isQcStage = currentStatus === "Proses Jahit";
  const isFinishingStage = currentStatus === "Proses QC";
  const isGudangStage = currentStatus === "Proses Finishing";

  const headerGradient = isCuttingStage
    ? "from-[#0f172a] via-[#1e3a8a] to-[#2563eb]"
    : isJahitStage
    ? "from-[#0f172a] via-[#4c1d95] to-[#7c3aed]"
    : isQcStage
    ? "from-[#064e3b] via-[#046a52] to-[#0f766e]"
    : isFinishingStage
    ? "from-[#78350f] via-[#b45309] to-[#d97706]"
    : "from-[#881337] via-[#be123c] to-[#e11d48]";

  const submitButtonGradient = isCuttingStage
    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
    : isJahitStage
    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25"
    : isQcStage
    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
    : isFinishingStage
    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25"
    : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/25";

  // Match info produk untuk default ongkos potong
  const matchedProduct = useMemo(() => {
    return products.find((p) => p.sku === item.sku || p.namaProduk === item.namaProduk) || null;
  }, [products, item.sku, item.namaProduk]);

  // Karyawan per bagian (fallback ke semua karyawan jika filter kosong)
  const cuttingEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return b.includes("cut") || b.includes("pola");
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  const jahitEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return (
        b.includes("jahit") ||
        b.includes("sew") ||
        (e.kategori || "").toLowerCase() === "makloon"
      );
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  const qcEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return (
        b.includes("qc") ||
        b.includes("quality") ||
        b.includes("control") ||
        b.includes("periksa")
      );
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  const finishingEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return b.includes("finish") || b.includes("pack") || b.includes("lipat");
    });
    if (list.length > 0) return list;
    return [
      { id: 1, nama: "Tim Finishing 1 (Uap & Lipat)", bagian: "Finishing" },
      {
        id: 2,
        nama: "Tim Finishing 2 (Hangtag & Plastik OPP)",
        bagian: "Finishing",
      },
      { id: 3, nama: "Gudang Packing Akhir", bagian: "Packing" },
    ];
  }, [employees]);

  // State Form
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Data Cutting (Otomatis Master Produk & Petugas Sesuai User Login)
  const prodTarif = Number(matchedProduct?.hargaPotong ?? matchedProduct?.harga_potong ?? 0);
  const defaultTarifPotong = prodTarif > 0 ? prodTarif : Number(item.tarifCutting || 700);
  const loggedInUser = currentUser?.nama || (currentUser?.username ? `Admin Cutting (${currentUser.username})` : "Admin Cutting");

  const [tglSerahCutting, setTglSerahCutting] = useState(todayStr);
  const [timCutting] = useState(loggedInUser);
  const [tarifCutting] = useState(defaultTarifPotong);
  const [catatanCutting, setCatatanCutting] = useState(
    item.catatanCutting || "Pola dan potongan presisi sesuai SOP",
  );

  // 2. Data Jahit
  const [tglSerahJahit, setTglSerahJahit] = useState(todayStr);
  const [timJahit, setTimJahit] = useState(
    jahitEmployees[0]?.nama || item.timJahit || "Tim Jahit 1",
  );
  const [tarifJahit, setTarifJahit] = useState(item.tarifJahit || 3500);
  const [catatanJahit, setCatatanJahit] = useState(item.catatanJahit || "");

  // 3. Data QC
  const [tglSerahQc, setTglSerahQc] = useState(todayStr);
  const [timQc, setTimQc] = useState(
    qcEmployees[0]?.nama || item.timQc || "Tim QC 1",
  );
  const [tarifQc, setTarifQc] = useState(item.tarifQc || 500);
  const [catatanQc, setCatatanQc] = useState(item.catatanQc || "");

  // 4. Data Finishing
  const [qtyPassQc, setQtyPassQc] = useState(qty);
  const [qtyRejectQc, setQtyRejectQc] = useState(0);
  const [catatanRejectQc, setCatatanRejectQc] = useState("");
  const [tglSerahFinishing, setTglSerahFinishing] = useState(todayStr);
  const [timFinishing, setTimFinishing] = useState(
    finishingEmployees[0]?.nama || item.timFinishing || "Tim Finishing 1",
  );
  const [tarifFinishing, setTarifFinishing] = useState(
    item.tarifFinishing || 1000,
  );
  const [catatanFinishing, setCatatanFinishing] = useState(
    item.catatanFinishing || "",
  );

  // 5. Data Gudang Jadi
  const [lokasiRak, setLokasiRak] = useState("RAK-GUDANG-A1");
  const [petugasGudang, setPetugasGudang] = useState("Admin Gudang Jadi");
  const [catatanGudang, setCatatanGudang] = useState("");

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (currentStatus === "Menunggu Cutting" || currentStatus === "Draft") {
        await api.serahCutting({
          ids: [item.id],
          tglSerahCutting,
          timCutting,
          tarifCutting: Number(tarifCutting),
          catatanCutting,
        });
      } else if (currentStatus === "Proses Cutting") {
        await api.serahJahit({
          ids: [item.id],
          tglSerahJahit,
          timJahit,
          tarifJahit: Number(tarifJahit),
          catatanJahit,
        });
      } else if (currentStatus === "Proses Jahit") {
        await api.serahQc({
          ids: [item.id],
          tglSerahQc,
          timQc,
          tarifQc: Number(tarifQc),
          catatanQc,
        });
      } else if (currentStatus === "Proses QC") {
        await api.serahFinishing({
          ids: [item.id],
          qtyPassQc: Number(qtyPassQc),
          qtyRejectQc: Number(qtyRejectQc),
          catatanRejectQc,
          tglSerahFinishing,
          timFinishing,
          tarifFinishing: Number(tarifFinishing),
          catatanFinishing,
        });
      } else if (currentStatus === "Proses Finishing") {
        await api.selesaiFinishing({
          id: item.id,
          noAntrian: item.noAntrian || `ANT-${item.id}`,
          sku: item.sku,
          qty: Number(qtyPassQc || qty),
          lokasiRak,
          petugas: petugasGudang,
          catatan: catatanGudang,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Gagal memproses tahapan produksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal Melengkung dengan Warna Tema Tahapan */}
        <div className={`px-5 py-4 bg-gradient-to-r ${headerGradient} text-white flex items-center justify-between shrink-0 shadow-sm`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-xs shrink-0">
              {currentStatus === "Menunggu Cutting" && (
                <Scissors className="w-5 h-5 stroke-[2.5]" />
              )}
              {currentStatus === "Proses Cutting" && (
                <Shirt className="w-5 h-5 stroke-[2.5]" />
              )}
              {currentStatus === "Proses Jahit" && (
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              )}
              {currentStatus === "Proses QC" && (
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              )}
              {currentStatus === "Proses Finishing" && (
                <Warehouse className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-wide text-white">
                  {currentStatus === "Menunggu Cutting" &&
                    "Mulai Proses Cutting (Pola Kain)"}
                  {currentStatus === "Proses Cutting" &&
                    "Selesaikan Cutting & Serah ke Penjahit"}
                  {currentStatus === "Proses Jahit" &&
                    "Serah ke Pemeriksaan QC (Tahap 4)"}
                  {currentStatus === "Proses QC" &&
                    "Hasil QC & Serah Finishing (Tahap 5)"}
                  {currentStatus === "Proses Finishing" &&
                    "Selesai & Masuk Gudang Jadi (Tahap 6)"}
                </h3>
              </div>
              <p className="text-[10.5px] text-white/80 font-mono mt-0.5">
                {item.noAntrian || `ANT-${item.id}`} • Target: <span className="font-bold text-white">{qty} Pcs</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Singkat Kartu Order & Alokasi Bahan Baku SPK */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono font-black text-[10.5px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                {item.sku}
              </span>
              <span className="font-black text-slate-900 truncate">{item.namaProduk}</span>
              {(item.varian || item.ukuran) && (
                <span className="text-[10px] text-slate-500 shrink-0">
                  ({item.varian || '-'}/{item.ukuran || '-'})
                </span>
              )}
            </div>
            <div className="font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs shrink-0">
              {qty} Pcs
            </div>
          </div>

          {/* Rincian Resep Bahan Baku jika ada */}
          {bahanList.length > 0 && (
            <div className="pt-1 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase flex items-center gap-1 shrink-0">
                <Boxes className="w-3 h-3 text-amber-600" />
                <span>Bahan SPK:</span>
              </span>
              {bahanList.map((b, bIdx) => {
                const total = b.totalKebutuhan || Number(((Number(b.qtyPerPcs) || 0) * qty).toFixed(2));
                return (
                  <span
                    key={bIdx}
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold whitespace-nowrap shrink-0"
                  >
                    <span>{b.namaBahan}:</span>
                    <b className="text-amber-950 font-black">{total} {b.satuan}</b>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Body Form Bertahap */}
        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-3.5 flex-1"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. TAHAP CUTTING */}
          {(currentStatus === "Menunggu Cutting" ||
            currentStatus === "Draft") && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tgl Serah Cutting:
                  </label>
                  <input
                    type="date"
                    value={tglSerahCutting}
                    onChange={(e) => setTglSerahCutting(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Input Format Rupiah Read-Only / Otomatis Master Produk */}
                <RupiahInput
                  label="Tarif Potong / Pcs:"
                  value={tarifCutting}
                  disabled={true}
                  required
                />
              </div>

              {/* Box Total Estimasi Biaya */}
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-800">
                  Total Biaya Cutting:
                </span>
                <span className="font-mono font-black text-sm text-blue-950">
                  Rp {(qty * Number(tarifCutting)).toLocaleString("id-ID")}
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 2. TAHAP JAHIT */}
          {currentStatus === "Proses Cutting" && (
            <>
              {/* Searchable Select Penjahit */}
              <SearchableSelectMobile
                label="Pilih Penjahit / Tim Jahit:"
                value={timJahit}
                onChange={setTimJahit}
                options={jahitEmployees}
                placeholder="Pilih atau cari penjahit..."
              />

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

                {/* Input Format Rupiah Rata Kanan */}
                <RupiahInput
                  label="Tarif Jahit / Pcs:"
                  value={tarifJahit}
                  onChange={setTarifJahit}
                  required
                />
              </div>

              {/* Box Total Estimasi Biaya Jahit */}
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-800">
                  Total Biaya Jahit:
                </span>
                <span className="font-mono font-black text-sm text-purple-950">
                  Rp {(qty * Number(tarifJahit)).toLocaleString("id-ID")}
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
          {currentStatus === "Proses Jahit" && (
            <>
              {/* Searchable Select Petugas QC */}
              <SearchableSelectMobile
                label="Pilih Petugas Pemeriksa QC:"
                value={timQc}
                onChange={setTimQc}
                options={qcEmployees}
                placeholder="Pilih atau cari petugas QC..."
              />

              {/* Input Tarif Borongan QC */}
              <RupiahInput
                label="Tarif Upah QC (per Pcs):"
                value={tarifQc}
                onChange={setTarifQc}
                placeholder="500"
              />

              <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-900">
                  Total Estimasi Upah QC ({qty} Pcs):
                </span>
                <span className="text-xs font-black font-mono text-indigo-700">
                  Rp {(qty * Number(tarifQc || 0)).toLocaleString("id-ID")}
                </span>
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
          {currentStatus === "Proses QC" && (
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
                    className="w-full h-9 px-3 bg-emerald-50 border border-emerald-300 rounded-xl font-black text-emerald-950 text-xs text-right focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                    className="w-full h-9 px-3 bg-rose-50 border border-rose-300 rounded-xl font-black text-rose-950 text-xs text-right focus:bg-white focus:border-rose-600 focus:outline-none"
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

              {/* Searchable Select Finishing */}
              <SearchableSelectMobile
                label="Pilih Tim Finishing & Packing:"
                value={timFinishing}
                onChange={setTimFinishing}
                options={finishingEmployees}
                placeholder="Pilih atau cari tim finishing..."
              />

              {/* Input Tarif Borongan Finishing */}
              <RupiahInput
                label="Tarif Upah Finishing (per Pcs):"
                value={tarifFinishing}
                onChange={setTarifFinishing}
                placeholder="1.000"
              />

              <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-900">
                  Total Estimasi Upah Finishing ({qtyPassQc || qty} Pcs):
                </span>
                <span className="text-xs font-black font-mono text-teal-700">
                  Rp{" "}
                  {(
                    (qtyPassQc || qty) * Number(tarifFinishing || 0)
                  ).toLocaleString("id-ID")}
                </span>
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
          {currentStatus === "Proses Finishing" && (
            <>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-emerald-800">
                  Siap Masuk Stok Gudang Jadi:
                </span>
                <span className="font-mono font-black text-base text-emerald-950">
                  {qtyPassQc || qty} Pcs
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
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold transition-all cursor-pointer shadow-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-xl ${submitButtonGradient} active:scale-95 text-white font-extrabold shadow-md cursor-pointer transition-all flex items-center gap-1.5`}
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  {isCuttingStage && <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />}
                  {isJahitStage && <Shirt className="w-3.5 h-3.5 stroke-[2.5]" />}
                  {isQcStage && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                  {isFinishingStage && <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />}
                  {isGudangStage && <Warehouse className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>
                    {currentStatus === "Menunggu Cutting" &&
                      "Mulai"}
                    {currentStatus === "Proses Cutting" &&
                      "Serahkan ke Penjahit"}
                    {currentStatus === "Proses Jahit" && "Mulai QC"}
                    {currentStatus === "Proses QC" && "Serah Finishing"}
                    {currentStatus === "Proses Finishing" && "Simpan ke Gudang"}
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
