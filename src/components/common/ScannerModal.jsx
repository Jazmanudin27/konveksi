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
  Warehouse,
  ArrowRight,
  Volume2,
  VolumeX,
  Barcode as BarcodeIcon,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { parseUnitQrValue } from '../../utils/qrLabel';

export default function ScannerModal({
  isOpen,
  onClose,
  division = 'jahit', // 'cutting' | 'jahit' | 'qc' | 'finishing' | 'gudang' | 'general'
  antreanList = [],
  currentUser = null,
  onActionSuccess,
}) {
  // Deteksi perangkat: Mobile pakai Kamera, Desktop pakai Mesin Scanner (Laser Gun)
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  };

  const [scanMode, setScanMode] = useState(() => (isMobile() ? 'camera' : 'laser'));
  const [scanQuery, setScanQuery] = useState('');
  const [matchedItem, setMatchedItem] = useState(null);
  const [isUnitMode, setIsUnitMode] = useState(false);
  const [scannedUnits, setScannedUnits] = useState([]); // Array nomor pcs yang sudah di-scan, misal [1, 2]
  const [scanAlert, setScanAlert] = useState(null); // { type: 'success' | 'error' | 'warning', text: string }
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const lastCameraScanRef = useRef({ raw: '', time: 0 });

  // Ref sinkron agar callback kamera & keydown selalu membaca state terbaru
  const matchedItemRef = useRef(null);
  const scannedUnitsRef = useRef([]);
  const isUnitModeRef = useRef(false);

  useEffect(() => {
    matchedItemRef.current = matchedItem;
  }, [matchedItem]);

  useEffect(() => {
    scannedUnitsRef.current = scannedUnits;
  }, [scannedUnits]);

  useEffect(() => {
    isUnitModeRef.current = isUnitMode;
  }, [isUnitMode]);

  // Audio feedback: Beep sukses vs Error buzz (anti-tukar)
  const playBeep = (type = 'success') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.32);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.32);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.14);
      }
    } catch (_) {}
  };

  const resetScanState = () => {
    setScanQuery('');
    setMatchedItem(null);
    setIsUnitMode(false);
    setScannedUnits([]);
    setScanAlert(null);
    matchedItemRef.current = null;
    scannedUnitsRef.current = [];
    isUnitModeRef.current = false;
    lastCameraScanRef.current = { raw: '', time: 0 };
    if (scanMode === 'laser') {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  // Reset & inisialisasi mode saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const mobileDevice = isMobile();
      setScanMode(mobileDevice ? 'camera' : 'laser');
      resetScanState();
      setIsProcessing(false);

      if (mobileDevice) {
        startCamera();
      } else {
        stopCamera();
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Listener keyboard global khusus Mesin Scanner Laser di Desktop
  useEffect(() => {
    if (!isOpen || scanMode !== 'laser') return;

    const handleKeyDown = (e) => {
      if (document.activeElement === inputRef.current) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 150) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          handleCodeScanned(barcodeBufferRef.current, 'laser');
          barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scanMode, antreanList]);

  const switchScanMode = (newMode) => {
    setScanMode(newMode);
    if (newMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Kamera tidak didukung oleh browser ini. Gunakan mode Mesin Scanner / ketik nomor SPK.');
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
      console.warn('Camera stream error:', err);
      setCameraError('Kamera tidak aktif atau izin ditolak. Silakan gunakan mode Mesin Scanner.');
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
            const now = Date.now();
            // Hindari spam scan berulang jika kamera masih diarahkan ke QR yang sama < 1.8 detik
            if (
              lastCameraScanRef.current.raw === rawVal &&
              now - lastCameraScanRef.current.time < 1800
            ) {
              return;
            }
            lastCameraScanRef.current = { raw: rawVal, time: now };
            handleCodeScanned(rawVal, 'camera');
          }
        }
      } catch (_) {}
    }, 350);
  };

  // Cari item antrean dengan validasi ketat (anti tertukar antar SPK & antar produk)
  const findAntreanFromParsed = (parsed) => {
    if (!parsed) return null;
    if (parsed.isUnitQr) {
      // Cocokkan ID + No. SPK + SKU secara persis agar tidak mungkin tertukar
      return (
        antreanList.find(
          (a) =>
            String(a.id) === parsed.antreanId &&
            String(a.noAntrian || '').toLowerCase() === parsed.noAntrian.toLowerCase() &&
            String(a.sku || '').toLowerCase() === parsed.sku.toLowerCase()
        ) ||
        antreanList.find(
          (a) =>
            String(a.noAntrian || '').toLowerCase() === parsed.noAntrian.toLowerCase() &&
            String(a.sku || '').toLowerCase() === parsed.sku.toLowerCase()
        ) ||
        null
      );
    }

    const q = parsed.noAntrian.toLowerCase();
    return (
      antreanList.find(
        (a) =>
          (a.noAntrian && a.noAntrian.toLowerCase() === q) ||
          String(a.id) === parsed.noAntrian ||
          (a.noReff && a.noReff.toLowerCase() === q)
      ) || null
    );
  };

  // Proses hasil scan QR / Barcode
  const handleCodeScanned = (rawCode, source = 'manual') => {
    if (!rawCode || isProcessing) return;
    const parsed = parseUnitQrValue(rawCode);
    if (!parsed) return;

    const found = findAntreanFromParsed(parsed);
    const currentLocked = matchedItemRef.current;

    if (!found) {
      playBeep('error');
      setScanAlert({
        type: 'error',
        text: `QR / Kode "${parsed.raw}" tidak ditemukan di daftar SPK aktif.`,
      });
      if (source !== 'manual') setScanQuery('');
      return;
    }

    // MODE QR PER-PCS (FORMAT UNIK: SPK|ID|SKU|P1/2)
    if (parsed.isUnitQr) {
      const targetQty = Math.max(1, Number(found.qty) || parsed.totalQty || 1);

      // Validasi range nomor pcs
      if (parsed.pcsIndex < 1 || parsed.pcsIndex > targetQty) {
        playBeep('error');
        setScanAlert({
          type: 'error',
          text: `Nomor Pcs #${parsed.pcsIndex} tidak valid untuk jumlah ${targetQty} Pcs.`,
        });
        setScanQuery('');
        return;
      }

      // ANTI-TUKAR: Jika sudah mengunci 1 produk, tolak QR dari produk lain maupun SPK lain!
      if (currentLocked) {
        const isSameItem =
          String(currentLocked.id) === String(found.id) &&
          String(currentLocked.noAntrian || '').toLowerCase() === String(found.noAntrian || '').toLowerCase() &&
          String(currentLocked.sku || '').toLowerCase() === String(found.sku || '').toLowerCase();

        if (!isSameItem) {
          playBeep('error');
          setScanAlert({
            type: 'error',
            text: `TERTUKAR! QR ini milik ${found.noAntrian} (${found.namaProduk || found.sku} • Pcs #${parsed.pcsIndex}), bukan ${currentLocked.noAntrian} (${currentLocked.namaProduk || currentLocked.sku})!`,
          });
          setScanQuery('');
          return;
        }

        // ANTI-DUPLIKAT: Tolak jika Pcs yang sama di-scan dua kali!
        if (scannedUnitsRef.current.includes(parsed.pcsIndex)) {
          playBeep('error');
          setScanAlert({
            type: 'warning',
            text: `DUPLIKAT! QR Pcs #${parsed.pcsIndex}/${targetQty} sudah di-scan. Scan QR Pcs lainnya!`,
          });
          setScanQuery('');
          return;
        }

        const nextUnits = [...scannedUnitsRef.current, parsed.pcsIndex].sort((a, b) => a - b);
        scannedUnitsRef.current = nextUnits;
        setScannedUnits(nextUnits);
        playBeep('success');

        if (nextUnits.length >= targetQty) {
          setScanAlert({
            type: 'success',
            text: `LENGKAP! Semua ${targetQty}/${targetQty} Pcs (${found.namaProduk || found.sku}) sudah terverifikasi.`,
          });
        } else {
          setScanAlert({
            type: 'success',
            text: `Pcs #${parsed.pcsIndex}/${targetQty} cocok! Scan ${targetQty - nextUnits.length} Pcs lagi.`,
          });
        }
        setScanQuery('');
        return;
      }

      // Scan pertama: kunci produk ini dan catat Pcs pertama
      matchedItemRef.current = found;
      isUnitModeRef.current = true;
      scannedUnitsRef.current = [parsed.pcsIndex];
      setMatchedItem(found);
      setIsUnitMode(true);
      setScannedUnits([parsed.pcsIndex]);
      playBeep('success');

      if (targetQty <= 1) {
        setScanAlert({
          type: 'success',
          text: `LENGKAP! 1/1 Pcs (${found.namaProduk || found.sku}) terverifikasi.`,
        });
      } else {
        setScanAlert({
          type: 'success',
          text: `Pcs #${parsed.pcsIndex}/${targetQty} masuk! Scan ${targetQty - 1} Pcs lagi dari produk yang sama.`,
        });
      }
      setScanQuery('');
      return;
    }

    // Fallback: scan manual / barcode lama tanpa nomor pcs
    if (currentLocked && isUnitModeRef.current) {
      playBeep('error');
      setScanAlert({
        type: 'error',
        text: `Sedang memindai QR per Pcs (${currentLocked.noAntrian}). Scan label QR Pcs atau klik Reset untuk ganti SPK.`,
      });
      setScanQuery('');
      return;
    }

    matchedItemRef.current = found;
    isUnitModeRef.current = false;
    scannedUnitsRef.current = [];
    setMatchedItem(found);
    setIsUnitMode(false);
    setScannedUnits([]);
    setScanAlert({
      type: 'success',
      text: `SPK ${found.noAntrian} (${found.namaProduk || found.sku}) ditemukan.`,
    });
    playBeep('success');
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    handleCodeScanned(scanQuery, 'manual');
    if (scanMode === 'laser') {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  };

  const targetQty = matchedItem ? Math.max(1, Number(matchedItem.qty) || 1) : 0;
  const isAllUnitsScanned = !isUnitMode || scannedUnits.length >= targetQty;
  const remainingUnits = Math.max(0, targetQty - scannedUnits.length);

  const handleExecuteAction = async (actionType) => {
    if (!matchedItem || !onActionSuccess || !isAllUnitsScanned) return;
    setIsProcessing(true);
    try {
      await onActionSuccess(matchedItem, actionType, currentUser);
      onClose();
    } catch (err) {
      console.error('Error action execution:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const loggedInWorkerName = currentUser?.nama || 'Saya';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[96vh]">
        {/* HEADER MODAL */}
        <div className="bg-[#0b1b36] text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                Scan QR Code Per Produk (Anti-Tukar)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-300">
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

        {/* TAB TOGGLE: MESIN SCANNER (DESKTOP) VS KAMERA HP (MOBILE) */}
        <div className="bg-slate-100 p-1.5 flex items-center gap-1 border-b border-slate-200 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => switchScanMode('laser')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scanMode === 'laser'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>Mesin Scanner (Desktop)</span>
          </button>

          <button
            type="button"
            onClick={() => switchScanMode('camera')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scanMode === 'camera'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera HP (Mobile)</span>
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50 flex-1">
          {/* 1. MODE MESIN SCANNER (DESKTOP) */}
          {scanMode === 'laser' && (
            <div className="border-2 border-dashed border-purple-400 bg-purple-50/60 rounded-2xl p-4 text-center space-y-1.5 shadow-inner">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-md">
                <BarcodeIcon className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-black text-xs sm:text-sm text-purple-950">
                Mode Mesin Scanner Aktif
              </h4>
              <p className="text-[11px] text-purple-800 font-medium max-w-sm mx-auto">
                Scan QR di setiap produk satu per satu. Sistem otomatis menolak jika QR duplikat atau tertukar produk/SPK lain.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Siap Menerima Scan</span>
              </div>
            </div>
          )}

          {/* 2. MODE KAMERA HP (MOBILE) */}
          {scanMode === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-slate-700 shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                <div className="w-48 h-32 border-2 border-emerald-400 rounded-xl relative animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -mt-0.5 -ml-0.5"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white -mt-0.5 -mr-0.5"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -mb-0.5 -ml-0.5"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white -mb-0.5 -mr-0.5"></div>
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400 opacity-80"></div>
                </div>
                <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full mt-2 font-mono">
                  Arahkan kamera ke QR Label Produk
                </span>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 text-white p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => switchScanMode('laser')}
                    className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                  >
                    Beralih ke Mesin Scanner
                  </button>
                </div>
              )}
            </div>
          )}

          {/* INPUT FIELD SCANNER */}
          <form onSubmit={handleInputSubmit} className="relative">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan QR Label Produk atau ketik No. SPK lalu Enter..."
                  value={scanQuery}
                  onChange={(e) => setScanQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-purple-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs active:scale-95"
              >
                Scan
              </button>
            </div>
          </form>

          {/* NOTIFIKASI STATUS SCAN (ANTI-TUKAR / DUPLIKAT / SUKSES) */}
          {scanAlert && (
            <div
              className={`rounded-xl p-2.5 text-xs font-bold flex items-start gap-2 border animate-in fade-in duration-150 ${
                scanAlert.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : scanAlert.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              {scanAlert.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : scanAlert.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{scanAlert.text}</span>
            </div>
          )}

          {/* HASIL DETEKSI PRODUK & CHECKLIST PER-PCS */}
          {matchedItem && (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-3.5 shadow-md space-y-3 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-sm text-purple-700">
                      {matchedItem.noAntrian}
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      {matchedItem.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 mt-0.5">
                    {matchedItem.namaProduk}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    SKU: {matchedItem.sku} • {matchedItem.varian} ({matchedItem.ukuran})
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className="font-mono font-black text-base text-emerald-600 leading-none">
                    {isUnitMode ? `${scannedUnits.length}/${targetQty}` : targetQty} Pcs
                  </span>
                  <button
                    type="button"
                    onClick={resetScanState}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                    title="Reset dan scan produk / SPK lain"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ganti SPK</span>
                  </button>
                </div>
              </div>

              {/* PROGRESS BAR & CHECKLIST PER PCS (ANTI-TUKAR) */}
              {isUnitMode && (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700">Verifikasi QR Per Pcs</span>
                    <span className={isAllUnitsScanned ? 'text-emerald-700' : 'text-amber-700'}>
                      {isAllUnitsScanned
                        ? `Lengkap (${targetQty}/${targetQty} Pcs)`
                        : `Kurang ${remainingUnits} Pcs lagi`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isAllUnitsScanned ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (scannedUnits.length / targetQty) * 100)}%` }}
                    />
                  </div>

                  {/* Daftar Pcs #1 .. #N (tampilkan badge jika qty <= 40, jika lebih tampilkan ringkasan) */}
                  {targetQty <= 40 ? (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {Array.from({ length: targetQty }, (_, idx) => idx + 1).map((num) => {
                        const done = scannedUnits.includes(num);
                        return (
                          <span
                            key={num}
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                              done
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            {done ? `✓ #${num}` : `#${num}`}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-slate-500 font-mono">
                      Ter-scan: {scannedUnits.slice(-8).map((n) => `#${n}`).join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* ACTION SESUAI DIVISI */}
              <div className="space-y-2">
                {!isAllUnitsScanned ? (
                  <div className="w-full py-2.5 px-3 bg-slate-100 border border-slate-300 text-slate-500 font-bold text-xs rounded-xl text-center">
                    Scan sisa {remainingUnits} QR Pcs lagi untuk membuka tombol proses
                  </div>
                ) : (
                  <>
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
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Selesaikan Jahit & Serahkan ke Tim QC</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleExecuteAction('ambil_jahit')}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
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
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            <Scissors className="w-4 h-4" />
                            <span>Mulai Proses Potong Bahan (Cutting)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleExecuteAction('selesai_cutting')}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
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
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
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
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <Warehouse className="w-4 h-4" />
                        <span>Serahkan ke Gudang Jadi (Packing Selesai)</span>
                      </button>
                    )}

                    {(division === 'general' || division === 'gudang') && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleExecuteAction('view_detail')}
                        className="w-full py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Buka Detail & Lanjut Proses</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            {scanMode === 'laser' ? '🔫 Mesin Scanner Ready' : '📷 Kamera Scanner Ready'}
          </span>
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
