// src/components/common/Barcode.jsx
// Lightweight vector SVG Code 39 Barcode Generator (Zero dependencies)
import React, { useMemo } from 'react';

// Code 39 Character encodings (w = wide, n = narrow)
const CODE39_MAP = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn'
};

export default function Barcode({
  value = '',
  height = 42,
  width = 200,
  showText = true,
  className = '',
}) {
  const bars = useMemo(() => {
    if (!value) return [];
    const clean = '*' + String(value).toUpperCase().replace(/[^0-9A-Z\-.\s$/+%]/g, '-') + '*';
    const result = [];
    const narrowWidth = 1.2;
    const wideWidth = 2.8;

    let x = 4;
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      const pattern = CODE39_MAP[ch] || CODE39_MAP['-'];
      for (let j = 0; j < 9; j++) {
        const isBar = j % 2 === 0;
        const isWide = pattern[j] === 'w';
        const w = isWide ? wideWidth : narrowWidth;
        if (isBar) {
          result.push({ x, w });
        }
        x += w;
      }
      x += narrowWidth; // gap between characters
    }
    return { bars: result, totalWidth: x + 4 };
  }, [value]);

  if (!bars.bars || bars.bars.length === 0) return null;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${bars.totalWidth} ${height}`}
        style={{ width: width ? `${width}px` : '100%', height: `${height}px` }}
        shapeRendering="crispEdges"
      >
        <rect width={bars.totalWidth} height={height} fill="#ffffff" />
        {bars.bars.map((b, idx) => (
          <rect key={idx} x={b.x} y={2} width={b.w} height={height - 4} fill="#0f172a" />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-slate-700 font-bold -mt-0.5 select-none">
          {value}
        </span>
      )}
    </div>
  );
}
