import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Warehouse,
  Plus,
  Search,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  Package,
  Layers,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Check,
  Filter,
  FileSpreadsheet,
  Hash,
  Tag,
  Boxes,
  ChevronDown,
  Shirt,
  Sparkles,
  Settings,
  Scissors
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

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
                        <span
                          className={`font-extrabold text-xs truncate ${isAlreadySelected ? "text-slate-400 line-through" : ""}`}
                        >
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
        </div>
      )}
    </div>
  );
}

export default function PermintaanProduksiGudang({
  antreanList = [],
  setAntreanList,
  products = [],
  bahan = [],
  jasa = [],
  mutasiGudangJadiList = [],
  setMutasiGudangJadiList,
  onNavigateToMutasiGudang,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPrioritas, setFilterPrioritas] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Combobox Product state
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false);
  const [productComboboxSearch, setProductComboboxSearch] = useState('');
  const comboboxRef = useRef(null);

  // Sumber Permintaan State & Modal
  const [sumberOptions, setSumberOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('konveksi_sumber_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      'Stok Gudang',
      'PO Pelanggan',
      'Toko Offline',
      'Marketplace (Shopee/Tokped)',
      'Sample / Uji Model',
    ];
  });
  const [isSumberModalOpen, setIsSumberModalOpen] = useState(false);
  const [sumberInputText, setSumberInputText] = useState('');
  const [editingSumberIndex, setEditingSumberIndex] = useState(null);

  // Form State untuk Tambah Permintaan Baru oleh Gudang (Format SPK Lengkap)
  const [formData, setFormData] = useState({
    noAntrian: '',
    tglMasuk: new Date().toISOString().slice(0, 10),
    sumberPermintaan: 'Stok Gudang',
    noReff: '',
    sku: '',
    qty: 50,
    prioritas: 'Normal',
    deadline: '',
    catatan: 'Permintaan restock persediaan gudang jadi siap jual.',
    kebutuhanBahan: [],
  });

  // Helper get product info
  const getProdName = (p) => p?.nama || p?.namaProduk || p?.nama_produk || '-';
  const getProdBahan = (p) => p?.skuBahan || p?.sku_bahan || '-';

  // Selected product detail preview
  const selectedProduct = useMemo(() => {
    if (!formData.sku) return null;
    return products.find((p) => p.sku === formData.sku) || null;
  }, [formData.sku, products]);

  // Default Tarif Cutting dari Master Jasa
  const defaultTarifCutting = useMemo(() => {
    const item = (jasa || []).find((j) => {
      const k = (j.kodeJasa || '').toLowerCase();
      const n = (j.namaJasa || '').toLowerCase();
      return k.includes('cut') || n.includes('potong') || n.includes('cutting');
    });
    return item?.harga ? Number(item.harga) : 1500;
  }, [jasa]);

  // Default Tarif Jahit dari Master Jasa
  const defaultTarifJahit = useMemo(() => {
    const item = (jasa || []).find((j) => {
      const k = (j.kodeJasa || '').toLowerCase();
      const n = (j.namaJasa || '').toLowerCase();
      return k.includes('jahit') || n.includes('jahit') || n.includes('sew');
    });
    return item?.harga ? Number(item.harga) : 3500;
  }, [jasa]);

  // Kalkulasi HPP Otomatis (Biaya Bahan + Upah Borongan)
  const hppCalculation = useMemo(() => {
    const qtyTarget = Math.max(1, Number(formData.qty) || 1);

    const totalBiayaBahan = (formData.kebutuhanBahan || []).reduce(
      (acc, curr) => {
        const q = Number(curr.qty) || 0;
        const h = Number(curr.hargaSatuan) || 0;
        return acc + q * h;
      },
      0,
    );

    const tarifCut = Number(defaultTarifCutting) || 1500;
    const tarifJht = Number(defaultTarifJahit) || 3500;
    const tarifFin = 1000;
    const biayaCutting = qtyTarget * tarifCut;
    const biayaJahit = qtyTarget * tarifJht;
    const biayaFinishing = qtyTarget * tarifFin;
    const totalUpahBorongan = biayaCutting + biayaJahit + biayaFinishing;

    const totalHpp = totalBiayaBahan + totalUpahBorongan;
    const hppPerPcs = Math.round(totalHpp / qtyTarget);

    const hargaJual = Number(selectedProduct?.harga || 0);
    const profitPerPcs = hargaJual > 0 ? hargaJual - hppPerPcs : 0;
    const marginPersen =
      hargaJual > 0 ? Math.round((profitPerPcs / hargaJual) * 100) : 0;

    return {
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
      const sku = (p.sku || '').toLowerCase();
      const nama = getProdName(p).toLowerCase();
      const varian = (p.varian || '').toLowerCase();
      const ukuran = (p.ukuran || '').toLowerCase();
      const kat = (p.kategori || '').toLowerCase();
      const kain = (p.skuBahan || '').toLowerCase();
      return (
        sku.includes(q) ||
        nama.includes(q) ||
        varian.includes(q) ||
        ukuran.includes(q) ||
        kat.includes(q) ||
        kain.includes(q)
      );
    });
  }, [products, productComboboxSearch]);

  // Click outside Combobox dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target)
      ) {
        setIsProductComboboxOpen(false);
      }
    }
    if (isProductComboboxOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProductComboboxOpen]);

  // Generate No Antrean Otomatis
  const generateNoReq = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `ANT-${yyyy}${mm}${dd}-${rand}`;
  };

  // Helper Kelola Kebutuhan Bahan & Aksesoris
  const handleAddKebutuhanBahan = (
    defaultName = '',
    defaultSatuan = 'Pcs',
    defaultHarga = 0,
    defaultKode = '',
  ) => {
    if (!formData.sku) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Produk Dahulu',
        text: 'Silakan pilih produk (SKU) terlebih dahulu sebelum menambah kebutuhan bahan baku.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    const hasEmptyRow = (formData.kebutuhanBahan || []).some(
      (b) => !b.kodeBahan && !b.namaBahan,
    );
    if (hasEmptyRow) {
      Swal.fire({
        icon: 'info',
        title: 'Pilih Bahan Terlebih Dahulu',
        text: 'Silakan tentukan bahan pada baris yang masih kosong sebelum menambah baris baru.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    let matchedHarga = defaultHarga;
    let matchedSatuan = defaultSatuan;
    let matchedKode = defaultKode;
    let matchedStok = 0;
    if (defaultName || defaultKode) {
      const match = (bahan || []).find(
        (b) =>
          (defaultKode && b.kodeBahan === defaultKode) ||
          (b.namaBahan || '').toLowerCase() === (defaultName || '').toLowerCase() ||
          (b.kodeBahan || '').toLowerCase() === (defaultName || '').toLowerCase(),
      );
      if (match) {
        matchedHarga = Number(match.harga || 0);
        matchedSatuan = match.satuan || defaultSatuan;
        matchedKode = match.kodeBahan || '';
        matchedStok = Number(match.stok ?? 0);
      }
    }

    if (matchedKode || defaultName) {
      const alreadyExists = (formData.kebutuhanBahan || []).some(
        (b) =>
          (matchedKode && b.kodeBahan === matchedKode) ||
          (defaultName &&
            (b.namaBahan || '').toLowerCase() === defaultName.toLowerCase()),
      );
      if (alreadyExists) {
        Swal.fire({
          icon: 'warning',
          title: 'Bahan Baku Sudah Ada',
          text: `Bahan "${defaultName || matchedKode}" sudah ada di dalam SPK ini. Tidak boleh ada bahan baku yang sama.`,
          confirmButtonColor: '#0284c7',
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
          catatan: '',
        },
      ],
    }));
  };

  const handleSelectMasterBahan = (index, selectedBahan) => {
    const isDuplicate = (formData.kebutuhanBahan || []).some((item, i) => {
      if (i === index) return false;
      return (
        (selectedBahan.kodeBahan && item.kodeBahan === selectedBahan.kodeBahan) ||
        (selectedBahan.namaBahan &&
          (item.namaBahan || '').toLowerCase() ===
            selectedBahan.namaBahan.toLowerCase())
      );
    });

    if (isDuplicate) {
      Swal.fire({
        icon: 'warning',
        title: 'Bahan Baku Sudah Dipilih!',
        text: `Bahan "${selectedBahan.namaBahan}" sudah digunakan di baris lain. Tidak boleh ada bahan baku yang sama dalam satu produk/SPK. Silakan ubah Qty pada baris yang sudah ada.`,
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    setFormData((prev) => {
      const list = [...(prev.kebutuhanBahan || [])];
      list[index] = {
        ...list[index],
        kodeBahan: selectedBahan.kodeBahan || '',
        namaBahan: selectedBahan.namaBahan || '',
        satuan: selectedBahan.satuan || 'Pcs',
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
      if (field === 'hargaSatuan') {
        if (typeof value === 'string') {
          const raw = value.replace(/\D/g, '');
          valToSet = raw ? Number(raw) : 0;
        } else {
          valToSet = Number(value) || 0;
        }
      }
      const cur = { ...list[index], [field]: valToSet };
      if (field === 'namaBahan') {
        const match = (bahan || []).find(
          (b) =>
            (b.namaBahan || '').toLowerCase() === String(value).toLowerCase() ||
            (b.kodeBahan || '').toLowerCase() === String(value).toLowerCase(),
        );
        if (match) {
          if (!cur.hargaSatuan || Number(cur.hargaSatuan) === 0) {
            cur.hargaSatuan = Number(match.harga || 0);
          }
          if (!cur.satuan) cur.satuan = match.satuan || 'Pcs';
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

  // Helper Kelola Sumber Permintaan
  const handleAddOrEditSumber = (e) => {
    e.preventDefault();
    if (!sumberInputText.trim()) return;
    const trimmed = sumberInputText.trim();
    let nextList = [...sumberOptions];
    if (editingSumberIndex !== null) {
      nextList[editingSumberIndex] = trimmed;
    } else {
      if (!nextList.includes(trimmed)) {
        nextList.push(trimmed);
      }
    }
    setSumberOptions(nextList);
    try {
      localStorage.setItem('konveksi_sumber_options', JSON.stringify(nextList));
    } catch (_) {}
    setFormData((prev) => ({ ...prev, sumberPermintaan: trimmed }));
    setSumberInputText('');
    setEditingSumberIndex(null);
    setIsSumberModalOpen(false);
  };

  const handleDeleteSumber = (indexToDelete) => {
    const nextList = sumberOptions.filter((_, i) => i !== indexToDelete);
    setSumberOptions(nextList);
    try {
      localStorage.setItem('konveksi_sumber_options', JSON.stringify(nextList));
    } catch (_) {}
  };

  const handleOpenModal = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const deadlineStr = d.toISOString().slice(0, 10);

    const firstProduct = products.length > 0 ? products[0] : null;
    let initialBahan = [];
    if (firstProduct) {
      let autoBahan = [];
      if (
        Array.isArray(firstProduct.kebutuhanBahan) &&
        firstProduct.kebutuhanBahan.length > 0
      ) {
        autoBahan = firstProduct.kebutuhanBahan;
      } else if (typeof firstProduct.kebutuhanBahan === 'string') {
        try {
          const parsed = JSON.parse(firstProduct.kebutuhanBahan);
          if (Array.isArray(parsed) && parsed.length > 0) autoBahan = parsed;
        } catch (_) {}
      }
      if (autoBahan.length === 0 && firstProduct.sku) {
        try {
          const cached = localStorage.getItem(
            `konveksi_resep_${firstProduct.sku}`,
          );
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) autoBahan = parsed;
          }
        } catch (_) {}
      }
      initialBahan = autoBahan.map((r, i) => {
        const match = (bahan || []).find(
          (m) =>
            (r.kodeBahan && m.kodeBahan === r.kodeBahan) ||
            (m.namaBahan || '').toLowerCase() === (r.namaBahan || '').toLowerCase(),
        );
        return {
          id: Date.now() + i + Math.random(),
          kodeBahan: match?.kodeBahan || r.kodeBahan || '',
          namaBahan: match?.namaBahan || r.namaBahan || '',
          satuan: match?.satuan || r.satuan || 'Pcs',
          hargaSatuan: Number(match?.harga ?? r.hargaSatuan ?? 0),
          stokSaatIni: Number(match?.stok ?? 0),
          qty: Number(r.qty || r.qtyPerPcs || 1),
          catatan: r.catatan || '',
        };
      });
    }

    setFormData({
      noAntrian: generateNoReq(),
      tglMasuk: new Date().toISOString().slice(0, 10),
      sumberPermintaan: 'Stok Gudang',
      noReff: `RESTOCK-GDG-${new Date().getMonth() + 1}`,
      sku: firstProduct ? firstProduct.sku : '',
      qty: 50,
      prioritas: 'Normal',
      deadline: deadlineStr,
      catatan: 'Permintaan restock persediaan gudang jadi siap jual.',
      kebutuhanBahan: initialBahan,
    });
    setIsProductComboboxOpen(false);
    setProductComboboxSearch('');
    setIsModalOpen(true);
  };

  // Muat ulang antrean secara mandiri
  const refreshData = async () => {
    setLoading(true);
    try {
      const fresh = await api.getAntrean();
      if (Array.isArray(fresh) && setAntreanList) {
        setAntreanList(fresh);
      }
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Filter antrean khusus yang relevan dengan Gudang atau seluruh antrean
  const filteredList = useMemo(() => {
    return antreanList.filter((item) => {
      // Filter Status
      if (filterStatus === 'DIPROSES') {
        if (item.status === 'Selesai' || item.status === 'Menunggu Penerimaan Gudang') return false;
      } else if (filterStatus === 'SIAP_TERIMA') {
        if (item.status !== 'Menunggu Penerimaan Gudang' && item.status !== 'Selesai') return false;
      }

      // Filter Prioritas
      if (filterPrioritas && item.prioritas !== filterPrioritas) return false;

      // Filter Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const no = (item.noAntrian || '').toLowerCase();
        const reff = (item.noReff || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const nama = (item.namaProduk || '').toLowerCase();
        const varian = (item.varian || '').toLowerCase();
        if (!no.includes(q) && !reff.includes(q) && !sku.includes(q) && !nama.includes(q) && !varian.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [antreanList, filterStatus, filterPrioritas, searchTerm]);

  // Statistik KPI Permintaan Gudang
  const stats = useMemo(() => {
    const total = antreanList.length;
    const diproses = antreanList.filter(
      (a) => a.status !== 'Selesai' && a.status !== 'Menunggu Penerimaan Gudang'
    ).length;
    const siapTerima = antreanList.filter(
      (a) => a.status === 'Menunggu Penerimaan Gudang' || a.status === 'Proses Finishing'
    ).length;
    const selesai = antreanList.filter((a) => a.status === 'Selesai').length;
    const totalPcs = antreanList.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

    return { total, diproses, siapTerima, selesai, totalPcs };
  }, [antreanList]);

  // Submit Simpan Permintaan Baru ke Antrean Produksi
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sku) {
      Swal.fire('Peringatan', 'Silakan pilih model produk (SKU) konveksi!', 'warning');
      return;
    }

    const payload = {
      noAntrian: formData.noAntrian || generateNoReq(),
      tglMasuk: formData.tglMasuk,
      sumberPermintaan: formData.sumberPermintaan,
      noReff: formData.noReff || '-',
      sku: selectedProduct?.sku || formData.sku,
      namaProduk: getProdName(selectedProduct),
      kategori: selectedProduct?.kategori || '-',
      varian: selectedProduct?.varian || 'Polos',
      ukuran: selectedProduct?.ukuran || 'All Size',
      skuBahan: getProdBahan(selectedProduct),
      qty: Number(formData.qty) || 1,
      prioritas: formData.prioritas || 'Normal',
      status: 'Menunggu Cutting',
      deadline: formData.deadline || null,
      catatan: formData.catatan || '',
      kebutuhanBahan: formData.kebutuhanBahan || [],
      totalBiayaBahan: hppCalculation.totalBiayaBahan,
      totalHpp: hppCalculation.totalHpp,
      hppPerPcs: hppCalculation.hppPerPcs,
    };

    try {
      const res = await api.createAntrean(payload);
      const newEntry = res?.id ? { ...payload, id: res.id } : { ...payload, id: Date.now() };

      if (setAntreanList) {
        setAntreanList((prev) => {
          const next = [newEntry, ...prev];
          try {
            localStorage.setItem('konveksi_antrean_list', JSON.stringify(next));
          } catch (_) {}
          return next;
        });
      }

      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Permintaan Berhasil Dikirim!',
        text: `Nomor ${newEntry.noAntrian} (${newEntry.namaProduk} - ${newEntry.qty} Pcs) telah masuk ke Divisi Cutting untuk diproses.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem saat membuat permintaan.', 'error');
    }
  };

  // Helper Badge Status Tahapan Pabrik
  const getTahapBadge = (status) => {
    if (status === 'Menunggu Cutting') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          Menunggu Cutting (Di Divisi Cutting)
        </span>
      );
    }
    if (status === 'Proses Cutting' || status === 'Sedang Diproses') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
          Proses Cutting
        </span>
      );
    }
    if (status === 'Proses Jahit') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
          Proses Jahit
        </span>
      );
    }
    if (status === 'Proses QC') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
          Proses QC
        </span>
      );
    }
    if (status === 'Proses Finishing') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Proses Finishing
        </span>
      );
    }
    if (status === 'Menunggu Penerimaan Gudang') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">
          ★ Siap Diterima Gudang
        </span>
      );
    }
    if (status === 'Selesai') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          <span>Selesai di Rak</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        {status}
      </span>
    );
  };

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. TOP BANNER HEADER KHUSUS ADMIN GUDANG */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white rounded-xl p-3 sm:px-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Permintaan Produksi (Input Gudang)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10px] font-black uppercase">
                Admin Gudang
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Input permintaan restock persediaan barang jadi atau pesanan klien langsung ke lini antrean produksi pabrik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3] text-amber-700" />
            <span>Buat Permintaan Produksi</span>
          </button>
        </div>
      </div>

      {/* 2. KPI RINGKASAN PERMINTAAN GUDANG */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Permintaan</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1 font-mono leading-none">
            {stats.total}{' '}
            <span className="text-xs font-medium text-slate-500 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Total {stats.totalPcs.toLocaleString('id-ID')} Pcs target
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-sky-700 uppercase tracking-wider flex items-center justify-between">
            <span>Sedang Dikerjakan</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-lg font-black text-sky-900 mt-1 font-mono leading-none">
            {stats.diproses}{' '}
            <span className="text-xs font-medium text-sky-600 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-sky-700 mt-0.5">
            Cutting, Jahit, QC, Finishing
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Siap Diterima Gudang</span>
            <Package className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-900 mt-1 font-mono leading-none">
            {stats.siapTerima}{' '}
            <span className="text-xs font-medium text-emerald-600 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">
            Finishing beres, siap masuk rak
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Selesai di Rak</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-800 mt-1 font-mono leading-none">
            {stats.selesai}{' '}
            <span className="text-xs font-medium text-slate-500 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Sudah di rak gudang jadi
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR FILTER & SEARCH */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-amber-700 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('DIPROSES')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'DIPROSES'
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sedang Diproduksi ({stats.diproses})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('SIAP_TERIMA')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'SIAP_TERIMA'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Siap Diterima ({stats.siapTerima})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari No Req, Reff PO, SKU, Model Produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-amber-600 text-slate-800"
            />
          </div>

          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 text-slate-700 cursor-pointer"
          >
            <option value="">Semua Prioritas</option>
            <option value="Urgent">Urgent</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* 4. TABEL PERMINTAAN PRODUKSI OLEH GUDANG (STYLE ELEGAN & SOFT GRAY BORDER) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 border-r border-[#3b4c5e] text-white font-bold">
                  NO
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  NO. REQ & TGL
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  TUJUAN & REFF PO
                </th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-[#3b4c5e] text-white font-bold">
                  MODEL PRODUK (SKU & VARIAN)
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">
                  TARGET QTY
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">
                  DEADLINE TARGET
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  STATUS DI PABRIK
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[100px] text-white font-bold">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Warehouse className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-700">
                      Belum ada permintaan produksi
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik "+ Buat Permintaan Produksi" untuk mengajukan kebutuhan stok baru ke lini produksi
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isUrgent = item.prioritas === 'Urgent';
                  const isReadyForGudang =
                    item.status === 'Menunggu Penerimaan Gudang' || item.status === 'Selesai';

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                      {/* NO */}
                      <td className="py-2 px-2 text-center text-slate-600 font-bold font-mono border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO REQ & TANGGAL */}
                      <td className="py-2 px-3 border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-xs text-[#0284c7]">
                            {item.noAntrian}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{item.tglMasuk}</span>
                          </div>
                        </div>
                      </td>

                      {/* TUJUAN & REFF PO */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.sumberPermintaan || 'Stok Gudang'}
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                            Reff: <strong>{item.noReff || '-'}</strong>
                          </span>
                        </div>
                      </td>

                      {/* MODEL PRODUK */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-extrabold text-[10px] text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 shrink-0">
                              {item.sku}
                            </span>
                            <span className="font-bold text-slate-900 text-xs truncate" title={item.namaProduk}>
                              {item.namaProduk}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200 text-[10px]">
                              {item.varian || 'Polos'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                              {item.ukuran || 'All Size'}
                            </span>
                            {item.catatan && (
                              <span className="text-slate-400 italic truncate max-w-xs text-[10px]">
                                • {item.catatan}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* TARGET QTY & PRIORITAS */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                            {Number(item.qty).toLocaleString('id-ID')}{' '}
                            <span className="text-[10px] font-medium text-slate-500 font-sans">Pcs</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {isUrgent && <Flame className="w-3 h-3 text-rose-600" />}
                            <span>{item.prioritas}</span>
                          </span>
                        </div>
                      </td>

                      {/* DEADLINE TARGET */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col items-center font-mono text-xs">
                          <span className="font-bold text-slate-800">
                            {item.deadline || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400">Target Masuk</span>
                        </div>
                      </td>

                      {/* STATUS DI PABRIK */}
                      <td className="py-2 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                        {getTahapBadge(item.status)}
                      </td>

                      {/* AKSI */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Terima ke Gudang Jadi jika sudah selesai finishing */}
                          {item.status === 'Menunggu Penerimaan Gudang' && onNavigateToMutasiGudang && (
                            <button
                              type="button"
                              onClick={() => onNavigateToMutasiGudang(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Buka Mutasi Gudang Jadi untuk Penerimaan Rak"
                            >
                              <Package className="w-3 h-3" />
                              <span>Terima</span>
                            </button>
                          )}

                          {/* Tombol Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedItemDetail(item)}
                            className="w-7 h-7 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Lihat Detail Permintaan"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </button>

                          {/* Tombol Hapus (hanya jika belum mulai dipotong) */}
                          {item.status === 'Menunggu Cutting' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await Swal.confirm(
                                  'Batalkan Permintaan?',
                                  `Yakin ingin menghapus permintaan ${item.noAntrian} (${item.namaProduk})?`
                                );
                                if (res.isConfirmed) {
                                  try {
                                    await api.deleteAntrean(item.id);
                                    if (setAntreanList) {
                                      setAntreanList((prev) => prev.filter((a) => a.id !== item.id));
                                    }
                                    Swal.success('Terhapus', 'Permintaan produksi berhasil dibatalkan.');
                                  } catch (err) {
                                    Swal.fire('Gagal', err.message || 'Tidak dapat membatalkan permintaan', 'error');
                                  }
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Batalkan Permintaan (Hanya sebelum cutting)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
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
        <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredList.length}</span> dari{' '}
            <span className="font-bold text-slate-900">{antreanList.length}</span> permintaan produksi
          </div>
          <div className="text-slate-400 text-[11px]">
            * Data tersinkronisasi otomatis dengan Antrean Produksi di Pabrik
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM: INPUT PERMINTAAN PRODUKSI BARU OLEH ADMIN GUDANG (IDENTIK FORM SPK) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header Full Screen (Clean Dark Modern Slate) */}
          <div className="bg-[#0b1329] text-white px-4 py-2.5 flex items-center justify-between shadow-sm shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/15 shadow-xs"
                title="Kembali ke Daftar Permintaan"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 leading-none">
                    <h3 className="font-extrabold text-sm text-white">
                      Pendaftaran SPK Permintaan Baru
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
                            const pBahan = getProdBahan(p);

                            return (
                              <button
                                key={p.id || p.sku}
                                type="button"
                                onClick={() => {
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
                                      const match = (bahan || []).find(
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
                                              const k = (
                                                it.kodeBahan ||
                                                it.namaBahan ||
                                                ""
                                              )
                                                .trim()
                                                .toLowerCase();
                                              if (!k) continue;
                                              const ex = unique.find(
                                                (u) =>
                                                  (
                                                    u.kodeBahan ||
                                                    u.namaBahan ||
                                                    ""
                                                  )
                                                    .trim()
                                                    .toLowerCase() === k,
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
                                      {pBahan && pBahan !== "-" && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono text-cyan-700">
                                            Kain: {pBahan}
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
                            noAntrian: generateNoReq(),
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

              {/* CARD 4: KALKULATOR HPP & RINGKASAN BIAYA (COMPACT STRIP) */}
              <div className="bg-[#0b1329] text-white rounded-xl p-2.5 shadow-2xs border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9.5px] font-bold">
                      ⚡
                    </span>
                    <h4 className="font-extrabold text-xs text-emerald-400">
                      Kalkulator Estimasi HPP
                    </h4>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono text-[9.5px]">
                    Batch: {Number(formData.qty || 0).toLocaleString("id-ID")}{" "}
                    Pcs
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-[9.5px] text-slate-400 block">
                      Biaya Bahan Baku
                    </span>
                    <span className="font-mono font-bold text-xs text-sky-300 block mt-0.5">
                      Rp{" "}
                      {hppCalculation.totalBiayaBahan.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-[9.5px] text-slate-400 block">
                      Upah Borongan Pabrik
                    </span>
                    <span className="font-mono font-bold text-xs text-amber-300 block mt-0.5">
                      Rp{" "}
                      {hppCalculation.totalUpahBorongan.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-[9.5px] text-slate-400 block">
                      Total Biaya Batch
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-100 block mt-0.5">
                      Rp {hppCalculation.totalHpp.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-lg p-2 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-black text-emerald-300 tracking-wider">
                      ★ ESTIMASI HPP / PCS
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-400 mt-0.5">
                      Rp {hppCalculation.hppPerPcs.toLocaleString("id-ID")}
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
                Estimasi HPP:{" "}
                <strong className="text-emerald-700 font-mono font-bold">
                  Rp {hppCalculation.hppPerPcs.toLocaleString("id-ID")} / Pcs
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
                <span>Simpan ke Antrean</span>
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

              {/* List Sumber Saat Ini */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Daftar Pilihan Sumber ({sumberOptions.length}):
                </span>
                {sumberOptions.map((opt, idx) => (
                  <div
                    key={opt}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs transition-colors"
                  >
                    <span className="font-semibold text-slate-800">{opt}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSumberIndex(idx);
                          setSumberInputText(opt);
                        }}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                        title="Edit Sumber"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSumber(idx)}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                        title="Hapus Sumber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSumberModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL PERMINTAAN */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#0b1329] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-sm text-white">
                  Rincian Permintaan Produksi ({selectedItemDetail.noAntrian})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">No. Permintaan</span>
                  <strong className="text-slate-900 font-mono">{selectedItemDetail.noAntrian}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tanggal Pengajuan</span>
                  <strong className="text-slate-900 font-mono">{selectedItemDetail.tglMasuk}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tujuan & Reff</span>
                  <strong className="text-slate-900">{selectedItemDetail.sumberPermintaan} ({selectedItemDetail.noReff || '-'})</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Deadline Target</span>
                  <strong className="text-slate-900 font-mono">{selectedItemDetail.deadline || '-'}</strong>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Produk yang Diproduksi</span>
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedItemDetail.namaProduk}
                </div>
                <div className="text-slate-600 flex items-center gap-2">
                  <span>SKU: {selectedItemDetail.sku}</span>
                  <span>•</span>
                  <span>Varian: {selectedItemDetail.varian || 'Polos'}</span>
                  <span>•</span>
                  <span>Ukuran: {selectedItemDetail.ukuran || 'All Size'}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Jumlah Target Produksi:</span>
                  <strong className="font-mono text-base text-amber-700">
                    {Number(selectedItemDetail.qty).toLocaleString('id-ID')} Pcs
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-800 uppercase font-bold">Status Saat Ini di Pabrik</span>
                <div className="pt-1">{getTahapBadge(selectedItemDetail.status)}</div>
                {selectedItemDetail.catatan && (
                  <p className="text-[11px] text-amber-900 pt-1 italic">
                    Instruksi: "{selectedItemDetail.catatan}"
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
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

