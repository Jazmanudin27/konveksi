// Konstanta Aplikasi & Dropdown Sistem Manajemen Konveksi

export const HARGA_POTONG_MAP = {
  "SAMIRA": 700,
  "AISHA": 600,
  "SHAFEA": 1000,
  "COQUETTE": 1000,
  "NAYYARA": 1000,
  "ALUNA": 1000,
  "HAFSA": 1000,
  "MINA": 1000,
  "NAEEMA": 1000,
  "IRANANDHA": 500,
  "NAOMI": 500,
  "RALINE": 500,
  "AYUMI": 500,
  "VISCOSE": 500,
  "KERUDUNG": 500,
  "OVAL": 500,
  "RAWDA": 700,
  "LINI": 600,
  "ZAFIRA": 700,
  "NOIRA": 600,
  "ALYSSA": 700,
  "LAVINA": 600,
  "ELVARA": 500,
  "ARUMI": 500,
  "HANA": 700,
  "LARISA": 600,
  "LUNARA": 200,
  "ALIFA": 600,
  "KALUNA": 600,
  "HUMAIRA": 1000,
  "PASBAN UV": 500
};

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

export const INITIAL_BAHAN_DATA = [
  {
    id: 1,
    kodeBahan: "BHN-001",
    namaBahan: "Fleece Hitam 280gsm",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 98000,
    stok: 428,
    status: "Tersedia",
    keterangan: "Fleece 280gsm gramasi tebal"
  },
  {
    id: 2,
    kodeBahan: "BHN-002",
    namaBahan: "Fleece Navy 280gsm",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 98000,
    stok: 344,
    status: "Tersedia",
    keterangan: "Fleece 280gsm gramasi tebal"
  },
  {
    id: 3,
    kodeBahan: "BHN-003",
    namaBahan: "Cotton Combed 24s Putih",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 85000,
    stok: 205,
    status: "Tersedia",
    keterangan: "Combed 24s katun premium"
  },
  {
    id: 4,
    kodeBahan: "BHN-004",
    namaBahan: "Cotton Combed 24s Hitam",
    satuan: "Kg",
    supplier: "CV Tekstil Priangan",
    harga: 85000,
    stok: 144,
    status: "Tersedia",
    keterangan: "Combed 24s katun premium"
  },
  {
    id: 5,
    kodeBahan: "BHN-005",
    namaBahan: "Terry Abu",
    satuan: "Kg",
    supplier: "UD Kain Makmur",
    harga: 92000,
    stok: 326,
    status: "Tersedia",
    keterangan: "Baby terry rajut halus"
  },
  {
    id: 6,
    kodeBahan: "BHN-006",
    namaBahan: "Benang Jahit Hitam",
    satuan: "Cone",
    supplier: "Toko Aksesoris Jaya",
    harga: 12000,
    stok: 30,
    status: "Tersedia",
    keterangan: "Benang jahit cone industri"
  }
];

export const SUMBER_PERMINTAAN_OPTIONS = [
  "PO Pelanggan",
  "Marketplace / Toko",
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
