import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Shirt,
  ArrowRight,
  AlertCircle,
  Download
} from 'lucide-react';
import { api } from '../../services/api';

export default function Login({ onLoginSuccess, onOpenInstallModal }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.login({
        username: username.trim(),
        password: password.trim()
      });

      if (res && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage('Gagal memverifikasi akun pengguna.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glow Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-5">
        {/* Card Header & Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-950/60 mb-1">
            <div className="w-full h-full rounded-[14px] bg-[#0b1329] flex items-center justify-center">
              <Shirt className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>RUANG KONVEKSI</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/60">
              ERP
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sistem Manajemen Produksi, Stok Gudang & Pembayaran Upah Terintegrasi MySQL
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-[#0f172a]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-white">Masuk ke Sistem</h2>
            <p className="text-[11px] text-slate-400">Gunakan akun pengguna terdaftar di database</p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Input Username */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="misal: admin, gudang, nama_tim..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun..."
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[10.5px] text-slate-500 space-y-2">
          {onOpenInstallModal && (
            <div>
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pasang Aplikasi di Google Chrome</span>
              </button>
            </div>
          )}
          <p>Database MySQL: <span className="font-mono text-cyan-400">konveksi@localhost</span></p>
          <p>© 2026 Ruang Konveksi System • Hak Akses & Keamanan Terenkripsi</p>
        </div>
      </div>
    </div>
  );
}

