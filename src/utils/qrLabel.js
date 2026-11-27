// src/utils/qrLabel.js
// Generator & parser QR Code unik per pcs produk (anti-tukar antar pcs, antar produk, & antar SPK)

/**
 * Format QR unik per pcs:
 * {noAntrian}|{antreanId}|{sku}|P{pcsIndex}/{totalQty}
 * Contoh: ANT-20261119-433-R|15|SAM-BW-TANPA|P1/2
 */
export function buildUnitQrValue(antrean, pcsIndex, totalQty) {
  const noAntrian = String(antrean?.noAntrian || `ANT-${antrean?.id || 0}`).trim();
  const id = String(antrean?.id ?? '0').trim();
  const sku = String(antrean?.sku || 'NOSKU').trim();
  return `${noAntrian}|${id}|${sku}|P${pcsIndex}/${totalQty}`;
}

/**
 * Parse hasil scan QR/Barcode.
 * Mendukung format baru per-pcs maupun fallback format lama (nomor SPK saja).
 */
export function parseUnitQrValue(rawCode) {
  const clean = String(rawCode || '')
    .trim()
    .replace(/^https?:\/\/.*#track\//i, '')
    .replace(/\*/g, '');

  if (!clean) return null;

  const parts = clean.split('|');
  if (parts.length >= 4 && /^P\d+\/\d+$/i.test(parts[3].trim())) {
    const [pcsPart, totalPart] = parts[3].trim().slice(1).split('/');
    const pcsIndex = Number(pcsPart);
    const totalQty = Number(totalPart);
    return {
      isUnitQr: true,
      raw: clean,
      noAntrian: parts[0].trim(),
      antreanId: parts[1].trim(),
      sku: parts[2].trim(),
      pcsIndex,
      totalQty,
      unitKey: `${parts[1].trim()}::${parts[2].trim()}::P${pcsIndex}`,
    };
  }

  return {
    isUnitQr: false,
    raw: clean,
    noAntrian: clean,
    antreanId: null,
    sku: null,
    pcsIndex: null,
    totalQty: null,
    unitKey: null,
  };
}
