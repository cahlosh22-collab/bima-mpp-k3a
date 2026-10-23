import React, { useState } from 'react';
import { BunkerLog, Vessel, Voyage } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Fuel, Plus, Search, Edit2, Trash2, Calendar, Ship, 
  Gauge, Wind, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface TransaksiBunkerProps {
  vessels: Vessel[];
  voyages: Voyage[];
  onDataChanged: () => void;
}

export const TransaksiBunker: React.FC<TransaksiBunkerProps> = ({ 
  vessels, 
  voyages, 
  onDataChanged 
}) => {
  const [bunkerLogs, setBunkerLogs] = useState<BunkerLog[]>(() => dbManager.getBunkerLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVesselFilter, setSelectedVesselFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<BunkerLog | null>(null);

  const [formData, setFormData] = useState<Omit<BunkerLog, 'id'>>({
    vesselId: vessels[0]?.id || '',
    voyageId: voyages[0]?.id || '',
    logDate: new Date().toISOString().split('T')[0],
    fuelType: 'VLSFO',
    consumptionMT: 15.0,
    stockRemainingMT: 450.0,
    avgEngineRPM: 102,
    avgSpeedKnots: 15.0,
    distanceRunNM: 220,
    seaState: 'Tenang (0-1)',
    recordedBy: 'Ir. Agus Pratama (KKM)',
    notes: 'Konsumsi dan suhu normal'
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getBunkerLogs();
    setBunkerLogs(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingLog(null);
    setFormData({
      vesselId: vessels[0]?.id || '',
      voyageId: voyages[0]?.id || '',
      logDate: new Date().toISOString().split('T')[0],
      fuelType: 'VLSFO',
      consumptionMT: 16.5,
      stockRemainingMT: 480.0,
      avgEngineRPM: 105,
      avgSpeedKnots: 15.2,
      distanceRunNM: 250,
      seaState: 'Tenang (0-1)',
      recordedBy: 'Chief Engineer (KKM)',
      notes: 'Kondisi ruang mesin terkendali'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: BunkerLog) => {
    setEditingLog(log);
    setFormData({
      vesselId: log.vesselId,
      voyageId: log.voyageId,
      logDate: log.logDate,
      fuelType: log.fuelType,
      consumptionMT: log.consumptionMT,
      stockRemainingMT: log.stockRemainingMT,
      avgEngineRPM: log.avgEngineRPM,
      avgSpeedKnots: log.avgSpeedKnots,
      distanceRunNM: log.distanceRunNM,
      seaState: log.seaState,
      recordedBy: log.recordedBy,
      notes: log.notes
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus catatan logbook konsumsi bunker ini?')) {
      const ok = dbManager.deleteBunkerLog(id);
      if (ok) {
        showNotification('success', 'Catatan bunker log berhasil dihapus.');
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus bunker log.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog) {
      dbManager.updateBunkerLog(editingLog.id, formData);
      showNotification('success', 'Catatan bunker log berhasil diperbarui.');
    } else {
      dbManager.createBunkerLog(formData);
      showNotification('success', 'Catatan bunker log baru berhasil disimpan.');
    }

    setIsModalOpen(false);
    reloadData();
  };

  const getVessel = (id: string) => vessels.find(v => v.id === id);
  const getVoyage = (id: string) => voyages.find(v => v.id === id);

  const filteredLogs = bunkerLogs.filter(b => {
    const ship = getVessel(b.vesselId);
    const matchesSearch = 
      b.recordedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fuelType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ship && ship.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVessel = selectedVesselFilter === 'all' || b.vesselId === selectedVesselFilter;

    return matchesSearch && matchesVessel;
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
            <Fuel className="w-6 h-6 text-amber-400" />
            Transaksi Logbook Harian & Konsumsi Bunker BBM (Bunker Log)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan harian konsumsi bahan bakar (VLSFO/MGO/HFO), sisa stok di tanki, RPM rata-rata, kecepatan, dan kondisi cuaca perairan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Logbook Bunker</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari logbook berdasarkan kapal, perwira KKM, atau jenis BBM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedVesselFilter}
            onChange={(e) => setSelectedVesselFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Semua Kapal Armada</option>
            {vessels.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="p-4">Tanggal & Kapal</th>
                <th className="p-4">Jenis BBM</th>
                <th className="p-4">Konsumsi Harian</th>
                <th className="p-4">Sisa Stok Tanki</th>
                <th className="p-4">Kondisi Mesin & Laut</th>
                <th className="p-4">Dicatat Oleh</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map((log) => {
                const ship = getVessel(log.vesselId);
                const voy = getVoyage(log.voyageId);

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{ship?.name || 'Kapal'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {log.logDate} • {voy?.voyageNumber || '-'}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded text-[11px]">
                        {log.fuelType}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-amber-400 font-mono text-sm">
                        {log.consumptionMT} MT
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Jarak Tempuh: {log.distanceRunNM} NM
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-mono text-white font-semibold">
                        {log.stockRemainingMT} MT
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Kapasitas total {ship?.fuelCapacityMT || 0} MT
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200">
                        {log.avgSpeedKnots} Knots @ {log.avgEngineRPM} RPM
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Wind className="w-3 h-3 text-cyan-400" />
                        Laut: {log.seaState}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-white font-medium">{log.recordedBy}</div>
                      {log.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
                          {log.notes}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Bunker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                {editingLog ? 'Edit Catatan Bunker Log' : 'Input Catatan Logbook Bunker Harian'}
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
                  <label className="block text-slate-300 font-medium mb-1">Kapal Armada *</label>
                  <select
                    value={formData.vesselId}
                    onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Voyage Terkait</label>
                  <select
                    value={formData.voyageId}
                    onChange={(e) => setFormData({ ...formData, voyageId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {voyages.map(voy => (
                      <option key={voy.id} value={voy.id}>{voy.voyageNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Logbook</label>
                  <input
                    type="date"
                    value={formData.logDate}
                    onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jenis Bahan Bakar (Fuel Type)</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="VLSFO">VLSFO (Very Low Sulphur Fuel Oil)</option>
                    <option value="MGO">MGO (Marine Gas Oil)</option>
                    <option value="HFO">HFO (Heavy Fuel Oil)</option>
                    <option value="Bio-Solar B35">Bio-Solar B35</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Konsumsi Harian (Metrik Ton)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.consumptionMT}
                    onChange={(e) => setFormData({ ...formData, consumptionMT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sisa Stok di Tanki (MT)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stockRemainingMT}
                    onChange={(e) => setFormData({ ...formData, stockRemainingMT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kecepatan Rata (Knots)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.avgSpeedKnots}
                    onChange={(e) => setFormData({ ...formData, avgSpeedKnots: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">RPM Mesin Induk</label>
                  <input
                    type="number"
                    value={formData.avgEngineRPM}
                    onChange={(e) => setFormData({ ...formData, avgEngineRPM: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jarak Tempuh Hari Ini (NM)</label>
                  <input
                    type="number"
                    value={formData.distanceRunNM}
                    onChange={(e) => setFormData({ ...formData, distanceRunNM: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kondisi Laut / Ombak</label>
                  <select
                    value={formData.seaState}
                    onChange={(e) => setFormData({ ...formData, seaState: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Tenang (0-1)">Tenang (Scale 0-1)</option>
                    <option value="Sedang (2-3)">Sedang (Scale 2-3)</option>
                    <option value="Kasar (4-5)">Kasar (Scale 4-5)</option>
                    <option value="Badai (>6)">Badai / Gelombang Tinggi (&gt;6)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Perwira Mesin Pencatat (KKM / Masinis)</label>
                  <input
                    type="text"
                    value={formData.recordedBy}
                    onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Catatan Operasional Mesin</label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingLog ? 'Simpan Perubahan' : 'Simpan Logbook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
