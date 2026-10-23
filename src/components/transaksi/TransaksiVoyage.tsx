import React, { useState } from 'react';
import { Voyage, VoyageStatus, Vessel, Port, CargoTariff } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Navigation, Plus, Search, Edit2, Trash2, Calendar, MapPin, 
  DollarSign, Ship, Fuel, CheckCircle2, AlertCircle, Clock 
} from 'lucide-react';

interface TransaksiVoyageProps {
  vessels: Vessel[];
  ports: Port[];
  tariffs: CargoTariff[];
  onDataChanged: () => void;
}

export const TransaksiVoyage: React.FC<TransaksiVoyageProps> = ({ 
  vessels, 
  ports, 
  tariffs, 
  onDataChanged 
}) => {
  const [voyages, setVoyages] = useState<Voyage[]>(() => dbManager.getVoyages());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null);

  const [formData, setFormData] = useState<Omit<Voyage, 'id' | 'createdAt'>>({
    voyageNumber: '',
    vesselId: vessels[0]?.id || '',
    originPortId: ports[0]?.id || '',
    destinationPortId: ports[1]?.id || '',
    etd: new Date().toISOString().slice(0, 16),
    eta: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    cargoCategory: 'Kontainer FCL',
    cargoVolume: 1000,
    cargoUnit: 'TEUs',
    freightRatePerUnit: 4850000,
    freightRevenue: 4850000000,
    estimatedFuelMT: 30,
    actualFuelMT: 0,
    distanceNauticalMiles: 400,
    status: 'Scheduled',
    captainOnDuty: 'Capt. Joko Wahyudi, M.Mar',
    remarks: 'Voyage terjadwal reguler'
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getVoyages();
    setVoyages(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingVoyage(null);
    const randomVoy = `VOY-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      voyageNumber: randomVoy,
      vesselId: vessels[0]?.id || '',
      originPortId: ports[0]?.id || '',
      destinationPortId: ports[1]?.id || '',
      etd: new Date().toISOString().slice(0, 16),
      eta: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      cargoCategory: 'Kontainer FCL',
      cargoVolume: 1200,
      cargoUnit: 'TEUs',
      freightRatePerUnit: 4850000,
      freightRevenue: 1200 * 4850000,
      estimatedFuelMT: 28.5,
      actualFuelMT: 0,
      distanceNauticalMiles: 395,
      status: 'Scheduled',
      captainOnDuty: vessels[0]?.captainName || 'Capt. On Duty',
      remarks: 'Jalur pelayaran reguler'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voy: Voyage) => {
    setEditingVoyage(voy);
    setFormData({
      voyageNumber: voy.voyageNumber,
      vesselId: voy.vesselId,
      originPortId: voy.originPortId,
      destinationPortId: voy.destinationPortId,
      etd: voy.etd,
      eta: voy.eta,
      atd: voy.atd,
      ata: voy.ata,
      cargoCategory: voy.cargoCategory,
      cargoVolume: voy.cargoVolume,
      cargoUnit: voy.cargoUnit,
      freightRatePerUnit: voy.freightRatePerUnit,
      freightRevenue: voy.freightRevenue,
      estimatedFuelMT: voy.estimatedFuelMT,
      actualFuelMT: voy.actualFuelMT,
      distanceNauticalMiles: voy.distanceNauticalMiles,
      status: voy.status,
      captainOnDuty: voy.captainOnDuty,
      remarks: voy.remarks
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, voyNumber: string) => {
    if (confirm(`Hapus jadwal pelayaran "${voyNumber}"?`)) {
      const ok = dbManager.deleteVoyage(id);
      if (ok) {
        showNotification('success', `Voyage "${voyNumber}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus voyage.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voyageNumber.trim() || !formData.vesselId) {
      showNotification('error', 'Nomor Voyage dan Kapal Armada wajib ditentukan!');
      return;
    }

    if (editingVoyage) {
      dbManager.updateVoyage(editingVoyage.id, formData);
      showNotification('success', `Voyage "${formData.voyageNumber}" berhasil diperbarui.`);
    } else {
      dbManager.createVoyage({
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      });
      showNotification('success', `Voyage baru "${formData.voyageNumber}" berhasil dijadwalkan.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  const getVessel = (id: string) => vessels.find(v => v.id === id);
  const getPort = (id: string) => ports.find(p => p.id === id);

  const filteredVoyages = voyages.filter(v => {
    const ship = getVessel(v.vesselId);
    const matchesSearch = 
      v.voyageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.captainOnDuty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ship && ship.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-6 h-6 text-cyan-400" />
            Transaksi Jadwal & Voyage Pelayaran (Voyage Management)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pengaturan rute pelayaran antar pelabuhan, jadwal ETD/ETA, realisasi keberangkatan, estimasi konsumsi bunker, dan kalkulasi nilai freight.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buka Voyage Pelayaran Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari voyage number, nama kapal, atau nakhoda..."
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
            <option value="all">Semua Status Pelayaran</option>
            <option value="Underway">Sedang Berlayar (Underway)</option>
            <option value="Scheduled">Dijadwalkan (Scheduled)</option>
            <option value="Arrived">Tiba di Pelabuhan (Arrived)</option>
            <option value="Completed">Selesai (Completed)</option>
            <option value="Delayed">Tertunda (Delayed)</option>
          </select>
        </div>
      </div>

      {/* Voyages Table / Cards */}
      <div className="space-y-3.5">
        {filteredVoyages.map((voy) => {
          const ship = getVessel(voy.vesselId);
          const origin = getPort(voy.originPortId);
          const dest = getPort(voy.destinationPortId);

          return (
            <div
              key={voy.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Ship className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-md">
                        {voy.voyageNumber}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        voy.status === 'Underway'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                          : voy.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : voy.status === 'Scheduled'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {voy.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {ship?.name || 'Armada Kapal'}
                      <span className="text-xs text-slate-400 font-normal">({ship?.type})</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {origin?.name || 'Asal'} &rarr; {dest?.name || 'Tujuan'}
                      </span>
                      <span>•</span>
                      <span>Jarak: <strong className="text-white">{voy.distanceNauticalMiles} Mil Laut</strong></span>
                      <span>•</span>
                      <span>Nakhoda: <strong className="text-white">{voy.captainOnDuty}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right side financial & schedule summary */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-500 block">Total Nilai Freight</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      Rp {voy.freightRevenue.toLocaleString('id-ID')}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      Muatan: {voy.cargoVolume.toLocaleString('id-ID')} {voy.cargoUnit} ({voy.cargoCategory})
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-500 block">Estimasi Waktu Navigasi</span>
                    <div className="text-xs text-slate-300 font-mono">
                      ETD: {voy.etd.replace('T', ' ')}
                    </div>
                    <div className="text-xs text-cyan-400 font-mono font-bold">
                      ETA: {voy.eta.replace('T', ' ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(voy)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Edit Voyage"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(voy.id, voy.voyageNumber)}
                      className="p-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all"
                      title="Hapus Voyage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {voy.remarks && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Catatan Operasional: <em className="text-slate-300">{voy.remarks}</em></span>
                  <span>BBM Est: {voy.estimatedFuelMT} MT {voy.actualFuelMT ? `(Realisasi: ${voy.actualFuelMT} MT)` : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Voyage */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                {editingVoyage ? `Edit Voyage: ${editingVoyage.voyageNumber}` : 'Buka Voyage Pelayaran Baru'}
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
                  <label className="block text-slate-300 font-medium mb-1">Nomor Voyage *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: VOY-SP-2026-045"
                    value={formData.voyageNumber}
                    onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kapal Armada yang Bertugas *</label>
                  <select
                    value={formData.vesselId}
                    onChange={(e) => {
                      const v = vessels.find(x => x.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        vesselId: e.target.value,
                        captainOnDuty: v?.captainName || formData.captainOnDuty
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pelabuhan Asal Keberangkatan</label>
                  <select
                    value={formData.originPortId}
                    onChange={(e) => setFormData({ ...formData, originPortId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    {ports.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pelabuhan Tujuan Kedatangan</label>
                  <select
                    value={formData.destinationPortId}
                    onChange={(e) => setFormData({ ...formData, destinationPortId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    {ports.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jadwal Keberangkatan (ETD)</label>
                  <input
                    type="datetime-local"
                    value={formData.etd}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Perkiraan Tiba (ETA)</label>
                  <input
                    type="datetime-local"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Muatan Kargo</label>
                  <input
                    type="text"
                    placeholder="misal: Kontainer FCL / Curah CPO"
                    value={formData.cargoCategory}
                    onChange={(e) => setFormData({ ...formData, cargoCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Volume Muatan & Satuan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.cargoVolume}
                      onChange={(e) => {
                        const vol = Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          cargoVolume: vol,
                          freightRevenue: vol * formData.freightRatePerUnit 
                        });
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="TEUs / MT"
                      value={formData.cargoUnit}
                      onChange={(e) => setFormData({ ...formData, cargoUnit: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tarif Freight per Unit (IDR)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.freightRatePerUnit}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setFormData({ 
                        ...formData, 
                        freightRatePerUnit: rate,
                        freightRevenue: formData.cargoVolume * rate
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Pendapatan Freight (IDR)</label>
                  <input
                    type="number"
                    value={formData.freightRevenue}
                    onChange={(e) => setFormData({ ...formData, freightRevenue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jarak Tempuh (Nautical Miles)</label>
                  <input
                    type="number"
                    value={formData.distanceNauticalMiles}
                    onChange={(e) => setFormData({ ...formData, distanceNauticalMiles: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Pelayaran</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VoyageStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Scheduled">Scheduled (Dijadwalkan)</option>
                    <option value="Underway">Underway (Sedang Berlayar)</option>
                    <option value="Arrived">Arrived (Tiba)</option>
                    <option value="Completed">Completed (Selesai Bongkar)</option>
                    <option value="Delayed">Delayed (Tertunda)</option>
                    <option value="Cancelled">Cancelled (Batal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nakhoda yang Bertanggung Jawab</label>
                <input
                  type="text"
                  value={formData.captainOnDuty}
                  onChange={(e) => setFormData({ ...formData, captainOnDuty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Catatan Pelayaran & Kondisi</label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingVoyage ? 'Simpan Perubahan' : 'Buka Voyage'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
