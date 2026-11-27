// src/views/desktop/antrean/CetakSpkModal.jsx
import React, { useMemo, useRef, useState } from 'react';
import { Printer, X, QrCode, Layers } from 'lucide-react';
import QRCode from '../../../components/common/QRCode';
import { buildUnitQrValue } from '../../../utils/qrLabel';

export default function CetakSpkModal({
  isOpen,
  antrean,
  antreanList = [],
  products = [],
  onClose,
}) {
  const printAreaRef = useRef(null);
  const [includeSameSpk, setIncludeSameSpk] = useState(false);

  // Cari produk lain yang masih satu SPK / satu No. Reff PO (jika ada)
  const siblingItems = useMemo(() => {
    if (!antrean) return [];
    const reff = String(antrean.noReff || '').trim();
    if (!reff || reff === '-' || !Array.isArray(antreanList) || antreanList.length === 0) {
      return [antrean];
    }
    const matched = antreanList.filter(
      (a) => String(a.noReff || '').trim().toLowerCase() === reff.toLowerCase()
    );
    return matched.length > 1 ? matched : [antrean];
  }, [antrean, antreanList]);

  const itemsToPrint = useMemo(() => {
    if (!antrean) return [];
    return includeSameSpk && siblingItems.length > 1 ? siblingItems : [antrean];
  }, [antrean, includeSameSpk, siblingItems]);

  // Generate daftar label: 1 label QR unik per 1 Pcs produk
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
          varian: item.varian || prod?.varian || '',
          ukuran: item.ukuran || prod?.ukuran || '',
          pcsIndex: i,
          totalQty: qty,
          qrValue: buildUnitQrValue(item, i, qty),
        });
      }
    });
    return list;
  }, [itemsToPrint, products]);

  if (!isOpen || !antrean) return null;

  const noAntrian = antrean.noAntrian || `ANT-${antrean.id}`;

  // Cetak bersih via jendela print khusus (hanya label QR & nama, tanpa terpotong halaman)
  const handlePrint = () => {
    const content = printAreaRef.current?.innerHTML;
    if (!content) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=820,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Label QR SPK - ${noAntrian}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      max-width: 560px;
      margin: 0 auto;
    }
    .label-card {
      border: 1.5px solid #cbd5e1;
      border-top: 4px solid #d97706;
      border-radius: 10px;
      padding: 12px 10px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .label-top {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .badge-spk {
      background: #d97706;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .pcs-counter {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .spk-no {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, monospace;
      margin-bottom: 6px;
    }
    .qr-wrap {
      padding: 4px;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .prod-name {
      margin-top: 6px;
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      word-break: break-word;
    }
    .prod-sku {
      margin-top: 2px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .pcs-foot {
      margin-top: 3px;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
    }
  </style>
</head>
<body>
  ${content}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 150);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* TOP TOOLBAR */}
        <div className="bg-[#0b1b36] text-white px-4 py-2.5 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs text-white truncate">
                Cetak Label QR Per Produk ({labels.length} Label)
              </h3>
              <p className="text-[10px] text-slate-300 truncate">
                #{noAntrian} • Setiap Pcs memiliki QR unik (anti tertukar)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label ({labels.length})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TOGGLE JIKA 1 SPK MEMILIKI BEBERAPA PRODUK */}
        {siblingItems.length > 1 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Terdapat <strong>{siblingItems.length} produk</strong> dalam Reff SPK <strong>{antrean.noReff}</strong>
              </span>
            </div>
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-amber-900 select-none">
              <input
                type="checkbox"
                checked={includeSameSpk}
                onChange={(e) => setIncludeSameSpk(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Cetak Semua Produk 1 SPK</span>
            </label>
          </div>
        )}

        {/* PREVIEW & PRINTABLE LABEL GRID */}
        <div
          id="printable-spk"
          className="p-5 overflow-y-auto bg-slate-100 flex-1 print:p-0 print:bg-white"
        >
          <div ref={printAreaRef}>
            <div className="label-grid grid grid-cols-2 gap-3.5 max-w-[540px] mx-auto">
              {labels.map((lbl) => (
                <div
                  key={lbl.key}
                  className="label-card bg-white border border-slate-300 border-t-4 border-t-amber-600 rounded-xl p-3 flex flex-col items-center text-center shadow-xs"
                >
                  {/* Top Bar: SPK Badge + Urutan Pcs */}
                  <div className="label-top w-full flex items-center justify-between mb-1.5">
                    <span className="badge-spk px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold tracking-wide">
                      SPK
                    </span>
                    <span className="pcs-counter font-mono text-[11px] font-bold text-slate-500">
                      {lbl.pcsIndex}/{lbl.totalQty}
                    </span>
                  </div>

                  {/* No SPK */}
                  <div className="spk-no font-mono font-extrabold text-[11px] text-slate-900 mb-1.5">
                    #{lbl.noAntrian}
                  </div>

                  {/* QR Code Unik Per Pcs */}
                  <div className="qr-wrap bg-white p-1">
                    <QRCode value={lbl.qrValue} size={120} includeMargin={false} />
                  </div>

                  {/* Nama Produk & SKU */}
                  <div className="prod-name mt-1.5 font-extrabold text-xs text-slate-900 leading-tight break-words">
                    {lbl.displayName}
                  </div>
                  <div className="prod-sku mt-0.5 font-mono font-bold text-[10px] text-slate-600">
                    {lbl.displaySku}
                  </div>

                  {/* Pcs Index */}
                  <div className="pcs-foot mt-0.5 text-[10px] font-semibold text-slate-500">
                    Pcs #{lbl.pcsIndex}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 print:hidden">
          <span className="text-[11px] text-slate-500">
            Total <strong>{labels.length}</strong> QR unik • Format: <code className="font-mono text-[10px]">SPK|ID|SKU|Pcs</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
