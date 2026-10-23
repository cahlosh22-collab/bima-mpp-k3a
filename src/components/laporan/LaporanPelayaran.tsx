import React, { useState } from 'react';
import { Vessel, Voyage, BunkerLog, Maintenance, CargoManifest, Port } from '../../types';
import { dbManager } from '../../services/db/databaseManager';
import { 
  BarChart3, Printer, Download, Filter, Calendar, Ship, 
  DollarSign, Fuel, Wrench, CheckCircle2, FileSpreadsheet, Anchor 
} from 'lucide-react';

interface LaporanPelayaranProps {
  vessels: Vessel[];
  ports: Port[];
  voyages: Voyage[];
  bunkerLogs: BunkerLog[];
  maintenances: Maintenance[];
  manifests: CargoManifest[];
}

type ReportType = 'voyage_operasional' | 'bunker_efisiensi' | 'finansial_freight' | 'kesiapan_armada';

export const LaporanPelayaran: React.FC<LaporanPelayaranProps> = ({
  vessels,
  ports,
  voyages,
  bunkerLogs,
  maintenances,
  manifests
}) => {
  const [reportType, setReportType] = useState<ReportType>('voyage_operasional');
  const [selectedVesselId, setSelectedVesselId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  const getVesselName = (id: string) => {
    const v = vessels.find(x => x.id === id);
    return v ? v.name : 'Semua Kapal';
  };

  const getPortName = (id: string) => {
    const p = ports.find(x => x.id === id);
    return p ? `${p.name} (${p.code})` : id;
  };

  // Filtered datasets based on vessel selection
  const filteredVoyages = voyages.filter(v => {
    return selectedVesselId === 'all' || v.vesselId === selectedVesselId;
  });

  const filteredBunkers = bunkerLogs.filter(b => {
    return selectedVesselId === 'all' || b.vesselId === selectedVesselId;
  });

  const filteredMaintenances = maintenances.filter(m => {
    return selectedVesselId === 'all' || m.vesselId === selectedVesselId;
  });

  // Calculate summaries
  const totalFreightRevenue = filteredVoyages.reduce((sum, v) => sum + v.freightRevenue, 0);
  const totalDistanceNM = filteredVoyages.reduce((sum, v) => sum + v.distanceNauticalMiles, 0);
  const totalFuelConsumed = filteredBunkers.reduce((sum, b) => sum + b.consumptionMT, 0);
  const totalMaintenanceCost = filteredMaintenances.reduce((sum, m) => sum + (m.actualCost || m.estimatedCost), 0);

  // Export to CSV
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `laporan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'voyage_operasional') {
      headers = ['No Voyage', 'Nama Kapal', 'Pelabuhan Asal', 'Pelabuhan Tujuan', 'ETD', 'ETA', 'Kategori Kargo', 'Volume', 'Jarak NM', 'Status', 'Pendapatan IDR'];
      rows = filteredVoyages.map(v => [
        v.voyageNumber,
        getVesselName(v.vesselId),
        getPortName(v.originPortId),
        getPortName(v.destinationPortId),
        v.etd,
        v.eta,
        v.cargoCategory,
        `${v.cargoVolume} ${v.cargoUnit}`,
        v.distanceNauticalMiles.toString(),
        v.status,
        v.freightRevenue.toString()
      ]);
    } else if (reportType === 'bunker_efisiensi') {
      headers = ['Tanggal', 'Kapal', 'Jenis BBM', 'Konsumsi MT', 'Sisa Stok MT', 'Kecepatan Knots', 'RPM', 'Jarak Tempuh NM', 'Kondisi Laut', 'Pencatat'];
      rows = filteredBunkers.map(b => [
        b.logDate,
        getVesselName(b.vesselId),
        b.fuelType,
        b.consumptionMT.toString(),
        b.stockRemainingMT.toString(),
        b.avgSpeedKnots.toString(),
        b.avgEngineRPM.toString(),
        b.distanceRunNM.toString(),
        b.seaState,
        b.recordedBy
      ]);
    } else if (reportType === 'finansial_freight') {
      headers = ['Nomor B/L', 'Nomor Manifest', 'Pengirim (Shipper)', 'Penerima (Consignee)', 'Deskripsi', 'Berat Ton', 'Nilai Tagihan IDR', 'Status Bayar', 'Tanggal'];
      rows = manifests.map(m => [
        m.billOfLadingNo,
        m.manifestNumber,
        m.shipperName,
        m.consigneeName,
        m.goodsDescription,
        m.weightTon.toString(),
        m.freightAmount.toString(),
        m.paymentStatus,
        m.issueDate
      ]);
    } else {
      headers = ['No Work Order', 'Kapal', 'Judul Perbaikan', 'Tipe', 'Prioritas', 'Vendor Galangan', 'Biaya Estimasi IDR', 'Biaya Realisasi IDR', 'Mulai', 'Target Selesai', 'Status'];
      rows = filteredMaintenances.map(m => [
        m.workOrderNumber,
        getVesselName(m.vesselId),
        m.title,
        m.type,
        m.priority,
        m.dockyardVendor,
        m.estimatedCost.toString(),
        m.actualCost.toString(),
        m.startDate,
        m.targetEndDate,
        m.status
      ]);
    }

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Laporan Eksekutif & Analitik Pelayaran (Maritime Reporting)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi resmi operasional armada, efisiensi SEEMP bahan bakar, realisasi pendapatan freight, dan kesiapan pemeliharaan kapal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export ke Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi</span>
          </button>
        </div>
      </div>

      {/* Filter Selection Panel */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs print:hidden">
        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Pilih Jenis Laporan:
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="voyage_operasional">1. Laporan Operasional & Performa Voyage</option>
            <option value="bunker_efisiensi">2. Laporan Konsumsi Bunker BBM & Emisi (SEEMP)</option>
            <option value="finansial_freight">3. Laporan Pendapatan Freight & Manifest B/L</option>
            <option value="kesiapan_armada">4. Laporan Kesiapan Armada & Pemeliharaan Docking</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-blue-400" />
            Filter Kapal Armada:
          </label>
          <select
            value={selectedVesselId}
            onChange={(e) => setSelectedVesselId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="all">Semua Armada Kapal (Fleet)</option>
            {vessels.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            Periode Laporan:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Report */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Total Nilai Freight</span>
          <div className="text-xl font-black text-emerald-400 font-mono">
            Rp {(totalFreightRevenue / 1_000_000_000).toFixed(2)} Miliar
          </div>
          <span className="text-[10px] text-slate-500">Dari {filteredVoyages.length} voyage terdata</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Total Jarak Tempuh</span>
          <div className="text-xl font-black text-cyan-400 font-mono">
            {totalDistanceNM.toLocaleString('id-ID')} NM
          </div>
          <span className="text-[10px] text-slate-500">Mil laut pelayaran</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Total Konsumsi BBM</span>
          <div className="text-xl font-black text-amber-400 font-mono">
            {totalFuelConsumed.toFixed(1)} MT
          </div>
          <span className="text-[10px] text-slate-500">MGO / VLSFO / HFO</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Biaya Pemeliharaan</span>
          <div className="text-xl font-black text-rose-400 font-mono">
            Rp {(totalMaintenanceCost / 1_000_000_000).toFixed(2)} M
          </div>
          <span className="text-[10px] text-slate-500">{filteredMaintenances.length} pekerjaan docking</span>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Official Letterhead Header */}
        <div className="flex items-center justify-between pb-6 border-b-2 border-slate-800 print:border-slate-900 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 print:bg-slate-200 print:text-slate-900">
              <Anchor className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-white print:text-black">
                PT Samudera Nusantara Lines Tbk
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Divisi Manajemen Operasional Armada & Logistik Kemaritiman Terpadu
              </p>
              <p className="text-[11px] text-slate-500 print:text-slate-500 font-mono">
                Gedung Graha Pelayaran Lt. 12, Jl. Yos Sudarso No. 88, Tanjung Priok, Jakarta Utara | Telp: (021) 430-8800
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-mono text-cyan-400 print:text-slate-800 font-bold">
              DOC REF: RPT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
            </div>
            <div className="text-slate-400 print:text-slate-600 text-[11px] mt-0.5">
              Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
          </div>
        </div>

        {/* Title of active report */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white print:text-black uppercase">
            {reportType === 'voyage_operasional' && 'LAPORAN REKAPITULASI OPERASIONAL & PERFORMA VOYAGE'}
            {reportType === 'bunker_efisiensi' && 'LAPORAN EFISIENSI KONSUMSI BAHAN BAKAR & EMISI (SEEMP / DCS)'}
            {reportType === 'finansial_freight' && 'LAPORAN REALISASI PENDAPATAN FREIGHT & MANIFEST BILL OF LADING'}
            {reportType === 'kesiapan_armada' && 'LAPORAN KESIAPAN TEKNIS ARMADA & PEMELIHARAAN DOCKING'}
          </h3>
          <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
            Filter Kapal: <strong>{getVesselName(selectedVesselId)}</strong> • Periode: {startDate} s/d {endDate}
          </p>
        </div>

        {/* Table Content Based on Selected Type */}
        <div className="overflow-x-auto">
          {reportType === 'voyage_operasional' && (
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-950/70 print:bg-slate-100 text-slate-400 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-slate-300 font-mono">
                <tr>
                  <th className="p-3">No Voyage</th>
                  <th className="p-3">Kapal</th>
                  <th className="p-3">Rute Pelayaran</th>
                  <th className="p-3">Jadwal ETD / ETA</th>
                  <th className="p-3">Kargo</th>
                  <th className="p-3">Jarak</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Nilai Freight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                {filteredVoyages.map(v => (
                  <tr key={v.id}>
                    <td className="p-3 font-mono font-bold text-white print:text-black">{v.voyageNumber}</td>
                    <td className="p-3">{getVesselName(v.vesselId)}</td>
                    <td className="p-3">{getPortName(v.originPortId)} &rarr; {getPortName(v.destinationPortId)}</td>
                    <td className="p-3 font-mono text-[11px]">{v.etd.split('T')[0]} / {v.eta.split('T')[0]}</td>
                    <td className="p-3">{v.cargoVolume.toLocaleString('id-ID')} {v.cargoUnit}</td>
                    <td className="p-3 font-mono">{v.distanceNauticalMiles} NM</td>
                    <td className="p-3 font-bold">{v.status}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                      Rp {v.freightRevenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'bunker_efisiensi' && (
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-950/70 print:bg-slate-100 text-slate-400 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-slate-300 font-mono">
                <tr>
                  <th className="p-3">Tanggal Log</th>
                  <th className="p-3">Kapal</th>
                  <th className="p-3">Jenis BBM</th>
                  <th className="p-3">Konsumsi</th>
                  <th className="p-3">Sisa Stok</th>
                  <th className="p-3">Speed (Kts)</th>
                  <th className="p-3">RPM Mesin</th>
                  <th className="p-3">Kondisi Laut</th>
                  <th className="p-3 text-right">Perwira KKM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                {filteredBunkers.map(b => (
                  <tr key={b.id}>
                    <td className="p-3 font-mono">{b.logDate}</td>
                    <td className="p-3 font-bold text-white print:text-black">{getVesselName(b.vesselId)}</td>
                    <td className="p-3 font-mono">{b.fuelType}</td>
                    <td className="p-3 font-mono font-bold text-amber-400 print:text-black">{b.consumptionMT} MT</td>
                    <td className="p-3 font-mono">{b.stockRemainingMT} MT</td>
                    <td className="p-3">{b.avgSpeedKnots}</td>
                    <td className="p-3">{b.avgEngineRPM}</td>
                    <td className="p-3">{b.seaState}</td>
                    <td className="p-3 text-right">{b.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'finansial_freight' && (
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-950/70 print:bg-slate-100 text-slate-400 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-slate-300 font-mono">
                <tr>
                  <th className="p-3">Nomor B/L</th>
                  <th className="p-3">Shipper</th>
                  <th className="p-3">Consignee</th>
                  <th className="p-3">Deskripsi Muatan</th>
                  <th className="p-3">Berat (Ton)</th>
                  <th className="p-3">Status Bayar</th>
                  <th className="p-3 text-right">Nilai Tagihan Freight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                {manifests.map(m => (
                  <tr key={m.id}>
                    <td className="p-3 font-mono font-bold text-white print:text-black">{m.billOfLadingNo}</td>
                    <td className="p-3 font-semibold">{m.shipperName}</td>
                    <td className="p-3">{m.consigneeName}</td>
                    <td className="p-3">{m.goodsDescription}</td>
                    <td className="p-3 font-mono">{m.weightTon.toLocaleString('id-ID')} Ton</td>
                    <td className="p-3 font-bold">{m.paymentStatus}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                      Rp {m.freightAmount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'kesiapan_armada' && (
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-950/70 print:bg-slate-100 text-slate-400 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-slate-300 font-mono">
                <tr>
                  <th className="p-3">No Work Order</th>
                  <th className="p-3">Kapal</th>
                  <th className="p-3">Judul Pekerjaan</th>
                  <th className="p-3">Tipe & Prioritas</th>
                  <th className="p-3">Galangan Vendor</th>
                  <th className="p-3">Target Selesai</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Biaya Aktual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                {filteredMaintenances.map(m => (
                  <tr key={m.id}>
                    <td className="p-3 font-mono font-bold text-white print:text-black">{m.workOrderNumber}</td>
                    <td className="p-3">{getVesselName(m.vesselId)}</td>
                    <td className="p-3 font-semibold">{m.title}</td>
                    <td className="p-3">{m.type} ({m.priority})</td>
                    <td className="p-3">{m.dockyardVendor}</td>
                    <td className="p-3 font-mono">{m.targetEndDate}</td>
                    <td className="p-3 font-bold">{m.status}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400 print:text-black">
                      Rp {(m.actualCost || m.estimatedCost).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Official Signatures Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800 print:border-slate-400 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="text-slate-400 print:text-slate-600 mb-16">
              Disiapkan Oleh:<br />
              <strong>Fleet Operations & Marine Dispatcher</strong>
            </div>
            <div className="border-t border-slate-700 print:border-slate-800 w-48 mx-auto pt-1 font-bold text-white print:text-black">
              Budi Santoso, S.T.
            </div>
            <div className="text-[10px] text-slate-500">Fleet Operations Manager</div>
          </div>

          <div>
            <div className="text-slate-400 print:text-slate-600 mb-16">
              Mengetahui & Menyetujui:<br />
              <strong>Direktur Operasi & Armada</strong>
            </div>
            <div className="border-t border-slate-700 print:border-slate-800 w-48 mx-auto pt-1 font-bold text-white print:text-black">
              Capt. R. Soedirman, M.Mar
            </div>
            <div className="text-[10px] text-slate-500">Direktur Utama PT Samudera Nusantara Lines</div>
          </div>
        </div>
      </div>
    </div>
  );
};
