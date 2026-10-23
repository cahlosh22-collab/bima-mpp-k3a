import React, { useState } from 'react';
import { Crew, CrewRank, CrewStatus, Vessel } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  Users, Plus, Search, Edit2, Trash2, Award, Ship, Phone, 
  Calendar, CheckCircle2, AlertCircle, ShieldAlert 
} from 'lucide-react';

interface MasterKruProps {
  vessels: Vessel[];
  onDataChanged: () => void;
}

export const MasterKru: React.FC<MasterKruProps> = ({ vessels, onDataChanged }) => {
  const [crews, setCrews] = useState<Crew[]>(() => dbManager.getCrews());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRank, setFilterRank] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);

  const [formData, setFormData] = useState<Omit<Crew, 'id'>>({
    seamanBookNo: '',
    fullName: '',
    rank: 'Nakhoda (Master)',
    assignedVesselId: vessels[0]?.id || '',
    nationality: 'WNI (Indonesia)',
    certificateLevel: 'ANT-I (Master Mariner)',
    licenseExpiry: '2028-12-31',
    phoneNumber: '+62-8',
    emergencyContact: '',
    status: 'Aktif di Kapal',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getCrews();
    setCrews(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingCrew(null);
    setFormData({
      seamanBookNo: `B.${Math.floor(100000 + Math.random() * 900000)}-ID`,
      fullName: '',
      rank: 'Nakhoda (Master)',
      assignedVesselId: vessels[0]?.id || '',
      nationality: 'WNI (Indonesia)',
      certificateLevel: 'ANT-I (Master Mariner)',
      licenseExpiry: '2028-12-31',
      phoneNumber: '+62-81',
      emergencyContact: '',
      status: 'Aktif di Kapal',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (crew: Crew) => {
    setEditingCrew(crew);
    setFormData({
      seamanBookNo: crew.seamanBookNo,
      fullName: crew.fullName,
      rank: crew.rank,
      assignedVesselId: crew.assignedVesselId,
      nationality: crew.nationality,
      certificateLevel: crew.certificateLevel,
      licenseExpiry: crew.licenseExpiry,
      phoneNumber: crew.phoneNumber,
      emergencyContact: crew.emergencyContact,
      status: crew.status,
      joinDate: crew.joinDate
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data kru pelaut "${name}"?`)) {
      const ok = dbManager.deleteCrew(id);
      if (ok) {
        showNotification('success', `Kru "${name}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus kru.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.seamanBookNo.trim()) {
      showNotification('error', 'Nama Lengkap dan Nomor Buku Pelaut wajib diisi!');
      return;
    }

    if (editingCrew) {
      dbManager.updateCrew(editingCrew.id, formData);
      showNotification('success', `Data kru "${formData.fullName}" berhasil diperbarui.`);
    } else {
      dbManager.createCrew(formData);
      showNotification('success', `Kru baru "${formData.fullName}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  const getVesselName = (id?: string) => {
    const v = vessels.find(x => x.id === id);
    return v ? v.name : 'Belum Ditugaskan';
  };

  const filteredCrews = crews.filter(c => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.seamanBookNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificateLevel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRank = filterRank === 'all' || c.rank === filterRank;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesRank && matchesStatus;
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
            <Users className="w-6 h-6 text-emerald-400" />
            Master Data Kru & Perwira Kapal (Crew Roster)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen buku pelaut (Seaman Book), sertifikat keahlian pelaut (CoC/CoP STCW), penugasan kapal, dan status dinas pelayaran.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelaut / Kru Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama kru, nomor buku pelaut, atau sertifikat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Semua Jabatan / Rank</option>
            <option value="Nakhoda (Master)">Nakhoda (Master)</option>
            <option value="Chief Officer (Mualim I)">Chief Officer (Mualim I)</option>
            <option value="Second Officer (Mualim II)">Second Officer (Mualim II)</option>
            <option value="Chief Engineer (KKM)">Chief Engineer (KKM)</option>
            <option value="First Engineer (Masinis I)">First Engineer (Masinis I)</option>
            <option value="Bosun">Bosun</option>
            <option value="Able Seaman (Juru Mudi)">Able Seaman (Juru Mudi)</option>
            <option value="Cook (Koki)">Cook (Koki)</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Semua Status Dinas</option>
            <option value="Aktif di Kapal">Aktif di Kapal</option>
            <option value="Cuti Resmi">Cuti Resmi (On Leave)</option>
            <option value="Standby / Pool">Standby / Pool Cadangan</option>
            <option value="Perawatan Medis">Perawatan Medis</option>
          </select>
        </div>
      </div>

      {/* Crews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCrews.map((crew) => (
          <div
            key={crew.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 ${
                    crew.status === 'Aktif di Kapal'
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                      : crew.status === 'Cuti Resmi'
                      ? 'bg-blue-950 border border-blue-500/40 text-blue-300'
                      : 'bg-amber-950 border border-amber-500/40 text-amber-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {crew.status}
                  </span>
                  <h3 className="text-base font-bold text-white">{crew.fullName}</h3>
                  <div className="text-xs text-emerald-400 font-semibold mt-0.5">{crew.rank}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(crew)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(crew.id, crew.fullName)}
                    className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Buku Pelaut (Seaman Book)</span>
                  <span className="font-mono text-slate-200 font-bold">{crew.seamanBookNo}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Masa Berlaku Ijazah</span>
                  <span className="font-mono text-cyan-300 font-bold">{crew.licenseExpiry}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-blue-400" />
                    Penempatan Kapal:
                  </span>
                  <span className="text-white font-semibold truncate max-w-[170px]">
                    {getVesselName(crew.assignedVesselId)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Sertifikasi STCW:
                  </span>
                  <span className="text-slate-300 truncate max-w-[170px]">
                    {crew.certificateLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Telepon Kru:
                  </span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    {crew.phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Bergabung: {crew.joinDate}</span>
              <span className="truncate max-w-[160px]">Darurat: {crew.emergencyContact || '-'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Kru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                {editingCrew ? `Edit Kru: ${editingCrew.fullName}` : 'Registrasi Perwira / Kru Baru'}
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
                  <label className="block text-slate-300 font-medium mb-1">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Capt. Joko Wahyudi, M.Mar"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor Buku Pelaut (Seaman Book) *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: B.092184-ID"
                    value={formData.seamanBookNo}
                    onChange={(e) => setFormData({ ...formData, seamanBookNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jabatan / Rank di Kapal</label>
                  <select
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value as CrewRank })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Nakhoda (Master)">Nakhoda (Master)</option>
                    <option value="Chief Officer (Mualim I)">Chief Officer (Mualim I)</option>
                    <option value="Second Officer (Mualim II)">Second Officer (Mualim II)</option>
                    <option value="Chief Engineer (KKM)">Chief Engineer (KKM)</option>
                    <option value="First Engineer (Masinis I)">First Engineer (Masinis I)</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Bosun">Bosun</option>
                    <option value="Able Seaman (Juru Mudi)">Able Seaman (Juru Mudi)</option>
                    <option value="Cook (Koki)">Cook (Koki)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Penugasan Kapal Armada</label>
                  <select
                    value={formData.assignedVesselId}
                    onChange={(e) => setFormData({ ...formData, assignedVesselId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Belum Ditugaskan / Pool</option>
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tingkat Sertifikat (CoC/CoP STCW)</label>
                  <input
                    type="text"
                    placeholder="misal: ANT-I (Master Mariner Unlimited)"
                    value={formData.certificateLevel}
                    onChange={(e) => setFormData({ ...formData, certificateLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Masa Berlaku Ijazah Pelaut</label>
                  <input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Dinas</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CrewStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Aktif di Kapal">Aktif di Kapal</option>
                    <option value="Cuti Resmi">Cuti Resmi (On Leave)</option>
                    <option value="Standby / Pool">Standby / Pool Cadangan</option>
                    <option value="Perawatan Medis">Perawatan Medis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor Telepon Seluler</label>
                  <input
                    type="text"
                    placeholder="+62-812-..."
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Kontak Darurat (Emergency Contact Person)</label>
                  <input
                    type="text"
                    placeholder="misal: Siti Rahma (Istri) - 0813-8822-1199"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCrew ? 'Simpan Perubahan' : 'Simpan Data Kru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
