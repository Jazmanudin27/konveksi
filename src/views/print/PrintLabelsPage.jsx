// src/views/print/PrintLabelsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Printer, Layers, X, Loader2, AlertCircle } from 'lucide-react';
import QRCode from '../../components/common/QRCode';
import { api } from '../../services/api';
import { buildUnitQrValue } from '../../utils/qrLabel';

export default function PrintLabelsPage({ antreanId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [antrean, setAntrean] = useState(null);
  const [allAntrean, setAllAntrean] = useState([]);
  const [products, setProducts] = useState([]);
  const [includeSameSpk, setIncludeSameSpk] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [list, prods] = await Promise.all([
          api.getAntrean(),
          api.getProducts().catch(() => []),
        ]);

        if (!active) return;
        const safeList = Array.isArray(list) ? list : [];
        const safeProds = Array.isArray(prods) ? prods : [];
        setAllAntrean(safeList);
        setProducts(safeProds);

        const target =
          safeList.find((a) => String(a.id) === String(antreanId)) ||
          safeList.find(
            (a) =>
              String(a.noAntrian || '').toLowerCase() ===
              decodeURIComponent(String(antreanId || '')).toLowerCase()
          );

        if (!target) {
          setError(`Data SPK "${antreanId}" tidak ditemukan.`);
        } else {
          setAntrean(target);
          document.title = `Cetak Label QR - ${target.noAntrian || `ANT-${target.id}`}`;
        }
      } catch (err) {
        if (active) setError(err.message || 'Gagal memuat data SPK.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [antreanId]);

  // Produk lain dalam 1 SPK / 1 No. Reff PO
  const siblingItems = useMemo(() => {
    if (!antrean) return [];
    const reff = String(antrean.noReff || '').trim();
    if (!reff || reff === '-' || allAntrean.length === 0) return [antrean];
    const matched = allAntrean.filter(
      (a) => String(a.noReff || '').trim().toLowerCase() === reff.toLowerCase()
    );
    return matched.length > 1 ? matched : [antrean];
  }, [antrean, allAntrean]);

  const itemsToPrint = useMemo(() => {
    if (!antrean) return [];
    return includeSameSpk && siblingItems.length > 1 ? siblingItems : [antrean];
  }, [antrean, includeSameSpk, siblingItems]);

  // Generate 1 label QR unik per 1 Pcs produk
  const labels = useMemo(() => {
    const list = [];
    itemsToPrint.forEach((item) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      const prod = products.find((p) => p.sku === item.sku) || null;
      const noAntrian = item.noAntrian || `ANT-${item.id}`;
      const displayName = item.namaProduk || prod?.namaProduk || item.sku || '-';
      const displaySku = item.sku || '-';

      for (let i = 1; i <= qty; i++) {
        list.push({
          key: `${item.id}-${item.sku}-${i}`,
          noAntrian,
          displayName,
          displaySku,
          pcsIndex: i,
          totalQty: qty,
          qrValue: buildUnitQrValue(item, i, qty),
        });
      }
    });
    return list;
  }, [itemsToPrint, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-2 text-slate-600 text-sm">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span className="font-semibold">Memuat label QR SPK...</span>
      </div>
    );
  }

  if (error || !antrean) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="text-sm font-bold text-slate-800">{error || 'Data SPK tidak ditemukan.'}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Tutup Tab
        </button>
      </div>
    );
  }

  const noAntrian = antrean.noAntrian || `ANT-${antrean.id}`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Toolbar Atas (Otomatis Hilang Saat Print) */}
      <div className="sticky top-0 z-20 bg-[#0b1b36] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md print:hidden">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-black tracking-wide">
            SPK
          </span>
          <div>
            <div className="text-xs font-extrabold leading-tight">
              #{noAntrian} • {labels.length} Label QR
            </div>
            <div className="text-[10px] text-slate-300">
              QR unik per pcs (anti-tukar antar produk & SPK)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {siblingItems.length > 1 && (
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSameSpk}
                onChange={(e) => setIncludeSameSpk(e.target.checked)}
                className="rounded cursor-pointer"
              />
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Produk 1 SPK ({siblingItems.length})</span>
            </label>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak ({labels.length} Label)</span>
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </div>
      </div>

      {/* Area Label QR (2 Kolom Bersih) */}
      <div className="py-6 px-4 print:p-0">
        <div
          id="printable-spk"
          className="grid grid-cols-2 gap-4 max-w-[540px] mx-auto"
        >
          {labels.map((lbl) => (
            <div
              key={lbl.key}
              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              className="bg-white border border-slate-300 border-t-4 border-t-amber-600 rounded-xl p-3 flex flex-col items-center text-center"
            >
              {/* Baris Atas: SPK Badge + Urutan Pcs */}
              <div className="w-full flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold tracking-wide">
                  SPK
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-500">
                  {lbl.pcsIndex}/{lbl.totalQty}
                </span>
              </div>

              {/* Nomor SPK */}
              <div className="font-mono font-extrabold text-[11px] text-slate-900 mb-1.5">
                #{lbl.noAntrian}
              </div>

              {/* QR Code Unik Per Pcs */}
              <div className="bg-white p-1">
                <QRCode value={lbl.qrValue} size={124} includeMargin={false} />
              </div>

              {/* Nama Produk & SKU */}
              <div className="mt-1.5 font-extrabold text-xs text-slate-900 leading-tight break-words">
                {lbl.displayName}
              </div>
              <div className="mt-0.5 font-mono font-bold text-[10px] text-slate-600">
                {lbl.displaySku}
              </div>

              {/* Pcs Index */}
              <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                Pcs #{lbl.pcsIndex}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
