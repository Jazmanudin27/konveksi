// g:\Konveksi\src\views\desktop\pembayaran\utils.js

export function angkaTerbilang(nilai) {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  const angka = Math.floor(Math.abs(Number(nilai) || 0));
  if (angka === 0) return "Nol Rupiah";

  function sebut(x) {
    if (x < 12) return bilangan[x];
    if (x < 20) return sebut(x - 10) + " Belas";
    if (x < 100) return sebut(Math.floor(x / 10)) + " Puluh " + sebut(x % 10);
    if (x < 200) return "Seratus " + sebut(x - 100);
    if (x < 1000)
      return sebut(Math.floor(x / 100)) + " Ratus " + sebut(x % 100);
    if (x < 2000) return "Seribu " + sebut(x - 1000);
    if (x < 1000000)
      return sebut(Math.floor(x / 1000)) + " Ribu " + sebut(x % 1000);
    if (x < 1000000000)
      return sebut(Math.floor(x / 1000000)) + " Juta " + sebut(x % 1000000);
    if (x < 1000000000000)
      return (
        sebut(Math.floor(x / 1000000000)) + " Miliar " + sebut(x % 1000000000)
      );
    return "";
  }

  return sebut(angka).replace(/\s+/g, " ").trim() + " Rupiah";
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const parts = String(dateStr).slice(0, 10).split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parts[2];
    return `${day} ${month} ${year}`;
  }
  return dateStr;
}

