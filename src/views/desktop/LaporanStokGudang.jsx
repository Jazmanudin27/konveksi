import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Boxes,
  FileSpreadsheet,
  Printer,
  Calendar,
  Package,
  Layers,
  Download,
  Warehouse,
  ChevronDown,
  X,
  FileText,
  TrendingUp,
  FolderOpen,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  Search,
  Check
} from 'lucide-react';

export default function LaporanStokGudang({
  products = [],
  mutasiGudangJadiList = [],
  categories = []
}) {
  // Tab Jenis Laporan (seperti screenshot portal)
  const [activeTabLaporan, setActiveTabLaporan] = useState('persediaan'); // 'persediaan' | 'rekap-persediaan'

  // Filter States
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  
  // Searchable Product Combobox State
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Tanggal Dari & Sampai
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [tglDari, setTglDari] = useState(firstDayOfMonthStr);
  const [tglSampai, setTglSampai] = useState(todayStr);

  // Filter daftar produk berdasarkan kategori & query pencarian
  const filteredProductOptions = useMemo(() => {
    return products.filter(p => {
      if (selectedKategori && p.kategori !== selectedKategori) return false;
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        const mSku = (p.sku || '').toLowerCase().includes(q);
        const mNama = (p.namaProduk || p.nama || '').toLowerCase().includes(q);
        const mVarian = (p.varian || '').toLowerCase().includes(q);
        const mKategori = (p.kategori || '').toLowerCase().includes(q);
        if (!mSku && !mNama && !mVarian && !mKategori) return false;
      }
      return true;
    });
  }, [products, selectedKategori, productSearchQuery]);

  // Produk aktif yang dipilih
  const currentProduct = useMemo(() => {
    if (!selectedSku || selectedSku === 'ALL') return null;
    return products.find(p => p.sku === selectedSku) || null;
  }, [products, selectedSku]);

  // Stok riil produk aktif: ambil dari stok Produk master atau hitungan Mutasi Gudang
  const currentProductMutasiStok = useMemo(() => {
    if (!currentProduct) return 0;
    const mutasi = mutasiGudangJadiList.filter(m => m.sku === currentProduct.sku);
    const masuk = mutasi.filter(m => m.jenisMutasi === 'MASUK').reduce((acc, m) => acc + Number(m.qty || 0), 0);
    const keluar = mutasi.filter(m => m.jenisMutasi === 'KELUAR').reduce((acc, m) => acc + Number(m.qty || 0), 0);
    const netMutasi = masuk - keluar;
    const masterStok = Number(currentProduct.stok || 0);
    return mutasi.length > 0 && netMutasi > 0 ? netMutasi : masterStok;
  }, [currentProduct, mutasiGudangJadiList]);

  // Daftar produk yang akan dimasukkan ke dalam laporan cetak (100% mengikuti filter inputan)
  const productsToPrint = useMemo(() => {
    let list = products;
    if (selectedKategori) {
      list = list.filter(p => p.kategori === selectedKategori);
    }
    if (selectedSku && selectedSku !== 'ALL') {
      list = list.filter(p => p.sku === selectedSku);
    }
    return list;
  }, [products, selectedKategori, selectedSku]);

  // Format Tanggal Indonesia
  const formatTglIndo = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (_) {
      return dStr;
    }
  };

  // FUNGSI UTAMA: CETAK KE TARGET BLANK (WINDOW.OPEN) SESUAI INSTRUKSI SPESIFIK USER
  // Nama Laporan: STOK GUDANG JADI
  // Kolom: No, SKU, Nama Produk, Kategori, Varian (warna & ukuran), Harga HPP, Harga Jual, Stok Gudang (Pcs)
  const handleCetakTargetBlank = () => {
    const list = productsToPrint;
    if (list.length === 0) {
      alert('Tidak ada data produk yang sesuai filter untuk dicetak.');
      return;
    }

    const periodeTitle = `PERIODE ${formatTglIndo(tglDari)} S/D ${formatTglIndo(tglSampai)}`.toUpperCase();
    const filterSubTitle = selectedSku && currentProduct
      ? `PRODUK: ${currentProduct.sku} - ${(currentProduct.namaProduk || currentProduct.nama || '').toUpperCase()}`
      : selectedKategori
      ? `KATEGORI: ${selectedKategori.toUpperCase()}`
      : 'SELURUH MASTER PRODUK GUDANG JADI';

    let totalStokFisik = 0;
    let totalNilaiHpp = 0;
    let totalNilaiJual = 0;

    // 1. HITUNG STOK LANGSUNG DARI MASTER DATA PRODUK (p.stok) JIKA MUTASI KOSONG
    const calculatedItems = list.map((p) => {
      const mutasiProduk = mutasiGudangJadiList.filter(m => m.sku === p.sku);
      const totalMasuk = mutasiProduk
        .filter(m => m.jenisMutasi === 'MASUK')
        .reduce((sum, m) => sum + Number(m.qty || 0), 0);
      const totalKeluar = mutasiProduk
        .filter(m => m.jenisMutasi === 'KELUAR')
        .reduce((sum, m) => sum + Number(m.qty || 0), 0);
      
      const stokDariMutasi = totalMasuk - totalKeluar;
      
      // Prioritaskan stok dari Master Data Produk jika mutasi belum ada/0, atau gunakan max
      const stokProdukMaster = Number(p.stok !== undefined && p.stok !== null ? p.stok : 0);
      const stokGudang = mutasiProduk.length > 0 && stokDariMutasi > 0 ? stokDariMutasi : stokProdukMaster;

      const hargaJual = Number(p.harga || 0);
      const hpp = p.hpp !== undefined && p.hpp !== null && Number(p.hpp) > 0
        ? Number(p.hpp)
        : Math.round(hargaJual * 0.70);

      // Perhitungan Margin Rp dan Margin %
      const marginRp = hargaJual - hpp;
      const marginPersen = hargaJual > 0 ? ((marginRp / hargaJual) * 100).toFixed(1) : '0';

      const varianLengkap = `${p.varian || 'Polos'} (${p.ukuran || 'All Size'})`;

      return {
        ...p,
        stokGudang,
        hargaJual,
        hpp,
        marginRp,
        marginPersen,
        varianLengkap
      };
    });

    // Tampilkan semua produk yang sesuai filter, atau prioritaskan produk dengan stok
    const listToDisplay = calculatedItems;

    listToDisplay.forEach(item => {
      totalStokFisik += item.stokGudang;
      totalNilaiHpp += item.stokGudang * item.hpp;
      totalNilaiJual += item.stokGudang * item.hargaJual;
    });

    const totalMarginRp = totalNilaiJual - totalNilaiHpp;
    const totalMarginPersen = totalNilaiJual > 0 ? ((totalMarginRp / totalNilaiJual) * 100).toFixed(1) : '0';

    const rowsHtml = listToDisplay.length === 0
      ? `<tr><td colspan="10" style="padding: 24px; text-align: center; color: #64748b; font-weight: bold; font-size: 11px;">Tidak ada produk dengan stok fisik di gudang (Stok 0)</td></tr>`
      : listToDisplay.map((p, idx) => `
        <tr>
          <td style="padding: 7px 6px; border: 1px solid #1e293b; text-align: center; font-family: monospace; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 7px 8px; border: 1px solid #1e293b; font-family: monospace; font-weight: bold; font-size: 11px; white-space: nowrap;">${p.sku}</td>
          <td style="padding: 7px 10px; border: 1px solid #1e293b; font-weight: bold; font-size: 11px;">${p.namaProduk || p.nama}</td>
          <td style="padding: 7px 8px; border: 1px solid #1e293b; font-size: 11px;">${p.kategori || '-'}</td>
          <td style="padding: 7px 8px; border: 1px solid #1e293b; font-size: 11px;">${p.varianLengkap}</td>
          <td style="padding: 7px 10px; border: 1px solid #1e293b; text-align: right; font-family: monospace; font-size: 11px;">Rp ${p.hpp.toLocaleString('id-ID')}</td>
          <td style="padding: 7px 10px; border: 1px solid #1e293b; text-align: right; font-family: monospace; font-weight: bold; font-size: 11px;">Rp ${p.hargaJual.toLocaleString('id-ID')}</td>
          <td style="padding: 7px 10px; border: 1px solid #1e293b; text-align: right; font-family: monospace; font-weight: bold; font-size: 11px; color: #0284c7;">Rp ${p.marginRp.toLocaleString('id-ID')}</td>
          <td style="padding: 7px 8px; border: 1px solid #1e293b; text-align: center; font-family: monospace; font-weight: bold; font-size: 11px; color: #059669;">${p.marginPersen}%</td>
          <td style="padding: 7px 10px; border: 1px solid #1e293b; text-align: center; font-family: monospace; font-weight: 900; font-size: 11.5px; background-color: #f0fdf4;">${p.stokGudang.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Stok Gudang Jadi - Cetak Dokumen</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 24px 30px;
            color: #0f172a;
            background: #ffffff;
          }
          .header-title {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: -0.2px;
            text-transform: uppercase;
            margin: 0 0 2px 0;
            color: #0f172a;
          }
          .header-periode {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #334155;
            margin: 0 0 4px 0;
          }
          .header-sub {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #0284c7;
            margin: 0 0 16px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            border: 1px solid #1e293b;
          }
          th, td {
            border: 1px solid #1e293b;
          }
          th {
            background-color: #0f4c81;
            color: #ffffff;
            font-weight: 900;
            text-align: center;
            padding: 8px 6px;
            text-transform: uppercase;
            font-size: 10.5px;
            letter-spacing: 0.3px;
          }
          .btn-print-bar {
            position: fixed;
            top: 15px;
            right: 20px;
            display: flex;
            gap: 8px;
            z-index: 9999;
          }
          .btn-action {
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          .btn-action:hover { background: #0369a1; }
          .btn-close { background: #64748b; }
          .btn-close:hover { background: #475569; }
          .footer-total {
            background-color: #f1f5f9;
            font-weight: 900;
            border-top: 2px solid #1e293b;
          }
          @media print {
            .btn-print-bar { display: none !important; }
            body { padding: 5mm !important; }
            table { font-size: 10px !important; }
          }
        </style>
      </head>
      <body>
        <div class="btn-print-bar">
          <button class="btn-action" onclick="window.print()">🖨 Cetak Dokumen</button>
          <button class="btn-action btn-close" onclick="window.close()">✕ Tutup Tab</button>
        </div>

        <div class="header-title">STOK GUDANG JADI</div>
        <div class="header-periode">${periodeTitle}</div>
        <div class="header-sub">${filterSubTitle}</div>

        <table>
          <thead>
            <tr>
              <th style="width: 38px;">NO</th>
              <th style="width: 110px;">SKU</th>
              <th>NAMA PRODUK</th>
              <th style="width: 125px;">KATEGORI</th>
              <th style="width: 160px;">VARIAN (WARNA & UKURAN)</th>
              <th style="width: 105px; text-align: right;">HARGA HPP</th>
              <th style="width: 105px; text-align: right;">HARGA JUAL</th>
              <th style="width: 105px; text-align: right; background-color: #0369a1;">MARGIN (RP)</th>
              <th style="width: 80px; text-align: center; background-color: #0284c7;">MARGIN (%)</th>
              <th style="width: 115px; text-align: center; background-color: #0f4c81;">STOK GUDANG (PCS)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="footer-total">
              <td colspan="5" style="padding: 8px 10px; text-align: right; font-weight: 900; text-transform: uppercase; font-size: 11px;">
                TOTAL KESELURUHAN (${listToDisplay.length} PRODUK):
              </td>
              <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 900; font-size: 11px;">
                Rp ${totalNilaiHpp.toLocaleString('id-ID')}
              </td>
              <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 900; font-size: 11px;">
                Rp ${totalNilaiJual.toLocaleString('id-ID')}
              </td>
              <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 900; font-size: 11px; color: #0284c7;">
                Rp ${totalMarginRp.toLocaleString('id-ID')}
              </td>
              <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 900; font-size: 11px; color: #059669;">
                ${totalMarginPersen}%
              </td>
              <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 900; font-size: 12px; color: #047857; background-color: #ecfdf5;">
                ${totalStokFisik.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Area Pengesahan / Tanda Tangan -->
        <div style="margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; font-size: 11.5px; color: #334155;">
          <div>
            <p style="margin: 0; font-weight: 600; color: #64748b;">Dibuat Oleh,</p>
            <div style="height: 55px;"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #0f172a;">Admin Gudang Jadi</p>
          </div>
          <div>
            <p style="margin: 0; font-weight: 600; color: #64748b;">Diperiksa Oleh,</p>
            <div style="height: 55px;"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #0f172a;">Supervisor Produksi</p>
          </div>
          <div>
            <p style="margin: 0; font-weight: 600; color: #64748b;">Mengetahui,</p>
            <div style="height: 55px;"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #0f172a;">Kepala Bagian / Owner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  return (
    <div className="space-y-4 font-sans pb-10">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Stok Gudang Jadi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan ketersediaan dan mutasi persediaan barang jadi siap jual.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
          <span>Gudang Jadi</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-bold">Stok Gudang Jadi</span>
        </div>
      </div>

      {/* 2. LAYOUT FILTER PERSIS PORTAL (TAB SEBELAH KIRI + CARD FILTER KANAN) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Tab Menu Laporan */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs font-semibold">
            <button
              onClick={() => setActiveTabLaporan('persediaan')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                activeTabLaporan === 'persediaan'
                  ? 'bg-sky-50 text-[#0284c7] font-bold border-l-4 border-[#0284c7]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Boxes className="w-4 h-4 shrink-0 text-[#0284c7]" />
              <span>Stok Gudang Jadi</span>
            </button>

            <button
              onClick={() => setActiveTabLaporan('rekap-persediaan')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                activeTabLaporan === 'rekap-persediaan'
                  ? 'bg-sky-50 text-[#0284c7] font-bold border-l-4 border-[#0284c7]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Rekap Persediaan</span>
            </button>

            <div className="px-3.5 py-2.5 text-slate-400 flex items-center gap-2.5 text-xs select-none">
              <Package className="w-4 h-4 shrink-0 text-slate-300" />
              <span>Hasil Produksi</span>
            </div>

            <div className="px-3.5 py-2.5 text-slate-400 flex items-center gap-2.5 text-xs select-none">
              <TrendingUp className="w-4 h-4 shrink-0 text-slate-300" />
              <span>Rekap Pengeluaran</span>
            </div>

            <div className="px-3.5 py-2.5 text-slate-400 flex items-center gap-2.5 text-xs select-none">
              <ClipboardList className="w-4 h-4 shrink-0 text-slate-300" />
              <span>Realisasi Kiriman</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Card Filter Laporan Persediaan (PERSIS GAMBAR 1) */}
        <div className="md:col-span-9">
          <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
            {/* Header Card Biru Navy (Persis Gambar 1) */}
            <div className="bg-[#1e40af] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Boxes className="w-4 h-4 text-white" />
                <span>Stok Gudang Jadi</span>
              </div>
            </div>

            {/* Body Form Filter */}
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Filter Kategori & Produk */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Produk
                  </label>
                  <select
                    value={selectedKategori}
                    onChange={(e) => {
                      setSelectedKategori(e.target.value);
                      const matching = products.filter(p => !e.target.value || p.kategori === e.target.value);
                      if (matching.length > 0) setSelectedSku(matching[0].sku);
                    }}
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.nama}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2" ref={dropdownRef}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Pilih Produk *</span>
                    {currentProduct ? (
                      <span className="text-[10px] text-emerald-600 font-mono font-bold">
                        Stok Mutasi Gudang: {currentProductMutasiStok} Pcs
                      </span>
                    ) : (
                      <span className="text-[10px] text-sky-600 font-mono font-bold">
                        Mencetak: {productsToPrint.length} Produk
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    {/* Trigger Bar (Menampilkan produk aktif & tombol search/clear/dropdown) */}
                    <div
                      onClick={() => setIsProductDropdownOpen(prev => !prev)}
                      className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 flex items-center justify-between cursor-pointer hover:border-[#1e40af] transition-colors shadow-2xs select-none"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {currentProduct ? (
                            <>
                              <strong className="text-[#1e40af] font-mono">{currentProduct.sku}</strong>
                              <span className="text-slate-400 mx-1">|</span>
                              <span>{currentProduct.namaProduk || currentProduct.nama}</span>
                              <span className="text-slate-500 font-normal ml-1">
                                - {currentProduct.varian} ({currentProduct.ukuran || 'All Size'})
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-700 font-bold">
                              -- Semua Produk ({productsToPrint.length} SKU) --
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedSku && selectedSku !== 'ALL' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSku('ALL');
                              setProductSearchQuery('');
                            }}
                            className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                            title="Reset ke Semua Produk"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Popover Dropdown Searchable List */}
                    {isProductDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden animate-fade-in font-sans">
                        {/* Input Box Pencarian Real-Time */}
                        <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                          <Search className="w-4 h-4 text-[#1e40af] shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            placeholder="Ketik SKU, nama kaos/produk, varian..."
                            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                          />
                          {productSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setProductSearchQuery('')}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* List Pilihan Produk */}
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                          {/* Opsi 1: Semua Produk */}
                          <div
                            onClick={() => {
                              setSelectedSku('ALL');
                              setIsProductDropdownOpen(false);
                              setProductSearchQuery('');
                            }}
                            className={`p-2.5 flex items-center justify-between text-xs hover:bg-sky-50 transition-colors cursor-pointer border-b border-slate-200 ${
                              selectedSku === 'ALL' ? 'bg-sky-50/90 font-bold text-[#1e40af]' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-sky-600 shrink-0" />
                              <span className="font-extrabold">-- Semua Produk (Seluruh Master) --</span>
                            </div>
                            {selectedSku === 'ALL' && <Check className="w-4 h-4 text-[#1e40af] stroke-[3]" />}
                          </div>

                          {filteredProductOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                              Tidak ada produk cocok dengan "{productSearchQuery}"
                            </div>
                          ) : (
                            filteredProductOptions.map((p) => {
                              const isSelected = p.sku === selectedSku;
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedSku(p.sku);
                                    setIsProductDropdownOpen(false);
                                    setProductSearchQuery('');
                                  }}
                                  className={`p-2.5 flex items-center justify-between text-xs hover:bg-sky-50 transition-colors cursor-pointer ${
                                    isSelected ? 'bg-sky-50/80 font-bold' : ''
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-black text-sky-800 bg-sky-100/80 px-1.5 py-0.2 rounded border border-sky-300 shrink-0">
                                        {p.sku}
                                      </span>
                                      <span className="font-bold text-slate-900 truncate">
                                        {p.namaProduk || p.nama}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                                      <span>{p.kategori}</span>
                                      <span>•</span>
                                      <span className="text-slate-700 font-medium">{p.varian} ({p.ukuran || 'All Size'})</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {(() => {
                                      const mItm = mutasiGudangJadiList.filter(m => m.sku === p.sku);
                                      const mMasuk = mItm.filter(m => m.jenisMutasi === 'MASUK').reduce((acc, m) => acc + Number(m.qty || 0), 0);
                                      const mKeluar = mItm.filter(m => m.jenisMutasi === 'KELUAR').reduce((acc, m) => acc + Number(m.qty || 0), 0);
                                      const stokMut = Math.max(0, mMasuk - mKeluar);
                                      return (
                                        <span className="font-mono text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="Stok Riil Mutasi Gudang Jadi">
                                          {stokMut}
                                        </span>
                                      );
                                    })()}
                                    {isSelected && <Check className="w-4 h-4 text-[#1e40af] stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Rentang Tanggal: Dari & Sampai (Persis Gambar 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dari Tanggal</span>
                  </label>
                  <input
                    type="date"
                    value={tglDari}
                    onChange={(e) => setTglDari(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1e40af]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sampai Tanggal</span>
                  </label>
                  <input
                    type="date"
                    value={tglSampai}
                    onChange={(e) => setTglSampai(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              {/* Tombol Cetak (Target Blank) & Download (Persis Gambar 1) */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCetakTargetBlank}
                  className="flex-1 h-9.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Klik untuk membuka lembar cetak laporan persediaan di Tab Baru"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>Cetak</span>
                </button>

                <button
                  type="button"
                  onClick={handleCetakTargetBlank}
                  className="h-9.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Unduh / Cetak Dokumen"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
