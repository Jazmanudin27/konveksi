// src/views/desktop/antrean/CetakSpkModal.jsx
// Tidak lagi menampilkan modal — langsung buka halaman cetak label di tab baru (target="_blank")
import { useEffect } from 'react';
import { openPrintLabelsTab } from '../../../utils/qrLabel';

export default function CetakSpkModal({ isOpen, antrean, onClose }) {
  useEffect(() => {
    if (isOpen && antrean) {
      openPrintLabelsTab(antrean);
      if (onClose) onClose();
    }
  }, [isOpen, antrean, onClose]);

  return null;
}
