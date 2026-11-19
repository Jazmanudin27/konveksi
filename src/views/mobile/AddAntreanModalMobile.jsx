import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Scissors,
  X,
  Search,
  Package,
  ChevronDown,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Boxes,
} from 'lucide-react';
import { api } from '../../services/api';

// Helper deteksi warna hex dari nama varian
function getVariantColor(varian = '') {
  const v = (varian || '').toUpperCase();
  if (v.includes('HITAM') || v.includes('BLACK')) return '#1e293b';
  if (v.includes('NAVY') || v.includes('BLUE')) return '#1e3a8a';
  if (v.includes('PUTIH') || v.includes('WHITE') || v.includes('BW')) return '#f8fafc';
  if (v.includes('MAROON') || v.includes('MERAH')) return '#991b1b';
  if (v.includes('ARMY')) return '#365314';
  if (v.includes('SAGE')) return '#84a98c';
  if (v.includes('KHAKI') || v.includes('BISKUIT') || v.includes('TANAH')) return '#d4b996';
  if (v.includes('COKSU') || v.includes('COKLAT') || v.includes('MOCCA')) return '#854d0e';
  if (v.includes('GREY') || v.includes('ABU')) return '#64748b';
  if (v.includes('PINK') || v.includes('DUSTY') || v.includes('ROSE')) return '#f43f5e';
  if (v.includes('LILAC') || v.includes('UNGU')) return '#a855f7';
  if (v.includes('KUNING') || v.includes('MUSTARD')) return '#eab308';
  if (v.includes('TERRACOTTA') || v.includes('BATA')) return '#c2410c';
  if (v.includes('TAUPE')) return '#8d7b68';
  return '#64748b';
}

// Sub-komponen Select Produk Searchable Mobile
function SearchableProductSelectMobile({
  products = [],
  selectedSku,
  onSelectSku,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const searchInputRef = useRef(null);

  const selectedProd = useMemo(() => {
    return products.find((p) => p.sku === selectedSku);
  }, [products, selectedSku]);

  // Kategori unik untuk filter cepat
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
      else if (p.namaProduk) set.add(p.namaProduk);
    });
    return Array.from(set).slice(0, 10);
  }, [products]);

  // Filter produk berdasarkan search & kategori
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          p.kategori === selectedCategory || p.namaProduk === selectedCategory
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          (p.sku || '').toLowerCase().includes(q) ||
          (p.namaProduk || '').toLowerCase().includes(q) ||
          (p.varian || '').toLowerCase().includes(q) ||
          (p.kategori || '').toLowerCase().includes(q) ||
          (Array.isArray(p.ukuran) ? p.ukuran.join(' ') : (p.ukuran || '')).toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, query, selectedCategory]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
        Pilih Produk (SKU) <span className="text-rose-500">*</span>
      </label>

      {/* Tampilan jika belum dibuka */}
      {!isOpen && (
        <>
          {!selectedProd ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setQuery('');
              }}
              className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-emerald-500 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-slate-600">-- Cari & Pilih Produk (SKU) --</span>
                  <p className="text-[10px] text-slate-400">Tersedia {products.length} SKU katalog</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
            </button>
          ) : (
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                  style={{
                    backgroundColor:
                      selectedProd.warnaHex || getVariantColor(selectedProd.varian),
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-xs text-emerald-950 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                      {selectedProd.sku}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {selectedProd.namaProduk}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-slate-600">
                    <span className="font-semibold text-slate-700">{selectedProd.varian}</span>
                    <span>•</span>
                    <span className="bg-white/80 px-1 py-0.2 rounded border border-emerald-200 font-bold text-slate-800">
                      Size: {Array.isArray(selectedProd.ukuran) ? selectedProd.ukuran[0] : selectedProd.ukuran}
                    </span>
                    {selectedProd.hargaPotong ? (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          Rp {Number(selectedProd.hargaPotong).toLocaleString('id-ID')}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    setQuery('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 cursor-pointer shadow-2xs"
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSku('')}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer"
                  title="Hapus pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mode Terbuka / Picker Popover */}
      {isOpen && (
        <div className="mt-1 bg-white border-2 border-emerald-600 rounded-2xl shadow-xl overflow-hidden p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Bar Pencarian */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-emerald-700 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari SKU, nama model, varian, ukuran..."
              className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Quick Category Chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                  !selectedCategory
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? '' : cat)
                  }
                  className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Daftar Produk */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
            {filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <Package className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Tidak ada produk ditemukan</p>
                <p className="text-[10px] text-slate-400">Coba kata kunci atau varian lain</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.sku === selectedSku;
                const sizeText = Array.isArray(p.ukuran) ? p.ukuran[0] : (p.ukuran || '-');
                return (
                  <button
                    key={p.id || p.sku}
                    type="button"
                    onClick={() => {
                      onSelectSku(p.sku);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-100/90 text-emerald-950 font-bold'
                        : 'hover:bg-emerald-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                        style={{
                          backgroundColor:
                            p.warnaHex || getVariantColor(p.varian),
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-[11px] text-emerald-900 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {p.sku}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 truncate">
                            {p.namaProduk}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{p.varian || 'Standar'}</span>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold border border-slate-200 text-[10px]">
                            {sizeText}
                          </span>
                          {p.kategori && (
                            <span className="text-slate-400 text-[9.5px]">({p.kategori})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.hargaPotong ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Rp {Number(p.hargaPotong).toLocaleString('id-ID')}
                        </span>
                      ) : null}
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Popover */}
          <div className="flex items-center justify-between pt-1 text-[10.5px] text-slate-500">
            <span>Ditemukan {filteredProducts.length} produk</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen Select Bahan Baku Searchable Mobile
function SearchableBahanSelectMobile({
  masterBahan = [],
  selectedKode = '',
  selectedNama = '',
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef(null);

  const selectedBahan = useMemo(() => {
    return masterBahan.find(
      (m) =>
        (selectedKode && m.kodeBahan === selectedKode) ||
        (selectedNama && (m.namaBahan || '').toLowerCase() === selectedNama.toLowerCase())
    );
  }, [masterBahan, selectedKode, selectedNama]);

  const filteredBahan = useMemo(() => {
    if (!query.trim()) return masterBahan;
    const q = query.toLowerCase();
    return masterBahan.filter(
      (m) =>
        (m.namaBahan || '').toLowerCase().includes(q) ||
        (m.kodeBahan || '').toLowerCase().includes(q) ||
        (m.satuan || '').toLowerCase().includes(q) ||
        (m.supplier || '').toLowerCase().includes(q)
    );
  }, [masterBahan, query]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  return (
    <div className="relative flex-1 min-w-0">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setQuery('');
          }}
          className={`w-full px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs ${
            selectedBahan
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/60'
              : 'bg-slate-50 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Search className="w-3 h-3 text-amber-700 shrink-0" />
            {selectedBahan ? (
              <span className="text-xs font-bold text-slate-900 truncate">
                {selectedBahan.namaBahan}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium truncate">
                -- Cari & Pilih Bahan --
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>
      ) : (
        <div className="absolute left-0 right-0 top-0 z-50 bg-white rounded-xl shadow-2xl border border-amber-300 p-2 space-y-2 min-w-[260px] animate-fadeIn">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari bahan (Kain, Kancing, Benang...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List Bahan Hasil Pencarian */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50">
            {filteredBahan.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-slate-400">
                Bahan tidak ditemukan
              </div>
            ) : (
              filteredBahan.map((m) => {
                const isSelected =
                  selectedBahan &&
                  (selectedBahan.kodeBahan === m.kodeBahan || selectedBahan.namaBahan === m.namaBahan);
                const stokVal = Number(m.stok ?? 0);
                return (
                  <button
                    key={m.id || m.kodeBahan}
                    type="button"
                    onClick={() => {
                      onSelect(m);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-100/70 text-amber-950 font-black' : 'hover:bg-amber-50/60 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">{m.namaBahan}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="bg-white px-1 py-0.2 rounded border border-slate-200 text-slate-700">
                          {m.kodeBahan}
                        </span>
                        <span>•</span>
                        <span className={stokVal <= 10 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          Stok: {stokVal} {m.satuan}
                        </span>
                        {Number(m.harga || 0) > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">
                              Rp {Number(m.harga).toLocaleString('id-ID')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-700 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Popover */}
          <div className="flex justify-between items-center pt-1 text-[10px] text-slate-500">
            <span>Ditemukan {filteredBahan.length} bahan</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10.5px] font-bold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddAntreanModalMobile({
  isOpen,
  onClose,
  products = [],
  bahan = [],
  onAntreanCreated,
  isGudang = false,
}) {
  const [form, setForm] = useState({
    sku: '',
    targetQty: 50,
    prioritas: 'Normal',
    deadline: '',
    catatan: '',
  });

  // State Master Bahan Baku (Prop atau Fetch Otomatis)
  const [masterBahanList, setMasterBahanList] = useState(bahan || []);

  useEffect(() => {
    if (bahan && bahan.length > 0) {
      setMasterBahanList(bahan);
    } else {
      api.getBahan()
        .then((data) => {
          if (Array.isArray(data)) setMasterBahanList(data);
        })
        .catch(() => {});
    }
  }, [bahan]);

  // State Kebutuhan Bahan Baku per Pcs yang Diambil dari Master Bahan
  const [kebutuhanBahan, setKebutuhanBahan] = useState([]);
  const [isRecipeLoadedAuto, setIsRecipeLoadedAuto] = useState(false);

  // Helper auto-load resep tersimpan saat produk SKU dipilih
  const loadResepBahanForSku = (selectedSku, targetProduct = null) => {
    const prod = targetProduct || (products || []).find((p) => p.sku === selectedSku);
    let recipe = null;

    // 1. Cek dari master produk database (kebutuhanBahan)
    if (Array.isArray(prod?.kebutuhanBahan) && prod.kebutuhanBahan.length > 0) {
      recipe = prod.kebutuhanBahan;
    } else if (typeof prod?.kebutuhanBahan === 'string') {
      try {
        const parsed = JSON.parse(prod.kebutuhanBahan);
        if (Array.isArray(parsed) && parsed.length > 0) recipe = parsed;
      } catch (_) {}
    }

    // 2. Cek dari localStorage cache (per SKU)
    if (!recipe && selectedSku) {
      try {
        const cached = localStorage.getItem(`konveksi_resep_${selectedSku}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) recipe = parsed;
        }
      } catch (_) {}
    }

    // 3. Cek dari localStorage cache (per Kategori Model)
    if (!recipe && prod?.kategori) {
      try {
        const cachedCat = localStorage.getItem(`konveksi_resep_cat_${prod.kategori}`);
        if (cachedCat) {
          const parsed = JSON.parse(cachedCat);
          if (Array.isArray(parsed) && parsed.length > 0) recipe = parsed;
        }
      } catch (_) {}
    }

    // Jika resep ditemukan -> Auto populate & sinkronkan dengan stok terbaru dari masterBahanList
    if (recipe && recipe.length > 0) {
      const reconciled = recipe.map((r, i) => {
        const matched = (masterBahanList || []).find(
          (m) =>
            (r.kodeBahan && m.kodeBahan === r.kodeBahan) ||
            (m.namaBahan || '').toLowerCase() === (r.namaBahan || '').toLowerCase()
        );
        return {
          id: Date.now() + i + Math.random(),
          kodeBahan: matched?.kodeBahan || r.kodeBahan || '',
          namaBahan: matched?.namaBahan || r.namaBahan || '',
          satuan: matched?.satuan || r.satuan || 'Pcs',
          stokSaatIni: Number(matched?.stok ?? r.stokSaatIni ?? 0),
          hargaSatuan: Number(matched?.harga ?? r.hargaSatuan ?? 0),
          qtyPerPcs: Number(r.qtyPerPcs) || 1,
        };
      });
      setKebutuhanBahan(reconciled);
      setIsRecipeLoadedAuto(true);
      return true;
    }

    // Fallback: Jika belum ada resep tersimpan, cek skuBahan bawaan produk
    setIsRecipeLoadedAuto(false);
    if (prod?.skuBahan) {
      const matched = (masterBahanList || []).find(
        (m) =>
          (m.namaBahan || '').toLowerCase() === (prod.skuBahan || '').toLowerCase() ||
          (m.kodeBahan || '').toLowerCase() === (prod.skuBahan || '').toLowerCase()
      );
      if (matched) {
        setKebutuhanBahan([
          {
            id: Date.now(),
            kodeBahan: matched.kodeBahan || '',
            namaBahan: matched.namaBahan || '',
            satuan: matched.satuan || 'Meter',
            stokSaatIni: Number(matched.stok ?? 0),
            hargaSatuan: Number(matched.harga ?? 0),
            qtyPerPcs: 1.5,
          },
        ]);
        return false;
      }
    }
    setKebutuhanBahan([]);
    return false;
  };

  // Reset form dan kebutuhan bahan saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setForm({
        sku: '',
        targetQty: 50,
        prioritas: 'Normal',
        deadline: '',
        catatan: '',
      });
      setKebutuhanBahan([]);
      setIsRecipeLoadedAuto(false);
    }
  }, [isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectMasterBahan = (idx, selectedBahan) => {
    setKebutuhanBahan((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        kodeBahan: selectedBahan.kodeBahan || '',
        namaBahan: selectedBahan.namaBahan || '',
        satuan: selectedBahan.satuan || 'Pcs',
        stokSaatIni: Number(selectedBahan.stok ?? 0),
        hargaSatuan: Number(selectedBahan.harga ?? 0),
      };
      return next;
    });
  };

  const handleAddBahanRow = (presetBahan = null) => {
    if (!form.sku) {
      alert('Pilih produk (SKU) terlebih dahulu sebelum menambah kebutuhan bahan baku.');
      return;
    }
    const item = presetBahan || masterBahanList[0];
    setKebutuhanBahan((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        kodeBahan: item?.kodeBahan || '',
        namaBahan: item?.namaBahan || '',
        satuan: item?.satuan || 'Pcs',
        stokSaatIni: Number(item?.stok ?? 0),
        hargaSatuan: Number(item?.harga ?? 0),
        qtyPerPcs: 1,
      },
    ]);
  };

  const handleUpdateQtyPerPcs = (idx, val) => {
    setKebutuhanBahan((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], qtyPerPcs: val };
      return next;
    });
  };

  const handleRemoveBahanRow = (idx) => {
    setKebutuhanBahan((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sku) {
      alert('Pilih SKU Produk terlebih dahulu');
      return;
    }

    const cleanKebutuhan = kebutuhanBahan
      .filter((b) => b.namaBahan && b.namaBahan.trim() !== '')
      .map((b) => {
        const perPcs = Number(b.qtyPerPcs) || 0;
        const total = Number((perPcs * (Number(form.targetQty) || 0)).toFixed(2));
        return {
          kodeBahan: b.kodeBahan || '',
          namaBahan: b.namaBahan.trim(),
          qtyPerPcs: perPcs,
          satuan: b.satuan || 'Pcs',
          totalKebutuhan: total,
          stokSaatIni: b.stokSaatIni || 0,
          hargaSatuan: b.hargaSatuan || 0,
          catatan: b.catatan || '',
        };
      });

    setIsSubmitting(true);
    const selectedProd = products.find((p) => p.sku === form.sku);
    const prefix = isGudang ? 'SPK' : 'ANT';
    const payload = {
      noAntrean: `${prefix}-${Date.now().toString().slice(-6)}`,
      noAntrian: `${prefix}-${Date.now().toString().slice(-6)}`,
      tanggalAntrean: new Date().toISOString().split('T')[0],
      tglMasuk: new Date().toISOString().split('T')[0],
      sumberPermintaan: isGudang ? 'Gudang Jadi' : 'PO Pelanggan',
      noReff: isGudang ? 'Req-Gudang' : '-',
      sku: selectedProd?.sku || form.sku,
      modelProduk: selectedProd?.namaProduk || 'Custom Model',
      kategori: selectedProd?.kategori || 'Umum',
      varianWarna: selectedProd?.varian || 'Standar',
      ukuran: Array.isArray(selectedProd?.ukuran) ? selectedProd?.ukuran[0] : (selectedProd?.ukuran || 'All Size'),
      bahanBaku: cleanKebutuhan[0]?.namaBahan || selectedProd?.skuBahan || 'Bahan Standar',
      targetQty: Number(form.targetQty) || 50,
      qty: Number(form.targetQty) || 50,
      prioritas: form.prioritas || 'Normal',
      deadline:
        form.deadline ||
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Menunggu Cutting',
      statusTahapan: 'Menunggu Cutting',
      catatan: form.catatan || '',
      kebutuhanBahan: cleanKebutuhan,
    };

    try {
      const saved = await api.createAntrean(payload);

      // Simpan otomatis resep bahan baku per pcs produk (BOM) ke cache browser & master database
      try {
        const targetSku = selectedProd?.sku || form.sku;
        if (targetSku && cleanKebutuhan.length > 0) {
          localStorage.setItem(`konveksi_resep_${targetSku}`, JSON.stringify(cleanKebutuhan));
          if (selectedProd?.kategori) {
            localStorage.setItem(`konveksi_resep_cat_${selectedProd.kategori}`, JSON.stringify(cleanKebutuhan));
          }
          api.saveResepBahan(targetSku, cleanKebutuhan, true).catch(() => {});
        }
      } catch (_) {}

      onAntreanCreated(saved || payload);
      onClose();
      setForm({ sku: '', targetQty: 50, prioritas: 'Normal', deadline: '', catatan: '' });
    } catch (err) {
      alert('Gagal simpan antrean: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className={`p-3.5 text-white flex items-center justify-between shrink-0 shadow-xs ${
          isGudang ? 'bg-amber-700' : 'bg-[#064e3b]'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isGudang ? 'bg-amber-900/60 text-amber-200' : 'bg-emerald-800/80 text-emerald-300'
            }`}>
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs tracking-wide">
                {isGudang ? 'Buat SPK Permintaan Produksi' : 'Tambah Antrean Produksi'}
              </h3>
              <p className={`text-[10px] ${isGudang ? 'text-amber-100/90' : 'text-emerald-200/80'}`}>
                {isGudang ? 'Kirim SPK restock ke bagian produksi (Cutting)' : 'Input pesanan baru ke antrean cutting'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isGudang ? 'hover:bg-amber-800 text-amber-200 hover:text-white' : 'hover:bg-emerald-800 text-emerald-200 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Isi */}
        <form onSubmit={handleSubmit} noValidate className="p-3.5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Searchable SKU Dropdown */}
          <SearchableProductSelectMobile
            products={products}
            selectedSku={form.sku}
            onSelectSku={(sku) => {
              setForm((prev) => ({ ...prev, sku }));
              if (!sku) {
                setKebutuhanBahan([]);
                setIsRecipeLoadedAuto(false);
                return;
              }
              const prod = products.find((p) => p.sku === sku);
              loadResepBahanForSku(sku, prod);
            }}
          />

          {/* Target Qty & Prioritas */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                Target Qty (Pcs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.targetQty}
                onChange={(e) => setForm((prev) => ({ ...prev, targetQty: e.target.value }))}
                required
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
              />
              {/* Quick Presets */}
              <div className="flex items-center gap-1 mt-1.5">
                {[25, 50, 100, 200].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, targetQty: qty }))}
                    className={`flex-1 py-0.5 text-[9.5px] font-bold rounded-md border transition-colors cursor-pointer ${
                      Number(form.targetQty) === qty
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                Prioritas
              </label>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { value: 'Normal', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                  { value: 'Urgent', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                  { value: 'Tinggi', color: 'bg-rose-50 text-rose-800 border-rose-300' },
                ].map((p) => {
                  const isSel = form.prioritas === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, prioritas: p.value }))}
                      className={`h-6 px-2 rounded-lg text-[10.5px] font-bold border flex items-center justify-between transition-colors cursor-pointer ${
                        isSel
                          ? `${p.color} ring-1 ring-emerald-600 font-black`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{p.value}</span>
                      {isSel && <Check className="w-3 h-3 text-emerald-700" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION KHUSUS: INPUT KEBUTUHAN BAHAN BAKU PER PCS (Kain, Kancing, Benang, dll) */}
          <div className={`p-3 rounded-2xl space-y-2.5 transition-all ${
            !form.sku
              ? 'bg-slate-50 border border-slate-200'
              : 'bg-amber-50/70 border border-amber-300/80'
          }`}>
            <div className="flex items-center justify-between gap-1">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${
                    !form.sku ? 'text-slate-600' : 'text-amber-950'
                  }`}>
                    <Boxes className={`w-4 h-4 ${!form.sku ? 'text-slate-400' : 'text-amber-700'}`} />
                    <span>Kebutuhan Bahan per Pcs</span>
                  </label>
                  {form.sku && isRecipeLoadedAuto && (
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                      <span>Resep Otomatis</span>
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-medium mt-0.5 ${
                  !form.sku ? 'text-slate-400' : 'text-amber-800/80'
                }`}>
                  {!form.sku
                    ? 'Pilih produk (SKU) di atas terlebih dahulu'
                    : 'Tersimpan otomatis — tidak perlu input ulang kedepannya'}
                </p>
              </div>

              {form.sku && (
                <button
                  type="button"
                  onClick={() => handleAddBahanRow()}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-[10.5px] flex items-center gap-1 shadow-2xs cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>+ Bahan</span>
                </button>
              )}
            </div>

            {/* Jika BELUM pilih produk: Tampilkan pesan terkunci */}
            {!form.sku ? (
              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Boxes className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Pilih Produk (SKU) Terlebih Dahulu
                </p>
                <p className="text-[10.5px] text-slate-400 leading-tight">
                  Kebutuhan bahan baku terkunci dan baru dapat diinput setelah produk dipilih pada pilihan di atas.
                </p>
              </div>
            ) : (
              <>
                {/* Daftar Input Bahan */}
                <div className="space-y-2">
                  {kebutuhanBahan.map((b, idx) => {
                    const totalKebutuhan = Number(
                      ((Number(b.qtyPerPcs) || 0) * (Number(form.targetQty) || 0)).toFixed(2)
                    );
                    return (
                      <div
                        key={b.id || idx}
                        className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                            #{idx + 1}
                          </span>
                          {/* Searchable Select Option Master Bahan Baku */}
                          <SearchableBahanSelectMobile
                            masterBahan={masterBahanList}
                            selectedKode={b.kodeBahan}
                            selectedNama={b.namaBahan}
                            onSelect={(selected) => handleSelectMasterBahan(idx, selected)}
                          />

                          {/* Tombol Hapus Row */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBahanRow(idx)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Hapus Bahan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Qty Per Pcs & Satuan Master + Live Kalkulasi Total SPK */}
                        <div className="grid grid-cols-12 gap-1.5 items-center">
                          <div className="col-span-5">
                            <label className="text-[9px] font-extrabold text-slate-500 block mb-0.5">
                              Per Pcs
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="1"
                                value={b.qtyPerPcs}
                                onChange={(e) => handleUpdateQtyPerPcs(idx, e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                              />
                              <span className="absolute right-2 text-[10px] text-slate-400 font-semibold pointer-events-none">
                                {b.satuan || 'Pcs'}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <label className="text-[9px] font-extrabold text-slate-500 block mb-0.5">
                              Satuan
                            </label>
                            <div className="w-full px-1.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 text-center truncate">
                              {b.satuan || 'Pcs'}
                            </div>
                          </div>

                          <div className="col-span-4 bg-amber-50 p-1 rounded-lg border border-amber-200 text-right">
                            <span className="text-[8.5px] font-bold text-amber-800 block">
                              Total SPK
                            </span>
                            <span className="text-[11px] font-mono font-black text-amber-950 truncate block">
                              {totalKebutuhan} {b.satuan}
                            </span>
                          </div>
                        </div>

                        {/* Info Kode Bahan & Stok Real-time dari Master */}
                        <div className="flex items-center justify-between text-[9.5px] px-1 pt-0.5">
                          <span className="text-slate-500">
                            Kode: <span className="font-mono font-bold text-slate-700">{b.kodeBahan || '-'}</span>
                          </span>
                          {b.stokSaatIni !== undefined && (
                            totalKebutuhan > b.stokSaatIni ? (
                              <span className="text-rose-600 font-bold">
                                ⚠️ Melebihi stok gudang (Sisa: {b.stokSaatIni} {b.satuan})
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                ✓ Stok gudang cukup (Tersedia: {b.stokSaatIni} {b.satuan})
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {kebutuhanBahan.length === 0 && (
                    <div className="p-3 bg-white rounded-xl border border-dashed border-amber-300 text-center text-[11px] text-amber-800">
                      Belum ada bahan baku dipilih. Klik <b>+ Bahan</b> untuk menambahkan kebutuhan bahan.
                    </div>
                  )}
                </div>

                {/* Note Simpan Otomatis */}
                <div className="text-[9.5px] text-amber-900/70 font-semibold flex items-center gap-1 pt-1 border-t border-amber-200/60">
                  <span>💾 Resep bahan baku tersimpan otomatis — tidak perlu input ulang untuk SKU ini kedepannya.</span>
                </div>
              </>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
              Deadline Selesai
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              rows="2"
              placeholder="Cth: Logo dada kiri, jahitan rantai, benang hitam..."
              value={form.catatan}
              onChange={(e) => setForm((prev) => ({ ...prev, catatan: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Footer Aksi */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.sku}
              className={`px-5 py-2 rounded-xl text-white font-black shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                isGudang ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#064e3b] hover:bg-[#043e2f]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-white" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isGudang
                  ? 'Kirim SPK ke Produksi'
                  : 'Simpan Antrean'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
