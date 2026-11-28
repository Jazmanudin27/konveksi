import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ListOrdered,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  X,
  Check,
  ChevronDown,
  RefreshCw,
  FolderOpen,
  Shirt,
  Tag,
  Hash,
  ArrowLeft,
  ReceiptText,
  Boxes,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Flame,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Scissors,
  History,
  UserCheck,
  Coins,
  CheckSquare,
  Square,
  CheckCheck,
  ShieldCheck,
  PackageCheck,
  RotateCcw,
  Undo2,
  Warehouse,
  Settings,
  Edit2,
  Share2,
  Printer,
  QrCode,
  Camera,
} from "lucide-react";
import { api } from "../../services/api";
import { Swal } from "../../utils/swal";
import {
  ANTREAN_PRIORITAS_OPTIONS,
  ANTREAN_STATUS_OPTIONS,
} from "../../constants/uiConstants";

// Sub-komponen Modular
import SewingMachineIcon from "./antrean/SewingMachineIcon";
import ModalShowAntrean from "./antrean/ModalShowAntrean";
import ModalSerahCutting from "./antrean/ModalSerahCutting";
import ModalSerahJahit from "./antrean/ModalSerahJahit";
import ModalSerahQC from "./antrean/ModalSerahQC";
import ModalSerahFinishing from "./antrean/ModalSerahFinishing";
import ModalSelesaiGudangJadi from "./antrean/ModalSelesaiGudangJadi";
import ModalHistoriCutting from "./antrean/ModalHistoriCutting";
import CetakSpkModal from "./antrean/CetakSpkModal";
import ScannerModal from "../../components/common/ScannerModal";
import ShareTrackingModal from "../../components/common/ShareTrackingModal";

// Sub-komponen Searchable Select Master Bahan Baku Desktop
function SearchableBahanSelectDesktop({
  masterBahan = [],
  selectedKode = "",
  selectedNama = "",
  disabledKodes = [],
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 340,
    openUp: false,
  });

  const updateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = 280;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const left = Math.max(10, Math.min(rect.left, window.innerWidth - 350));
    const width = Math.max(340, rect.width);

    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      openUp,
    });
  };

  const selectedBahan = useMemo(() => {
    return masterBahan.find(
      (m) =>
        (selectedKode && m.kodeBahan === selectedKode) ||
        (selectedNama &&
          (m.namaBahan || "").toLowerCase() === selectedNama.toLowerCase()),
    );
  }, [masterBahan, selectedKode, selectedNama]);

  const filteredBahan = useMemo(() => {
    if (!query.trim()) return masterBahan;
    const q = query.toLowerCase();
    return masterBahan.filter(
      (m) =>
        (m.namaBahan || "").toLowerCase().includes(q) ||
        (m.kodeBahan || "").toLowerCase().includes(q) ||
        (m.satuan || "").toLowerCase().includes(q) ||
        (m.supplier || "").toLowerCase().includes(q),
    );
  }, [masterBahan, query]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      updateCoords();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updateCoords();
            setIsOpen(true);
            setQuery("");
          } else {
            setIsOpen(false);
          }
        }}
        className={`w-full h-8 px-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
          selectedBahan
            ? "bg-sky-50/70 border-sky-200 hover:bg-sky-100/60"
            : "bg-white border-slate-200 hover:border-[#0284c7]"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Search className="w-3 h-3 text-[#0284c7] shrink-0" />
          {selectedBahan ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono font-bold text-[9.5px] text-sky-800 bg-white px-1 py-0.2 rounded border border-sky-200 shrink-0">
                {selectedBahan.kodeBahan}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {selectedBahan.namaBahan}
              </span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                (Stok: {selectedBahan.stok ?? 0} {selectedBahan.satuan})
              </span>
              {Number(selectedBahan.harga || 0) > 0 && (
                <span className="text-[10px] text-emerald-700 font-mono font-bold shrink-0">
                  • Rp {Number(selectedBahan.harga).toLocaleString("id-ID")}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium truncate">
              {selectedNama || "-- Cari & Pilih Bahan dari Master --"}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#0284c7]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: coords.openUp ? undefined : `${coords.top}px`,
            bottom: coords.openUp
              ? `${window.innerHeight - coords.top}px`
              : undefined,
            left: `${coords.left}px`,
            width: `${Math.min(coords.width, window.innerWidth - 20)}px`,
            zIndex: 99999,
          }}
          className="bg-white rounded-xl shadow-2xl border border-slate-200 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari bahan (Kain, Kancing, Benang...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-7 pr-6 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0284c7] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1.5 p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List Bahan Hasil Pencarian */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50">
            {filteredBahan.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Bahan baku tidak ditemukan
              </div>
            ) : (
              filteredBahan.map((m) => {
                const isSelected =
                  selectedBahan &&
                  (selectedBahan.kodeBahan === m.kodeBahan ||
                    selectedBahan.namaBahan === m.namaBahan);
                const isAlreadySelected =
                  !isSelected &&
                  (disabledKodes.includes(m.kodeBahan) ||
                    disabledKodes.some(
                      (dk) =>
                        String(dk).toLowerCase() ===
                        (m.namaBahan || "").toLowerCase(),
                    ));
                const stokVal = Number(m.stok ?? 0);
                return (
                  <button
                    key={m.id || m.kodeBahan}
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => {
                      if (isAlreadySelected) return;
                      onSelect(m);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 text-left flex items-center justify-between gap-2 transition-colors ${
                      isAlreadySelected
                        ? "bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "bg-sky-100/80 text-sky-950 font-bold cursor-pointer"
                          : "hover:bg-sky-50 text-slate-800 cursor-pointer"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`font-extrabold text-xs truncate ${isAlreadySelected ? "text-slate-400 line-through" : ""}`}>
                          {m.namaBahan}
                        </span>
                        {isAlreadySelected && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-300 shrink-0">
                            Sudah Ada di SPK
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="bg-white px-1 py-0.2 rounded border border-slate-200 text-slate-700">
                          {m.kodeBahan}
                        </span>
                        <span>•</span>
                        <span
                          className={
                            isAlreadySelected
                              ? "text-slate-400"
                              : stokVal <= 10
                                ? "text-rose-600 font-bold"
                                : "text-emerald-700 font-semibold"
                          }
                        >
                          Stok: {stokVal} {m.satuan}
                        </span>
                        {m.harga ? (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">
                              Rp {Number(m.harga).toLocaleString("id-ID")}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#0284c7] shrink-0" />
                    ) : isAlreadySelected ? (
                      <span className="text-[9.5px] font-bold text-amber-600 shrink-0">
                        Dipakai
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-1 text-[10px] text-slate-500">
            <span>Ditemukan {filteredBahan.length} bahan</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Antrean({
  antreanList = [],
  setAntreanList,
  products = [],
  employees = [],
  jasa = [],
  bahan = [],
  timFinishingList: propTimFinishingList = [],
  userRole = "superadmin",
  onNavigateToMutasiGudang,
}) {
  const getDefaultTabForRole = (role) => {
    switch (role) {
      case "cutting":
        return "Proses Cutting";
      case "jahit":
        return "Proses Jahit";
      case "qc":
        return "Proses QC";
      case "finishing":
        return "Proses Finishing";
      default:
        return "Semua Antrean";
    }
  };

  const isGudang = userRole === "gudang";
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSumber, setFilterSumber] = useState("");
  const [filterPrioritas, setFilterPrioritas] = useState("");
  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTabForRole(userRole),
  );
  const [shareTrackingItem, setShareTrackingItem] = useState(null);
  const [selectedCetakSpk, setSelectedCetakSpk] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (userRole && userRole !== "superadmin") {
      setActiveTab(getDefaultTabForRole(userRole));
    }
  }, [userRole]);

  // State Manajemen List Tim Finishing
  const [timFinishingList, setTimFinishingList] =
    useState(propTimFinishingList);

  useEffect(() => {
    if (propTimFinishingList && propTimFinishingList.length > 0) {
      setTimFinishingList(propTimFinishingList);
    }
  }, [propTimFinishingList]);

  // State Manajemen List Sumber Permintaan (Tersinkron ke Database MySQL)
  const [sumberOptions, setSumberOptions] = useState(() => {
    try {
      const cached = localStorage.getItem("konveksi_sumber_permintaan");
      return cached
        ? JSON.parse(cached)
        : [
            "PO Pelanggan",
            "Marketplace / Toko",
            "Stok Gudang",
            "Rencana Internal",
          ];
    } catch (_) {
      return [
        "PO Pelanggan",
        "Marketplace / Toko",
        "Stok Gudang",
        "Rencana Internal",
      ];
    }
  });

  // Ambil list sumber permintaan real dari database SQLite & Sinkronisasi Antrean Real-time
  useEffect(() => {
    // Sinkronisasi data antrean langsung dari database saat komponen desktop dimuat
    api
      .getAntrean()
      .then((list) => {
        if (Array.isArray(list)) {
          setAntreanList(list);
          try {
            localStorage.setItem("konveksi_antrean_list", JSON.stringify(list));
          } catch (_) {}
        }
      })
      .catch(() => {});

    api
      .getSumberPermintaan()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setSumberOptions(list);
          try {
            localStorage.setItem(
              "konveksi_sumber_permintaan",
              JSON.stringify(list),
            );
          } catch (_) {}
        }
      })
      .catch(() => {});

    api
      .getTimFinishing()
      .then((list) => {
        if (Array.isArray(list)) {
          setTimFinishingList(list);
        }
      })
      .catch(() => {});
  }, []);

  const [isSumberModalOpen, setIsSumberModalOpen] = useState(false);
  const [editingSumberIndex, setEditingSumberIndex] = useState(null);
  const [sumberInputText, setSumberInputText] = useState("");

  const saveSumberOptions = (newList) => {
    setSumberOptions(newList);
    try {
      localStorage.setItem(
        "konveksi_sumber_permintaan",
        JSON.stringify(newList),
      );
    } catch (_) {}
  };

  const handleAddOrEditSumber = (e) => {
    e.preventDefault();
    const val = sumberInputText.trim();
    if (!val) return;

    if (editingSumberIndex !== null) {
      const updated = [...sumberOptions];
      const oldVal = updated[editingSumberIndex];
      updated[editingSumberIndex] = val;
      saveSumberOptions(updated);
      api
        .deleteSumberPermintaan(oldVal)
        .then(() => api.addSumberPermintaan(val))
        .catch(() => {});
      if (formData.sumberPermintaan === oldVal) {
        setFormData((prev) => ({ ...prev, sumberPermintaan: val }));
      }
      setEditingSumberIndex(null);
    } else {
      if (sumberOptions.includes(val)) {
        Swal.fire({
          icon: "warning",
          title: "Sudah Ada",
          text: `Sumber "${val}" sudah terdaftar.`,
        });
        return;
      }
      saveSumberOptions([...sumberOptions, val]);
      api.addSumberPermintaan(val).catch(() => {});
      setFormData((prev) => ({ ...prev, sumberPermintaan: val }));
    }
    setSumberInputText("");
  };

  const handleDeleteSumber = (idxToDelete) => {
    const target = sumberOptions[idxToDelete];
    if (sumberOptions.length <= 1) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Bisa Dihapus",
        text: "Minimal harus ada 1 sumber permintaan.",
      });
      return;
    }
    const updated = sumberOptions.filter((_, i) => i !== idxToDelete);
    saveSumberOptions(updated);
    api.deleteSumberPermintaan(target).catch(() => {});
    if (formData.sumberPermintaan === target) {
      setFormData((prev) => ({ ...prev, sumberPermintaan: updated[0] }));
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [selectedAntreanShow, setSelectedAntreanShow] = useState(null); // Fullscreen Show View

  // State Pilihan Checkbox (Multi-select antrean yang mau ke tahap Cutting/Jahit)
  const [selectedIds, setSelectedIds] = useState([]);

  // State Modal Penyerahan ke Tim Cutting
  const [isCuttingModalOpen, setIsCuttingModalOpen] = useState(false);
  const [cuttingTargetItems, setCuttingTargetItems] = useState([]);
  const [isCuttingDropdownOpen, setIsCuttingDropdownOpen] = useState(false);
  const cuttingDropdownRef = useRef(null);

  // State Modal Histori Penyerahan Cutting
  const [isCuttingHistoryModalOpen, setIsCuttingHistoryModalOpen] =
    useState(false);

  // Form Penyerahan ke Tim Cutting
  const initialCuttingForm = {
    tglSerahCutting: new Date().toISOString().slice(0, 10),
    timCutting: "",
    customTimCutting: "",
    tarifCutting: 1500, // Default 1500 per instruksi user
    catatanCutting: "",
  };
  const [cuttingForm, setCuttingForm] = useState(initialCuttingForm);

  // State Modal Penyerahan ke Tim Jahit (Tahap 3 SOP)
  const [isJahitModalOpen, setIsJahitModalOpen] = useState(false);
  const [jahitTargetItems, setJahitTargetItems] = useState([]);
  const initialJahitForm = {
    tglSerahJahit: new Date().toISOString().slice(0, 10),
    timJahit: "",
    customTimJahit: "",
    tarifJahit: 3500, // Default tarif jahit
    catatanJahit: "",
  };
  const [jahitForm, setJahitForm] = useState(initialJahitForm);

  // State Modal Penyerahan ke Tim QC (Tahap 4 SOP)
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [qcTargetItems, setQcTargetItems] = useState([]);
  const initialQcForm = {
    tglSerahQc: new Date().toISOString().slice(0, 10),
    timQc: "",
    catatanQc: "",
    statusQc: "Pemeriksaan",
  };
  const [qcForm, setQcForm] = useState(initialQcForm);

  // State Modal Penyerahan ke Tim Finishing (Tahap 5 SOP - Pasca QC)
  const [isFinishingModalOpen, setIsFinishingModalOpen] = useState(false);
  const [finishingTargetItems, setFinishingTargetItems] = useState([]);
  const initialFinishingForm = {
    qtyPassQc: 0,
    qtyRejectQc: 0,
    catatanRejectQc: "",
    tglSerahFinishing: new Date().toISOString().slice(0, 10),
    timFinishing: "",
    catatanFinishing: "",
  };
  const [finishingForm, setFinishingForm] = useState(initialFinishingForm);

  // State Modal Selesai Finishing & Masuk Gudang Jadi (Step 6 SOP - Final)
  const [isGudangJadiModalOpen, setIsGudangJadiModalOpen] = useState(false);
  const [gudangJadiTargetItem, setGudangJadiTargetItem] = useState(null);

  // Combobox Product Dropdown State in Modal
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false);
  const [productComboboxSearch, setProductComboboxSearch] = useState("");
  const comboboxRef = useRef(null);

  // Close combobox & dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsProductComboboxOpen(false);
      }
      if (
        cuttingDropdownRef.current &&
        !cuttingDropdownRef.current.contains(event.target)
      ) {
        setIsCuttingDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // List Tim Cutting dari Master Karyawan Database
  const cuttingEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return b.includes("cut") || b.includes("pola");
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  // List Tim Jahit: Diambil langsung dari Master Karyawan Database (bagian Penjahit / Jahit)
  const jahitEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return b.includes("jahit") || b.includes("penjahit") || b.includes("sew");
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  // List Tim QC dari Master Karyawan Database
  const qcEmployees = useMemo(() => {
    const list = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return b.includes("qc") || b.includes("quality") || b.includes("control");
    });
    return list.length > 0 ? list : employees;
  }, [employees]);

  // List Tim Finishing: Khusus dari Master Tim Finishing Database
  const finishingEmployees = useMemo(() => {
    if (timFinishingList.length > 0) {
      return timFinishingList.map((f) => ({
        id: f.id,
        nama: f.namaTim,
        bagian: "Finishing & Packing",
        kapasitas: f.kapasitasHarian,
      }));
    }
    const fromEmp = employees.filter((e) => {
      const b = (e.bagian || "").toLowerCase();
      return b.includes("finish") || b.includes("pack");
    });
    return fromEmp;
  }, [timFinishingList, employees]);

  // Default Tarif Cutting dari Master Jasa
  const defaultTarifCutting = useMemo(() => {
    const item = (jasa || []).find((j) => {
      const k = (j.kodeJasa || "").toLowerCase();
      const n = (j.namaJasa || "").toLowerCase();
      return k.includes("cut") || n.includes("potong") || n.includes("cutting");
    });
    return item?.harga ? Number(item.harga) : 1500;
  }, [jasa]);

  // Default Tarif Jahit dari Master Jasa
  const defaultTarifJahit = useMemo(() => {
    const item = (jasa || []).find((j) => {
      const k = (j.kodeJasa || "").toLowerCase();
      const n = (j.namaJasa || "").toLowerCase();
      return k.includes("jahit") || n.includes("jahit") || n.includes("sew");
    });
    return item?.harga ? Number(item.harga) : 3500;
  }, [jasa]);

  // Form Fields State
  const initialForm = {
    noAntrian: "",
    tglMasuk: new Date().toISOString().slice(0, 10),
    sumberPermintaan: "PO Pelanggan",
    noReff: "",
    sku: "",
    qty: 50,
    prioritas: "Normal",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    status: "Menunggu Cutting",
    catatan: "",
    kebutuhanBahan: [],
  };
  const [formData, setFormData] = useState(initialForm);

  // Helper Kelola Kebutuhan Bahan & Aksesoris (Kancing, Resleting, dll)
  const handleAddKebutuhanBahan = (
    defaultName = "",
    defaultSatuan = "Pcs",
    defaultHarga = 0,
    defaultKode = "",
  ) => {
    if (!formData.sku) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Produk Dahulu",
        text: "Silakan pilih produk (SKU) terlebih dahulu sebelum menambah kebutuhan bahan baku.",
        confirmButtonColor: "#059669",
      });
      return;
    }

    // Cegah menambah baris jika masih ada baris bahan yang belum dipilih
    const hasEmptyRow = (formData.kebutuhanBahan || []).some(
      (b) => !b.kodeBahan && !b.namaBahan,
    );
    if (hasEmptyRow) {
      Swal.fire({
        icon: "info",
        title: "Pilih Bahan Terlebih Dahulu",
        text: "Silakan tentukan bahan pada baris yang masih kosong sebelum menambah baris baru.",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    let matchedHarga = defaultHarga;
    let matchedSatuan = defaultSatuan;
    let matchedKode = defaultKode;
    let matchedStok = 0;
    if (defaultName || defaultKode) {
      const match = bahan.find(
        (b) =>
          (defaultKode && b.kodeBahan === defaultKode) ||
          (b.namaBahan || "").toLowerCase() ===
            (defaultName || "").toLowerCase() ||
          (b.kodeBahan || "").toLowerCase() ===
            (defaultName || "").toLowerCase(),
      );
      if (match) {
        matchedHarga = Number(match.harga || 0);
        matchedSatuan = match.satuan || defaultSatuan;
        matchedKode = match.kodeBahan || "";
        matchedStok = Number(match.stok ?? 0);
      }
    }

    // Jika defaultName/defaultKode sudah ada di list, jangan tambahkan duplikat
    if (matchedKode || defaultName) {
      const alreadyExists = (formData.kebutuhanBahan || []).some(
        (b) =>
          (matchedKode && b.kodeBahan === matchedKode) ||
          (defaultName &&
            (b.namaBahan || "").toLowerCase() === defaultName.toLowerCase()),
      );
      if (alreadyExists) {
        Swal.fire({
          icon: "warning",
          title: "Bahan Baku Sudah Ada",
          text: `Bahan "${defaultName || matchedKode}" sudah ada di dalam SPK ini. Tidak boleh ada bahan baku yang sama.`,
          confirmButtonColor: "#0284c7",
        });
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      kebutuhanBahan: [
        ...(prev.kebutuhanBahan || []),
        {
          id: Date.now() + Math.random(),
          kodeBahan: matchedKode,
          namaBahan: defaultName,
          qty: 1,
          satuan: matchedSatuan,
          hargaSatuan: matchedHarga,
          stokSaatIni: matchedStok,
          catatan: "",
        },
      ],
    }));
  };

  const handleSelectMasterBahan = (index, selectedBahan) => {
    // Validasi ketat: Tidak boleh ada bahan baku yang sama dalam satu produk / SPK
    const isDuplicate = (formData.kebutuhanBahan || []).some((item, i) => {
      if (i === index) return false;
      return (
        (selectedBahan.kodeBahan && item.kodeBahan === selectedBahan.kodeBahan) ||
        (selectedBahan.namaBahan &&
          (item.namaBahan || "").toLowerCase() ===
            selectedBahan.namaBahan.toLowerCase())
      );
    });

    if (isDuplicate) {
      Swal.fire({
        icon: "warning",
        title: "Bahan Baku Sudah Dipilih!",
        text: `Bahan "${selectedBahan.namaBahan}" sudah digunakan di baris lain. Tidak boleh ada bahan baku yang sama dalam satu produk/SPK. Silakan ubah Qty pada baris yang sudah ada.`,
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    setFormData((prev) => {
      const list = [...(prev.kebutuhanBahan || [])];
      list[index] = {
        ...list[index],
        kodeBahan: selectedBahan.kodeBahan || "",
        namaBahan: selectedBahan.namaBahan || "",
        satuan: selectedBahan.satuan || "Pcs",
        hargaSatuan: Number(selectedBahan.harga || 0),
        stokSaatIni: Number(selectedBahan.stok ?? 0),
      };
      return { ...prev, kebutuhanBahan: list };
    });
  };

  const handleUpdateKebutuhanBahan = (index, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.kebutuhanBahan || [])];
      let valToSet = value;
      if (field === "hargaSatuan") {
        if (typeof value === "string") {
          const raw = value.replace(/\D/g, "");
          valToSet = raw ? Number(raw) : 0;
        } else {
          valToSet = Number(value) || 0;
        }
      }
      const cur = { ...list[index], [field]: valToSet };
      if (field === "namaBahan") {
        const match = bahan.find(
          (b) =>
            (b.namaBahan || "").toLowerCase() === String(value).toLowerCase() ||
            (b.kodeBahan || "").toLowerCase() === String(value).toLowerCase(),
        );
        if (match) {
          if (!cur.hargaSatuan || Number(cur.hargaSatuan) === 0) {
            cur.hargaSatuan = Number(match.harga || 0);
          }
          if (!cur.satuan) cur.satuan = match.satuan || "Pcs";
        }
      }
      list[index] = cur;
      return { ...prev, kebutuhanBahan: list };
    });
  };

  const handleDeleteKebutuhanBahan = (index) => {
    setFormData((prev) => {
      const list = [...(prev.kebutuhanBahan || [])];
      list.splice(index, 1);
      return { ...prev, kebutuhanBahan: list };
    });
  };

  // Helper get product name safely
  const getProdName = (p) => p?.nama || p?.namaProduk || p?.nama_produk || "-";
  const getProdBahan = (p) => p?.skuBahan || p?.sku_bahan || "-";

  // Selected product detail preview
  const selectedProduct = useMemo(() => {
    if (!formData.sku) return null;
    return products.find((p) => p.sku === formData.sku) || null;
  }, [formData.sku, products]);

  // Kalkulasi HPP Otomatis (Biaya Bahan + Upah Borongan)
  const hppCalculation = useMemo(() => {
    const qtyTarget = Math.max(1, Number(formData.qty) || 1);

    // 1. Biaya Bahan & Aksesoris per Pcs dan Total Batch
    const biayaBahanPerPcs = (formData.kebutuhanBahan || []).reduce(
      (acc, curr) => {
        const q = Number(curr.qty) || 0;
        const h = Number(curr.hargaSatuan) || 0;
        return acc + q * h;
      },
      0,
    );
    const totalBiayaBahanBatch = Math.round(biayaBahanPerPcs * qtyTarget);
    const totalBiayaBahan = biayaBahanPerPcs;

    // 2. Upah Borongan Tenaga Kerja
    const tarifCut = Number(defaultTarifCutting) || 1500;
    const tarifJht = Number(defaultTarifJahit) || 3500;
    const tarifFin = 1000;
    const biayaCutting = qtyTarget * tarifCut;
    const biayaJahit = qtyTarget * tarifJht;
    const biayaFinishing = qtyTarget * tarifFin;
    const totalUpahBorongan = biayaCutting + biayaJahit + biayaFinishing;

    // 3. Total HPP Batch & HPP per Pcs
    const totalHpp = totalBiayaBahanBatch + totalUpahBorongan;
    const hppPerPcs = Math.round(totalHpp / qtyTarget);

    // 4. Analisis Profit & Margin jika ada harga jual produk
    const hargaJual = Number(selectedProduct?.harga || 0);
    const profitPerPcs = hargaJual > 0 ? hargaJual - hppPerPcs : 0;
    const marginPersen =
      hargaJual > 0 ? Math.round((profitPerPcs / hargaJual) * 100) : 0;

    return {
      biayaBahanPerPcs: Math.round(biayaBahanPerPcs),
      totalBiayaBahanBatch,
      totalBiayaBahan,
      tarifCut,
      tarifJht,
      tarifFin,
      biayaCutting,
      biayaJahit,
      biayaFinishing,
      totalUpahBorongan,
      totalHpp,
      hppPerPcs,
      hargaJual,
      profitPerPcs,
      marginPersen,
    };
  }, [
    formData.qty,
    formData.kebutuhanBahan,
    defaultTarifCutting,
    defaultTarifJahit,
    selectedProduct,
  ]);

  // Filtered products inside combobox dropdown
  const filteredComboboxProducts = useMemo(() => {
    if (!productComboboxSearch.trim()) return products;
    const q = productComboboxSearch.toLowerCase();
    return products.filter((p) => {
      const name = getProdName(p).toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const kat = (p.kategori || "").toLowerCase();
      const varColor = (p.varian || "").toLowerCase();
      const sz = (p.ukuran || "").toLowerCase();
      return (
        name.includes(q) ||
        sku.includes(q) ||
        kat.includes(q) ||
        varColor.includes(q) ||
        sz.includes(q)
      );
    });
  }, [products, productComboboxSearch]);

  // Generate automated No Antrian
  const generateNoAntrian = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(100 + Math.random() * 900);
    return `ANT-${today}-${rand}`;
  };

  // Open Modal Create
  const handleOpenCreate = () => {
    const defaultSku = products && products.length > 0 ? products[0].sku : "";
    setFormData({
      ...initialForm,
      noAntrian: generateNoAntrian(),
      sku: defaultSku,
      kebutuhanBahan: [],
    });
    setModalMode("create");
    setCurrentId(null);
    setProductComboboxSearch("");
    setIsProductComboboxOpen(false);
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item) => {
    let parsedKebutuhan = [];
    if (item.kebutuhanBahan) {
      if (typeof item.kebutuhanBahan === "string") {
        try {
          parsedKebutuhan = JSON.parse(item.kebutuhanBahan);
        } catch (_) {
          parsedKebutuhan = [];
        }
      } else if (Array.isArray(item.kebutuhanBahan)) {
        parsedKebutuhan = item.kebutuhanBahan;
      }
    }

    setFormData({
      noAntrian: item.noAntrian || "",
      tglMasuk: item.tglMasuk || "",
      sumberPermintaan: item.sumberPermintaan || "PO Pelanggan",
      noReff: item.noReff || "",
      sku: item.sku || "",
      qty: item.qty || 1,
      prioritas: item.prioritas || "Normal",
      deadline: item.deadline || "",
      status: item.status || "Menunggu Cutting",
      catatan: item.catatan || "",
      kebutuhanBahan: Array.isArray(parsedKebutuhan)
        ? parsedKebutuhan.map((k) => {
            let harga = Number(k.hargaSatuan || 0);
            let sat = k.satuan || "Pcs";
            if (!harga && k.namaBahan) {
              const match = bahan.find(
                (b) =>
                  (b.namaBahan || "").toLowerCase() ===
                    k.namaBahan.toLowerCase() ||
                  (b.kodeBahan || "").toLowerCase() ===
                    k.namaBahan.toLowerCase(),
              );
              if (match) {
                harga = Number(match.harga || 0);
                if (!sat) sat = match.satuan || "Pcs";
              }
            }
            return {
              ...k,
              hargaSatuan: harga,
              satuan: sat,
            };
          })
        : [],
    });
    setModalMode("edit");
    setCurrentId(item.id);
    setProductComboboxSearch("");
    setIsProductComboboxOpen(false);
    setIsModalOpen(true);
  };

  // Selection Handlers (Centang antrean yang mau ke tahap Cutting)
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((a) => a.id));
    }
  };

  // Open Cutting Modal (Bisa per-baris tunggal atau multi-select)
  const handleOpenCuttingModal = (items = []) => {
    if (!items || items.length === 0) return;
    setCuttingTargetItems(items);
    setCuttingForm({
      tglSerahCutting: new Date().toISOString().slice(0, 10),
      timCutting: cuttingEmployees[0]?.nama
        ? `Tim ${cuttingEmployees[0].nama}`
        : "Tim Cutting",
      customTimCutting: "",
      tarifCutting: defaultTarifCutting || 1500,
      catatanCutting: "",
    });
    setIsCuttingModalOpen(true);
  };

  // Eksekusi Penyerahan ke Tim Cutting
  const handleSerahkanCutting = async (e) => {
    e?.preventDefault();
    if (!cuttingTargetItems || cuttingTargetItems.length === 0) return;

    const finalTim =
      cuttingForm.timCutting === "LAINNYA"
        ? cuttingForm.customTimCutting.trim() || "Tim Cutting"
        : cuttingForm.timCutting;

    const targetIds = cuttingTargetItems.map((item) => item.id);
    const totalQty = cuttingTargetItems.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );
    const tarif = Number(cuttingForm.tarifCutting) || 0;
    const totalBiaya = totalQty * tarif;

    try {
      // 1. Simpan ke SQLite Backend via API
      try {
        await api.serahCutting({
          ids: targetIds,
          tglSerahCutting: cuttingForm.tglSerahCutting,
          timCutting: finalTim,
          tarifCutting: tarif,
          catatanCutting: cuttingForm.catatanCutting,
        });
      } catch (apiErr) {
        console.warn(
          "API serahCutting error, update local state fallback:",
          apiErr,
        );
      }

      // 2. Update state lokal & localStorage
      setAntreanList((prev) => {
        const next = prev.map((item) => {
          if (targetIds.includes(item.id)) {
            const itemQty = Number(item.qty) || 0;
            return {
              ...item,
              status: "Proses Cutting",
              tglSerahCutting: cuttingForm.tglSerahCutting,
              timCutting: finalTim,
              tarifCutting: tarif,
              totalBiayaCutting: itemQty * tarif,
              catatanCutting: cuttingForm.catatanCutting,
            };
          }
          return item;
        });
        try {
          localStorage.setItem("konveksi_antrean_list", JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      // 3. Clear selections & modal
      setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      setIsCuttingModalOpen(false);

      // 4. Update modal detail jika sedang dibuka
      if (selectedAntreanShow && targetIds.includes(selectedAntreanShow.id)) {
        const currentQty = Number(selectedAntreanShow.qty) || 0;
        setSelectedAntreanShow((prev) => ({
          ...prev,
          status: "Proses Cutting",
          tglSerahCutting: cuttingForm.tglSerahCutting,
          timCutting: finalTim,
          tarifCutting: tarif,
          totalBiayaCutting: currentQty * tarif,
          catatanCutting: cuttingForm.catatanCutting,
        }));
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil Diserahkan ke Cutting!",
        html: `
          <div style="font-size:12px; text-align:left; line-height:1.6; color:#334155;">
            <p><strong>${targetIds.length} Antrean (${totalQty.toLocaleString("id-ID")} Pcs)</strong> telah diserahkan ke <strong>${finalTim}</strong> (Status: Proses Cutting).</p>
            <div style="margin-top:10px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace;">
              <div>📅 Tgl Penyerahan : <b>${cuttingForm.tglSerahCutting}</b></div>
              <div>✂️ Tim Cutting : <b>${finalTim}</b></div>
              <div>💰 Tarif Jasa : <b>Rp ${tarif.toLocaleString("id-ID")} / Pcs</b></div>
              <div style="margin-top:4px; padding-top:4px; border-top:1px dashed #cbd5e1; font-size:13px; color:#0284c7;">
                📊 Total Biaya : <b>Rp ${totalBiaya.toLocaleString("id-ID")}</b>
              </div>
            </div>
          </div>
        `,
        confirmButtonText: "Selesai & Tutup",
        confirmButtonColor: "#0284c7",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyerahkan",
        text: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Open Jahit Modal (Bisa per-baris tunggal atau multi-select)
  const handleOpenJahitModal = (items = []) => {
    if (!items || items.length === 0) return;
    setJahitTargetItems(items);
    setJahitForm({
      tglSerahJahit: new Date().toISOString().slice(0, 10),
      timJahit: jahitEmployees[0]?.nama
        ? `Tim ${jahitEmployees[0].nama}`
        : "Tim Jahit",
      customTimJahit: "",
      tarifJahit: defaultTarifJahit || 3500,
      catatanJahit: "",
    });
    setIsJahitModalOpen(true);
  };

  // Eksekusi Penyerahan ke Tim Jahit (Step 3 SOP)
  const handleSerahkanJahit = async (e) => {
    e?.preventDefault();
    if (!jahitTargetItems || jahitTargetItems.length === 0) return;

    const finalTim =
      jahitForm.timJahit === "LAINNYA"
        ? jahitForm.customTimJahit.trim() || "Tim Jahit"
        : jahitForm.timJahit;

    const targetIds = jahitTargetItems.map((item) => item.id);
    const totalQty = jahitTargetItems.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );
    const tarif = Number(jahitForm.tarifJahit) || 0;
    const totalBiaya = totalQty * tarif;

    try {
      try {
        await api.serahJahit({
          ids: targetIds,
          tglSerahJahit: jahitForm.tglSerahJahit,
          timJahit: finalTim,
          tarifJahit: tarif,
          catatanJahit: jahitForm.catatanJahit,
        });
      } catch (apiErr) {
        console.warn("API serahJahit error, fallback to local state:", apiErr);
      }

      setAntreanList((prev) => {
        const next = prev.map((item) => {
          if (targetIds.includes(item.id)) {
            const itemQty = Number(item.qty) || 0;
            return {
              ...item,
              status: "Proses Jahit",
              tglSerahJahit: jahitForm.tglSerahJahit,
              timJahit: finalTim,
              tarifJahit: tarif,
              totalBiayaJahit: itemQty * tarif,
              catatanJahit: jahitForm.catatanJahit,
            };
          }
          return item;
        });
        try {
          localStorage.setItem("konveksi_antrean_list", JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      setIsJahitModalOpen(false);

      if (selectedAntreanShow && targetIds.includes(selectedAntreanShow.id)) {
        const currentQty = Number(selectedAntreanShow.qty) || 0;
        setSelectedAntreanShow((prev) => ({
          ...prev,
          status: "Proses Jahit",
          tglSerahJahit: jahitForm.tglSerahJahit,
          timJahit: finalTim,
          tarifJahit: tarif,
          totalBiayaJahit: currentQty * tarif,
          catatanJahit: jahitForm.catatanJahit,
        }));
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil Diserahkan ke Tim Jahit!",
        html: `
          <div style="font-size:12px; text-align:left; line-height:1.6; color:#334155;">
            <p><strong>${targetIds.length} Antrean (${totalQty.toLocaleString("id-ID")} Pcs)</strong> telah diserahkan ke <strong>${finalTim}</strong> untuk penjahitan (Step 3 SOP).</p>
            <div style="margin-top:10px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace;">
              <div>📅 Tgl Penyerahan : <b>${jahitForm.tglSerahJahit}</b></div>
              <div>🧵 Tim Jahit : <b>${finalTim}</b></div>
              <div>💰 Tarif Jasa Jahit : <b>Rp ${tarif.toLocaleString("id-ID")} / Pcs</b></div>
              <div style="margin-top:4px; padding-top:4px; border-top:1px dashed #cbd5e1; font-size:13px; color:#4f46e5;">
                📊 Total Biaya Jahit : <b>Rp ${totalBiaya.toLocaleString("id-ID")}</b>
              </div>
            </div>
          </div>
        `,
        confirmButtonText: "Selesai & Tutup",
        confirmButtonColor: "#4f46e5",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyerahkan ke Jahit",
        text: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Open QC Modal (Bisa per-baris tunggal atau multi-select)
  const handleOpenQcModal = (items = []) => {
    if (!items || items.length === 0) return;
    setQcTargetItems(items);
    setQcForm({
      tglSerahQc: new Date().toISOString().slice(0, 10),
      timQc: qcEmployees[0]?.nama ? `Tim ${qcEmployees[0].nama}` : "Tim QC",
      catatanQc: "",
      statusQc: "Pemeriksaan",
    });
    setIsQcModalOpen(true);
  };

  // Eksekusi Penyerahan ke Tim QC (Step 4 SOP)
  const handleSerahkanQc = async (e) => {
    e?.preventDefault();
    if (!qcTargetItems || qcTargetItems.length === 0) return;

    const finalTim = qcForm.timQc || "Tim QC";
    const targetIds = qcTargetItems.map((item) => item.id);
    const totalQty = qcTargetItems.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );
    const tarif = Number(qcForm.tarifQc ?? 500);

    try {
      try {
        await api.serahQc({
          ids: targetIds,
          tglSerahQc: qcForm.tglSerahQc,
          timQc: finalTim,
          tarifQc: tarif,
          catatanQc: qcForm.catatanQc,
          statusQc: qcForm.statusQc || "Pemeriksaan",
        });
      } catch (apiErr) {
        console.warn("API serahQc error, fallback to local state:", apiErr);
      }

      setAntreanList((prev) => {
        const next = prev.map((item) => {
          if (targetIds.includes(item.id)) {
            const itemQty = Number(item.qty) || 0;
            return {
              ...item,
              status: "Proses QC",
              tglSerahQc: qcForm.tglSerahQc,
              timQc: finalTim,
              tarifQc: tarif,
              totalBiayaQc: itemQty * tarif,
              catatanQc: qcForm.catatanQc,
              statusQc: qcForm.statusQc || "Pemeriksaan",
            };
          }
          return item;
        });
        try {
          localStorage.setItem("konveksi_antrean_list", JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      setIsQcModalOpen(false);

      if (selectedAntreanShow && targetIds.includes(selectedAntreanShow.id)) {
        setSelectedAntreanShow((prev) => ({
          ...prev,
          status: "Proses QC",
          tglSerahQc: qcForm.tglSerahQc,
          timQc: finalTim,
          catatanQc: qcForm.catatanQc,
          statusQc: qcForm.statusQc || "Pemeriksaan",
        }));
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil Diserahkan ke Tim QC!",
        html: `
          <div style="font-size:12px; text-align:left; line-height:1.6; color:#334155;">
            <p><strong>${targetIds.length} Antrean (${totalQty.toLocaleString("id-ID")} Pcs)</strong> telah diserahkan ke <strong>${finalTim}</strong> untuk inspeksi & pemeriksaan kualitas (Step 4 SOP).</p>
            <div style="margin-top:10px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace;">
              <div>📅 Tgl Masuk QC : <b>${qcForm.tglSerahQc}</b></div>
              <div>🔍 Tim QC : <b>${finalTim}</b></div>
              <div>📋 Status : <b style="color:#0f766e;">Dalam Pemeriksaan QC</b></div>
            </div>
          </div>
        `,
        confirmButtonText: "Selesai & Tutup",
        confirmButtonColor: "#0f766e",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyerahkan ke QC",
        text: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Open Finishing Modal (Bisa per-baris tunggal atau multi-select)
  const handleOpenFinishingModal = (items = []) => {
    if (!items || items.length === 0) return;
    setFinishingTargetItems(items);
    const totalQty = items.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );
    const defaultTim = finishingEmployees[0]?.nama
      ? `Tim ${finishingEmployees[0].nama}`
      : "Tim Finishing & Packing";
    setFinishingForm({
      qtyPassQc: totalQty,
      qtyRejectQc: 0,
      catatanRejectQc: "",
      tglSerahFinishing: new Date().toISOString().slice(0, 10),
      timFinishing: defaultTim,
      catatanFinishing: "",
    });
    setIsFinishingModalOpen(true);
  };

  // Eksekusi Penyerahan ke Tim Finishing (Step 5 SOP - Pasca QC)
  const handleSerahkanFinishing = async (e) => {
    e?.preventDefault();
    if (!finishingTargetItems || finishingTargetItems.length === 0) return;

    const finalTim = finishingForm.timFinishing || "Tim Finishing & Packing";
    const targetIds = finishingTargetItems.map((item) => item.id);
    const totalQty = finishingTargetItems.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );
    const passQty = Number(finishingForm.qtyPassQc) || 0;
    const rejectQty = Number(finishingForm.qtyRejectQc) || 0;
    const tarif = Number(finishingForm.tarifFinishing ?? 1000);

    try {
      let apiResult = null;
      try {
        apiResult = await api.serahFinishing({
          ids: targetIds,
          qtyPassQc: passQty,
          qtyRejectQc: rejectQty,
          catatanRejectQc: finishingForm.catatanRejectQc,
          tglSerahFinishing: finishingForm.tglSerahFinishing,
          timFinishing: finalTim,
          tarifFinishing: tarif,
          catatanFinishing: finishingForm.catatanFinishing,
        });

        // Refresh data antrean terbaru dari database untuk sinkronisasi antrean pecahan retur
        const freshList = await api.getAntrean();
        if (Array.isArray(freshList)) {
          setAntreanList(freshList);
          try {
            localStorage.setItem(
              "konveksi_antrean_list",
              JSON.stringify(freshList),
            );
          } catch (_) {}
        }
      } catch (apiErr) {
        console.warn(
          "API serahFinishing error, fallback to local state:",
          apiErr,
        );
        // Fallback local state jika server offline
        setAntreanList((prev) => {
          let next = [...prev];
          if (rejectQty > 0 && passQty > 0) {
            // Split: update asli jadi passQty, buat baru untuk rejectQty
            next = next.map((item) => {
              if (targetIds.includes(item.id)) {
                return {
                  ...item,
                  qty: passQty,
                  status: "Proses Finishing",
                  statusQc: "Selesai QC (Lolos Sebagian)",
                  qtyPassQc: passQty,
                  qtyRejectQc: rejectQty,
                  catatanRejectQc: finishingForm.catatanRejectQc,
                  tglSerahFinishing: finishingForm.tglSerahFinishing,
                  timFinishing: finalTim,
                  catatanFinishing: finishingForm.catatanFinishing,
                };
              }
              return item;
            });
            // Tambah retur jahit item
            const firstTarget = finishingTargetItems[0];
            if (firstTarget) {
              const returItem = {
                ...firstTarget,
                id: Date.now(),
                noAntrian: `${firstTarget.noAntrian}-R`,
                qty: rejectQty,
                status: "Proses Jahit",
                statusQc: "Perbaikan Jahit",
                prioritas: "Urgent",
                catatan: `[RETUR REVISI QC]: ${finishingForm.catatanRejectQc || "Perbaikan cacat jahit"}`,
                catatanJahit: `[PERBAIKAN REJECT QC]: ${finishingForm.catatanRejectQc || "Perbaiki jahitan yang meleset"}`,
                tglSerahJahit: new Date().toISOString().slice(0, 10),
                qtyPassQc: 0,
                qtyRejectQc: rejectQty,
                catatanRejectQc: finishingForm.catatanRejectQc,
                tglSerahFinishing: null,
                timFinishing: null,
              };
              next.unshift(returItem);
            }
          } else if (rejectQty > 0 && passQty === 0) {
            // 100% Reject: kembalikan ke Proses Jahit
            next = next.map((item) => {
              if (targetIds.includes(item.id)) {
                return {
                  ...item,
                  status: "Proses Jahit",
                  statusQc: "Reject (Kembali Jahit)",
                  qtyPassQc: 0,
                  qtyRejectQc: rejectQty,
                  catatanRejectQc: finishingForm.catatanRejectQc,
                  catatan: `[RETUR QC]: ${finishingForm.catatanRejectQc || "Cacat jahit"}`,
                };
              }
              return item;
            });
          } else {
            // 100% Lolos
            next = next.map((item) => {
              if (targetIds.includes(item.id)) {
                return {
                  ...item,
                  status: "Proses Finishing",
                  statusQc: "Selesai QC",
                  qtyPassQc: passQty,
                  qtyRejectQc: 0,
                  tglSerahFinishing: finishingForm.tglSerahFinishing,
                  timFinishing: finalTim,
                  catatanFinishing: finishingForm.catatanFinishing,
                };
              }
              return item;
            });
          }
          try {
            localStorage.setItem("konveksi_antrean_list", JSON.stringify(next));
          } catch (_) {}
          return next;
        });
      }

      setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      setIsFinishingModalOpen(false);

      if (selectedAntreanShow && targetIds.includes(selectedAntreanShow.id)) {
        setSelectedAntreanShow(null);
      }

      const returList = apiResult?.returItems || [];
      const returNoText = returList
        .map((r) => `<b>${r.noAntrian}</b> (${r.qty} Pcs)`)
        .join(", ");

      await Swal.fire({
        icon: "success",
        title:
          rejectQty > 0
            ? "QC Terverifikasi: Lolos & Retur Jahit Terpisah"
            : "Hasil QC Terverifikasi & Masuk Finishing!",
        html: `
          <div style="font-size:12px; text-align:left; line-height:1.6; color:#334155;">
            <p>Pemeriksaan QC selesai. Alokasi kuantitas telah diproses:</p>
            <div style="margin-top:10px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1; font-family:sans-serif;">
              ${
                passQty > 0
                  ? `
                <div style="color:#059669; font-weight:bold; margin-bottom:6px;">
                  ✨ ${passQty.toLocaleString("id-ID")} Pcs Lolos ➔ Lanjut ke <u>Proses Finishing</u> (${finalTim})
                </div>
              `
                  : ""
              }
              ${
                rejectQty > 0
                  ? `
                <div style="color:#e11d48; font-weight:bold; padding-top:6px; border-top:1px dashed #fecdd3;">
                  🧵 ${rejectQty.toLocaleString("id-ID")} Pcs Reject ➔ Otomatis KEMBALI ke <u>Proses Jahit</u> (Perbaikan)
                  ${returNoText ? `<div style="font-size:11px; color:#be123c; margin-top:3px;">No Antrean Retur: ${returNoText}</div>` : ""}
                  ${finishingForm.catatanRejectQc ? `<div style="font-size:11px; color:#64748b; font-style:italic; margin-top:2px;">Catatan: "${finishingForm.catatanRejectQc}"</div>` : ""}
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `,
        confirmButtonText: "Selesai & Tutup",
        confirmButtonColor: "#059669",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyerahkan ke Finishing",
        text: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Buka Modal Selesai Finishing & Masuk Gudang Jadi (Step 6 SOP - Final)
  const handleOpenGudangJadiModal = (item) => {
    if (!item) return;
    setGudangJadiTargetItem(item);
    setIsGudangJadiModalOpen(true);
  };

  // Eksekusi Serah Terima Barang Jadi ke Tim Gudang (Step 6 SOP)
  const handleConfirmSelesaiGudangJadi = async (formValues) => {
    if (!gudangJadiTargetItem) return;
    const item = gudangJadiTargetItem;
    const finalQty = Number(item.qtyPassQc) || Number(item.qty) || 0;

    try {
      try {
        await api.selesaiFinishing({
          ids: [item.id],
          tglDiserahkan: formValues.tglDiserahkan,
          petugasSerah: formValues.petugasSerah,
          catatan: formValues.catatan,
        });

        const freshAntrean = await api.getAntrean();
        if (Array.isArray(freshAntrean)) {
          setAntreanList(freshAntrean);
          try {
            localStorage.setItem(
              "konveksi_antrean_list",
              JSON.stringify(freshAntrean),
            );
          } catch (_) {}
        }
      } catch (apiErr) {
        console.warn(
          "API selesaiFinishing offline/error, updating local state:",
          apiErr,
        );
        setAntreanList((prev) => {
          const next = prev.map((a) =>
            a.id === item.id
              ? {
                  ...a,
                  status: "Selesai",
                  tglSerahGudang:
                    formValues.tglDiserahkan ||
                    new Date().toISOString().slice(0, 10),
                  timFinishing: formValues.petugasSerah,
                }
              : a,
          );
          try {
            localStorage.setItem("konveksi_antrean_list", JSON.stringify(next));
          } catch (_) {}
          return next;
        });
      }

      setIsGudangJadiModalOpen(false);
      setGudangJadiTargetItem(null);

      await Swal.fire({
        icon: "success",
        title: "Berhasil Diserahkan ke Gudang Jadi!",
        html: `
          <div style="font-size:12px; text-align:left; color:#334155; line-height:1.6;">
            <p>Antrean <b>${item.noAntrian}</b> berhasil diserahkan ke Tim Gudang.</p>
            <div style="margin-top:8px; padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; color:#166534;">
              <div>📦 <b>+${finalQty.toLocaleString("id-ID")} Pcs</b> siap diperiksa & disimpan di rak gudang</div>
              <div>📅 Tgl Diserahkan: <b>${formValues.tglDiserahkan}</b></div>
              <div>👤 Diserahkan Oleh: <b>${formValues.petugasSerah}</b></div>
              <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #86efac; font-size:11px; color:#15803d;">
                ⏳ Status saat ini: <b>Menunggu Penerimaan Gudang</b> (Buka menu <u>Mutasi Gudang Jadi</u> untuk Approve & Tentukan Rak).
              </div>
            </div>
          </div>
        `,
        confirmButtonText: "Tutup",
        confirmButtonColor: "#059669",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyerahkan ke Gudang",
        text: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Rollback / Batalkan Penyerahan Tahap (Undo Jika Salah Proses)
  const handleRollbackTahap = async (item) => {
    if (!item) return;

    let targetTahap = "Menunggu Cutting";
    let detailKeterangan = "";

    if (item.status === "Proses Cutting" || item.status === "Sedang Diproses") {
      targetTahap = "Menunggu Cutting";
      detailKeterangan =
        "Data penyerahan cutting, alokasi tim cutting, dan biaya potong akan di-reset.";
    } else if (item.status === "Proses Jahit") {
      targetTahap = "Proses Cutting";
      detailKeterangan =
        "Data penyerahan jahit, tim jahit, dan biaya jahit akan di-reset.";
    } else if (item.status === "Proses QC") {
      targetTahap = "Proses Jahit";
      detailKeterangan = "Data pemeriksaan QC akan di-reset.";
    } else if (
      item.status === "Selesai" ||
      item.status === "Menunggu Penerimaan Gudang"
    ) {
      targetTahap = "Proses Finishing";
      detailKeterangan =
        "Status dikembalikan ke Proses Finishing dan mutasi masuk gudang jadi dibatalkan.";
    } else if (item.status === "Proses Finishing") {
      targetTahap = "Proses QC";
      detailKeterangan =
        "Data alokasi finishing dan rekap hasil lolos/reject akan di-reset.";
    }

    const res = await Swal.fire({
      icon: "warning",
      title: `Batalkan Tahap ${item.status}?`,
      html: `
        <div style="font-size:12px; text-align:left; line-height:1.6; color:#334155;">
          <p>Apakah terjadi <strong>salah proses</strong> pada antrean <strong>${item.noAntrian}</strong>?</p>
          <div style="margin-top:8px; padding:10px 12px; background:#fffbeb; border-radius:8px; border:1px solid #fde68a;">
            <div>⏪ Status saat ini: <strong style="color:#b45309;">${item.status}</strong></div>
            <div>⏩ Dikembalikan ke: <strong style="color:#0284c7;">${targetTahap}</strong></div>
            <p style="margin-top:6px; font-size:11px; color:#64748b;">${detailKeterangan}</p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Ya, Kembalikan ke ${targetTahap}`,
      cancelButtonText: "Batal",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
    });

    if (res.isConfirmed) {
      try {
        let rolledBackItem = null;
        try {
          const resApi = await api.rollbackAntrean(item.id);
          rolledBackItem = resApi?.updated || null;
          const fresh = await api.getAntrean();
          if (Array.isArray(fresh) && fresh.length > 0) {
            setAntreanList(fresh);
            try {
              localStorage.setItem(
                "konveksi_antrean_list",
                JSON.stringify(fresh),
              );
            } catch (_) {}
          }
        } catch (apiErr) {
          console.warn("API rollback warning, update local fallback:", apiErr);
        }

        setAntreanList((prev) => {
          const next = prev.map((a) => {
            if (a.id === item.id) {
              if (rolledBackItem) return { ...a, ...rolledBackItem };
              if (
                item.status === "Proses Cutting" ||
                item.status === "Sedang Diproses"
              ) {
                return {
                  ...a,
                  status: "Menunggu Cutting",
                  tglSerahCutting: null,
                  timCutting: null,
                  tarifCutting: 0,
                  totalBiayaCutting: 0,
                  catatanCutting: null,
                };
              } else if (item.status === "Proses Jahit") {
                return {
                  ...a,
                  status: "Proses Cutting",
                  tglSerahJahit: null,
                  timJahit: null,
                  tarifJahit: 0,
                  totalBiayaJahit: 0,
                  catatanJahit: null,
                };
              } else if (item.status === "Proses QC") {
                return {
                  ...a,
                  status: "Proses Jahit",
                  tglSerahQc: null,
                  timQc: null,
                  catatanQc: null,
                  statusQc: null,
                };
              } else if (
                item.status === "Selesai" ||
                item.status === "Menunggu Penerimaan Gudang"
              ) {
                return {
                  ...a,
                  status: "Proses Finishing",
                  tglSerahGudang: null,
                };
              } else if (item.status === "Proses Finishing") {
                return {
                  ...a,
                  status: "Proses QC",
                  statusQc: "Pemeriksaan",
                  qtyPassQc: 0,
                  qtyRejectQc: 0,
                  catatanRejectQc: null,
                  tglSerahFinishing: null,
                  timFinishing: null,
                  catatanFinishing: null,
                };
              }
            }
            return a;
          });
          try {
            localStorage.setItem("konveksi_antrean_list", JSON.stringify(next));
          } catch (_) {}
          return next;
        });

        // Update modal detail jika dibuka
        if (selectedAntreanShow && selectedAntreanShow.id === item.id) {
          setSelectedAntreanShow((prev) => ({
            ...prev,
            status: targetTahap,
            ...(targetTahap === "Menunggu Cutting"
              ? { tglSerahCutting: null, timCutting: null }
              : {}),
            ...(targetTahap === "Proses Cutting"
              ? { tglSerahJahit: null, timJahit: null }
              : {}),
            ...(targetTahap === "Proses Jahit"
              ? { tglSerahQc: null, timQc: null }
              : {}),
            ...(targetTahap === "Proses QC"
              ? { tglSerahFinishing: null, timFinishing: null }
              : {}),
          }));
        }

        Swal.fire({
          icon: "success",
          title: "Tahap Berhasil Dibatalkan!",
          text: `Antrean ${item.noAntrian} telah dikembalikan ke status "${targetTahap}".`,
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal Membatalkan Tahap",
          text: err.message || "Terjadi kesalahan sistem",
        });
      }
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sku) {
      Swal.fire({
        icon: "warning",
        title: "SKU Wajib Dipilih",
        text: "Silakan pilih model produk/SKU untuk antrean produksi ini.",
      });
      return;
    }

    if (!formData.qty || Number(formData.qty) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Qty Tidak Valid",
        text: "Target kuantiti produksi harus lebih dari 0.",
      });
      return;
    }

    // Validasi ketat: Tidak boleh ada bahan baku yang sama (duplikat) dalam satu SPK / produk
    const seenBahanKeys = new Set();
    const duplicateBahanNames = [];
    for (const b of formData.kebutuhanBahan || []) {
      const key = (b.kodeBahan || b.namaBahan || "").trim().toLowerCase();
      if (!key) continue;
      if (seenBahanKeys.has(key)) {
        duplicateBahanNames.push(b.namaBahan || b.kodeBahan);
      } else {
        seenBahanKeys.add(key);
      }
    }
    if (duplicateBahanNames.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Bahan Baku Duplikat Terdeteksi",
        text: `Terdapat bahan yang sama dalam SPK ini: "${duplicateBahanNames.join(", ")}". Tidak boleh ada bahan baku yang sama dalam satu SPK/Produk. Harap hapus salah satu baris atau gabungkan Qty-nya.`,
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    const matchedProd = products.find((p) => p.sku === formData.sku);
    const prodDetails = {
      namaProduk: getProdName(matchedProd),
      kategori: matchedProd?.kategori || "-",
      varian: matchedProd?.varian || "-",
      ukuran: matchedProd?.ukuran || "-",
      skuBahan: getProdBahan(matchedProd),
    };

    if (modalMode === "create") {
      const tempId = Date.now();
      const newRecord = {
        id: tempId,
        ...formData,
        ...prodDetails,
        qty: Number(formData.qty),
        totalBiayaBahan: hppCalculation.totalBiayaBahan,
        totalHpp: hppCalculation.totalHpp,
        hppPerPcs: hppCalculation.hppPerPcs,
      };

      // Simpan ke state & localStorage agar saat refresh TIDAK HILANG
      setAntreanList((prev) => {
        const nextList = [newRecord, ...(prev || [])];
        localStorage.setItem("konveksi_antrean_list", JSON.stringify(nextList));
        return nextList;
      });
      setIsModalOpen(false);

      // Simpan resep bahan otomatis ke database & cache browser
      if (formData.sku && formData.kebutuhanBahan?.length > 0) {
        try {
          localStorage.setItem(
            `konveksi_resep_${formData.sku}`,
            JSON.stringify(formData.kebutuhanBahan),
          );
          api
            .saveResepBahan(formData.sku, formData.kebutuhanBahan, true)
            .catch(() => {});
        } catch (_) {}
      }

      try {
        const saved = await api.createAntrean(newRecord);
        if (saved && saved.id) {
          setAntreanList((prev) => {
            const nextList = (prev || []).map((item) =>
              item.id === tempId ? { ...saved, ...prodDetails } : item,
            );
            localStorage.setItem(
              "konveksi_antrean_list",
              JSON.stringify(nextList),
            );
            return nextList;
          });
        }
        Swal.fire({
          icon: "success",
          title: "Antrean Berhasil Disimpan!",
          text: `No. ${newRecord.noAntrian} tersimpan permanen ke sistem.`,
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (err) {
        console.warn("API sync warning:", err);
        Swal.fire({
          icon: "success",
          title: "Antrean Tersimpan!",
          text: `No. ${newRecord.noAntrian} aman tersimpan di sistem.`,
          timer: 1600,
          showConfirmButton: false,
        });
      }
    } else {
      const updatedRecord = {
        id: currentId,
        ...formData,
        ...prodDetails,
        qty: Number(formData.qty),
        totalBiayaBahan: hppCalculation.totalBiayaBahan,
        totalHpp: hppCalculation.totalHpp,
        hppPerPcs: hppCalculation.hppPerPcs,
      };

      setAntreanList((prev) => {
        const nextList = (prev || []).map((item) =>
          item.id === currentId ? updatedRecord : item,
        );
        localStorage.setItem("konveksi_antrean_list", JSON.stringify(nextList));
        return nextList;
      });
      setIsModalOpen(false);

      try {
        await api.updateAntrean(currentId, updatedRecord);
        Swal.fire({
          icon: "success",
          title: "Antrean Diperbarui!",
          text: `Data antrean ${updatedRecord.noAntrian} telah diperbarui.`,
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (err) {
        console.warn("API error saat updateAntrean:", err);
      }
    }
  };

  // Handle Delete with SweetAlert
  const handleDelete = async (item) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "Hapus Antrean?",
      text: `Yakin ingin menghapus antrean "${item.noAntrian}" (${item.namaProduk || item.sku})?`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (res.isConfirmed) {
      setAntreanList((prev) => {
        const nextList = (prev || []).filter((a) => a.id !== item.id);
        localStorage.setItem("konveksi_antrean_list", JSON.stringify(nextList));
        return nextList;
      });
      try {
        await api.deleteAntrean(item.id);
      } catch (err) {
        console.warn("API error deleteAntrean:", err);
      }
      Swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: `Antrean ${item.noAntrian} telah dihapus.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // Reload / Refresh
  const handleRefresh = async () => {
    try {
      const data = await api.getAntrean();
      if (Array.isArray(data)) {
        setAntreanList(data);
        localStorage.setItem("konveksi_antrean_list", JSON.stringify(data));
      }
      Swal.fire({
        icon: "success",
        title: "Data Dimuat Ulang",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (_) {
      Swal.fire({
        icon: "info",
        title: "Antrean Siap",
        text: "Daftar antrean sudah sinkron.",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const list = antreanList || [];
    const total = list.length;
    const countWaiting = list.filter(
      (a) => a.status === "Menunggu Cutting",
    ).length;
    const countCutting = list.filter(
      (a) => a.status === "Proses Cutting" || a.status === "Sedang Diproses",
    ).length;
    const countJahit = list.filter((a) => a.status === "Proses Jahit").length;
    const countQc = list.filter((a) => a.status === "Proses QC").length;
    const countFinishing = list.filter(
      (a) => a.status === "Proses Finishing",
    ).length;
    const countDone = list.filter(
      (a) =>
        a.status === "Selesai" ||
        a.status === "Menunggu Penerimaan Gudang" ||
        a.status === "Menunggu Approval Gudang",
    ).length;
    const countUrgent = list.filter((a) => a.prioritas === "Urgent").length;
    const totalQty = list.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );

    return {
      total,
      countWaiting,
      countCutting,
      countJahit,
      countQc,
      countFinishing,
      countDone,
      countUrgent,
      totalQty,
    };
  }, [antreanList]);

  // Filtering Table
  const filteredList = useMemo(() => {
    return (antreanList || []).filter((item) => {
      // Tab filter
      if (
        activeTab === "Menunggu Cutting" &&
        item.status !== "Menunggu Cutting"
      )
        return false;
      if (
        activeTab === "Proses Cutting" &&
        item.status !== "Proses Cutting" &&
        item.status !== "Sedang Diproses"
      )
        return false;
      if (activeTab === "Proses Jahit" && item.status !== "Proses Jahit")
        return false;
      if (activeTab === "Proses QC" && item.status !== "Proses QC")
        return false;
      if (
        activeTab === "Proses Finishing" &&
        item.status !== "Proses Finishing"
      )
        return false;
      if (
        activeTab === "Selesai" &&
        item.status !== "Selesai" &&
        item.status !== "Menunggu Penerimaan Gudang" &&
        item.status !== "Menunggu Approval Gudang"
      )
        return false;

      // Dropdown Sumber Permintaan
      if (filterSumber && item.sumberPermintaan !== filterSumber) return false;

      // Dropdown Prioritas
      if (filterPrioritas && item.prioritas !== filterPrioritas) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = item.noAntrian?.toLowerCase().includes(q);
        const matchReff = item.noReff?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchNama = item.namaProduk?.toLowerCase().includes(q);
        const matchSumber = item.sumberPermintaan?.toLowerCase().includes(q);
        const matchCatatan = item.catatan?.toLowerCase().includes(q);
        if (
          !matchNo &&
          !matchReff &&
          !matchSku &&
          !matchNama &&
          !matchSumber &&
          !matchCatatan
        ) {
          return false;
        }
      }

      return true;
    });
  }, [antreanList, activeTab, filterSumber, filterPrioritas, searchTerm]);

  return (
    <div className="w-full space-y-2 select-none">
      {/* 1. HEADER CARD (COMPACT SLIM PM STYLE PERSIS MUTASI BAHAN) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-xl py-2 px-3 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <ListOrdered className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                1. SPK (Surat Perintah Kerja) Produksi
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10.5px] font-black">
                TAHAP 1 SOP
              </span>
              {userRole && userRole !== "superadmin" && (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10.5px] font-black uppercase tracking-wider shadow-xs">
                  Akses {userRole}
                </span>
              )}
            </div>
            <p className="text-xs text-white/90 mt-1 leading-tight font-medium">
              Pendaftaran Surat Perintah Kerja (SPK) masuk dari PO, restock barang, atau rencana internal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black shadow-md transition-all cursor-pointer border border-purple-500 active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan SPK</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/25"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>SPK Baru</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS (4 KARTU BER-BORDER #cbd5e1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Antrean Masuk
            </div>
            <div className="text-lg sm:text-xl font-black text-[#0f172a] mt-0.5 leading-none">
              {stats.total}{" "}
              <span className="text-xs font-semibold text-slate-400">
                Order
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <ReceiptText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#b91c1c] uppercase tracking-wider">
              Prioritas Urgent
            </div>
            <div className="text-lg sm:text-xl font-black text-[#ef4444] mt-0.5 leading-none">
              {stats.countUrgent}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Batch Prioritas
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#047857] uppercase tracking-wider">
              Menunggu Cutting
            </div>
            <div className="text-lg sm:text-xl font-black text-[#059669] mt-0.5 leading-none">
              {stats.countWaiting}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Siap Potong
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#047857] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Target Volume
            </div>
            <div className="text-lg sm:text-xl font-black text-[#0284c7] mt-0.5 leading-none">
              {stats.totalQty.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-semibold text-slate-400">Pcs</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Shirt className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS (PM TAB STYLES PERSIS MUTASI BAHAN) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setActiveTab("Semua Antrean")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Semua Antrean"
              ? "bg-[#0284c7] text-white border border-[#0284c7] shadow-[0_1px_4px_rgba(2,132,199,0.25)]"
              : "bg-[#eff6ff] text-[#0284c7] border border-[#bae6fd] hover:bg-sky-100/60"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Antrean ({stats.total})</span>
        </button>

        <button
          onClick={() => setActiveTab("Menunggu Cutting")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Menunggu Cutting"
              ? "bg-[#d97706] text-white border border-[#d97706] shadow-[0_1px_4px_rgba(217,119,6,0.25)]"
              : "bg-[#fffbeb] text-[#b45309] border border-[#fde68a] hover:bg-amber-100/60"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Cutting ({stats.countWaiting})</span>
        </button>

        <button
          onClick={() => setActiveTab("Proses Cutting")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Proses Cutting"
              ? "bg-[#0284c7] text-white border border-[#0284c7] shadow-[0_1px_4px_rgba(2,132,199,0.25)]"
              : "bg-[#eff6ff] text-[#0284c7] border border-[#bae6fd] hover:bg-sky-100/60"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Proses Cutting ({stats.countCutting})</span>
        </button>

        <button
          onClick={() => setActiveTab("Proses Jahit")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Proses Jahit"
              ? "bg-[#4f46e5] text-white border border-[#4f46e5] shadow-[0_1px_4px_rgba(79,70,229,0.25)]"
              : "bg-[#eef2ff] text-[#4338ca] border border-[#c7d2fe] hover:bg-indigo-100/60"
          }`}
        >
          <SewingMachineIcon className="w-3.5 h-3.5" />
          <span>Proses Jahit ({stats.countJahit})</span>
        </button>

        <button
          onClick={() => setActiveTab("Proses QC")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Proses QC"
              ? "bg-[#0f766e] text-white border border-[#0f766e] shadow-[0_1px_4px_rgba(15,118,110,0.25)]"
              : "bg-[#f0fdfa] text-[#0f766e] border border-[#99f6e4] hover:bg-teal-100/60"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Proses QC ({stats.countQc})</span>
        </button>

        <button
          onClick={() => setActiveTab("Proses Finishing")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Proses Finishing"
              ? "bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]"
              : "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60"
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Proses Finishing ({stats.countFinishing})</span>
        </button>

        <button
          onClick={() => setActiveTab("Selesai")}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeTab === "Selesai"
              ? "bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]"
              : "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Selesai ({stats.countDone})</span>
        </button>
      </div>

      {/* 4. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No Antrian, No Reff, SKU, Model Produk, Catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0284c7] focus:bg-white text-[#0f172a] transition-all"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterSumber}
            onChange={(e) => setFilterSumber(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Sumber Permintaan</option>
            {sumberOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Prioritas</option>
            <option value="Urgent">Urgent</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* BULK ACTION BAR: KETIKA ADA ANTREAN YANG DICENTANG */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between text-xs text-blue-900 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckSquare className="w-4 h-4 text-[#0284c7]" />
            <span>
              <strong>{selectedIds.length}</strong> antrean dipilih (Total
              Target:{" "}
              <strong className="text-[#0284c7]">
                {antreanList
                  .filter((a) => selectedIds.includes(a.id))
                  .reduce((sum, a) => sum + (Number(a.qty) || 0), 0)
                  .toLocaleString("id-ID")}{" "}
                Pcs
              </strong>
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-slate-600 hover:bg-white rounded border border-slate-300 font-semibold cursor-pointer text-[11px]"
            >
              Batal Pilihan
            </button>
            {!isGudang && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const items = antreanList.filter((a) =>
                      selectedIds.includes(a.id),
                    );
                    handleOpenCuttingModal(items);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#075985] text-white font-bold rounded flex items-center gap-1.5 shadow-xs cursor-pointer text-[11px]"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Serahkan Cutting ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const items = antreanList.filter((a) =>
                      selectedIds.includes(a.id),
                    );
                    handleOpenJahitModal(items);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded flex items-center gap-1.5 shadow-xs cursor-pointer text-[11px]"
                >
                  <SewingMachineIcon className="w-3.5 h-3.5" />
                  <span>Serahkan Jahit ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const items = antreanList.filter((a) =>
                      selectedIds.includes(a.id),
                    );
                    handleOpenQcModal(items);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded flex items-center gap-1.5 shadow-xs cursor-pointer text-[11px]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Serahkan QC ({selectedIds.length})</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. TABEL INDEX ANTREAN (KOLOM CHECKBOX + MERGE BIAR LEGA) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-9 min-w-[36px] border-r border-[#3b4c5e] text-white font-bold">
                  <input
                    type="checkbox"
                    checked={
                      filteredList.length > 0 &&
                      selectedIds.length === filteredList.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#0284c7] focus:ring-0 cursor-pointer w-4 h-4"
                    title="Pilih Semua Antrean"
                  />
                </th>
                <th className="py-2.5 px-2 text-center w-10 min-w-[40px] border-r border-[#3b4c5e] text-white font-bold">
                  NO
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px] border-r border-[#3b4c5e] text-white font-bold">
                  NO. ANTREAN & TGL
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px] border-r border-[#3b4c5e] text-white font-bold">
                  SUMBER & REFF
                </th>
                <th className="py-2.5 px-3 min-w-[240px] border-r border-[#3b4c5e] text-white font-bold">
                  RINCIAN MODEL PRODUK (SKU)
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[120px] border-r border-[#3b4c5e] text-white font-bold">
                  TARGET & PRIORITAS
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">
                  STATUS
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[150px] text-white font-bold">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">
                      Tidak ada data antrean produksi
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Klik "SPK Baru" untuk mendaftarkan permintaan
                      produksi pertama
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isUrgent = item.prioritas === "Urgent";
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                    >
                      {/* 0. CHECKBOX SELECT */}
                      <td className="py-2 px-2 text-center border-r border-slate-200/60">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-[#0284c7] focus:ring-0 cursor-pointer w-4 h-4"
                        />
                      </td>

                      {/* 1. NO */}
                      <td className="py-2 px-2 text-center text-slate-700 font-bold text-xs sm:text-sm border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* 2. NO. ANTREAN & TGL MASUK (GABUNGAN) */}
                      <td className="py-2 px-3 border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-xs sm:text-[13px] text-[#0284c7]">
                            {item.noAntrian}
                          </span>
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{item.tglMasuk}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. SUMBER PERMINTAAN & NO REFF (GABUNGAN) */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col min-w-0">
                          <span
                            className="text-xs sm:text-sm font-bold text-slate-900"
                            title={item.sumberPermintaan}
                          >
                            {item.sumberPermintaan}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-0.5">
                            <span className="text-slate-500">Reff:</span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-300">
                              {item.noReff || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. MODEL PRODUK & SPESIFIKASI (SPACE LEBAR & LENGKAP) */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col min-w-0">
                          {/* SKU & Nama Produk */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-xs text-[#0284c7]">
                              {item.sku}
                            </span>
                            <span
                              className="font-bold text-slate-900 text-xs sm:text-sm truncate"
                              title={item.namaProduk}
                            >
                              {item.namaProduk || "-"}
                            </span>
                          </div>

                          {/* Kategori, Varian, Ukuran, Kain */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 flex-wrap">
                            {item.kategori && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs">
                                {item.kategori}
                              </span>
                            )}
                            {(item.varian || item.ukuran) && (
                              <span className="text-slate-700 font-medium">
                                {item.varian || "Polos"} (
                                {item.ukuran || "All Size"})
                              </span>
                            )}
                            {item.skuBahan && item.skuBahan !== "-" && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-mono text-cyan-800 font-bold text-xs">
                                  Kain: {item.skuBahan}
                                </span>
                              </>
                            )}
                            {Array.isArray(item.kebutuhanBahan) &&
                              item.kebutuhanBahan.length > 0 && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[10.5px]">
                                    <Layers className="w-3 h-3 text-amber-600" />
                                    <span>
                                      {item.kebutuhanBahan.length}{" "}
                                      Bahan/Aksesoris
                                    </span>
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                      </td>

                      {/* 5. TARGET QTY & PRIORITAS (GABUNGAN) */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-sm sm:text-base text-slate-900">
                            {Number(item.qty).toLocaleString("id-ID")}{" "}
                            <span className="text-xs font-semibold text-slate-500">
                              Pcs
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                              isUrgent
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : item.prioritas === "Low"
                                  ? "bg-slate-100 text-slate-600 border-slate-300"
                                  : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {isUrgent && (
                              <Flame className="w-3 h-3 text-rose-600 shrink-0" />
                            )}
                            <span>{item.prioritas}</span>
                          </span>

                          {/* Info HPP per Pcs */}
                          {Number(item.hppPerPcs) > 0 && (
                            <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                              HPP: Rp{" "}
                              {Number(item.hppPerPcs).toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. STATUS & TGL PROSES */}
                      <td className="py-2 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${
                              item.status === "Menunggu Cutting"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : item.status === "Proses Cutting" ||
                                    item.status === "Sedang Diproses"
                                  ? "bg-sky-100 text-sky-800 border-sky-300"
                                  : item.status === "Proses Jahit"
                                    ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                                    : item.status === "Proses QC"
                                      ? "bg-teal-100 text-teal-800 border-teal-300"
                                        : item.status === "Menunggu Approval Gudang"
                                          ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : item.status === "Proses Finishing"
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : item.status === "Selesai" ||
                                            item.status ===
                                              "Menunggu Penerimaan Gudang"
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                          : "bg-rose-100 text-rose-800 border-rose-300"
                            }`}
                          >
                            {item.status === "Sedang Diproses"
                              ? "Proses Cutting"
                              : item.status === "Menunggu Approval Gudang"
                                ? "Menunggu Approval Gudang"
                              : item.status === "Menunggu Penerimaan Gudang"
                                ? "Selesai"
                                : item.status}
                          </span>

                          {/* Tanggal Update / Masuk Tahapan Proses */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {item.status === "Proses Finishing"
                                ? item.tglSerahFinishing || item.tglMasuk
                                : item.status === "Proses QC"
                                  ? item.tglSerahQc || item.tglMasuk
                                  : item.status === "Proses Jahit"
                                    ? item.tglSerahJahit || item.tglMasuk
                                    : item.status === "Proses Cutting" ||
                                        item.status === "Sedang Diproses"
                                      ? item.tglSerahCutting || item.tglMasuk
                                      : item.status === "Selesai" ||
                                          item.status ===
                                            "Menunggu Penerimaan Gudang"
                                        ? item.tglSerahGudang || item.tglMasuk
                                        : item.tglMasuk}
                            </span>
                          </div>

                          {/* Estimasi Selesai / Deadline */}
                          {item.deadline && (
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-500 font-mono">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>s/d {item.deadline}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. AKSI: IKON SERAHKAN CUTTING / JAHIT / QC / FINISHING, EYE, EDIT, TRASH */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 flex-nowrap">
                          {item.status === "Proses Cutting" ||
                          item.status === "Sedang Diproses" ? (
                            <button
                              onClick={() => handleOpenJahitModal([item])}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Lanjut ke Proses Jahit (Serahkan ke Tim Jahit)"
                            >
                              <SewingMachineIcon className="w-4 h-4" />
                            </button>
                          ) : item.status === "Proses Jahit" ? (
                            <button
                              onClick={() => handleOpenQcModal([item])}
                              className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Lanjut ke Proses QC (Serahkan ke Tim QC untuk Inspeksi)"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          ) : item.status === "Proses QC" ? (
                            <button
                              onClick={() => handleOpenFinishingModal([item])}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Pemeriksaan Hasil QC & Serahkan ke Proses Finishing"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          ) : item.status === "Proses Finishing" ? (
                            <button
                              onClick={() => handleOpenGudangJadiModal(item)}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Selesaikan Finishing & Masukkan Barang ke Gudang Jadi"
                            >
                              <Warehouse className="w-4 h-4" />
                            </button>
                          ) : item.status === "Menunggu Approval Gudang" ? (
                            <button
                              onClick={() => {
                                if (onNavigateToMutasiGudang) {
                                  onNavigateToMutasiGudang();
                                } else {
                                  Swal.fire({
                                    icon: "info",
                                    title: "Menunggu Opname Gudang",
                                    text: "Buka menu Gudang Jadi -> Mutasi Gudang Jadi untuk melakukan approval dan verifikasi barang.",
                                  });
                                }
                              }}
                              className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
                              title="Buka Mutasi Gudang Jadi untuk Approval/Opname"
                            >
                              <Warehouse className="w-3.5 h-3.5" />
                              <span>Opname Gudang</span>
                            </button>
                          ) : item.status === "Selesai" ||
                            item.status === "Menunggu Penerimaan Gudang" ? (
                            <span
                              className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0"
                              title="Produksi Selesai (Di Gudang Jadi)"
                            >
                              ✓
                            </span>
                          ) : isGudang ? (
                            <span
                              className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px] shrink-0 whitespace-nowrap"
                              title="Menunggu Divisi Cutting Memproses"
                            >
                              Tunggu Cutting
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenCuttingModal([item])}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0 ${
                                item.tglSerahCutting
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                              title={
                                item.tglSerahCutting
                                  ? "Edit / Lihat Penyerahan Cutting"
                                  : "Serahkan ke Tim Cutting (Hitung Biaya)"
                              }
                            >
                              <Scissors className="w-4 h-4" />
                            </button>
                          )}

                          {/* Tombol Cetak SPK & QR Code */}
                          <button
                            type="button"
                            onClick={() => setSelectedCetakSpk(item)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Cetak Lembar SPK & QR Code / Barcode"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAntreanShow(item);
                              if (item?.id) {
                                api
                                  .getAntreanById(item.id)
                                  .then((fresh) => {
                                    if (fresh && fresh.id)
                                      setSelectedAntreanShow(fresh);
                                  })
                                  .catch(() => {});
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Tampilkan Detail Antrean"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Tombol Bagikan Link Tracking Customer */}
                          <button
                            type="button"
                            onClick={() => setShareTrackingItem(item)}
                            className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Bagikan Link Live Tracking ke Pelanggan (WhatsApp / Link)"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Tombol Edit & Hapus HANYA muncul jika status 'Menunggu Cutting' */}
                          {item.status === "Menunggu Cutting" ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="w-8 h-8 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
                                title="Edit Antrean"
                              >
                                <Pencil className="w-4 h-4 text-white stroke-[2.2]" />
                              </button>

                              <button
                                onClick={() => handleDelete(item)}
                                className="w-8 h-8 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
                                title="Hapus Antrean"
                              >
                                <Trash2 className="w-4 h-4 text-white stroke-[2.2]" />
                              </button>
                            </>
                          ) : (
                            /* Jika dalam proses produksi, sediakan tombol Batalkan Tahap (Undo / Rollback) */
                            <button
                              onClick={() => handleRollbackTahap(item)}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-300 flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Batalkan & Kembalikan ke Tahap Sebelumnya (Undo jika salah proses)"
                            >
                              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}
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
        <div className="bg-[#f8fafc] border-t border-[#cbd5e1] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-600 gap-2">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-800">
              {filteredList.length}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-slate-800">
              {antreanList.length}
            </span>{" "}
            antrean
          </div>
          <div className="flex items-center gap-3 font-semibold text-slate-700">
            <span>
              Total Target:{" "}
              <strong className="text-[#0284c7] font-bold">
                {stats.totalQty.toLocaleString("id-ID")} Pcs
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 6. MODAL SHOW RINCIAN DETAIL (FULL SCREEN VIEW SEPERTI MUTASI BAHAN) */}
      {selectedAntreanShow && (
        <ModalShowAntrean
          antrean={selectedAntreanShow}
          products={products}
          onClose={() => setSelectedAntreanShow(null)}
          onEdit={() => {
            const item = selectedAntreanShow;
            setSelectedAntreanShow(null);
            handleOpenEdit(item);
          }}
          onSerahCutting={(item) => {
            handleOpenCuttingModal([item]);
          }}
          onSerahJahit={(item) => {
            handleOpenJahitModal([item]);
          }}
          onSerahQc={(item) => {
            handleOpenQcModal([item]);
          }}
          onSerahFinishing={(item) => {
            handleOpenFinishingModal([item]);
          }}
          onSelesaiFinishing={(item) => {
            setSelectedAntreanShow(null);
            handleOpenGudangJadiModal(item);
          }}
          onRollbackTahap={async (item) => {
            setSelectedAntreanShow(null);
            await handleRollbackTahap(item);
          }}
        />
      )}

      {/* MODAL SERAHKAN KE TIM CUTTING */}
      {isCuttingModalOpen && (
        <ModalSerahCutting
          isOpen={isCuttingModalOpen}
          targetItems={cuttingTargetItems}
          form={cuttingForm}
          setForm={setCuttingForm}
          cuttingEmployees={cuttingEmployees}
          products={products}
          onClose={() => setIsCuttingModalOpen(false)}
          onSubmit={handleSerahkanCutting}
        />
      )}

      {/* MODAL SERAHKAN KE TIM JAHIT */}
      {isJahitModalOpen && (
        <ModalSerahJahit
          isOpen={isJahitModalOpen}
          targetItems={jahitTargetItems}
          form={jahitForm}
          setForm={setJahitForm}
          jahitEmployees={jahitEmployees}
          products={products}
          onClose={() => setIsJahitModalOpen(false)}
          onSubmit={handleSerahkanJahit}
        />
      )}

      {/* MODAL SERAHKAN KE TIM QC */}
      {isQcModalOpen && (
        <ModalSerahQC
          isOpen={isQcModalOpen}
          targetItems={qcTargetItems}
          form={qcForm}
          setForm={setQcForm}
          qcEmployees={qcEmployees}
          products={products}
          onClose={() => setIsQcModalOpen(false)}
          onSubmit={handleSerahkanQc}
        />
      )}

      {/* MODAL SERAHKAN KE TIM FINISHING (PASCA QC) */}
      {isFinishingModalOpen && (
        <ModalSerahFinishing
          isOpen={isFinishingModalOpen}
          targetItems={finishingTargetItems}
          form={finishingForm}
          setForm={setFinishingForm}
          finishingEmployees={finishingEmployees}
          products={products}
          onClose={() => setIsFinishingModalOpen(false)}
          onSubmit={handleSerahkanFinishing}
        />
      )}

      {/* MODAL SELESAI FINISHING & MASUK GUDANG JADI (STEP 6 SOP - FINAL) */}
      {isGudangJadiModalOpen && (
        <ModalSelesaiGudangJadi
          isOpen={isGudangJadiModalOpen}
          item={gudangJadiTargetItem}
          products={products}
          onClose={() => {
            setIsGudangJadiModalOpen(false);
            setGudangJadiTargetItem(null);
          }}
          onSubmit={handleConfirmSelesaiGudangJadi}
        />
      )}

      {/* MODAL HISTORI PENYERAHAN TIM CUTTING */}
      {isCuttingHistoryModalOpen && (
        <ModalHistoriCutting
          isOpen={isCuttingHistoryModalOpen}
          antreanList={antreanList}
          onClose={() => setIsCuttingHistoryModalOpen(false)}
        />
      )}

      {/* 7. MODAL FORM TAMBAH / EDIT ANTREAN (FULL SCREEN MODERN & LEGA) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header Full Screen (Clean Dark Modern Slate) */}
          <div className="bg-[#0b1329] text-white px-4 py-2.5 flex items-center justify-between shadow-sm shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/15 shadow-xs"
                title="Kembali ke Daftar Antrean"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 leading-none">
                    <h3 className="font-extrabold text-sm text-white">
                      {modalMode === "create"
                        ? "Pendaftaran SPK Permintaan Baru"
                        : "Edit Lembar SPK Produksi"}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 font-mono text-[9px] font-extrabold border border-sky-400/30">
                      STEP 1 SOP
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-none">
                    Pendaftaran Surat Perintah Kerja (SPK) batch produksi & alokasi bahan baku
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors border border-white/15"
              title="Tutup Form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Body - Full Width 100% & Compact Spacing */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 w-full">
            <form
              id="form-antrean-fullscreen"
              onSubmit={handleSubmit}
              noValidate
              className="w-full space-y-2 text-xs pb-3"
            >
              {/* CARD 1: PRODUK & TARGET JUMLAH (COMPACT 100% WIDTH) */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 sm:p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-sky-100 text-[#0284c7] flex items-center justify-center text-[9.5px] font-black">
                      1
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 leading-none">
                        Pilih Model Produk & Target Produksi{" "}
                        <span className="text-rose-500">*</span>
                      </h4>
                    </div>
                  </div>
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProductComboboxOpen(true);
                        setProductComboboxSearch("");
                      }}
                      className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-bold text-[10.5px] cursor-pointer transition-colors border border-sky-200/60"
                    >
                      Ganti Produk
                    </button>
                  )}
                </div>

                {/* Combobox Trigger Button & Dropdown Container */}
                <div className="relative" ref={comboboxRef}>
                  <button
                    type="button"
                    onClick={() => setIsProductComboboxOpen((prev) => !prev)}
                    className={`w-full h-8 px-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isProductComboboxOpen
                        ? "border-[#0284c7] ring-1 ring-[#0284c7]/20 bg-white"
                        : selectedProduct
                          ? "border-sky-300 bg-sky-50/20 hover:bg-sky-50/50"
                          : "border-slate-200 bg-slate-50/70 hover:bg-white hover:border-[#0284c7]"
                    }`}
                  >
                    {selectedProduct ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              selectedProduct.warnaHex ||
                              selectedProduct.warna_hex ||
                              "#cbd5e1",
                          }}
                        />
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-black text-xs text-[#0284c7] bg-white px-2 py-0.5 rounded-md border border-sky-200">
                            {selectedProduct.sku}
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs truncate">
                            {getProdName(selectedProduct)}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            • {selectedProduct.kategori || "Kaos"} (
                            {selectedProduct.varian || "Polos"} /{" "}
                            {selectedProduct.ukuran || "All Size"})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium">
                          -- Cari & Pilih Produk (SKU) --
                        </span>
                      </div>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isProductComboboxOpen ? "rotate-180 text-[#0284c7]" : ""
                      }`}
                    />
                  </button>

                  {/* POP-OVER DROPDOWN DENGAN SEARCH INPUT */}
                  {isProductComboboxOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                      {/* Search Bar Input inside Combobox */}
                      <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Ketik SKU, nama baju, warna, atau ukuran..."
                          value={productComboboxSearch}
                          onChange={(e) =>
                            setProductComboboxSearch(e.target.value)
                          }
                          className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
                        />
                        {productComboboxSearch && (
                          <button
                            type="button"
                            onClick={() => setProductComboboxSearch("")}
                            className="p-0.5 hover:bg-slate-200 rounded text-slate-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* List Item Hasil Pencarian */}
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 p-1">
                        {filteredComboboxProducts.length === 0 ? (
                          <div className="py-4 text-center text-slate-400 text-xs">
                            <Shirt className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                            <p className="font-semibold text-slate-500">
                              Produk tidak ditemukan
                            </p>
                          </div>
                        ) : (
                          filteredComboboxProducts.map((p) => {
                            const isSelected = formData.sku === p.sku;
                            const prodName = getProdName(p);
                            const prodBahan = getProdBahan(p);

                            return (
                              <button
                                key={p.id || p.sku}
                                type="button"
                                onClick={() => {
                                  // Auto-load resep bahan produk jika tersedia
                                  let autoBahan = [];
                                  if (
                                    Array.isArray(p.kebutuhanBahan) &&
                                    p.kebutuhanBahan.length > 0
                                  ) {
                                    autoBahan = p.kebutuhanBahan;
                                  } else if (
                                    typeof p.kebutuhanBahan === "string"
                                  ) {
                                    try {
                                      const parsed = JSON.parse(
                                        p.kebutuhanBahan,
                                      );
                                      if (
                                        Array.isArray(parsed) &&
                                        parsed.length > 0
                                      )
                                        autoBahan = parsed;
                                    } catch (_) {}
                                  }
                                  if (autoBahan.length === 0 && p.sku) {
                                    try {
                                      const cached = localStorage.getItem(
                                        `konveksi_resep_${p.sku}`,
                                      );
                                      if (cached) {
                                        const parsed = JSON.parse(cached);
                                        if (
                                          Array.isArray(parsed) &&
                                          parsed.length > 0
                                        )
                                          autoBahan = parsed;
                                      }
                                    } catch (_) {}
                                  }
                                  const reconciledBahan = autoBahan.map(
                                    (r, i) => {
                                      const match = (Array.isArray(bahan) ? bahan : []).find(
                                        (m) =>
                                          (r.kodeBahan &&
                                            m.kodeBahan === r.kodeBahan) ||
                                          (m.namaBahan || "").toLowerCase() ===
                                            (r.namaBahan || "").toLowerCase(),
                                      );
                                      return {
                                        id: Date.now() + i + Math.random(),
                                        kodeBahan:
                                          match?.kodeBahan || r.kodeBahan || "",
                                        namaBahan:
                                          match?.namaBahan || r.namaBahan || "",
                                        satuan:
                                          match?.satuan || r.satuan || "Pcs",
                                        hargaSatuan: Number(
                                          match?.harga ?? r.hargaSatuan ?? 0,
                                        ),
                                        stokSaatIni: Number(match?.stok ?? 0),
                                        qty: Number(r.qty || r.qtyPerPcs || 1),
                                        catatan: r.catatan || "",
                                      };
                                    },
                                  );

                                  setFormData((prev) => ({
                                    ...prev,
                                    sku: p.sku,
                                    kebutuhanBahan:
                                      reconciledBahan.length > 0
                                        ? (() => {
                                            const unique = [];
                                            for (const it of reconciledBahan) {
                                              const k = (it.kodeBahan || it.namaBahan || "").trim().toLowerCase();
                                              if (!k) continue;
                                              const ex = unique.find(
                                                (u) => (u.kodeBahan || u.namaBahan || "").trim().toLowerCase() === k,
                                              );
                                              if (ex) {
                                                ex.qty = Number(
                                                  (
                                                    Number(ex.qty || 0) +
                                                    Number(it.qty || 1)
                                                  ).toFixed(2),
                                                );
                                              } else {
                                                unique.push({ ...it });
                                              }
                                            }
                                            return unique;
                                          })()
                                        : prev.kebutuhanBahan || [],
                                  }));
                                  setIsProductComboboxOpen(false);
                                  setProductComboboxSearch("");
                                }}
                                className={`w-full p-1.5 rounded text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? "bg-sky-50/80 border border-sky-300/60"
                                    : "hover:bg-slate-100/80 border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs"
                                    style={{
                                      backgroundColor:
                                        p.warnaHex || p.warna_hex || "#f1f5f9",
                                    }}
                                  >
                                    <Shirt className="w-3 h-3 text-slate-700/80" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 leading-none">
                                      <span className="font-mono font-bold text-[9.5px] text-[#0284c7] bg-white px-1 py-0.2 rounded border border-sky-200">
                                        {p.sku}
                                      </span>
                                      <span className="font-bold text-xs text-slate-900 truncate">
                                        {prodName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9.5px] text-slate-500 mt-0.5 truncate">
                                      <span>{p.kategori || "Kaos"}</span>
                                      <span>•</span>
                                      <span>
                                        {p.varian || "Polos"} (
                                        {p.ukuran || "All Size"})
                                      </span>
                                      {prodBahan && prodBahan !== "-" && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono text-cyan-700">
                                            Kain: {prodBahan}
                                          </span>
                                        </>
                                      )}
                                      {Number(p.harga || 0) > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono font-bold text-emerald-700">
                                            Rp{" "}
                                            {Number(p.harga).toLocaleString(
                                              "id-ID",
                                            )}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                  </div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 1.2 Target Qty, Deadline, dan Prioritas dalam 1 Baris Sejajar Compact */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                  {/* Target Qty (5 col) */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[10.5px] font-black text-slate-700">
                      Target Qty Produksi (Pcs){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            qty: Math.max(1, Number(prev.qty || 1) - 10),
                          }))
                        }
                        className="w-7.5 h-7.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.qty}
                        onChange={(e) =>
                          setFormData({ ...formData, qty: e.target.value })
                        }
                        className="w-16 h-7.5 px-1.5 text-center rounded-lg border border-slate-200 font-mono font-black text-xs text-slate-900 focus:outline-none focus:border-[#0284c7]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            qty: Number(prev.qty || 0) + 10,
                          }))
                        }
                        className="w-7.5 h-7.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
                      >
                        +
                      </button>
                      {/* Quick Preset Chips */}
                      <div className="flex items-center gap-1 flex-1">
                        {[50, 100, 200, 500].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, qty: val })
                            }
                            className={`flex-1 h-7.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                              Number(formData.qty) === val
                                ? "bg-[#0284c7] text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tingkat Prioritas (4 col) */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[10.5px] font-black text-slate-700">
                      Tingkat Prioritas
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg border border-slate-200 bg-slate-50/60 shadow-2xs">
                      {[
                        {
                          id: "Urgent",
                          label: "Urgent",
                          icon: Flame,
                          activeClass:
                            "bg-rose-500 text-white border border-rose-600 shadow-2xs font-extrabold",
                          inactiveClass:
                            "bg-white text-rose-700 border border-rose-200/90 hover:bg-rose-50 hover:border-rose-300",
                        },
                        {
                          id: "Normal",
                          label: "Normal",
                          icon: Clock,
                          activeClass:
                            "bg-[#0284c7] text-white border border-[#0369a1] shadow-2xs font-extrabold",
                          inactiveClass:
                            "bg-white text-slate-700 border border-slate-200 hover:bg-sky-50/60 hover:text-[#0284c7] hover:border-sky-300",
                        },
                        {
                          id: "Low",
                          label: "Low",
                          icon: Sparkles,
                          activeClass:
                            "bg-slate-700 text-white border border-slate-800 shadow-2xs font-extrabold",
                          inactiveClass:
                            "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                        },
                      ].map((prio) => {
                        const Icon = prio.icon;
                        const isSelected = formData.prioritas === prio.id;
                        return (
                          <button
                            key={prio.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                prioritas: prio.id,
                              })
                            }
                            className={`h-7 px-1 rounded-md text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected ? prio.activeClass : prio.inactiveClass
                            }`}
                          >
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{prio.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deadline Target Selesai (3 col) */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-[10.5px] font-black text-slate-700">
                      Deadline Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full h-7.5 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: KEBUTUHAN BAHAN & AKSESORIS PRODUKSI (BOM) */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 sm:p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[9.5px] font-black">
                      2
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-slate-900 leading-none">
                          Kebutuhan Bahan Baku & Aksesoris per Pcs
                        </h4>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[9.5px] font-bold">
                          {formData.kebutuhanBahan?.length || 0} Terdaftar
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">
                        Resep otomatis tersimpan & memotong stok gudang saat
                        proses cutting
                      </p>
                    </div>
                  </div>

                  {formData.sku && (
                    <button
                      type="button"
                      onClick={() => handleAddKebutuhanBahan("", "Pcs")}
                      className="h-7 px-2.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tambah Bahan</span>
                    </button>
                  )}
                </div>

                {!formData.sku ? (
                  <div className="py-4 px-3 text-center bg-slate-50/70 rounded-lg border border-slate-100 text-slate-400 text-xs space-y-0.5">
                    <Boxes className="w-5 h-5 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-xs">
                      Pilih Produk (SKU) Terlebih Dahulu
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Rincian bahan baku dapat diinput setelah SKU dipilih di
                      atas.
                    </p>
                  </div>
                ) : !formData.kebutuhanBahan ||
                  formData.kebutuhanBahan.length === 0 ? (
                  <div className="py-4 px-3 text-center bg-slate-50/70 rounded-lg border border-slate-100 text-slate-500 text-xs space-y-0.5">
                    <p className="font-bold text-slate-700 text-xs">
                      Belum ada bahan baku terdaftar untuk produk ini.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Klik tombol <strong>+ Tambah Bahan</strong> di kanan atas
                      untuk memilih bahan dari Master Database.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-100 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[9.5px] font-bold uppercase tracking-wider">
                          <th className="py-1.5 px-2 text-center w-8">No</th>
                          <th className="py-1.5 px-2 min-w-[220px]">
                            Bahan Baku (Database)
                          </th>
                          <th className="py-1.5 px-1.5 text-center w-20">
                            Qty/Pcs
                          </th>
                          <th className="py-1.5 px-1.5 w-24">Satuan</th>
                          <th className="py-1.5 px-1.5 text-center w-24">
                            Total SPK
                          </th>
                          <th className="py-1.5 px-2 text-right w-28">
                            Harga Satuan
                          </th>
                          <th className="py-1.5 px-2 text-right w-28">
                            Subtotal
                          </th>
                          <th className="py-1.5 px-2 min-w-[130px]">
                            Catatan / Spek
                          </th>
                          <th className="py-1.5 px-1 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {formData.kebutuhanBahan.map((item, idx) => {
                          const itemQty = Number(item.qty) || 0;
                          const itemHarga = Number(item.hargaSatuan) || 0;
                          const itemSubtotal = itemQty * itemHarga;
                          const matchedBahan = (bahan || []).find(
                            (b) =>
                              (item.kodeBahan && b.kodeBahan === item.kodeBahan) ||
                              (b.namaBahan &&
                                (item.namaBahan || "").toLowerCase() ===
                                  b.namaBahan.toLowerCase()),
                          );
                          const currentSatuan =
                            matchedBahan?.satuan || item.satuan || "-";

                          return (
                            <tr
                              key={item.id || idx}
                              className="hover:bg-sky-50/30 transition-colors"
                            >
                              <td className="py-1 px-2 text-center font-bold text-slate-400 text-[10.5px]">
                                {idx + 1}
                              </td>
                              <td className="py-1 px-2">
                                <SearchableBahanSelectDesktop
                                  masterBahan={bahan}
                                  selectedKode={item.kodeBahan}
                                  selectedNama={item.namaBahan}
                                  disabledKodes={(formData.kebutuhanBahan || [])
                                    .filter((_, otherIdx) => otherIdx !== idx)
                                    .map((b) => b.kodeBahan || b.namaBahan)
                                    .filter(Boolean)}
                                  onSelect={(selected) =>
                                    handleSelectMasterBahan(idx, selected)
                                  }
                                />
                              </td>
                              <td className="py-1 px-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="1"
                                  value={item.qty ?? ""}
                                  onChange={(e) =>
                                    handleUpdateKebutuhanBahan(
                                      idx,
                                      "qty",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-7.5 px-1.5 text-center font-mono font-bold rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#0284c7]"
                                />
                              </td>
                              <td className="py-1 px-1.5 text-center">
                                <span className="inline-flex items-center justify-center w-full h-7.5 px-2 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-2xs select-none">
                                  {currentSatuan}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center">
                                <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  {Number(
                                    (
                                      (Number(item.qty) || 0) *
                                      (Number(formData.qty) || 0)
                                    ).toFixed(2),
                                  )}{" "}
                                  {currentSatuan}
                                </span>
                              </td>
                              <td className="py-1 px-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-[9.5px] text-slate-400 font-bold pointer-events-none">
                                    Rp
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={
                                      item.hargaSatuan !== undefined &&
                                      item.hargaSatuan !== "" &&
                                      item.hargaSatuan !== null &&
                                      Number(item.hargaSatuan) > 0
                                        ? Number(
                                            item.hargaSatuan,
                                          ).toLocaleString("id-ID")
                                        : item.hargaSatuan === 0 ||
                                            item.hargaSatuan === "0"
                                          ? "0"
                                          : ""
                                    }
                                    onChange={(e) =>
                                      handleUpdateKebutuhanBahan(
                                        idx,
                                        "hargaSatuan",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full h-7.5 pl-6 pr-2 text-right font-mono font-bold rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                                  />
                                </div>
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-xs text-slate-900">
                                Rp {itemSubtotal.toLocaleString("id-ID")}
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  placeholder="mis: warna senada..."
                                  value={item.catatan || ""}
                                  onChange={(e) =>
                                    handleUpdateKebutuhanBahan(
                                      idx,
                                      "catatan",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-7.5 px-2 rounded-md border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#0284c7]"
                                />
                              </td>
                              <td className="py-1 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteKebutuhanBahan(idx)
                                  }
                                  className="p-1 text-slate-300 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus Bahan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Subtotal Bahan Baku */}
                {formData.kebutuhanBahan &&
                  formData.kebutuhanBahan.length > 0 && (
                    <div className="flex items-center justify-between pt-1 px-1 text-xs">
                      <span className="text-slate-500 font-medium">
                        Total Bahan Terdaftar:{" "}
                        <strong>{formData.kebutuhanBahan.length} item</strong>
                      </span>
                      <div className="text-right">
                        <span className="text-slate-500 mr-2">
                          Estimasi Biaya Bahan:
                        </span>
                        <span className="font-mono font-black text-xs text-[#0284c7]">
                          Rp{" "}
                          {hppCalculation.totalBiayaBahan.toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
              </div>

              {/* CARD 3: DOKUMEN & INFORMASI TAMBAHAN (1 BARIS RINGKAS 100% WIDTH) */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 sm:p-3 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-indigo-100 text-indigo-800 flex items-center justify-center text-[9.5px] font-black">
                    3
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-none">
                    Dokumen & Catatan Tambahan (Opsional)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      No Antrian
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.noAntrian}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            noAntrian: e.target.value,
                          })
                        }
                        className="w-full h-7.5 px-2 rounded-lg border border-slate-200 font-mono font-bold text-[#0284c7] bg-slate-50 text-xs focus:bg-white focus:border-[#0284c7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            noAntrian: generateNoAntrian(),
                          })
                        }
                        className="absolute right-1 top-1 px-1 py-0.2 rounded text-[8.5px] font-bold text-slate-500 hover:text-[#0284c7] cursor-pointer"
                        title="Generate Acak Baru"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Tgl Masuk
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tglMasuk}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tglMasuk: e.target.value,
                        })
                      }
                      className="w-full h-7.5 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-bold text-slate-700">
                        Sumber
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSumberIndex(null);
                          setSumberInputText("");
                          setIsSumberModalOpen(true);
                        }}
                        className="text-[9px] text-[#0284c7] hover:underline font-bold"
                      >
                        Kelola
                      </button>
                    </div>
                    <select
                      value={formData.sumberPermintaan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sumberPermintaan: e.target.value,
                        })
                      }
                      className="w-full h-7.5 px-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:border-[#0284c7] cursor-pointer"
                    >
                      {sumberOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      No Referensi / PO
                    </label>
                    <input
                      type="text"
                      value={formData.noReff}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          noReff: e.target.value,
                        })
                      }
                      placeholder="mis: PO-CLIENT-08"
                      className="w-full h-7.5 px-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Catatan SOP
                    </label>
                    <input
                      type="text"
                      value={formData.catatan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          catatan: e.target.value,
                        })
                      }
                      placeholder="mis: Sablon DTF dada, jahit rantai..."
                      className="w-full h-7.5 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 4: KALKULATOR HPP BAHAN (HANYA HPP BAHAN SAAT INPUT SPK) */}
              <div className="bg-[#0b1329] text-white rounded-xl p-2.5 shadow-2xs border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9.5px] font-bold">
                      ⚡
                    </span>
                    <h4 className="font-extrabold text-xs text-emerald-400">
                      Estimasi HPP Bahan Baku
                    </h4>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono text-[9.5px]">
                    Batch: {Number(formData.qty || 0).toLocaleString("id-ID")}{" "}
                    Pcs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-[9.5px] text-slate-400 block">
                      Total Biaya Bahan Batch ({Number(formData.qty || 0).toLocaleString("id-ID")} Pcs)
                    </span>
                    <span className="font-mono font-bold text-sm text-sky-300 block mt-0.5">
                      Rp{" "}
                      {hppCalculation.totalBiayaBahanBatch.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-lg p-2 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-black text-emerald-300 tracking-wider">
                      ★ HPP BAHAN / PCS
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-400 mt-0.5">
                      Rp {hppCalculation.biayaBahanPerPcs.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Bottom Bar Full Screen (Compact & Sleek) */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm shrink-0 w-full">
            <div className="flex items-center gap-2.5 text-xs flex-wrap">
              <div className="text-slate-500 font-medium">
                No. Antrean:{" "}
                <span className="font-mono font-bold text-slate-800">
                  {formData.noAntrian || "-"}
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="font-semibold text-slate-700">
                Target:{" "}
                <strong className="text-[#0284c7]">
                  {Number(formData.qty || 0).toLocaleString("id-ID")} Pcs
                </strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="text-slate-700">
                HPP Bahan:{" "}
                <strong className="text-emerald-700 font-mono font-bold">
                  Rp {hppCalculation.biayaBahanPerPcs.toLocaleString("id-ID")} / Pcs
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 px-3.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-antrean-fullscreen"
                className="h-8 px-5 rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#075985] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {modalMode === "create"
                    ? "Simpan ke Antrean"
                    : "Perbarui Antrean"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA SUMBER PERMINTAAN (TAMBAH, EDIT, HAPUS) */}
      {isSumberModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Settings className="w-4 h-4 text-white" />
                <span>Kelola Sumber Permintaan</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSumberModalOpen(false)}
                className="text-white/80 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Form Input Tambah / Edit */}
              <form onSubmit={handleAddOrEditSumber} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nama Sumber (cth: TikTok Shop, PO Brand X)"
                  value={sumberInputText}
                  onChange={(e) => setSumberInputText(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs"
                >
                  {editingSumberIndex !== null ? "Simpan Edit" : "+ Tambah"}
                </button>
                {editingSumberIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSumberIndex(null);
                      setSumberInputText("");
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </form>

              {/* List Sumber yang Tersedia */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Daftar Sumber ({sumberOptions.length})
                </div>
                {sumberOptions.map((item, idx) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:bg-sky-50/50 transition-colors"
                  >
                    <span className="font-semibold text-slate-800">{item}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSumberIndex(idx);
                          setSumberInputText(item);
                        }}
                        className="p-1 text-slate-500 hover:text-[#0284c7] hover:bg-white rounded transition-colors cursor-pointer"
                        title="Edit Sumber"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSumber(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors cursor-pointer"
                        title="Hapus Sumber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 px-4 py-2 text-right border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSumberModalOpen(false)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Share Tracking Link Customer */}
      <ShareTrackingModal
        isOpen={Boolean(shareTrackingItem)}
        item={shareTrackingItem}
        onClose={() => setShareTrackingItem(null)}
      />

      {/* Modal Cetak SPK & QR Code */}
      <CetakSpkModal
        isOpen={Boolean(selectedCetakSpk)}
        antrean={selectedCetakSpk}
        antreanList={antreanList}
        products={products}
        onClose={() => setSelectedCetakSpk(null)}
      />

      {/* Modal Scanner Barcode / QR SPK */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        division="general"
        antreanList={antreanList}
        currentUser={null}
        onActionSuccess={(item) => {
          setSelectedAntreanShow(item);
        }}
      />
    </div>
  );
}
