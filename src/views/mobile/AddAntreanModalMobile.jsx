import React, { useState } from 'react';
import { Scissors, X } from 'lucide-react';
import { api } from '../../services/api';

export default function AddAntreanModalMobile({
  isOpen,
  onClose,
  products = [],
  onAntreanCreated,
}) {
  const [form, setForm] = useState({
    sku: '',
    targetQty: 50,
    prioritas: 'Normal',
    deadline: '',
    catatan: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sku) {
      alert('Pilih SKU Produk terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    const selectedProd = products.find((p) => p.sku === form.sku);
    const payload = {
      noAntrean: `ANT-${Date.now().toString().slice(-6)}`,
      tanggalAntrean: new Date().toISOString().split('T')[0],
      sumberPermintaan: 'PO Pelanggan',
      noReff: '-',
      sku: selectedProd?.sku || form.sku,
      modelProduk: selectedProd?.namaProduk || 'Custom Model',
      kategori: selectedProd?.kategori || 'Umum',
      varianWarna: selectedProd?.varian || 'Standar',
      ukuran: selectedProd?.ukuran || 'All Size',
      bahanBaku: selectedProd?.skuBahan || 'Bahan Standar',
      targetQty: Number(form.targetQty) || 50,
      prioritas: form.prioritas || 'Normal',
      deadline:
        form.deadline ||
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      statusTahapan: 'Menunggu Cutting',
      catatan: form.catatan || '',
    };

    try {
      const saved = await api.createAntrean(payload);
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
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-[#0b1329] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs">Tambah Antrean Produksi</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Produk (SKU)</label>
            <select
              value={form.sku}
              onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Pilih Model Produk --</option>
              {products.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} - {p.namaProduk} ({p.varian})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Qty (Pcs)</label>
              <input
                type="number"
                min="1"
                value={form.targetQty}
                onChange={(e) => setForm((prev) => ({ ...prev, targetQty: e.target.value }))}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
              <select
                value={form.prioritas}
                onChange={(e) => setForm((prev) => ({ ...prev, prioritas: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Tinggi">Tinggi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Deadline Selesai</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
            <input
              type="text"
              placeholder="Cth: Logo dada kiri, jahitan rantai"
              value={form.catatan}
              onChange={(e) => setForm((prev) => ({ ...prev, catatan: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Antrean'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

