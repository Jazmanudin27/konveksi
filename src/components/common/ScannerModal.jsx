// src/components/common/ScannerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  QrCode,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  ShieldCheck,
  PackageCheck,
  Warehouse,
  ArrowRight,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function ScannerModal({
  isOpen,
  onClose,
  division = 'jahit', // 'cutting' | 'jahit' | 'qc' | 'finishing' | 'gudang' | 'general'
  antreanList = [],
  currentUser = null,
  onActionSuccess,
}) {
  const [scanQuery, setScanQuery] = useState('');
  const [matchedItem, setMatchedItem] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Play beep sound on scan success
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {}
  };

  // Auto focus input on modal open so Barcode Laser Gun works instantly
  useEffect(() => {
    if (isOpen) {
      setScanQuery('');
      setMatchedItem(null);
      setIsProcessing(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Kamera tidak didukung oleh browser ini. Gunakan barcode scanner atau input nomor.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Check if BarcodeDetector API exists
        if ('BarcodeDetector' in window) {
          try {
            detectorRef.current = new window.BarcodeDetector({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
            });
            startBarcodeDetection();
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Kamera tidak aktif atau izin ditolak. Anda tetap dapat menggunakan Barcode Scanner Gun / mengetik No. Antrean.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startBarcodeDetection = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(async () => {
      if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawVal = barcodes[0].rawValue;
          if (rawVal) {
            handleCodeScanned(rawVal);
          }
        }
      } catch (_) {}
    }, 400);
  };

  // Find antrean item based on scanned string
  const handleCodeScanned = (rawCode) => {
    if (!rawCode || isProcessing) return;
    const clean = String(rawCode).trim().replace(/^https?:\/\/.*#track\//i, '').replace(/\*/g, '');
    setScanQuery(clean);

    // Search in antrean list
    const found = antreanList.find(
      (a) =>
        (a.noAntrian && a.noAntrian.toLowerCase() === clean.toLowerCase()) ||
        String(a.id) === clean ||
        (a.noReff && a.noReff.toLowerCase() === clean.toLowerCase())
    );

    if (found) {
      playBeep();
      setMatchedItem(found);
    } else {
      setMatchedItem(null);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    handleCodeScanned(scanQuery);
  };

  // Execute Division Action
  const handleExecuteAction = async (actionType) => {
    if (!matchedItem || !onActionSuccess) return;
    setIsProcessing(true);
    try {
      await onActionSuccess(matchedItem, actionType, currentUser);
      onClose();
    } catch (err) {
      console.error('Error executing action:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const loggedInWorkerName = currentUser?.nama || 'Saya';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[95vh]">
        {/* HEADER */}
        <div className="bg-[#0b1b36] text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white leading-tight">
                Scan Barcode & QR Code SPK
              </h3>
              <p className="text-[10px] text-slate-300">
                Divisi: <span className="font-bold text-amber-300 uppercase">{division}</span> • Petugas: <strong className="text-emerald-300">{loggedInWorkerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
              title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-4 overflow-y-auto space-y-3.5 bg-slate-50 flex-1">
          {/* CAMERA VIEWPORT */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-slate-700 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* SCANNING OVERLAY FRAME */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="w-48 h-32 border-2 border-emerald-400 rounded-xl relative animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -mt-0.5 -ml-0.5"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white -mt-0.5 -mr-0.5"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -mb-0.5 -ml-0.5"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white -mb-0.5 -mr-0.5"></div>
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400 opacity-70"></div>
              </div>
              <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full mt-2 font-mono">
                Arahkan kamera ke QR / Barcode SPK
              </span>
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 text-white p-4 flex flex-col items-center justify-center text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              </div>
            )}
          </div>

          {/* LASER BARCODE SCANNER INPUT BOX (AUTO-FOCUS) */}
          <form onSubmit={handleInputSubmit} className="relative">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ketik / Scan nomor SPK (mis: ANT-20261119-433)..."
                  value={scanQuery}
                  onChange={(e) => {
                    setScanQuery(e.target.value);
                    handleCodeScanned(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Cari
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 pl-1">
              💡 <b>Tips:</b> Gunakan Barcode Scanner Gun (Laser) otomatis membaca saat diarahkan ke lembar SPK.
            </p>
          </form>

          {/* HASIL DETEKSI SPK */}
          {matchedItem ? (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-3.5 shadow-md space-y-2.5 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm text-purple-700">
                      {matchedItem.noAntrian}
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      {matchedItem.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 mt-0.5">
                    {matchedItem.namaProduk}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    SKU: {matchedItem.sku} • {matchedItem.varian} ({matchedItem.ukuran})
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-base text-emerald-600 block">
                    {matchedItem.qty} Pcs
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-bold block">
                    Target Order
                  </span>
                </div>
              </div>

              {/* ACTION BERDASARKAN DIVISI */}
              <div className="space-y-2">
                {division === 'jahit' && (
                  <div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 mb-2 text-xs">
                      <div className="text-[11px] text-purple-900 font-medium">
                        Akun Penjahit: <strong className="font-black text-purple-950 underline">{loggedInWorkerName}</strong>
                      </div>
                      <div className="text-[10px] text-purple-700 mt-0.5">
                        {matchedItem.status === 'Proses Jahit'
                          ? `Sedang dijahit oleh: ${matchedItem.timJahit || '-'}`
                          : 'Batch siap diambil untuk Anda jahit sekarang.'}
                      </div>
                    </div>

                    {matchedItem.status === 'Proses Jahit' ? (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleExecuteAction('serah_qc')}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Selesaikan Jahit & Serahkan ke Tim QC</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleExecuteAction('ambil_jahit')}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Scissors className="w-4 h-4" />
                        <span>Ambil SPK Ini & Mulai Menjahit</span>
                      </button>
                    )}
                  </div>
                )}

                {division === 'cutting' && (
                  <div>
                    {matchedItem.status === 'Menunggu Cutting' ? (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleExecuteAction('mulai_cutting')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Scissors className="w-4 h-4" />
                        <span>Mulai Proses Potong Bahan (Cutting)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleExecuteAction('selesai_cutting')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tandai Selesai Cutting (Siap Diambil Jahit)</span>
                      </button>
                    )}
                  </div>
                )}

                {division === 'qc' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleExecuteAction('proses_qc')}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lakukan Inspeksi QC & Lanjut Finishing</span>
                  </button>
                )}

                {division === 'finishing' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleExecuteAction('selesai_finishing')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>Serahkan ke Gudang Jadi (Packing Selesai)</span>
                  </button>
                )}
              </div>
            </div>
          ) : scanQuery ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Nomor SPK "{scanQuery}" tidak ditemukan</span>
              <span className="text-[11px] text-amber-600 block">
                Pastikan nomor antrean sudah didaftarkan pada sistem.
              </span>
            </div>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Scanner Siap Digunakan</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
