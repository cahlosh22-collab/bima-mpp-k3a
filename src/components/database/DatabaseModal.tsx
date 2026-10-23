import React, { useState } from 'react';
import { dbManager } from '../../services/db/databaseManager';
import { DatabaseConfig, DatabaseProvider } from '../../types';
import { 
  Database, Server, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, 
  ExternalLink, HardDrive, ShieldCheck, Zap 
} from 'lucide-react';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose, onConfigChanged }) => {
  const [config, setConfig] = useState<DatabaseConfig>(() => dbManager.getConfig());
  const [selectedTab, setSelectedTab] = useState<DatabaseProvider>(config.provider);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async (provider: DatabaseProvider) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await dbManager.testConnection(provider, config);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi gagal diuji.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndActivate = (provider: DatabaseProvider) => {
    const updated = {
      ...config,
      provider,
      isConnected: true,
      lastConnectedAt: new Date().toISOString(),
      syncStatus: 'synced' as const
    };
    setConfig(updated);
    dbManager.saveConfig(updated);
    setTestResult({
      success: true,
      message: `Database provider berhasil dialihkan ke "${provider.toUpperCase()}".`
    });
    onConfigChanged();
  };

  const handleCopySql = () => {
    const sql = dbManager.generateSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang semua data demo armada maritim ke kondisi awal?')) {
      dbManager.resetToFactoryData();
      onConfigChanged();
      setTestResult({
        success: true,
        message: 'Seluruh data demo kapal, pelabuhan, kru, dan transaksi berhasil di-reset!'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Pusat Koneksi Real Database
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-normal">
                  Multi-DB Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih atau integrasikan database live Anda: Supabase, Neon DB, Firebase Firestore, atau Local Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            &times;
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/30 gap-2 pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setSelectedTab('supabase'); setTestResult(null); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
              selectedTab === 'supabase'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Supabase (PostgreSQL)</span>
            {config.provider === 'supabase' && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">AKTIF</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTab('neon'); setTestResult(null); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
              selectedTab === 'neon'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Neon DB (Serverless SQL)</span>
            {config.provider === 'neon' && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">AKTIF</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTab('firebase'); setTestResult(null); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
              selectedTab === 'firebase'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Firebase Firestore</span>
            {config.provider === 'firebase' && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">AKTIF</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTab('local'); setTestResult(null); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
              selectedTab === 'local'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Local Indexed Engine (Siap Pakai)</span>
            {config.provider === 'local' && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">AKTIF</span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {testResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* TAB 1: SUPABASE */}
          {selectedTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-emerald-300 text-sm">Integrasi Supabase Realtime PostgreSQL</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Hubungkan langsung ke Supabase Project Anda menggunakan Project URL dan Public Anon Key.
                  </p>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Buka Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzprojectref.supabase.co"
                    value={config.supabaseUrl}
                    onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={config.supabaseAnonKey}
                    onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTestConnection('supabase')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Uji Koneksi Supabase
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('supabase')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan & Aktifkan Supabase
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-2 border border-emerald-500/30 ml-auto"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'SQL Tersalin ke Clipboard!' : 'Salin SQL Schema Tables'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NEON DB */}
          {selectedTab === 'neon' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-cyan-300 text-sm">Integrasi Neon Serverless PostgreSQL</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Hubungkan menggunakan Connection String resmi dari Neon Console untuk query SQL langsung.
                  </p>
                </div>
                <a
                  href="https://console.neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Neon Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Neon DB Connection String (PostgreSQL URL)
                </label>
                <input
                  type="password"
                  placeholder="postgresql://neondb_owner:npg_xyz@ep-weathered-wave-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
                  value={config.neonConnectionString}
                  onChange={(e) => setConfig({ ...config, neonConnectionString: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format didukung: <code>postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require</code>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTestConnection('neon')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Uji Query Neon DB (SELECT NOW())
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('neon')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan & Aktifkan Neon DB
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-2 border border-cyan-500/30 ml-auto"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'SQL DDL Tersalin!' : 'Salin Skrip DDL PostgreSQL'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FIREBASE */}
          {selectedTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-amber-300 text-sm">Integrasi Google Firebase Firestore</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Sinkronisasikan koleksi data armada ke Google Cloud Firestore NoSQL Database.
                  </p>
                </div>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Firebase Project ID
                  </label>
                  <input
                    type="text"
                    placeholder="misal: samudera-fleet-prod"
                    value={config.firebaseProjectId}
                    onChange={(e) => setConfig({ ...config, firebaseProjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Firebase Web API Key
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSyA..."
                    value={config.firebaseApiKey}
                    onChange={(e) => setConfig({ ...config, firebaseApiKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTestConnection('firebase')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Uji Koneksi Firestore
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('firebase')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan & Aktifkan Firebase
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LOCAL ENGINE */}
          {selectedTab === 'local' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20">
                <h4 className="font-semibold text-blue-300 text-sm">Database Engine Lokal (Offline-First Persistent Storage)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Menggunakan penyimpanan lokal persisten dengan seed lengkap kapal perairan Indonesia (MV Samudera Perkasa, MT Barito Pioneer, KM Nusantara Raya, dll.). Mendukung penuh CRUD tanpa perlu koneksi internet eksternal.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-cyan-400">8 Kapal</div>
                  <div className="text-[11px] text-slate-400">Armada Aktif</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-blue-400">8 Pelabuhan</div>
                  <div className="text-[11px] text-slate-400">Terminal Laut</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-emerald-400">8 Perwira</div>
                  <div className="text-[11px] text-slate-400">Kru Nakhoda/KKM</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-amber-400">5 Voyage</div>
                  <div className="text-[11px] text-slate-400">Jadwal Pelayaran</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('local')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aktifkan Database Lokal
                </button>

                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-500/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset ke Data Awal Demo
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-blue-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 ml-auto"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin SQL Schema DDL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              Status Aktif: <strong className="text-white uppercase">{config.provider}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
