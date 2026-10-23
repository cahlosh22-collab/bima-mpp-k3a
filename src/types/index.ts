export type VesselStatus = 'Berlayar' | 'Bersandar' | 'Perawatan' | 'Anchored';
export type VesselType = 'Container' | 'Bulk Carrier' | 'Oil Tanker' | 'Tug & Barge' | 'General Cargo' | 'LNG/LPG';

export interface Vessel {
  id: string;
  imoNumber: string;
  name: string;
  type: VesselType;
  flag: string;
  dwtCapacity: number; // Deadweight Tonnage
  teuCapacity?: number; // for container
  yearBuilt: number;
  enginePowerHP: number;
  status: VesselStatus;
  currentPortId?: string;
  destinationPortId?: string;
  latitude: number;
  longitude: number;
  heading: number; // 0 - 360 degrees
  speedKnots: number;
  fuelLevelPercent: number;
  captainName: string;
  fuelCapacityMT: number;
  lastUpdated: string;
}

export interface Port {
  id: string;
  code: string; // UN/LOCODE (e.g. IDTPP)
  name: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  maxDraftMeters: number;
  berthsCount: number;
  contactPhone: string;
  harborMaster: string;
}

export type CrewRank = 
  | 'Nakhoda (Master)'
  | 'Chief Officer (Mualim I)'
  | 'Second Officer (Mualim II)'
  | 'Chief Engineer (KKM)'
  | 'First Engineer (Masinis I)'
  | 'Electrician'
  | 'Bosun'
  | 'Able Seaman (Juru Mudi)'
  | 'Cook (Koki)';

export type CrewStatus = 'Aktif di Kapal' | 'Cuti Resmi' | 'Standby / Pool' | 'Perawatan Medis';

export interface Crew {
  id: string;
  seamanBookNo: string;
  fullName: string;
  rank: CrewRank;
  assignedVesselId: string;
  nationality: string;
  certificateLevel: string; // ANT-I, ANT-II, ATT-I, etc.
  licenseExpiry: string;
  phoneNumber: string;
  emergencyContact: string;
  status: CrewStatus;
  joinDate: string;
}

export interface CargoTariff {
  id: string;
  code: string;
  name: string;
  category: 'Kontainer' | 'Curah Kering' | 'Curah Cair' | 'General Cargo' | 'Gas & Kimia';
  baseRatePerUnit: number; // in IDR
  unitName: string; // per TEU, per Ton, per KL, per M3
  minimumOrder: number;
  notes: string;
}

export type VoyageStatus = 'Scheduled' | 'Underway' | 'Arrived' | 'Delayed' | 'Completed' | 'Cancelled';

export interface Voyage {
  id: string;
  voyageNumber: string;
  vesselId: string;
  originPortId: string;
  destinationPortId: string;
  etd: string; // Estimated Time of Departure
  eta: string; // Estimated Time of Arrival
  atd?: string; // Actual Time of Departure
  ata?: string; // Actual Time of Arrival
  cargoCategory: string;
  cargoVolume: number;
  cargoUnit: string;
  freightRatePerUnit: number;
  freightRevenue: number;
  estimatedFuelMT: number;
  actualFuelMT?: number;
  distanceNauticalMiles: number;
  status: VoyageStatus;
  captainOnDuty: string;
  remarks?: string;
  createdAt: string;
}

export interface BunkerLog {
  id: string;
  vesselId: string;
  voyageId: string;
  logDate: string;
  fuelType: 'HFO' | 'MGO' | 'VLSFO' | 'Bio-Solar B35';
  consumptionMT: number; // Metric Tonnes
  stockRemainingMT: number;
  avgEngineRPM: number;
  avgSpeedKnots: number;
  distanceRunNM: number;
  seaState: 'Tenang (0-1)' | 'Sedang (2-3)' | 'Kasar (4-5)' | 'Badai (>6)';
  recordedBy: string;
  notes?: string;
}

export type MaintenanceType = 'Rutin & Berkal' | 'Dry Docking' | 'Darurat / Breakdown' | 'Survey BKI/Statutoria';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus = 'Dijadwalkan' | 'Dalam Pengerjaan' | 'Selesai' | 'Tertunda';

export interface Maintenance {
  id: string;
  workOrderNumber: string;
  vesselId: string;
  title: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  description: string;
  estimatedCost: number;
  actualCost: number;
  startDate: string;
  targetEndDate: string;
  completionDate?: string;
  dockyardVendor: string;
  status: MaintenanceStatus;
  technicianInCharge: string;
  approvedBy: string;
}

export interface CargoManifest {
  id: string;
  manifestNumber: string;
  billOfLadingNo: string;
  voyageId: string;
  shipperName: string;
  consigneeName: string;
  goodsDescription: string;
  packageCount: number;
  weightTon: number;
  volumeCbm: number;
  freightAmount: number;
  paymentStatus: 'Lunas (Paid)' | 'Belum Lunas' | 'Termin / Invoice';
  issueDate: string;
}

export type DatabaseProvider = 'local' | 'supabase' | 'neon' | 'firebase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  supabaseUrl: string;
  supabaseAnonKey: string;
  neonConnectionString: string;
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  isConnected: boolean;
  lastConnectedAt?: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Fleet Manager' | 'Port Agent' | 'Chief Superintendent';
  avatar?: string;
}
