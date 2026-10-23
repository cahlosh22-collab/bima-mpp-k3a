import React, { useState } from 'react';
import { Vessel, VesselStatus, VesselType, Port } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Ship, Plus, Search, Edit2, Trash2, MapPin, Fuel, Gauge, 
  CheckCircle2, X, AlertCircle, Anchor, Navigation, ShieldCheck 
} from 'lucide-react';

interface MasterKapalProps {
  ports: Port[];
  onDataChanged: () => void;
}

export const MasterKapal: React.FC<MasterKapalProps> = ({ ports, onDataChanged }) => {
  const [vessels, setVessels] = useState<Vessel[]>(() => dbManager.getVessels());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Vessel, 'id' | 'lastUpdated'>>({
    name: '',
    imoNumber: '',
    type: 'Container',
    flag: 'Indonesia (ID)',
    dwtCapacity: 25000,
    teuCapacity: 1500,
    yearBuilt: 2020,
    enginePowerHP: 15000,
    status: 'Bersandar',
    currentPortId: ports[0]?.id || '',
    destinationPortId: ports[1]?.id || '',
    latitude: -6.1025,
    longitude: 106.8856,
    heading: 0,
    speedKnots: 0,
    fuelLevelPercent: 85,
    captainName: 'Capt. M. Arifin, M.Mar',
    fuelCapacityMT: 600,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getVessels();
    setVessels(list);
    onDataChanged();
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingVessel(null);
    setFormData({
      name: '',
      imoNumber: `IMO ${Math.floor(9000000 + Math.random() * 900000)}`,
      type: 'Container',
      flag: 'Indonesia (ID)',
      dwtCapacity: 25000,
      teuCapacity: 1500,
      yearBuilt: 2021,
      enginePowerHP: 14500,
      status: 'Bersandar',
      currentPortId: ports[0]?.id || '',
      destinationPortId: ports[1]?.id || '',
      latitude: -6.1025,
      longitude: 106.8856,
      heading: 90,
      speedKnots: 0,
      fuelLevelPercent: 85,
      captainName: '',
      fuelCapacityMT: 600,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setFormData({
      name: vessel.name,
      imoNumber: vessel.imoNumber,
      type: vessel.type,
      flag: vessel.flag,
      dwtCapacity: vessel.dwtCapacity,
      teuCapacity: vessel.teuCapacity || 0,
      yearBuilt: vessel.yearBuilt,
      enginePowerHP: vessel.enginePowerHP,
      status: vessel.status,
      currentPortId: vessel.currentPortId || '',
      destinationPortId: vessel.destinationPortId || '',
      latitude: vessel.latitude,
      longitude: vessel.longitude,
      heading: vessel.heading,
      speedKnots: vessel.speedKnots,
      fuelLevelPercent: vessel.fuelLevelPercent,
      captainName: vessel.captainName,
      fuelCapacityMT: vessel.fuelCapacityMT,
    });
    setIsModalOpen(true);
  };

  // Delete Vessel
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kapal "${name}" dari armada?`)) {
      const ok = dbManager.deleteVessel(id);
      if (ok) {
        showNotification('success', `Kapal "${name}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus kapal.');
      }
    }
  };

  // Save (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.imoNumber.trim()) {
      showNotification('error', 'Nama Kapal dan Nomor IMO wajib diisi!');
      return;
    }

    if (editingVessel) {
      dbManager.updateVessel(editingVessel.id, formData);
      showNotification('success', `Data kapal "${formData.name}" berhasil diperbarui.`);
    } else {
      dbManager.createVessel(formData);
      showNotification('success', `Kapal baru "${formData.name}" berhasil didaftarkan ke armada.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  // Filter logic
  const filteredVessels = vessels.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.imoNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.captainName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesType = filterType === 'all' || v.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getPortName = (id?: string) => {
    const p = ports.find(x => x.id === id);
    return p ? `${p.name} (${p.code})` : '-';
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs">&times;</button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="w-6 h-6 text-cyan-400" />
            Master Data Armada Kapal (Fleet Master)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola spesifikasi teknis, nomor IMO, perwira nakhoda, kapasitas muat, dan status operasional armada kapal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kapal Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kapal berdasarkan nama, IMO, atau nama nakhoda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="all">Semua Status Operasional</option>
            <option value="Berlayar">Sedang Berlayar (Underway)</option>
            <option value="Bersandar">Bersandar di Pelabuhan (Docked)</option>
            <option value="Perawatan">Dalam Perawatan (Maintenance)</option>
            <option value="Anchored">Labuh Jangkar (Anchored)</option>
          </select>
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="all">Semua Tipe Kapal</option>
            <option value="Container">Container Vessel</option>
            <option value="Bulk Carrier">Bulk Carrier (Curah Kering)</option>
            <option value="Oil Tanker">Oil / Chemical Tanker</option>
            <option value="Tug & Barge">Tug Boat & Tongkang</option>
            <option value="General Cargo">General Cargo</option>
            <option value="LNG/LPG">Gas Carrier (LNG/LPG)</option>
          </select>
        </div>
      </div>

      {/* Vessels Data Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVessels.map((vessel) => (
          <div
            key={vessel.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 ${
                    vessel.status === 'Berlayar'
                      ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                      : vessel.status === 'Bersandar'
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                      : vessel.status === 'Perawatan'
                      ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {vessel.status}
                  </span>
                  <h3 className="text-base font-bold text-white">{vessel.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{vessel.imoNumber}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(vessel)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    title="Edit Kapal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(vessel.id, vessel.name)}
                    className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all"
                    title="Hapus Kapal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Specs & Metrics */}
              <div className="grid grid-cols-2 gap-2.5 my-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Tipe & Bobot Mati</span>
                  <span className="font-semibold text-slate-200">{vessel.type}</span>
                  <div className="text-[11px] text-cyan-400 font-mono">{vessel.dwtCapacity.toLocaleString('id-ID')} DWT</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Kecepatan & Course</span>
                  <span className="font-semibold text-white">{vessel.speedKnots} Knots</span>
                  <div className="text-[11px] text-slate-400 font-mono">Heading: {vessel.heading}°</div>
                </div>
              </div>

              {/* Port & Crew Details */}
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-blue-400" />
                    Posisi Pelabuhan:
                  </span>
                  <span className="text-slate-200 font-medium truncate max-w-[170px]">
                    {getPortName(vessel.currentPortId)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    Tujuan Navigasi:
                  </span>
                  <span className="text-cyan-300 font-medium truncate max-w-[170px]">
                    {getPortName(vessel.destinationPortId)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Nakhoda:
                  </span>
                  <span className="text-white font-medium">
                    {vessel.captainName || '-'}
                  </span>
                </div>
              </div>

              {/* Fuel Level Bar */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    Stok Bunker BBM:
                  </span>
                  <span className="font-mono text-white font-bold">{vessel.fuelLevelPercent}% ({vessel.fuelCapacityMT} MT)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      vessel.fuelLevelPercent > 50 ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${vessel.fuelLevelPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Tahun Pembuatan: {vessel.yearBuilt} ({vessel.enginePowerHP} HP)</span>
              <span>GPS: {vessel.latitude.toFixed(2)}°, {vessel.longitude.toFixed(2)}°</span>
            </div>
          </div>
        ))}
      </div>

      {filteredVessels.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
          <Ship className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold">Tidak ditemukan armada kapal yang sesuai dengan filter.</p>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-400" />
                {editingVessel ? `Ubah Data Kapal: ${editingVessel.name}` : 'Pendaftaran Kapal Baru ke Armada'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Kapal (Vessel Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: MV Samudera Perkasa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor IMO (UN/IMO No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: IMO 9482156"
                    value={formData.imoNumber}
                    onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipe Kapal</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as VesselType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Container">Container (Peti Kemas)</option>
                    <option value="Bulk Carrier">Bulk Carrier (Curah Kering)</option>
                    <option value="Oil Tanker">Oil / Chemical Tanker</option>
                    <option value="Tug & Barge">Tug Boat & Tongkang</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="LNG/LPG">LNG / LPG Gas Carrier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VesselStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Bersandar">Bersandar (Docked at Port)</option>
                    <option value="Berlayar">Berlayar (Underway)</option>
                    <option value="Perawatan">Dalam Perawatan (Maintenance)</option>
                    <option value="Anchored">Labuh Jangkar (Anchored)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kapasitas Bobot Mati (DWT - MT)</label>
                  <input
                    type="number"
                    min="100"
                    value={formData.dwtCapacity}
                    onChange={(e) => setFormData({ ...formData, dwtCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kapasitas TEUs (Jika Container)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.teuCapacity || 0}
                    onChange={(e) => setFormData({ ...formData, teuCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nakhoda yang Bertugas (Master)</label>
                  <input
                    type="text"
                    placeholder="misal: Capt. Joko Wahyudi, M.Mar"
                    value={formData.captainName}
                    onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tahun Pembuatan & Horsepower (HP)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Tahun (2018)"
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData({ ...formData, yearBuilt: Number(e.target.value) })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="HP (16000)"
                      value={formData.enginePowerHP}
                      onChange={(e) => setFormData({ ...formData, enginePowerHP: Number(e.target.value) })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pelabuhan Saat Ini</label>
                  <select
                    value={formData.currentPortId}
                    onChange={(e) => setFormData({ ...formData, currentPortId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="">Pilih Pelabuhan...</option>
                    {ports.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pelabuhan Tujuan</label>
                  <select
                    value={formData.destinationPortId}
                    onChange={(e) => setFormData({ ...formData, destinationPortId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="">Pilih Pelabuhan...</option>
                    {ports.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Koordinat Posisi GPS (Lat, Long)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lat (-6.10)"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Long (106.88)"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kecepatan Navigasi & Heading</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Knots (15.5)"
                      value={formData.speedKnots}
                      onChange={(e) => setFormData({ ...formData, speedKnots: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Heading (0-360)"
                      value={formData.heading}
                      onChange={(e) => setFormData({ ...formData, heading: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingVessel ? 'Simpan Perubahan' : 'Daftarkan Kapal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
