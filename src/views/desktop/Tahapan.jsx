import React, { useEffect } from 'react';

// Deprecated view: dialihkan otomatis ke antrean produksi
export default function Tahapan({ onRedirect }) {
  useEffect(() => {
    if (onRedirect) onRedirect('antrean');
  }, [onRedirect]);

  return null;
}
