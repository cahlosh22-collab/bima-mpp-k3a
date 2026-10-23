import React, { useState } from 'react';
import { CargoTariff } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  DollarSign, Plus, Search, Edit2, Trash2, Box, Tag, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';

interface MasterTarifProps {
  onDataChanged: () => void;
}

export const MasterTarif: React.FC<MasterTarifProps> = ({ onDataChanged }) => {
  const [tariffs, setTariffs] = useState<CargoTariff[]>(() => dbManager.getTariffs());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<CargoTariff | null>(null);

  const [formData, setFormData] = useState<Omit<CargoTariff, 'id'>>({
    code: '',
    name: '',
    category: 'Kontainer',
    baseRatePerUnit: 5000000,
    unitName: 'per TEU / Box',
    minimumOrder: 1,
    notes: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getTariffs();
    setTariffs(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingTariff(null);
    setFormData({
      code: `TRF-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Kontainer',
      baseRatePerUnit: 5000000,
      unitName: 'per TEU / Box',
      minimumOrder: 1,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tariff: CargoTariff) => {
    setEditingTariff(tariff);
    setFormData({
      code: tariff.code,
      name: tariff.name,
      category: tariff.category,
      baseRatePerUnit: tariff.baseRatePerUnit,
      unitName: tariff.unitName,
      minimumOrder: tariff.minimumOrder,
      notes: tariff.notes
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus tarif kargo "${name}"?`)) {
      const ok = dbManager.deleteTariff(id);
      if (ok) {
        showNotification('success', `Tarif "${name}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus tarif.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showNotification('error', 'Nama Muatan dan Kode Tarif wajib diisi!');
      return;
    }

    if (editingTariff) {
      dbManager.updateTariff(editingTariff.id, formData);
      showNotification('success', `Tarif "${formData.name}" berhasil diperbarui.`);
    } else {
      dbManager.createTariff(formData);
      showNotification('success', `Tarif baru "${formData.name}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  const filteredTariffs = tariffs.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
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
            <DollarSign className="w-6 h-6 text-purple-400" />
            Master Tarif & Kategori Muatan Kargo (Freight Tariff)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standarisasi tarif dasar freight pelayaran per TEU kontainer, metrik ton curah kering (batubara/mineral), dan curah cair (CPO/minyak).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tarif Kargo Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari tarif berdasarkan nama kargo, kode atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      {/* Tariffs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTariffs.map((tariff) => (
          <div
            key={tariff.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-md">
                    {tariff.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{tariff.name}</h3>
                  <div className="text-xs text-purple-400 font-medium mt-0.5">{tariff.category}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tariff)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tariff.id, tariff.name)}
                    className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="my-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block mb-0.5">Tarif Dasar Freight</span>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  Rp {tariff.baseRatePerUnit.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Satuan: {tariff.unitName}</div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Minimum Pemesanan:</span>
                  <span className="text-white font-medium">{tariff.minimumOrder.toLocaleString('id-ID')} {tariff.unitName}</span>
                </div>
                {tariff.notes && (
                  <div className="pt-2 text-[11px] text-slate-400 italic">
                    Catatan: {tariff.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-right">
              Tarif Berlaku Armada Nasional
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tariff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                {editingTariff ? `Edit Tarif: ${editingTariff.name}` : 'Tambah Tarif Kargo Baru'}
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
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Tarif / Jenis Muatan *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Kontainer FCL 20ft Standar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kode Tarif *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: FCL-20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Muatan</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Kontainer">Kontainer</option>
                    <option value="Curah Kering">Curah Kering (Coal/Ore)</option>
                    <option value="Curah Cair">Curah Cair (CPO/BBM)</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Gas & Kimia">Gas & Kimia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tarif Dasar (IDR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.baseRatePerUnit}
                    onChange={(e) => setFormData({ ...formData, baseRatePerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Satuan Tagihan (Unit)</label>
                  <input
                    type="text"
                    placeholder="misal: per TEU / Box"
                    value={formData.unitName}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Minimum Order</label>
                <input
                  type="number"
                  min="1"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Catatan / Ketentuan Khusus</label>
                <textarea
                  rows={2}
                  placeholder="misal: Termasuk lashing dermaga ke dermaga..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingTariff ? 'Simpan Perubahan' : 'Tambah Tarif'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
