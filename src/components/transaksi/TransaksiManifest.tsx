import React, { useState } from 'react';
import { CargoManifest, Voyage } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  FileText, Plus, Search, Edit2, Trash2, Calendar, 
  DollarSign, Package, CheckCircle2, AlertCircle, Building2 
} from 'lucide-react';

interface TransaksiManifestProps {
  voyages: Voyage[];
  onDataChanged: () => void;
}

export const TransaksiManifest: React.FC<TransaksiManifestProps> = ({ 
  voyages, 
  onDataChanged 
}) => {
  const [manifests, setManifests] = useState<CargoManifest[]>(() => dbManager.getManifests());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManifest, setEditingManifest] = useState<CargoManifest | null>(null);

  const [formData, setFormData] = useState<Omit<CargoManifest, 'id'>>({
    manifestNumber: '',
    billOfLadingNo: '',
    voyageId: voyages[0]?.id || '',
    shipperName: '',
    consigneeName: '',
    goodsDescription: '',
    packageCount: 100,
    weightTon: 50,
    volumeCbm: 120,
    freightAmount: 250000000,
    paymentStatus: 'Belum Lunas',
    issueDate: new Date().toISOString().split('T')[0]
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const reloadData = () => {
    const list = dbManager.getManifests();
    setManifests(list);
    onDataChanged();
  };

  const handleOpenCreate = () => {
    setEditingManifest(null);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      manifestNumber: `MNF-SP-2026-${rand}`,
      billOfLadingNo: `BL-JKT-${rand}`,
      voyageId: voyages[0]?.id || '',
      shipperName: '',
      consigneeName: '',
      goodsDescription: 'Komoditas Industri Ekspor / Impor',
      packageCount: 1500,
      weightTon: 450,
      volumeCbm: 950,
      freightAmount: 480000000,
      paymentStatus: 'Belum Lunas',
      issueDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mnf: CargoManifest) => {
    setEditingManifest(mnf);
    setFormData({
      manifestNumber: mnf.manifestNumber,
      billOfLadingNo: mnf.billOfLadingNo,
      voyageId: mnf.voyageId,
      shipperName: mnf.shipperName,
      consigneeName: mnf.consigneeName,
      goodsDescription: mnf.goodsDescription,
      packageCount: mnf.packageCount,
      weightTon: mnf.weightTon,
      volumeCbm: mnf.volumeCbm,
      freightAmount: mnf.freightAmount,
      paymentStatus: mnf.paymentStatus,
      issueDate: mnf.issueDate
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, mnfNo: string) => {
    if (confirm(`Hapus manifest muatan "${mnfNo}"?`)) {
      const ok = dbManager.deleteManifest(id);
      if (ok) {
        showNotification('success', `Manifest "${mnfNo}" berhasil dihapus.`);
        reloadData();
      } else {
        showNotification('error', 'Gagal menghapus manifest.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shipperName.trim() || !formData.billOfLadingNo.trim()) {
      showNotification('error', 'Nama Shipper dan Nomor B/L wajib diisi!');
      return;
    }

    if (editingManifest) {
      dbManager.updateManifest(editingManifest.id, formData);
      showNotification('success', `Manifest "${formData.manifestNumber}" berhasil diperbarui.`);
    } else {
      dbManager.createManifest(formData);
      showNotification('success', `Manifest baru "${formData.manifestNumber}" berhasil diterbitkan.`);
    }

    setIsModalOpen(false);
    reloadData();
  };

  const getVoyage = (id: string) => voyages.find(v => v.id === id);

  const filteredManifests = manifests.filter(m => {
    const matchesSearch = 
      m.manifestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.billOfLadingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shipperName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.consigneeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment = filterPayment === 'all' || m.paymentStatus === filterPayment;

    return matchesSearch && matchesPayment;
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
            <FileText className="w-6 h-6 text-emerald-400" />
            Transaksi Manifest Kargo & Billing (Cargo Manifest & B/L)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pengelolaan dokumen Bill of Lading (B/L), data pengirim (Shipper), penerima (Consignee), rincian volume/berat, dan status pelunasan invoice freight.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan B/L Manifest Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nomor B/L, nomor manifest, nama shipper atau consignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Semua Status Pembayaran</option>
            <option value="Lunas (Paid)">Lunas (Paid)</option>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Termin / Invoice">Termin / Invoice</option>
          </select>
        </div>
      </div>

      {/* Table Manifests */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="p-4">Dokumen B/L & Manifest</th>
                <th className="p-4">Shipper & Consignee</th>
                <th className="p-4">Deskripsi Barang</th>
                <th className="p-4">Berat & Volume</th>
                <th className="p-4">Nilai Freight</th>
                <th className="p-4">Status Bayar</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredManifests.map((mnf) => {
                const voy = getVoyage(mnf.voyageId);

                return (
                  <tr key={mnf.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-white text-xs">{mnf.billOfLadingNo}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {mnf.manifestNumber} • {voy?.voyageNumber || '-'}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{mnf.shipperName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Kepada: {mnf.consigneeName}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-white max-w-[200px] truncate">{mnf.goodsDescription}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {mnf.packageCount.toLocaleString('id-ID')} Coli / Koli
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-mono text-cyan-300 font-semibold">
                        {mnf.weightTon.toLocaleString('id-ID')} Ton
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {mnf.volumeCbm.toLocaleString('id-ID')} CBM
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        Rp {mnf.freightAmount.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Diterbitkan: {mnf.issueDate}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        mnf.paymentStatus === 'Lunas (Paid)'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : mnf.paymentStatus === 'Termin / Invoice'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {mnf.paymentStatus}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(mnf)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(mnf.id, mnf.manifestNumber)}
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

      {/* Modal Manifest */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                {editingManifest ? `Edit B/L: ${editingManifest.billOfLadingNo}` : 'Penerbitan Bill of Lading & Manifest'}
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
                  <label className="block text-slate-300 font-medium mb-1">Nomor Bill of Lading (B/L) *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: BL-JKT-SUB-09821"
                    value={formData.billOfLadingNo}
                    onChange={(e) => setFormData({ ...formData, billOfLadingNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor Manifest *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: MNF-SP-2026-104"
                    value={formData.manifestNumber}
                    onChange={(e) => setFormData({ ...formData, manifestNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Voyage Kapal Terkait</label>
                  <select
                    value={formData.voyageId}
                    onChange={(e) => setFormData({ ...formData, voyageId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {voyages.map(v => (
                      <option key={v.id} value={v.id}>{v.voyageNumber} ({v.cargoCategory})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Terbit B/L</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Pengirim (Shipper) *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: PT Indofood Sukses Makmur Tbk"
                    value={formData.shipperName}
                    onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Penerima (Consignee) *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: PT Sumber Alfaria Trijaya"
                    value={formData.consigneeName}
                    onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Deskripsi Kargo / Barang</label>
                  <input
                    type="text"
                    value={formData.goodsDescription}
                    onChange={(e) => setFormData({ ...formData, goodsDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jumlah Kemasan / Koli</label>
                  <input
                    type="number"
                    value={formData.packageCount}
                    onChange={(e) => setFormData({ ...formData, packageCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Berat Kotor (Gross Weight - Ton)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightTon}
                    onChange={(e) => setFormData({ ...formData, weightTon: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Volume (CBM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.volumeCbm}
                    onChange={(e) => setFormData({ ...formData, volumeCbm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tagihan Freight Amount (IDR)</label>
                  <input
                    type="number"
                    value={formData.freightAmount}
                    onChange={(e) => setFormData({ ...formData, freightAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Pembayaran</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Lunas (Paid)">Lunas (Paid)</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Termin / Invoice">Termin / Invoice</option>
                  </select>
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
                  <span>{editingManifest ? 'Simpan Perubahan' : 'Terbitkan B/L'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
