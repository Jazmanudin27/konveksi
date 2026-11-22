// src/components/common/QRCode.jsx
import React, { useMemo } from 'react';
import { createQRCodeMatrix } from './qrcode-generator';

export default function QRCode({
  value = '',
  size = 120,
  bgColor = '#ffffff',
  fgColor = '#0f172a',
  className = '',
  includeMargin = true,
}) {
  const qr = useMemo(() => {
    if (!value) return null;
    try {
      return createQRCodeMatrix(String(value));
    } catch (e) {
      console.warn('QR Code generation fallback:', e);
      return null;
    }
  }, [value]);

  if (!qr) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono border border-slate-200 rounded ${className}`}
      >
        QR
      </div>
    );
  }

  const { moduleCount, modules } = qr;
  const margin = includeMargin ? 2 : 0;
  const viewBoxSize = moduleCount + margin * 2;

  const rects = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c + margin}
            y={r + margin}
            width={1}
            height={1}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`inline-block select-none ${className}`}
      style={{ background: bgColor }}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {rects}
    </svg>
  );
}
