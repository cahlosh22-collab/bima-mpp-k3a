import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ship, Lock, Mail, Eye, EyeOff, ShieldCheck, Anchor, ArrowRight, Database, CheckCircle2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin@samudera-logistics.co.id');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(usernameOrEmail, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Login gagal. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background nautical grid & glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Brand */}
      <div className="z-10 text-center mb-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-blue-400 mb-4 backdrop-blur-md shadow-lg shadow-blue-950/50">
          <Ship className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span className="text-sm font-semibold tracking-wider uppercase">Samudera Maritime Fleet OS</span>
          <span className="inline-flex items-center gap-1 text-[11px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono">
            v2.6 Enterprise
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Portal Manajemen Operasional Armada
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Sistem Terpadu Pelacakan Kapal, Master Data, Transaksi Voyage, Log Bunker & Real-Time Analytics.
        </p>
      </div>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Login Admin & Perwira</h2>
              <p className="text-xs text-slate-400">Silakan masukkan akun terdaftar Anda</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            DB Siap
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <span className="text-rose-400 font-bold">!</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username atau Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="misal: admin atau admin@samudera-logistics.co.id"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500" />
              <span>Ingat sesi saya</span>
            </label>
            <span className="text-blue-400 hover:underline cursor-pointer">Lupa sandi?</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengautentikasi...
              </span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              1-Klik Akses Demo Akun:
            </span>
            <span className="text-[11px] text-slate-500">Pilih role instan</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('admin@samudera-logistics.co.id');
                setPassword('admin123');
                quickLogin('Super Admin');
              }}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/30 text-left transition-all group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-blue-400 flex items-center justify-between">
                <span>Super Admin</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">admin@samudera-logistics.co.id</div>
              <div className="text-[10px] text-slate-500 font-mono">pwd: admin123</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('ops.manager@samudera-logistics.co.id');
                setPassword('ops123');
                quickLogin('Fleet Manager');
              }}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/30 text-left transition-all group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-blue-400 flex items-center justify-between">
                <span>Fleet Manager</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">ops.manager@...</div>
              <div className="text-[10px] text-slate-500 font-mono">pwd: ops123</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('port.agent@samudera-logistics.co.id');
                setPassword('port123');
                quickLogin('Port Agent');
              }}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/30 text-left transition-all group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-blue-400 flex items-center justify-between">
                <span>Port Agent</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">port.agent@...</div>
              <div className="text-[10px] text-slate-500 font-mono">pwd: port123</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('superintendent@samudera-logistics.co.id');
                setPassword('tech123');
                quickLogin('Chief Superintendent');
              }}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/30 text-left transition-all group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-blue-400 flex items-center justify-between">
                <span>Superintendent</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">superintendent@...</div>
              <div className="text-[10px] text-slate-500 font-mono">pwd: tech123</div>
            </button>
          </div>
        </div>

        {/* Database connectivity note */}
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mendukung Real Multi-DB: Supabase, Neon DB, Firebase & Local</span>
        </div>
      </div>

      <div className="z-10 mt-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} PT Samudera Nusantara Lines Tbk. Seluruh Hak Cipta Dilindungi.
      </div>
    </div>
  );
};
