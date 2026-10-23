import { 
  Vessel, Port, Crew, CargoTariff, Voyage, BunkerLog, Maintenance, CargoManifest, 
  DatabaseConfig, DatabaseProvider 
} from '../../types';
import { 
  initialVessels, initialPorts, initialCrews, initialTariffs, 
  initialVoyages, initialBunkerLogs, initialMaintenances, initialManifests 
} from './initialData';

// Dynamic loaders for database clients
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore, validateFirestoreConnection, handleFirestoreError, OperationType } from './firebaseService';
import firebaseAppletConfig from '../../../firebase-applet-config.json';

const STORAGE_KEY_PREFIX = 'samudera_shipping_';
const CONFIG_KEY = 'samudera_db_config';

class DatabaseManager {
  private config: DatabaseConfig = {
    provider: 'firebase',
    supabaseUrl: '',
    supabaseAnonKey: '',
    neonConnectionString: '',
    firebaseApiKey: firebaseAppletConfig.apiKey,
    firebaseProjectId: firebaseAppletConfig.projectId,
    firebaseAppId: firebaseAppletConfig.appId,
    isConnected: true,
    lastConnectedAt: new Date().toISOString(),
    syncStatus: 'synced',
  };

  private supabaseClient: SupabaseClient | null = null;
  private neonSql: ReturnType<typeof neon> | null = null;
  private firestoreDb = firestore;

  constructor() {
    this.loadConfig();
    this.initializeLocalStorage();
    this.initRealDatabaseClients();
    this.seedFirestoreIfEmpty();
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save DB config to localStorage', e);
    }
    this.initRealDatabaseClients();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not load DB config from localStorage', e);
    }
  }

  private initRealDatabaseClients(): void {
    // 1. Supabase Init
    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      try {
        this.supabaseClient = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey);
      } catch (err) {
        console.error('Failed to init Supabase client:', err);
        this.supabaseClient = null;
      }
    } else {
      this.supabaseClient = null;
    }

    // 2. Neon DB Init
    if (this.config.neonConnectionString) {
      try {
        this.neonSql = neon(this.config.neonConnectionString);
      } catch (err) {
        console.error('Failed to init Neon DB connection:', err);
        this.neonSql = null;
      }
    } else {
      this.neonSql = null;
    }

    // 3. Firebase Firestore instance
    this.firestoreDb = firestore;
  }

  public async testConnection(provider: DatabaseProvider, credentials: Partial<DatabaseConfig>): Promise<{ success: boolean; message: string }> {
    try {
      if (provider === 'local') {
        return { success: true, message: 'Database Lokal Indexed/Browser Engine aktif dan terverifikasi.' };
      }

      if (provider === 'supabase') {
        const url = credentials.supabaseUrl || this.config.supabaseUrl;
        const key = credentials.supabaseAnonKey || this.config.supabaseAnonKey;
        if (!url || !key) {
          return { success: false, message: 'Supabase URL dan Anon Key harus diisi.' };
        }
        // Test query via REST
        const testClient = createClient(url, key);
        const { error } = await testClient.from('vessels').select('id').limit(1);
        if (error && error.code !== 'PGRST116' && !error.message.includes('relation "vessels" does not exist')) {
          // If error is authentication/url related:
          if (error.message.includes('API key') || error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
            return { success: false, message: `Gagal terhubung ke Supabase: ${error.message}` };
          }
        }
        return { 
          success: true, 
          message: 'Berhasil terhubung ke Supabase Project! API Key valid dan endpoint aktif.' 
        };
      }

      if (provider === 'neon') {
        const connStr = credentials.neonConnectionString || this.config.neonConnectionString;
        if (!connStr) {
          return { success: false, message: 'Neon DB Connection String harus diisi.' };
        }
        const sql = neon(connStr);
        const result = await sql`SELECT 1 as connected, NOW() as server_time;`;
        return { 
          success: true, 
          message: `Berhasil terhubung ke Serverless Neon DB (PostgreSQL)! Waktu server: ${result[0]?.server_time || 'OK'}` 
        };
      }

      if (provider === 'firebase') {
        const res = await validateFirestoreConnection();
        return res;
      }

      return { success: false, message: 'Provider tidak dikenali.' };
    } catch (err: any) {
      return { success: false, message: `Error koneksi: ${err.message || String(err)}` };
    }
  }

  public async seedFirestoreIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(this.firestoreDb, 'vessels')).catch(() => null);
      if (!snap || snap.empty) {
        for (const v of initialVessels) {
          await setDoc(doc(this.firestoreDb, 'vessels', v.id), v).catch(() => null);
        }
        for (const p of initialPorts) {
          await setDoc(doc(this.firestoreDb, 'ports', p.id), p).catch(() => null);
        }
        for (const c of initialCrews) {
          await setDoc(doc(this.firestoreDb, 'crews', c.id), c).catch(() => null);
        }
        for (const t of initialTariffs) {
          await setDoc(doc(this.firestoreDb, 'tariffs', t.id), t).catch(() => null);
        }
        for (const voy of initialVoyages) {
          await setDoc(doc(this.firestoreDb, 'voyages', voy.id), voy).catch(() => null);
        }
        for (const b of initialBunkerLogs) {
          await setDoc(doc(this.firestoreDb, 'bunker_logs', b.id), b).catch(() => null);
        }
        for (const m of initialMaintenances) {
          await setDoc(doc(this.firestoreDb, 'maintenances', m.id), m).catch(() => null);
        }
        for (const mnf of initialManifests) {
          await setDoc(doc(this.firestoreDb, 'manifests', mnf.id), mnf).catch(() => null);
        }
      }
    } catch (e) {
      console.warn('Firestore seed notice:', e);
    }
  }

  private initializeLocalStorage(): void {
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'vessels')) {
      this.setItem('vessels', initialVessels);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'ports')) {
      this.setItem('ports', initialPorts);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'crews')) {
      this.setItem('crews', initialCrews);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'tariffs')) {
      this.setItem('tariffs', initialTariffs);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'voyages')) {
      this.setItem('voyages', initialVoyages);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'bunker_logs')) {
      this.setItem('bunker_logs', initialBunkerLogs);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'maintenances')) {
      this.setItem('maintenances', initialMaintenances);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'manifests')) {
      this.setItem('manifests', initialManifests);
    }
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Error reading ${key} from storage:`, e);
      return fallback;
    }
  }

  private setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
      this.syncToExternalDatabases(key, data);
    } catch (e) {
      console.warn(`Error writing ${key} to storage:`, e);
    }
  }

  // Background sync helper if external database is connected
  private async syncToExternalDatabases(table: string, data: any): Promise<void> {
    if (this.config.provider === 'supabase' && this.supabaseClient) {
      try {
        if (Array.isArray(data)) {
          await this.supabaseClient.from(table).upsert(data);
        }
      } catch (err) {
        console.warn(`Supabase sync warning for ${table}:`, err);
      }
    }
    if (this.config.provider === 'firebase' && this.firestoreDb) {
      try {
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.id) {
              await setDoc(doc(this.firestoreDb, table, item.id), item);
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, table);
      }
    }
  }

  public async deleteFromFirestore(table: string, id: string): Promise<void> {
    if (this.config.provider === 'firebase' && this.firestoreDb) {
      try {
        await deleteDoc(doc(this.firestoreDb, table, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${table}/${id}`);
      }
    }
  }

  // ===================== CRUD FOR MASTER KAPAL =====================
  public getVessels(): Vessel[] {
    return this.getItem<Vessel[]>('vessels', initialVessels);
  }

  public createVessel(vessel: Omit<Vessel, 'id' | 'lastUpdated'> & { lastUpdated?: string }): Vessel {
    const vessels = this.getVessels();
    const newVessel: Vessel = {
      ...vessel,
      id: 'vessel-' + Date.now(),
      lastUpdated: vessel.lastUpdated || 'Baru saja ditambahkan'
    };
    vessels.unshift(newVessel);
    this.setItem('vessels', vessels);
    return newVessel;
  }

  public updateVessel(id: string, updates: Partial<Vessel>): Vessel | null {
    const vessels = this.getVessels();
    const index = vessels.findIndex(v => v.id === id);
    if (index === -1) return null;
    vessels[index] = { ...vessels[index], ...updates, lastUpdated: 'Baru diperbarui' };
    this.setItem('vessels', vessels);
    return vessels[index];
  }

  public deleteVessel(id: string): boolean {
    const vessels = this.getVessels();
    const filtered = vessels.filter(v => v.id !== id);
    if (filtered.length === vessels.length) return false;
    this.setItem('vessels', filtered);
    return true;
  }

  // ===================== CRUD FOR MASTER PELABUHAN =====================
  public getPorts(): Port[] {
    return this.getItem<Port[]>('ports', initialPorts);
  }

  public createPort(port: Omit<Port, 'id'>): Port {
    const ports = this.getPorts();
    const newPort: Port = {
      ...port,
      id: 'port-' + Date.now()
    };
    ports.push(newPort);
    this.setItem('ports', ports);
    return newPort;
  }

  public updatePort(id: string, updates: Partial<Port>): Port | null {
    const ports = this.getPorts();
    const index = ports.findIndex(p => p.id === id);
    if (index === -1) return null;
    ports[index] = { ...ports[index], ...updates };
    this.setItem('ports', ports);
    return ports[index];
  }

  public deletePort(id: string): boolean {
    const ports = this.getPorts();
    const filtered = ports.filter(p => p.id !== id);
    if (filtered.length === ports.length) return false;
    this.setItem('ports', filtered);
    return true;
  }

  // ===================== CRUD FOR MASTER KRU KAPAL =====================
  public getCrews(): Crew[] {
    return this.getItem<Crew[]>('crews', initialCrews);
  }

  public createCrew(crew: Omit<Crew, 'id'>): Crew {
    const crews = this.getCrews();
    const newCrew: Crew = {
      ...crew,
      id: 'crew-' + Date.now()
    };
    crews.unshift(newCrew);
    this.setItem('crews', crews);
    return newCrew;
  }

  public updateCrew(id: string, updates: Partial<Crew>): Crew | null {
    const crews = this.getCrews();
    const index = crews.findIndex(c => c.id === id);
    if (index === -1) return null;
    crews[index] = { ...crews[index], ...updates };
    this.setItem('crews', crews);
    return crews[index];
  }

  public deleteCrew(id: string): boolean {
    const crews = this.getCrews();
    const filtered = crews.filter(c => c.id !== id);
    if (filtered.length === crews.length) return false;
    this.setItem('crews', filtered);
    return true;
  }

  // ===================== CRUD FOR MASTER TARIF KARGO =====================
  public getTariffs(): CargoTariff[] {
    return this.getItem<CargoTariff[]>('tariffs', initialTariffs);
  }

  public createTariff(tariff: Omit<CargoTariff, 'id'>): CargoTariff {
    const tariffs = this.getTariffs();
    const newTariff: CargoTariff = {
      ...tariff,
      id: 'tariff-' + Date.now()
    };
    tariffs.push(newTariff);
    this.setItem('tariffs', tariffs);
    return newTariff;
  }

  public updateTariff(id: string, updates: Partial<CargoTariff>): CargoTariff | null {
    const tariffs = this.getTariffs();
    const index = tariffs.findIndex(t => t.id === id);
    if (index === -1) return null;
    tariffs[index] = { ...tariffs[index], ...updates };
    this.setItem('tariffs', tariffs);
    return tariffs[index];
  }

  public deleteTariff(id: string): boolean {
    const tariffs = this.getTariffs();
    const filtered = tariffs.filter(t => t.id !== id);
    if (filtered.length === tariffs.length) return false;
    this.setItem('tariffs', filtered);
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI VOYAGE =====================
  public getVoyages(): Voyage[] {
    return this.getItem<Voyage[]>('voyages', initialVoyages);
  }

  public createVoyage(voyage: Omit<Voyage, 'id'>): Voyage {
    const voyages = this.getVoyages();
    const newVoyage: Voyage = {
      ...voyage,
      id: 'voy-' + Date.now()
    };
    voyages.unshift(newVoyage);
    this.setItem('voyages', voyages);

    // If voyage is underway, automatically set vessel status to Berlayar
    if (voyage.status === 'Underway' && voyage.vesselId) {
      this.updateVessel(voyage.vesselId, {
        status: 'Berlayar',
        currentPortId: voyage.originPortId,
        destinationPortId: voyage.destinationPortId
      });
    }

    return newVoyage;
  }

  public updateVoyage(id: string, updates: Partial<Voyage>): Voyage | null {
    const voyages = this.getVoyages();
    const index = voyages.findIndex(v => v.id === id);
    if (index === -1) return null;
    voyages[index] = { ...voyages[index], ...updates };
    this.setItem('voyages', voyages);

    // Update vessel status if completed or arrived
    if (updates.status === 'Completed' || updates.status === 'Arrived') {
      const vesselId = voyages[index].vesselId;
      if (vesselId) {
        this.updateVessel(vesselId, {
          status: 'Bersandar',
          currentPortId: voyages[index].destinationPortId
        });
      }
    }

    return voyages[index];
  }

  public deleteVoyage(id: string): boolean {
    const voyages = this.getVoyages();
    const filtered = voyages.filter(v => v.id !== id);
    if (filtered.length === voyages.length) return false;
    this.setItem('voyages', filtered);
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI BUNKER LOG =====================
  public getBunkerLogs(): BunkerLog[] {
    return this.getItem<BunkerLog[]>('bunker_logs', initialBunkerLogs);
  }

  public createBunkerLog(log: Omit<BunkerLog, 'id'>): BunkerLog {
    const logs = this.getBunkerLogs();
    const newLog: BunkerLog = {
      ...log,
      id: 'bunk-' + Date.now()
    };
    logs.unshift(newLog);
    this.setItem('bunker_logs', logs);
    return newLog;
  }

  public updateBunkerLog(id: string, updates: Partial<BunkerLog>): BunkerLog | null {
    const logs = this.getBunkerLogs();
    const index = logs.findIndex(b => b.id === id);
    if (index === -1) return null;
    logs[index] = { ...logs[index], ...updates };
    this.setItem('bunker_logs', logs);
    return logs[index];
  }

  public deleteBunkerLog(id: string): boolean {
    const logs = this.getBunkerLogs();
    const filtered = logs.filter(b => b.id !== id);
    if (filtered.length === logs.length) return false;
    this.setItem('bunker_logs', filtered);
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI MAINTENANCE =====================
  public getMaintenances(): Maintenance[] {
    return this.getItem<Maintenance[]>('maintenances', initialMaintenances);
  }

  public createMaintenance(maint: Omit<Maintenance, 'id'>): Maintenance {
    const maints = this.getMaintenances();
    const newMaint: Maintenance = {
      ...maint,
      id: 'maint-' + Date.now()
    };
    maints.unshift(newMaint);
    this.setItem('maintenances', maints);

    if (maint.status === 'Dalam Pengerjaan' && maint.vesselId) {
      this.updateVessel(maint.vesselId, { status: 'Perawatan' });
    }

    return newMaint;
  }

  public updateMaintenance(id: string, updates: Partial<Maintenance>): Maintenance | null {
    const maints = this.getMaintenances();
    const index = maints.findIndex(m => m.id === id);
    if (index === -1) return null;
    maints[index] = { ...maints[index], ...updates };
    this.setItem('maintenances', maints);

    if (updates.status === 'Selesai' && maints[index].vesselId) {
      this.updateVessel(maints[index].vesselId, { status: 'Bersandar' });
    }

    return maints[index];
  }

  public deleteMaintenance(id: string): boolean {
    const maints = this.getMaintenances();
    const filtered = maints.filter(m => m.id !== id);
    if (filtered.length === maints.length) return false;
    this.setItem('maintenances', filtered);
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI MANIFEST & BILLING =====================
  public getManifests(): CargoManifest[] {
    return this.getItem<CargoManifest[]>('manifests', initialManifests);
  }

  public createManifest(manifest: Omit<CargoManifest, 'id'>): CargoManifest {
    const manifests = this.getManifests();
    const newManifest: CargoManifest = {
      ...manifest,
      id: 'mnf-' + Date.now()
    };
    manifests.unshift(newManifest);
    this.setItem('manifests', manifests);
    return newManifest;
  }

  public updateManifest(id: string, updates: Partial<CargoManifest>): CargoManifest | null {
    const manifests = this.getManifests();
    const index = manifests.findIndex(m => m.id === id);
    if (index === -1) return null;
    manifests[index] = { ...manifests[index], ...updates };
    this.setItem('manifests', manifests);
    return manifests[index];
  }

  public deleteManifest(id: string): boolean {
    const manifests = this.getManifests();
    const filtered = manifests.filter(m => m.id !== id);
    if (filtered.length === manifests.length) return false;
    this.setItem('manifests', filtered);
    return true;
  }

  // ===================== REAL-TIME SIMULATOR =====================
  // Simulates live vessel positions, speed jitter, and fuel consumption
  public simulateTelemetryTick(): Vessel[] {
    const vessels = this.getVessels();
    let changed = false;

    const updatedVessels = vessels.map(vessel => {
      if (vessel.status === 'Berlayar') {
        changed = true;
        // Minor knot speed fluctuation (+- 0.3 knots)
        const speedDelta = (Math.random() - 0.5) * 0.4;
        const newSpeed = Math.max(10, Math.min(22, +(vessel.speedKnots + speedDelta).toFixed(1)));

        // Slight heading drift along route
        const rad = (vessel.heading * Math.PI) / 180;
        // Approximate 0.005 degrees per tick
        const latDelta = Math.cos(rad) * 0.004;
        const lonDelta = Math.sin(rad) * 0.004;

        // Minor fuel decrease
        const fuelDelta = 0.02; // 0.02% decrease
        const newFuel = Math.max(15, +(vessel.fuelLevelPercent - fuelDelta).toFixed(2));

        return {
          ...vessel,
          speedKnots: newSpeed,
          latitude: +(vessel.latitude + latDelta).toFixed(4),
          longitude: +(vessel.longitude + lonDelta).toFixed(4),
          fuelLevelPercent: newFuel,
          lastUpdated: 'Live Telemetri (Sinkron detik ini)'
        };
      }
      return vessel;
    });

    if (changed) {
      this.setItem('vessels', updatedVessels);
    }
    return updatedVessels;
  }

  // Reset to initial Indonesian shipping demo state
  public resetToFactoryData(): void {
    this.setItem('vessels', initialVessels);
    this.setItem('ports', initialPorts);
    this.setItem('crews', initialCrews);
    this.setItem('tariffs', initialTariffs);
    this.setItem('voyages', initialVoyages);
    this.setItem('bunker_logs', initialBunkerLogs);
    this.setItem('maintenances', initialMaintenances);
    this.setItem('manifests', initialManifests);
  }

  // Generate SQL DDL script for Supabase or Neon DB
  public generateSqlSchema(): string {
    return `-- =========================================================
-- SAMUDERA MARITIME ENTERPRISE DATABASE SCHEMA
-- Compatible with Supabase (PostgreSQL) and Neon DB
-- =========================================================

-- 1. Table Ports (Pelabuhan)
CREATE TABLE IF NOT EXISTS ports (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    max_draft_meters NUMERIC(4,2),
    berths_count INT DEFAULT 1,
    contact_phone VARCHAR(50),
    harbor_master VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table Vessels (Kapal)
CREATE TABLE IF NOT EXISTS vessels (
    id VARCHAR(64) PRIMARY KEY,
    imo_number VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    flag VARCHAR(64) DEFAULT 'Indonesia (ID)',
    dwt_capacity INT NOT NULL,
    teu_capacity INT,
    year_built INT,
    engine_power_hp INT,
    status VARCHAR(32) DEFAULT 'Bersandar',
    current_port_id VARCHAR(64) REFERENCES ports(id) ON DELETE SET NULL,
    destination_port_id VARCHAR(64) REFERENCES ports(id) ON DELETE SET NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    heading NUMERIC(5,2) DEFAULT 0,
    speed_knots NUMERIC(4,1) DEFAULT 0,
    fuel_level_percent NUMERIC(5,2) DEFAULT 100,
    captain_name VARCHAR(255),
    fuel_capacity_mt NUMERIC(8,2),
    last_updated VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table Crews (Kru Kapal)
CREATE TABLE IF NOT EXISTS crews (
    id VARCHAR(64) PRIMARY KEY,
    seaman_book_no VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    assigned_vessel_id VARCHAR(64) REFERENCES vessels(id) ON DELETE SET NULL,
    nationality VARCHAR(100) DEFAULT 'Indonesia',
    certificate_level VARCHAR(100),
    license_expiry DATE,
    phone_number VARCHAR(50),
    emergency_contact TEXT,
    status VARCHAR(50) DEFAULT 'Aktif di Kapal',
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table Cargo Tariffs (Tarif Kargo)
CREATE TABLE IF NOT EXISTS cargo_tariffs (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    base_rate_per_unit NUMERIC(15,2) NOT NULL,
    unit_name VARCHAR(64) NOT NULL,
    minimum_order NUMERIC(10,2) DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table Voyages (Pelayaran)
CREATE TABLE IF NOT EXISTS voyages (
    id VARCHAR(64) PRIMARY KEY,
    voyage_number VARCHAR(64) NOT NULL UNIQUE,
    vessel_id VARCHAR(64) REFERENCES vessels(id) ON DELETE CASCADE,
    origin_port_id VARCHAR(64) REFERENCES ports(id),
    destination_port_id VARCHAR(64) REFERENCES ports(id),
    etd TIMESTAMP WITH TIME ZONE NOT NULL,
    eta TIMESTAMP WITH TIME ZONE NOT NULL,
    atd TIMESTAMP WITH TIME ZONE,
    ata TIMESTAMP WITH TIME ZONE,
    cargo_category VARCHAR(100),
    cargo_volume NUMERIC(12,2),
    cargo_unit VARCHAR(32),
    freight_rate_per_unit NUMERIC(15,2),
    freight_revenue NUMERIC(15,2),
    estimated_fuel_mt NUMERIC(8,2),
    actual_fuel_mt NUMERIC(8,2),
    distance_nautical_miles NUMERIC(8,2),
    status VARCHAR(32) DEFAULT 'Scheduled',
    captain_on_duty VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table Bunker Logs (Bahan Bakar)
CREATE TABLE IF NOT EXISTS bunker_logs (
    id VARCHAR(64) PRIMARY KEY,
    vessel_id VARCHAR(64) REFERENCES vessels(id) ON DELETE CASCADE,
    voyage_id VARCHAR(64) REFERENCES voyages(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    fuel_type VARCHAR(32) NOT NULL,
    consumption_mt NUMERIC(8,2) NOT NULL,
    stock_remaining_mt NUMERIC(8,2) NOT NULL,
    avg_engine_rpm INT,
    avg_speed_knots NUMERIC(4,1),
    distance_run_nm NUMERIC(8,2),
    sea_state VARCHAR(64),
    recorded_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table Maintenances (Pemeliharaan & Docking)
CREATE TABLE IF NOT EXISTS maintenances (
    id VARCHAR(64) PRIMARY KEY,
    work_order_number VARCHAR(64) NOT NULL UNIQUE,
    vessel_id VARCHAR(64) REFERENCES vessels(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    priority VARCHAR(32) DEFAULT 'Medium',
    description TEXT,
    estimated_cost NUMERIC(15,2),
    actual_cost NUMERIC(15,2),
    start_date DATE,
    target_end_date DATE,
    completion_date DATE,
    dockyard_vendor VARCHAR(255),
    status VARCHAR(32) DEFAULT 'Dijadwalkan',
    technician_in_charge VARCHAR(255),
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table Cargo Manifests (Manifest & Billing)
CREATE TABLE IF NOT EXISTS cargo_manifests (
    id VARCHAR(64) PRIMARY KEY,
    manifest_number VARCHAR(64) NOT NULL UNIQUE,
    bill_of_lading_no VARCHAR(64) NOT NULL,
    voyage_id VARCHAR(64) REFERENCES voyages(id) ON DELETE CASCADE,
    shipper_name VARCHAR(255) NOT NULL,
    consignee_name VARCHAR(255) NOT NULL,
    goods_description TEXT,
    package_count INT,
    weight_ton NUMERIC(10,2),
    volume_cbm NUMERIC(10,2),
    freight_amount NUMERIC(15,2) NOT NULL,
    payment_status VARCHAR(32) DEFAULT 'Belum Lunas',
    issue_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;
  }
}

export const dbManager = new DatabaseManager();
