// Opsi Standar UI Dropdown (Satuan & Status Operasional)

export const EMPLOYEE_CATEGORIES = [
  "Internal",
  "Makloon",
  "Tetap",
  "Kontrak",
  "Borongan",
  "Harian Lepas",
];

export const EMPLOYEE_SECTIONS = [
  "Penjahit",
  "Cutting (Pola)",
  "Jahit (Sewing)",
  "Sablon & Bordir",
  "Quality Control (QC)",
  "Finishing & Packing",
  "Gudang Bahan Baku",
];

export const EMPLOYEE_STATUSES = [
  {
    value: "Aktif",
    label: "Aktif",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "Cuti",
    label: "Cuti",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "Non-Aktif",
    label: "Non-Aktif",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export const JASA_SATUAN_OPTIONS = [
  "Pcs",
  "Lusin",
  "Titik",
  "Set",
  "Meter",
  "Lembar",
];

export const BAHAN_SATUAN_OPTIONS = [
  "Kg",
  "Cone",
  "Yard",
  "Meter",
  "Roll",
  "Pcs",
  "Lembar",
];

export const ANTREAN_PRIORITAS_OPTIONS = [
  {
    value: "Urgent",
    label: "Urgent",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    value: "Normal",
    label: "Normal",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "Low",
    label: "Low",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
  },
];

export const ANTREAN_STATUS_OPTIONS = [
  {
    value: "Menunggu Cutting",
    label: "Menunggu Cutting",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "Proses Cutting",
    label: "Proses Cutting",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "Proses Jahit",
    label: "Proses Jahit",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    value: "Proses QC",
    label: "Proses QC",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "Proses Finishing",
    label: "Proses Finishing",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    value: "Selesai",
    label: "Selesai",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "Dibatalkan",
    label: "Dibatalkan",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

