import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Clock,
  Scissors,
  CheckCircle2,
  Package,
  TrendingUp,
  Warehouse,
  Boxes,
  ArrowRight,
  Flame,
  Shirt,
  Calendar,
  Layers
} from 'lucide-react';

export default function Dashboard({
  antreanList = [],
  products = [],
  mutasiGudangJadiList = [],
  onNavigate
}) {
  // 1. DATA TABEL PANTAU - PRIORITAS ANTREAN
  const tabelPantauList = useMemo(() => {
    // Urutkan prioritas (Urgent dulu, lalu deadline)
    const list = [...antreanList].sort((a, b) => {
      if (a.prioritas === 'Urgent' && b.prioritas !== 'Urgent') return -1;
      if (a.prioritas !== 'Urgent' && b.prioritas === 'Urgent') return 1;
      return (a.deadline || '').localeCompare(b.deadline || '');
    });

    // Ambil top 8 atau data yang ada
    return list.slice(0, 8).map((item, idx) => {
      const isUrgent = item.prioritas === 'Urgent';
      const isSelesai = item.status === 'Selesai' || item.status === 'Menunggu Penerimaan Gudang';
      const isCutting = item.status === 'Proses Cutting';
      const isJahit = item.status === 'Proses Jahit';
      const isQc = item.status === 'Proses QC';
      const isFinishing = item.status === 'Proses Finishing';

      let statusDisplay = item.status || 'Menunggu Cutting';
      if (statusDisplay === 'Sedang Diproses') statusDisplay = 'Proses Cutting';

      // Sisa target
      const sisaTarget = Number(item.qty || 0);

      // Perlu Cutting
      const perluCutting = item.status === 'Menunggu Cutting' ? sisaTarget : '-';

      // % Progress
      let progress = 0;
      if (isCutting) progress = 25;
      else if (isJahit) progress = 50;
      else if (isQc) progress = 75;
      else if (isFinishing) progress = 90;
      else if (isSelesai) progress = 100;

      // Cek keterlambatan deadline
      const today = new Date().toISOString().slice(0, 10);
      const isTerlambat = item.deadline && item.deadline < today && !isSelesai;

      return {
        urut: idx + 1,
        sku: item.sku || '-',
        namaProduk: `${item.namaProduk || item.model || '-'} - ${item.varian || 'POLOS'} - ${item.ukuran || 'ALLSIZE'}`,
        prioritas: isUrgent ? 'Tinggi' : item.prioritas || 'Normal',
        sumber: item.sumber || 'Marketplace',
        deadline: item.deadline || '-',
        sisaTarget,
        perluCutting,
        progress: `${progress}%`,
        status: statusDisplay,
        peringatan: isTerlambat ? 'TERLAMBAT' : item.status === 'Menunggu Cutting' ? 'SIAP POTONG' : ''
      };
    });
  }, [antreanList]);

  // Total Antrean Aktif per Sumber
  const sumberStats = useMemo(() => {
    let marketplaceSku = 0;
    let marketplacePcs = 0;
    let offlineSku = 0;
    let offlinePcs = 0;
    let internalSku = 0;
    let internalPcs = 0;

    antreanList.forEach(item => {
      const s = (item.sumber || '').toLowerCase();
      const q = Number(item.qty || 0);
      if (s.includes('market') || s.includes('toko') || s.includes('shopee') || s.includes('tiktok')) {
        marketplaceSku++;
        marketplacePcs += q;
      } else if (s.includes('offline') || s.includes('cideng')) {
        offlineSku++;
        offlinePcs += q;
      } else {
        internalSku++;
        internalPcs += q;
      }
    });

    return {
      marketplace: `${marketplaceSku} SKU / ${marketplacePcs.toLocaleString('id-ID')} pcs`,
      offline: `${offlineSku} SKU / ${offlinePcs.toLocaleString('id-ID')} pcs`,
      internal: `${internalSku} SKU / ${internalPcs.toLocaleString('id-ID')} pcs`
    };
  }, [antreanList]);

  // 2. SISA CUTTING BELUM DIJAHIT (SIAP JAHIT) - TERBANYAK
  const siapJahitList = useMemo(() => {
    // Filter antrean yang sudah beres cutting / siap jahit
    const cutItems = antreanList.filter(a => a.status === 'Proses Cutting' || a.tglSerahCutting);
    
    // Kelompokkan per SKU jika ada, atau mapping langsung
    return cutItems.slice(0, 8).map((item, idx) => ({
      rank: idx + 1,
      sku: item.sku || '-',
      namaProduk: `${item.namaProduk || '-'} - ${item.varian || '-'} - ${item.ukuran || '-'}`,
      siapJahit: Number(item.qty || 0),
      diPenjahit: item.timJahit || '-',
      peringatan: Number(item.qty || 0) > 100 ? '' : 'CEK INPUT: ADA TAHAP MINUS'
    }));
  }, [antreanList]);

  // 3. SIAP KIRIM KE GUDANG - TERBANYAK
  const siapKirimList = useMemo(() => {
    // Ambil dari mutasi masuk gudang jadi atau antrean selesai
    const finishingItems = antreanList.filter(a => a.status === 'Proses Finishing' || a.status === 'Selesai');
    
    return finishingItems.slice(0, 8).map((item, idx) => {
      const qtyPass = Number(item.qtyPassQc || item.qty || 0);
      return {
        rank: idx + 1,
        sku: item.sku || '-',
        namaProduk: `${item.namaProduk || '-'} - ${item.varian || '-'} - ${item.ukuran || '-'}`,
        siapKirim: qtyPass,
        totalSelesai: qtyPass,
        tungguFinishing: Math.max(0, Number(item.qty || 0) - qtyPass),
        statusProduksi: 'ON'
      };
    });
  }, [antreanList]);

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 animate-fade-in pb-8">
      {/* 1. HEADER CARD DASHBOARD */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#0f4c81] text-white rounded-xl p-3.5 sm:px-5 shadow-[0_3px_10px_rgba(2,132,199,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                DASHBOARD PANTAU PRODUKSI & GUDANG
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                LIVE MONITORING
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              Monitoring real-time antrean prioritas, deadline cutting, kesiapan jahit, dan stok siap kirim
            </p>
          </div>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('antrean')}
              className="px-3 py-1.5 bg-white text-[#0369a1] hover:bg-slate-100 rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Kelola Antrean</span>
            </button>
            <button
              onClick={() => onNavigate('laporan-stok-gudang')}
              className="px-3 py-1.5 bg-sky-500/30 hover:bg-sky-500/50 text-white rounded-lg text-xs font-black border border-white/20 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Stok Gudang</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TABEL PANTAU - 8 PRIORITAS TERATAS (PERSIS TAMPILAN USER) */}
      <div className="bg-white rounded-lg border border-[#cbd5e1] shadow-sm overflow-hidden">
        {/* Banner Biru Header Tabel */}
        <div className="bg-[#e0e7ff]/70 border-b border-[#cbd5e1] px-3.5 py-1.5">
          <div className="text-[11px] font-black text-[#1e3a8a] uppercase tracking-wider">
            TABEL PANTAU
          </div>
          <div className="text-xs font-black text-[#1e40af] uppercase tracking-wide">
            ANTREAN PRODUKSI - 8 PRIORITAS TERATAS (urut prioritas lalu deadline)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0f4c81] text-white font-extrabold text-[10.5px] uppercase tracking-wider border-b border-[#cbd5e1]">
                <th className="py-2 px-2 text-center w-10 border border-[#cbd5e1]">Urut</th>
                <th className="py-2 px-2.5 w-36 border border-[#cbd5e1]">Kode SKU</th>
                <th className="py-2 px-3 border border-[#cbd5e1]">Produk (Nama - Warna - Ukuran)</th>
                <th className="py-2 px-2 text-center w-20 border border-[#cbd5e1]">Prioritas</th>
                <th className="py-2 px-2.5 border border-[#cbd5e1] w-36">Sumber Permintaan</th>
                <th className="py-2 px-2 text-center w-24 border border-[#cbd5e1]">Deadline</th>
                <th className="py-2 px-2 text-right w-20 border border-[#cbd5e1]">Sisa Target</th>
                <th className="py-2 px-2 text-right w-20 border border-[#cbd5e1]">Perlu Cutting</th>
                <th className="py-2 px-2 text-center w-18 border border-[#cbd5e1]">% Progress</th>
                <th className="py-2 px-2.5 text-center w-28 border border-[#cbd5e1]">Status</th>
                <th className="py-2 px-3 border border-[#cbd5e1]">Peringatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-800 text-[11px]">
              {tabelPantauList.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400 border border-[#cbd5e1]">
                    Tidak ada antrean produksi yang perlu dipantau saat ini.
                  </td>
                </tr>
              ) : (
                tabelPantauList.map((row) => (
                  <tr key={row.urut} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-2 text-center font-mono font-bold border border-[#cbd5e1]">
                      {row.urut}
                    </td>
                    <td className="py-1.5 px-2.5 font-mono font-bold text-[#0284c7] border border-[#cbd5e1] whitespace-nowrap">
                      {row.sku}
                    </td>
                    <td className="py-1.5 px-3 font-semibold uppercase border border-[#cbd5e1]">
                      {row.namaProduk}
                    </td>
                    <td className="py-1.5 px-2 text-center border border-[#cbd5e1]">
                      <span className={`inline-block font-bold ${row.prioritas === 'Tinggi' ? 'text-rose-700 font-extrabold' : 'text-slate-700'}`}>
                        {row.prioritas}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 border border-[#cbd5e1]">
                      {row.sumber}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono border border-[#cbd5e1]">
                      {row.deadline}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold border border-[#cbd5e1]">
                      {row.sisaTarget}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 border border-[#cbd5e1]">
                      {row.perluCutting}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 border border-[#cbd5e1]">
                      {row.progress}
                    </td>
                    <td className="py-1.5 px-2.5 text-center border border-[#cbd5e1]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Menunggu Cutting' ? 'bg-amber-100 text-amber-900' :
                        row.status === 'Proses Cutting' ? 'bg-blue-100 text-blue-900' :
                        row.status === 'Proses Jahit' ? 'bg-purple-100 text-purple-900' :
                        'bg-emerald-100 text-emerald-900'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border border-[#cbd5e1]">
                      {row.peringatan && (
                        <span className="font-black text-rose-600 tracking-wider">
                          {row.peringatan}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Rekap Sumber (Persis Background Kuning Muda di Screenshot) */}
        <div className="bg-[#fef9c3] px-3.5 py-2 border-t border-[#fde047] text-[11px] font-bold text-slate-800">
          <span className="text-amber-950">Antrean aktif per sumber —</span>{' '}
          <span className="text-slate-800">Marketplace: <b>{sumberStats.marketplace}</b></span>{' '}
          <span className="text-slate-400 mx-2">|</span>{' '}
          <span className="text-slate-800">Cideng/Offline: <b>{sumberStats.offline}</b></span>{' '}
          <span className="text-slate-400 mx-2">|</span>{' '}
          <span className="text-slate-800">Internal/Produk Baru: <b>{sumberStats.internal}</b></span>
        </div>
      </div>

      {/* 3. DUA TABEL DI BAWAH (SISA CUTTING BELUM DIJAHIT & SIAP KIRIM KE GUDANG) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kolom Kiri: SISA CUTTING BELUM DIJAHIT (SIAP JAHIT) - TERBANYAK */}
        <div className="bg-white rounded-lg border border-[#cbd5e1] shadow-sm overflow-hidden">
          <div className="bg-[#0f4c81] text-white px-3 py-1.5 flex items-center justify-between">
            <span className="font-black text-xs uppercase tracking-wide">
              SISA CUTTING BELUM DIJAHIT (SIAP JAHIT) - TERBANYAK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e40af] text-white font-extrabold text-[10.5px] uppercase tracking-wider border-b border-[#cbd5e1]">
                  <th className="py-1.5 px-2 text-center w-10 border border-[#cbd5e1]">Rank</th>
                  <th className="py-1.5 px-2.5 w-32 border border-[#cbd5e1]">Kode SKU</th>
                  <th className="py-1.5 px-3 border border-[#cbd5e1]">Produk</th>
                  <th className="py-1.5 px-2 text-right w-20 border border-[#cbd5e1]">Siap Jahit</th>
                  <th className="py-1.5 px-2.5 border border-[#cbd5e1] w-28">Di Penjahit</th>
                  <th className="py-1.5 px-2.5 border border-[#cbd5e1]">Peringatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-800 text-[11px]">
                {siapJahitList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400 border border-[#cbd5e1]">
                      Tidak ada antrean siap jahit.
                    </td>
                  </tr>
                ) : (
                  siapJahitList.map((row) => (
                    <tr key={row.rank} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono font-bold border border-[#cbd5e1]">
                        {row.rank}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-[#0284c7] border border-[#cbd5e1]">
                        {row.sku}
                      </td>
                      <td className="py-1.5 px-3 font-semibold uppercase border border-[#cbd5e1]">
                        {row.namaProduk}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900 border border-[#cbd5e1] bg-amber-50/50">
                        {row.siapJahit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2.5 border border-[#cbd5e1]">
                        {row.diPenjahit}
                      </td>
                      <td className="py-1.5 px-2.5 border border-[#cbd5e1]">
                        {row.peringatan && (
                          <span className="font-extrabold text-rose-600 text-[10px]">
                            {row.peringatan}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: SIAP KIRIM KE GUDANG - TERBANYAK */}
        <div className="bg-white rounded-lg border border-[#cbd5e1] shadow-sm overflow-hidden">
          <div className="bg-[#0f4c81] text-white px-3 py-1.5 flex items-center justify-between">
            <span className="font-black text-xs uppercase tracking-wide">
              SIAP KIRIM KE GUDANG - TERBANYAK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e40af] text-white font-extrabold text-[10.5px] uppercase tracking-wider border-b border-[#cbd5e1]">
                  <th className="py-1.5 px-2 text-center w-10 border border-[#cbd5e1]">Rank</th>
                  <th className="py-1.5 px-2.5 w-32 border border-[#cbd5e1]">Kode SKU</th>
                  <th className="py-1.5 px-3 border border-[#cbd5e1]">Produk</th>
                  <th className="py-1.5 px-2 text-right w-20 border border-[#cbd5e1]">Siap Kirim</th>
                  <th className="py-1.5 px-2 text-right w-20 border border-[#cbd5e1]">Total Selesai</th>
                  <th className="py-1.5 px-2 text-right w-24 border border-[#cbd5e1]">Tunggu Finishing</th>
                  <th className="py-1.5 px-2 text-center w-24 border border-[#cbd5e1]">Status Produksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-800 text-[11px]">
                {siapKirimList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-400 border border-[#cbd5e1]">
                      Tidak ada antrean siap kirim ke gudang.
                    </td>
                  </tr>
                ) : (
                  siapKirimList.map((row) => (
                    <tr key={row.rank} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono font-bold border border-[#cbd5e1]">
                        {row.rank}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-[#0284c7] border border-[#cbd5e1]">
                        {row.sku}
                      </td>
                      <td className="py-1.5 px-3 font-semibold uppercase border border-[#cbd5e1]">
                        {row.namaProduk}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black text-emerald-800 border border-[#cbd5e1] bg-emerald-50/60">
                        {row.siapKirim.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-[#cbd5e1]">
                        {row.totalSelesai.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-700 border border-[#cbd5e1]">
                        {row.tungguFinishing}
                      </td>
                      <td className="py-1.5 px-2 text-center border border-[#cbd5e1]">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-900">
                          {row.statusProduksi}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

