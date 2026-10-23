import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { FleetDashboard } from './components/dashboard/FleetDashboard';
import { MasterKapal } from './components/master/MasterKapal';
import { MasterPelabuhan } from './components/master/MasterPelabuhan';
import { MasterKru } from './components/master/MasterKru';
import { MasterTarif } from './components/master/MasterTarif';
import { TransaksiVoyage } from './components/transaksi/TransaksiVoyage';
import { TransaksiBunker } from './components/transaksi/TransaksiBunker';
import { TransaksiMaintenance } from './components/transaksi/TransaksiMaintenance';
import { TransaksiManifest } from './components/transaksi/TransaksiManifest';
import { LaporanPelayaran } from './components/laporan/LaporanPelayaran';
import { DatabaseModal } from './components/database/DatabaseModal';
import { dbManager } from './services/db/databaseManager';
import { 
  Ship, Compass, Anchor, Users, DollarSign, Navigation, 
  Fuel, Wrench, FileText, BarChart3, Database, LogOut, 
  Menu, X, ShieldCheck, ChevronRight, Bell, Search, RefreshCw 
} from 'lucide-react';

type NavSection = 
  | 'dashboard'
  | 'master_kapal'
  | 'master_pelabuhan'
  | 'master_kru'
  | 'master_tarif'
  | 'transaksi_voyage'
  | 'transaksi_bunker'
  | 'transaksi_maintenance'
  | 'transaksi_manifest'
  | 'laporan';

const MainApplication: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // Load latest state from DB
  const [vessels, setVessels] = useState(() => dbManager.getVessels());
  const [ports, setPorts] = useState(() => dbManager.getPorts());
  const [crews, setCrews] = useState(() => dbManager.getCrews());
  const [tariffs, setTariffs] = useState(() => dbManager.getTariffs());
  const [voyages, setVoyages] = useState(() => dbManager.getVoyages());
  const [bunkerLogs, setBunkerLogs] = useState(() => dbManager.getBunkerLogs());
  const [maintenances, setMaintenances] = useState(() => dbManager.getMaintenances());
  const [manifests, setManifests] = useState(() => dbManager.getManifests());
  const [dbConfig, setDbConfig] = useState(() => dbManager.getConfig());

  const refreshAllData = () => {
    setVessels(dbManager.getVessels());
    setPorts(dbManager.getPorts());
    setCrews(dbManager.getCrews());
    setTariffs(dbManager.getTariffs());
    setVoyages(dbManager.getVoyages());
    setBunkerLogs(dbManager.getBunkerLogs());
    setMaintenances(dbManager.getMaintenances());
    setManifests(dbManager.getManifests());
    setDbConfig(dbManager.getConfig());
    setDataVersion(v => v + 1);
  };

  useEffect(() => {
    refreshAllData();
  }, [activeSection]);

  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
    count?: number;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const navItems: NavGroup[] = [
    {
      group: 'Utama & Telemetri',
      items: [
        { id: 'dashboard', label: 'Dashboard & Radar Pelayaran', icon: Compass, badge: 'Real-Time' }
      ]
    },
    {
      group: 'Master Data',
      items: [
        { id: 'master_kapal', label: 'Master Kapal (Fleet)', icon: Ship, count: vessels.length },
        { id: 'master_pelabuhan', label: 'Master Pelabuhan (Ports)', icon: Anchor, count: ports.length },
        { id: 'master_kru', label: 'Master Kru Kapal (Crew)', icon: Users, count: crews.length },
        { id: 'master_tarif', label: 'Master Tarif & Kargo', icon: DollarSign, count: tariffs.length },
      ]
    },
    {
      group: 'Transaksi Data',
      items: [
        { id: 'transaksi_voyage', label: 'Jadwal & Voyage Pelayaran', icon: Navigation, count: voyages.length },
        { id: 'transaksi_bunker', label: 'Logbook Konsumsi Bunker', icon: Fuel, count: bunkerLogs.length },
        { id: 'transaksi_maintenance', label: 'Pemeliharaan & Docking', icon: Wrench, count: maintenances.length },
        { id: 'transaksi_manifest', label: 'Manifest Kargo & B/L', icon: FileText, count: manifests.length },
      ]
    },
    {
      group: 'Laporan & Analitik',
      items: [
        { id: 'laporan', label: 'Laporan Resmi & Export', icon: BarChart3 }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveSection('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">SAMUDERA</span>
                <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.2 rounded-full font-mono font-bold">
                  FLEET OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Sistem Manajemen Perusahaan Pelayaran</p>
            </div>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Multi-Database Connector Status Button */}
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all shadow-md ${
              dbConfig.provider === 'supabase'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : dbConfig.provider === 'neon'
                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                : dbConfig.provider === 'firebase'
                ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                : 'bg-blue-950/70 border-blue-500/40 text-blue-300 hover:bg-blue-900/60'
            }`}
          >
            <Database className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Database:</span>
            <span className="font-mono uppercase font-bold text-[11px]">
              {dbConfig.provider}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping hidden sm:inline-block" />
          </button>

          {/* User Session Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                {user.name}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">
                {user.role}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-950/95 lg:bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-6 overflow-y-auto pr-1">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                  {group.group}
                </span>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id as NavSection);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold">
                          {item.badge}
                        </span>
                      )}

                      {typeof item.count === 'number' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isActive ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Quick Database Status Box in Sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 text-xs">
            <div
              onClick={() => setIsDbModalOpen(true)}
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Koneksi Real DB
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  AKTIF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Engine: <strong className="text-white uppercase">{dbConfig.provider}</strong>
              </p>
              <div className="text-[10px] text-cyan-400 hover:underline mt-1 flex items-center gap-1">
                Konfigurasi Multi-DB <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-16">
          {activeSection === 'dashboard' && (
            <FleetDashboard
              onNavigateToVoyages={() => setActiveSection('transaksi_voyage')}
              onNavigateToVessels={() => setActiveSection('master_kapal')}
              onNavigateToReports={() => setActiveSection('laporan')}
            />
          )}

          {activeSection === 'master_kapal' && (
            <MasterKapal ports={ports} onDataChanged={refreshAllData} />
          )}

          {activeSection === 'master_pelabuhan' && (
            <MasterPelabuhan onDataChanged={refreshAllData} />
          )}

          {activeSection === 'master_kru' && (
            <MasterKru vessels={vessels} onDataChanged={refreshAllData} />
          )}

          {activeSection === 'master_tarif' && (
            <MasterTarif onDataChanged={refreshAllData} />
          )}

          {activeSection === 'transaksi_voyage' && (
            <TransaksiVoyage
              vessels={vessels}
              ports={ports}
              tariffs={tariffs}
              onDataChanged={refreshAllData}
            />
          )}

          {activeSection === 'transaksi_bunker' && (
            <TransaksiBunker
              vessels={vessels}
              voyages={voyages}
              onDataChanged={refreshAllData}
            />
          )}

          {activeSection === 'transaksi_maintenance' && (
            <TransaksiMaintenance
              vessels={vessels}
              onDataChanged={refreshAllData}
            />
          )}

          {activeSection === 'transaksi_manifest' && (
            <TransaksiManifest
              voyages={voyages}
              onDataChanged={refreshAllData}
            />
          )}

          {activeSection === 'laporan' && (
            <LaporanPelayaran
              vessels={vessels}
              ports={ports}
              voyages={voyages}
              bunkerLogs={bunkerLogs}
              maintenances={maintenances}
              manifests={manifests}
            />
          )}
        </main>
      </div>

      {/* Database Connection Hub Modal */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onConfigChanged={refreshAllData}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
