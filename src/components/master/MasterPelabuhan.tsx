import React, { useState } from 'react';
import { Port } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Anchor, Plus, Search, Edit2, Trash2, MapPin, Phone, 
  CheckCircle2, AlertCircle, Building2, User 
} from 'lucide-react';

interface MasterPelabuhanProps {
  onDataChanged: () => void;
}

export const MasterPelabuhan: React.FC<MasterPelabuhanProps> = ({ onDataChanged }) => {
  const [ports, setPorts] = useState<Port[]>(() => dbManager.getPorts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);

  const [formData, setFormData] = useState<Omit<Port, 'id'>>({
    code: '',
    name: '',
    city: '',
    province: '',
    country: 'Indonesia',
    latitude: -6.1,
    longitude: 106.8,
    maxDraftMeters: 12.5,
    berthsCount: 10,
    contactPhone: '+62-21-',
    harborMaster: 'Capt. Syahbandar Pelabuhan'
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getPorts();
    setPorts(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingPort(null);
    setFormData({
      code: 'ID',
      name: '',
      city: '',
      province: 'Indonesia',
      country: 'Indonesia',
      latitude: -6.1,
      longitude: 106.8,
      maxDraftMeters: 12.0,
      berthsCount: 8,
      contactPhone: '+62-',
      harborMaster: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (port: Port) => {
    setEditingPort(port);
    setFormData({
      code: port.code,
      name: port.name,
      city: port.city,
      province: port.province,
      country: port.country,
      latitude: port.latitude,
      longitude: port.longitude,
      maxDraftMeters: port.maxDraftMeters,
      berthsCount: port.berthsCount,
      contactPhone: port.contactPhone,
      harborMaster: port.harborMaster
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pelabuhan "${name}"?`)) {
      const ok = dbManager.deletePort(id);
      if (ok) {
        showNotification('success', `Pelabuhan "${name}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus pelabuhan.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showNotification('error', 'Nama Pelabuhan dan Kode UN/LOCODE wajib diisi!');
      return;
    }

    if (editingPort) {
      dbManager.updatePort(editingPort.id, formData);
      showNotification('success', `Pelabuhan "${formData.name}" berhasil diperbarui.`);
    } else {
      dbManager.createPort(formData);
      showNotification('success', `Pelabuhan baru "${formData.name}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  const filteredPorts = ports.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Anchor className="w-6 h-6 text-blue-400" />
            Master Data Pelabuhan & Terminal (Port Master)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data pelabuhan laut, kode UN/LOCODE, kedalaman draft alur (draft limit), kapasitas dermaga, dan kontak syahbandar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelabuhan Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari pelabuhan berdasarkan nama, kode (IDTPP, IDSUB, IDBLW), atau kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Ports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPorts.map((port) => (
          <div
            key={port.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-md">
                    {port.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{port.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{port.city}, {port.province}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(port)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(port.id, port.name)}
                    className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 my-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Maksimal Kedalaman Draft</span>
                  <span className="font-semibold text-emerald-400">{port.maxDraftMeters} Meter</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Jumlah Dermaga / Berth</span>
                  <span className="font-semibold text-white">{port.berthsCount} Dermaga</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Syahbandar:
                  </span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px]">
                    {port.harborMaster || '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Kontak Radio / Telp:
                  </span>
                  <span className="text-white font-mono text-[11px]">
                    {port.contactPhone || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Negara: {port.country}</span>
              <span>GPS: {port.latitude.toFixed(4)}°, {port.longitude.toFixed(4)}°</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Port */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Anchor className="w-5 h-5 text-blue-400" />
                {editingPort ? `Edit Pelabuhan: ${editingPort.name}` : 'Tambah Pelabuhan Baru'}
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
                  <label className="block text-slate-300 font-medium mb-1">Nama Pelabuhan *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Pelabuhan Tanjung Priok"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kode UN/LOCODE *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: IDTPP"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kota</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Jakarta Utara"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Provinsi / Wilayah</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: DKI Jakarta"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Draft Alur (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.maxDraftMeters}
                    onChange={(e) => setFormData({ ...formData, maxDraftMeters: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jumlah Berth Dermaga</label>
                  <input
                    type="number"
                    value={formData.berthsCount}
                    onChange={(e) => setFormData({ ...formData, berthsCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Syahbandar (Harbor Master)</label>
                  <input
                    type="text"
                    placeholder="misal: Capt. Hendro Triatmojo, M.Mar"
                    value={formData.harborMaster}
                    onChange={(e) => setFormData({ ...formData, harborMaster: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor Telepon Kantor / Radio</label>
                  <input
                    type="text"
                    placeholder="misal: +62-21-4301080"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingPort ? 'Simpan Perubahan' : 'Tambah Pelabuhan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
