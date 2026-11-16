import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Flame,
  Clock,
  Package,
  Layers,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function MobileNotificationModal({
  isOpen,
  onClose,
  antreanList = [],
  bahan = [],
  products = [],
  onNavigateToAntrean,
  onNavigateToBahan,
  onNavigateToProduk,
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'order' | 'stok'

  // Kumpulkan notifikasi cerdas dari data operasional real-time
  const notifications = useMemo(() => {
    const list = [];

    // 1. Notifikasi Order Urgent & Prioritas Tinggi
    antreanList.forEach((item) => {
      const prioritas = (item.prioritas || '').toLowerCase();
      const status = item.status || item.statusTahapan || 'Menunggu Cutting';
      const isDone = status === 'Selesai Gudang' || status === 'Selesai';
      const noAntrian = item.noAntrian || item.noAntrean || `ANT-${item.id}`;
      const namaProduk = item.namaProduk || item.modelProduk || 'Produk';

      if (!isDone && (prioritas === 'urgent' || prioritas === 'tinggi')) {
        list.push({
          id: `antrean-urgent-${item.id || noAntrian}`,
          type: 'urgent',
          category: 'order',
          title: `Order Prioritas ${prioritas.toUpperCase()}`,
          message: `${noAntrian} • ${namaProduk} (${item.qty || item.targetQty || 50} Pcs)`,
          subMessage: `Tahapan: ${status} • Deadline: ${item.deadline || 'Segera'}`,
          icon: Flame,
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          badgeText: 'URGENT',
          actionText: 'Buka Antrean',
          onAction: () => {
            onClose();
            onNavigateToAntrean && onNavigateToAntrean();
          },
        });
      } else if (!isDone && (status === 'Menunggu Cutting' || status === 'Draft')) {
        list.push({
          id: `antrean-waiting-${item.id || noAntrian}`,
          type: 'waiting',
          category: 'order',
          title: 'Siap Potong / Menunggu Cutting',
          message: `${noAntrian} • ${namaProduk} (${item.qty || item.targetQty || 50} Pcs)`,
          subMessage: `Order antrean siap diserahkan ke bagian cutting`,
          icon: Clock,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          badgeText: 'MENUNGGU',
          actionText: 'Serah Cutting',
          onAction: () => {
            onClose();
            onNavigateToAntrean && onNavigateToAntrean();
          },
        });
      }
    });

    // 2. Notifikasi Stok Bahan Baku Menipis / Kritis
    bahan.forEach((b) => {
      const stokSaatIni = Number(b.stokSaatIni ?? b.stok ?? 0);
      const stokMin = Number(b.stokMinimum ?? 20);
      if (stokSaatIni <= stokMin) {
        list.push({
          id: `bahan-${b.id || b.kodeBahan}`,
          type: 'bahan-low',
          category: 'stok',
          title: stokSaatIni === 0 ? 'Stok Bahan Habis!' : 'Stok Bahan Menipis',
          message: `${b.namaBahan || b.nama} (${b.kodeBahan})`,
          subMessage: `Sisa fisik: ${stokSaatIni} ${b.satuan || 'Kg'} (Min: ${stokMin} ${b.satuan || 'Kg'})`,
          icon: Layers,
          color:
            stokSaatIni === 0
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200',
          badgeText: stokSaatIni === 0 ? 'HABIS' : 'MENIPIS',
          actionText: 'Cek Bahan',
          onAction: () => {
            onClose();
            onNavigateToBahan && onNavigateToBahan();
          },
        });
      }
    });

    // 3. Notifikasi Stok Produk Jadi Kosong
    products.forEach((p) => {
      const stok = Number(p.stok || 0);
      if (stok === 0 || p.status === 'Habis') {
        list.push({
          id: `prod-habis-${p.id || p.sku}`,
          type: 'prod-empty',
          category: 'stok',
          title: 'Stok Produk Habis',
          message: `${p.namaProduk} (${p.sku})`,
          subMessage: `Varian: ${p.varian} • Ukuran: ${Array.isArray(p.ukuran) ? p.ukuran[0] : p.ukuran}`,
          icon: Package,
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          badgeText: 'STOK 0',
          actionText: 'Lihat Produk',
          onAction: () => {
            onClose();
            onNavigateToProduk && onNavigateToProduk();
          },
        });
      }
    });

    return list;
  }, [antreanList, bahan, products, onClose, onNavigateToAntrean, onNavigateToBahan, onNavigateToProduk]);

  const filteredList = useMemo(() => {
    if (filterTab === 'all') return notifications;
    return notifications.filter((n) => n.category === filterTab);
  }, [notifications, filterTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center relative shadow-inner">
              <Bell className="w-5 h-5 text-emerald-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-[#064e3b] animate-pulse">
                  {notifications.length}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm tracking-tight text-white">
                  Pusat Notifikasi
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  {notifications.length} Baru
                </span>
              </div>
              <p className="text-[10.5px] font-semibold text-emerald-200/90 leading-none mt-0.5">
                Peringatan order antrean & stok fisik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-200 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Filter */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              filterTab === 'all'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilterTab('order')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              filterTab === 'order'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Order ({notifications.filter((n) => n.category === 'order').length})
          </button>
          <button
            onClick={() => setFilterTab('stok')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              filterTab === 'stok'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Stok ({notifications.filter((n) => n.category === 'stok').length})
          </button>
        </div>

        {/* Daftar Notifikasi */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800">
                Semua Operasional Terkendali!
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tidak ada order urgent atau stok kritis yang memerlukan perhatian saat ini.
              </p>
            </div>
          ) : (
            filteredList.map((notif) => {
              const IconComp = notif.icon;
              return (
                <div
                  key={notif.id}
                  onClick={notif.onAction}
                  className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-2xs transition-all cursor-pointer active:scale-[0.99] flex items-start gap-2.5"
                >
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${notif.color}`}
                  >
                    <IconComp className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black tracking-wide text-slate-500 uppercase">
                        {notif.title}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${notif.color}`}
                      >
                        {notif.badgeText}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 leading-snug truncate mt-0.5">
                      {notif.message}
                    </div>

                    <div className="text-[10.5px] text-slate-500 mt-0.5 leading-tight">
                      {notif.subMessage}
                    </div>

                    <div className="mt-2 flex items-center justify-end">
                      <span className="text-[10.5px] font-extrabold text-[#064e3b] hover:text-[#04362d] flex items-center gap-0.5">
                        {notif.actionText} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[10.5px] font-medium text-slate-500">
            {notifications.length} peringatan aktif
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#04362d] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

