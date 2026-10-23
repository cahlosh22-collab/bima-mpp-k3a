import React, { useState, useEffect } from 'react';
import { Vessel, Voyage, Port, BunkerLog, Maintenance } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Ship, Navigation, Compass, Gauge, Fuel, Anchor, AlertTriangle, 
  TrendingUp, Activity, Play, Pause, ChevronRight, Wind, MapPin, 
  Clock, DollarSign, Box, ShieldCheck, CheckCircle2
} from 'lucide-react';

interface FleetDashboardProps {
  onNavigateToVoyages: () => void;
  onNavigateToVessels: () => void;
  onNavigateToReports: () => void;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({ 
  onNavigateToVoyages, 
  onNavigateToVessels,
  onNavigateToReports 
}) => {
  const [vessels, setVessels] = useState<Vessel[]>(() => dbManager.getVessels());
  const [voyages, setVoyages] = useState<Voyage[]>(() => dbManager.getVoyages());
  const [ports, setPorts] = useState<Port[]>(() => dbManager.getPorts());
  const [bunkerLogs] = useState<BunkerLog[]>(() => dbManager.getBunkerLogs());
  const [maintenances] = useState<Maintenance[]>(() => dbManager.getMaintenances());

  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(vessels[0] || null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [telemetryTick, setTelemetryTick] = useState(0);

  // Live telemetry timer (runs every 3.5s when simulation is enabled)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const updated = dbManager.simulateTelemetryTick();
      setVessels(updated);
      setTelemetryTick(prev => prev + 1);

      // keep selected vessel in sync
      if (selectedVessel) {
        const found = updated.find(v => v.id === selectedVessel.id);
        if (found) setSelectedVessel(found);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedVessel]);

  // Operational metrics
  const totalVessels = vessels.length;
  const sailingVessels = vessels.filter(v => v.status === 'Berlayar');
  const dockedVessels = vessels.filter(v => v.status === 'Bersandar');
  const maintenanceVessels = vessels.filter(v => v.status === 'Perawatan');
  const anchoredVessels = vessels.filter(v => v.status === 'Anchored');

  const fleetUtilization = totalVessels > 0 
    ? Math.round((sailingVessels.length / totalVessels) * 100) 
    : 0;

  const totalFuelRemaining = vessels.reduce((acc, v) => acc + (v.fuelCapacityMT * (v.fuelLevelPercent / 100)), 0);
  const activeVoyages = voyages.filter(v => v.status === 'Underway');
  const totalRevenueOngoing = activeVoyages.reduce((acc, v) => acc + v.freightRevenue, 0);

  // Helper port name
  const getPortName = (portId?: string) => {
    if (!portId) return '-';
    const p = ports.find(x => x.id === portId);
    return p ? `${p.name} (${p.code})` : portId;
  };

  // Convert GPS Coordinates to SVG X, Y on Indonesian Archipelago Map
  // Longitude range: 95 to 141 (approx width 46 deg)
  // Latitude range: -11 to 6 (approx height 17 deg)
  const mapCoordsToSvg = (lat: number, lon: number) => {
    const minLon = 95.0;
    const maxLon = 141.0;
    const minLat = -11.0;
    const maxLat = 6.0;

    const x = ((lon - minLon) / (maxLon - minLon)) * 800;
    // Invert Y because latitude goes north (positive)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 360;

    return { x: Math.max(20, Math.min(780, x)), y: Math.max(20, Math.min(340, y)) };
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Telemetry Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-cyan-400 opacity-75' : 'bg-slate-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulating ? 'bg-cyan-500' : 'bg-slate-500'}`} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              {isSimulating ? 'SISTEM AIS TELEMETRI AKTIF • SINKRON OTOMATIS' : 'SIMULASI TELEMETRI DIJEDA'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Pusat Komando Operasional Armada
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring posisi geografis, konsumsi bunker, kecepatan navigasi, dan status voyage seluruh armada kapal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border shadow-lg ${
              isSimulating
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 shadow-cyan-950/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4 text-cyan-400" />
                <span>Jeda Pelacak Live ({telemetryTick})</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Lanjutkan Simulasi Real-Time</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNavigateToVoyages}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>+ Buka Voyage Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Armada</span>
            <Ship className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalVessels}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{totalVessels} kapal</span> terdaftar
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Sedang Berlayar</span>
            <Navigation className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{sailingVessels.length}</div>
          <div className="text-[11px] text-cyan-500/80 mt-1">
            {sailingVessels.length} kapal navigasi aktif
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Bersandar / Port</span>
            <Anchor className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{dockedVessels.length}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Bongkar/muat di pelabuhan
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Perawatan / Docking</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{maintenanceVessels.length}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">
            {anchoredVessels.length} jangkar luar
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Tingkat Utilisasi</span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{fleetUtilization}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" style={{ width: `${fleetUtilization}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Nilai Freight Berjalan</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 truncate">
            Rp {(totalRevenueOngoing / 1_000_000_000).toFixed(1)} M
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {activeVoyages.length} voyage underway
          </div>
        </div>
      </div>

      {/* Main Section: Interactive Marine Radar Map & Vessel Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Map (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Peta Pelacakan Radar Perairan Indonesia & Asia Tenggara
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                    AIS LIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Klik ikon kapal atau pelabuhan untuk menginspeksi telemetri operasional</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                Berlayar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Bersandar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Perawatan
              </span>
            </div>
          </div>

          {/* SVG Maritime Map Graphic */}
          <div className="relative w-full aspect-[2/1] bg-slate-950/90 rounded-2xl border border-slate-800/90 overflow-hidden flex items-center justify-center">
            {/* Nautical Grid Lines */}
            <svg className="w-full h-full" viewBox="0 0 800 360" preserveAspectRatio="none">
              <defs>
                <pattern id="marine-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 58, 138, 0.25)" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              <rect width="800" height="360" fill="url(#marine-grid)" />

              {/* Stylized Archipelago Landmass Silhouettes (Sumatra, Java, Kalimantan, Sulawesi, Papua) */}
              {/* Sumatra */}
              <path
                d="M 60,110 L 120,70 L 170,120 L 220,180 L 190,220 L 150,190 L 110,160 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />
              {/* Java */}
              <path
                d="M 210,235 L 290,240 L 370,245 L 400,248 L 380,260 L 290,255 L 210,250 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />
              {/* Kalimantan */}
              <path
                d="M 270,100 L 350,90 L 400,120 L 410,180 L 370,210 L 290,200 L 260,150 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />
              {/* Sulawesi */}
              <path
                d="M 440,120 L 490,110 L 530,130 L 500,160 L 470,150 L 480,220 L 450,225 L 440,170 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />
              {/* Maluku & Papua */}
              <path
                d="M 620,130 L 760,140 L 770,220 L 680,230 L 650,190 L 610,160 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />

              {/* Major Maritime Sea Lanes (Dashed route vectors) */}
              {/* Selat Malaka - Priok */}
              <line x1="120" y1="80" x2="225" y2="235" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Priok - Perak */}
              <line x1="225" y1="235" x2="350" y2="248" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Perak - Makassar */}
              <line x1="350" y1="248" x2="470" y2="215" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Balikpapan - Priok */}
              <line x1="410" y1="165" x2="225" y2="235" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Makassar - Bitung */}
              <line x1="470" y1="215" x2="530" y2="120" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Sea Labels */}
              <text x="270" y="225" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="2">LAUT JAWA</text>
              <text x="130" y="115" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1">SELAT MALAKA</text>
              <text x="430" y="175" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="2">SELAT MAKASSAR</text>
              <text x="560" y="240" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="2">LAUT BANDA</text>

              {/* Port Markers */}
              {ports.map((port) => {
                const { x, y } = mapCoordsToSvg(port.latitude, port.longitude);
                return (
                  <g key={port.id} className="cursor-pointer group">
                    <circle cx={x} cy={y} r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
                    <text
                      x={x + 6}
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="8"
                      fontWeight="bold"
                      className="group-hover:fill-white transition-colors"
                    >
                      {port.code}
                    </text>
                  </g>
                );
              })}

              {/* Vessel Markers */}
              {vessels.map((vessel) => {
                const { x, y } = mapCoordsToSvg(vessel.latitude, vessel.longitude);
                const isSelected = selectedVessel?.id === vessel.id;
                const isSailing = vessel.status === 'Berlayar';
                const isDocked = vessel.status === 'Bersandar';
                const isMaint = vessel.status === 'Perawatan';

                const color = isSailing ? '#06b6d4' : isDocked ? '#10b981' : isMaint ? '#f59e0b' : '#64748b';

                return (
                  <g
                    key={vessel.id}
                    onClick={() => setSelectedVessel(vessel)}
                    className="cursor-pointer"
                  >
                    {/* Pulsing ring for sailing ships */}
                    {isSailing && (
                      <circle cx={x} cy={y} r={isSelected ? "14" : "10"} fill={color} opacity="0.25">
                        <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Ship heading vector */}
                    {isSailing && (
                      <line
                        x1={x}
                        y1={y}
                        x2={x + Math.sin((vessel.heading * Math.PI) / 180) * 16}
                        y2={y - Math.cos((vessel.heading * Math.PI) / 180) * 16}
                        stroke={color}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Main Ship Icon Pin */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "7" : "5.5"}
                      fill={color}
                      stroke={isSelected ? "#ffffff" : "#0f172a"}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                    />

                    {/* Name Label */}
                    <text
                      x={x}
                      y={y - 9}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#cbd5e1'}
                      fontSize="8.5"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))"
                    >
                      {vessel.name.split(' ')[1] || vessel.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Radar Coordinates HUD Overlay */}
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              Coverage: 06°00&apos;N - 11°00&apos;S / 095°00&apos;E - 141°00&apos;E • Zona Waktu: WIB / WITA / WIT
            </div>
          </div>

          {/* Quick Vessels Slider / Selectors */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {vessels.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVessel(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                  selectedVessel?.id === v.id
                    ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  v.status === 'Berlayar' ? 'bg-cyan-400' : v.status === 'Bersandar' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span>{v.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Telemetry Detail Card (1 Col) */}
        {selectedVessel ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-1.5 ${
                    selectedVessel.status === 'Berlayar'
                      ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                      : selectedVessel.status === 'Bersandar'
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950 border border-amber-500/40 text-amber-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    Status: {selectedVessel.status}
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedVessel.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedVessel.imoNumber} • Bendera: {selectedVessel.flag}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Tipe Kapal</span>
                  <div className="text-xs font-bold text-blue-400">{selectedVessel.type}</div>
                </div>
              </div>

              {/* Live Gauges */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Kecepatan (SOG)</span>
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {selectedVessel.speedKnots} <span className="text-xs text-slate-400 font-normal">Knots</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Course: {selectedVessel.heading}° ({selectedVessel.heading > 180 ? 'Selatan' : 'Utara'})
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Stok Bunker (BBM)</span>
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {selectedVessel.fuelLevelPercent}%
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        selectedVessel.fuelLevelPercent > 40 ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${selectedVessel.fuelLevelPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Coordinates & Route Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Posisi Koordinat GPS
                  </span>
                  <span className="font-mono text-white text-[11px]">
                    {selectedVessel.latitude.toFixed(4)}°, {selectedVessel.longitude.toFixed(4)}°
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-blue-400" />
                    Pelabuhan Asal
                  </span>
                  <span className="font-semibold text-slate-200">
                    {getPortName(selectedVessel.currentPortId)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    Pelabuhan Tujuan
                  </span>
                  <span className="font-semibold text-cyan-300">
                    {getPortName(selectedVessel.destinationPortId)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Nakhoda (Master)
                  </span>
                  <span className="font-semibold text-white">
                    {selectedVessel.captainName}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-purple-400" />
                    Kapasitas Bobot Mati (DWT)
                  </span>
                  <span className="font-semibold text-slate-200">
                    {selectedVessel.dwtCapacity.toLocaleString('id-ID')} MT {selectedVessel.teuCapacity ? `(${selectedVessel.teuCapacity} TEUs)` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedVessel.lastUpdated}
              </span>
              <button
                type="button"
                onClick={onNavigateToVessels}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Kelola Spesifikasi Kapal <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-center text-slate-500 text-xs">
            Pilih kapal pada radar untuk memeriksa telemetri
          </div>
        )}
      </div>

      {/* Underway Voyages & Bunker Operational Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Voyages Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Jadwal & Progress Pelayaran Aktif
              </h3>
              <p className="text-xs text-slate-400">Monitoring real-time perjalanan kargo lintas pulau</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToVoyages}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Lihat Semua ({voyages.length})
            </button>
          </div>

          <div className="space-y-3.5">
            {activeVoyages.slice(0, 3).map((voy) => {
              const ship = vessels.find(v => v.id === voy.vesselId);
              const origin = ports.find(p => p.id === voy.originPortId);
              const dest = ports.find(p => p.id === voy.destinationPortId);

              return (
                <div key={voy.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                        {voy.voyageNumber}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{ship?.name || 'Armada Samudera'}</h4>
                      <p className="text-xs text-slate-400">
                        {origin?.name || 'Asal'} &rarr; {dest?.name || 'Tujuan'} ({voy.distanceNauticalMiles} Mil Laut)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-emerald-400">
                        Rp {(voy.freightRevenue / 1_000_000).toLocaleString('id-ID')} Juta
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {voy.cargoVolume.toLocaleString('id-ID')} {voy.cargoUnit}
                      </div>
                    </div>
                  </div>

                  {/* Progress simulation bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Status: Underway di Laut</span>
                      <span className="text-cyan-400 font-semibold font-mono">
                        ETD: {voy.etd.split('T')[0]} • ETA: {voy.eta.split('T')[0]}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 h-full rounded-full animate-pulse" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bunker & Fuel Efficiency Highlights */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Efisiensi Konsumsi Bunker & Emisi
              </h3>
              <p className="text-xs text-slate-400">Catatan konsumsi harian bahan bakar kapal (SEEMP & IMO-DCS)</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToReports}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Laporan Bunker
            </button>
          </div>

          <div className="space-y-3">
            {bunkerLogs.slice(0, 3).map((log) => {
              const ship = vessels.find(v => v.id === log.vesselId);
              return (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{ship?.name || 'Kapal'}</h4>
                      <div className="text-[11px] text-slate-400">
                        {log.fuelType} • Kecepatan Rata: {log.avgSpeedKnots} Kts • RPM: {log.avgEngineRPM}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Kondisi Laut: {log.seaState} • Dicatat: {log.recordedBy}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400 font-mono">
                      {log.consumptionMT} MT
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Sisa: {log.stockRemainingMT} MT
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Maintenance Notice Card */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {maintenances[0]?.title || 'Pemeliharaan Kapal'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Vendor: {maintenances[0]?.dockyardVendor} • Status: {maintenances[0]?.status}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-400 font-mono">
              Rp {((maintenances[0]?.estimatedCost || 0) / 1_000_000).toLocaleString('id-ID')} Jt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
