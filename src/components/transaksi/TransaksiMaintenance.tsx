import React, { useState } from 'react';
import { Maintenance, MaintenanceStatus, MaintenanceType, MaintenancePriority, Vessel } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Wrench, Plus, Search, Edit2, Trash2, Calendar, Ship, 
  DollarSign, CheckCircle2, AlertCircle, Building, ShieldAlert 
} from 'lucide-react';

interface TransaksiMaintenanceProps {
  vessels: Vessel[];
  onDataChanged: () => void;
}

export const TransaksiMaintenance: React.FC<TransaksiMaintenanceProps> = ({ 
  vessels, 
  onDataChanged 
}) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>(() => dbManager.getMaintenances());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaint, setEditingMaint] = useState<Maintenance | null>(null);

  const [formData, setFormData] = useState<Omit<Maintenance, 'id'>>({
    workOrderNumber: '',
    vesselId: vessels[0]?.id || '',
    title: '',
    type: 'Dry Docking',
    priority: 'High',
    description: '',
    estimatedCost: 1500000000,
    actualCost: 1400000000,
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    dockyardVendor: 'PT PAL Indonesia (Surabaya)',
    status: 'Dalam Pengerjaan',
    technicianInCharge: 'Lead Surveyor',
    approvedBy: 'Fleet Tech Superintendent'
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getMaintenances();
    setMaintenances(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingMaint(null);
    setFormData({
      workOrderNumber: `WO-${new Date().getFullYear()}-M-${Math.floor(100 + Math.random() * 900)}`,
      vesselId: vessels[0]?.id || '',
      title: '',
      type: 'Dry Docking',
      priority: 'High',
      description: 'Pembersihan lambung, blasting SA 2.5, rekondisi propeller dan valve laut.',
      estimatedCost: 850000000,
      actualCost: 0,
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      dockyardVendor: 'PT PAL Indonesia (Persero)',
      status: 'Dijadwalkan',
      technicianInCharge: 'Ir. Sigit Wicaksono',
      approvedBy: 'Direktur Teknik Armada'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Maintenance) => {
    setEditingMaint(m);
    setFormData({
      workOrderNumber: m.workOrderNumber,
      vesselId: m.vesselId,
      title: m.title,
      type: m.type,
      priority: m.priority,
      description: m.description,
      estimatedCost: m.estimatedCost,
      actualCost: m.actualCost,
      startDate: m.startDate,
      targetEndDate: m.targetEndDate,
      completionDate: m.completionDate,
      dockyardVendor: m.dockyardVendor,
      status: m.status,
      technicianInCharge: m.technicianInCharge,
      approvedBy: m.approvedBy
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, woNum: string) => {
    if (confirm(`Hapus work order pemeliharaan "${woNum}"?`)) {
      const ok = dbManager.deleteMaintenance(id);
      if (ok) {
        showNotification('success', `Work Order "${woNum}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus catatan maintenance.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.workOrderNumber.trim()) {
      showNotification('error', 'Judul Pekerjaan dan Nomor Work Order wajib diisi!');
      return;
    }

    if (editingMaint) {
      dbManager.updateMaintenance(editingMaint.id, formData);
      showNotification('success', `Work Order "${formData.workOrderNumber}" berhasil diperbarui.`);
    } else {
      dbManager.createMaintenance(formData);
      showNotification('success', `Work Order baru "${formData.workOrderNumber}" berhasil diterbitkan.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  const getVessel = (id: string) => vessels.find(v => v.id === id);

  const filteredMaintenances = maintenances.filter(m => {
    const ship = getVessel(m.vesselId);
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dockyardVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ship && ship.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
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
            <Wrench className="w-6 h-6 text-rose-400" />
            Transaksi Pemeliharaan Kapal & Dry Docking (Ship Maintenance)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Penerbitan Work Order perawatan berkala, survei berkala BKI, docking tahunan galangan kapal, dan kontrol biaya teknis armada.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan Work Order Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari work order, judul pekerjaan, vendor galangan, atau nama kapal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="all">Semua Status Pengerjaan</option>
            <option value="Dalam Pengerjaan">Dalam Pengerjaan</option>
            <option value="Dijadwalkan">Dijadwalkan</option>
            <option value="Selesai">Selesai (Completed)</option>
            <option value="Tertunda">Tertunda (Pending)</option>
          </select>
        </div>
      </div>

      {/* Maintenance Cards */}
      <div className="space-y-4">
        {filteredMaintenances.map((m) => {
          const ship = getVessel(m.vesselId);

          return (
            <div
              key={m.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <Wrench className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-md">
                        {m.workOrderNumber}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        m.status === 'Dalam Pengerjaan'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : m.status === 'Selesai'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {m.status}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Tipe: {m.type}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{m.title}</h3>
                    <p className="text-xs text-cyan-400 font-semibold mt-0.5">
                      Kapal: {ship?.name || 'Armada Kapal'} ({ship?.imoNumber})
                    </p>

                    <div className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      {m.description}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="text-slate-300 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                        Galangan: <strong>{m.dockyardVendor}</strong>
                      </span>
                      <span>•</span>
                      <span>PIC Teknis: <strong>{m.technicianInCharge}</strong></span>
                      <span>•</span>
                      <span>Disetujui: {m.approvedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Right side cost & timeline */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-500 block">Estimasi Biaya Perbaikan</span>
                    <span className="text-base font-black text-rose-400 font-mono">
                      Rp {m.estimatedCost.toLocaleString('id-ID')}
                    </span>
                    {m.actualCost > 0 && (
                      <div className="text-[11px] text-emerald-400 font-mono">
                        Realisasi: Rp {m.actualCost.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>

                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-500 block">Periode Docking</span>
                    <div className="text-xs text-slate-300 font-mono">
                      Mulai: {m.startDate}
                    </div>
                    <div className="text-xs text-cyan-400 font-mono font-bold">
                      Target Selesai: {m.targetEndDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id, m.workOrderNumber)}
                      className="p-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Maintenance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-rose-400" />
                {editingMaint ? `Edit Work Order: ${editingMaint.workOrderNumber}` : 'Penerbitan Work Order Pemeliharaan'}
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
                  <label className="block text-slate-300 font-medium mb-1">Nomor Work Order *</label>
                  <input
                    type="text"
                    required
                    value={formData.workOrderNumber}
                    onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kapal yang Dikerjakan *</label>
                  <select
                    value={formData.vesselId}
                    onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Judul Pekerjaan Pemeliharaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Annual Dry Docking & Penggantian Plate Hull BKI"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipe Pemeliharaan</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MaintenanceType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Dry Docking">Dry Docking (Galangan)</option>
                    <option value="Rutin & Berkal">Rutin & Berkala (Running Maintenance)</option>
                    <option value="Darurat / Breakdown">Darurat / Kerusakan Mesin Mendadak</option>
                    <option value="Survey BKI/Statutoria">Survey Kelas BKI / Statutoria IMO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Low">Low (Rendah)</option>
                    <option value="Medium">Medium (Sedang)</option>
                    <option value="High">High (Tinggi)</option>
                    <option value="Critical">Critical (Sangat Mendesak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimasi Biaya (IDR)</label>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Realisasi Biaya Aktual (IDR)</label>
                  <input
                    type="number"
                    value={formData.actualCost}
                    onChange={(e) => setFormData({ ...formData, actualCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Mulai Pengerjaan</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Selesai Docking</label>
                  <input
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Galangan / Vendor Pelaksana</label>
                  <input
                    type="text"
                    value={formData.dockyardVendor}
                    onChange={(e) => setFormData({ ...formData, dockyardVendor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Pekerjaan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Dijadwalkan">Dijadwalkan</option>
                    <option value="Dalam Pengerjaan">Dalam Pengerjaan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Tertunda">Tertunda</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Deskripsi Ruang Lingkup Perbaikan (Scope of Work)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingMaint ? 'Simpan Perubahan' : 'Terbitkan Work Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
