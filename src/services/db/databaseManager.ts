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
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
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

  // In-memory synced state
  private vessels: Vessel[] = [];
  private ports: Port[] = [];
  private crews: Crew[] = [];
  private tariffs: CargoTariff[] = [];
  private voyages: Voyage[] = [];
  private bunkerLogs: BunkerLog[] = [];
  private maintenances: Maintenance[] = [];
  private manifests: CargoManifest[] = [];

  // Listeners for real-time reactivity
  private listeners: Set<() => void> = new Set();
  private isFirestoreInitialized = false;

  constructor() {
    this.loadConfig();
    this.loadInitialLocalStorage();
    this.initRealDatabaseClients();
    this.initFirestoreRealtimeSync();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Error notifying DB listener:', err);
      }
    });
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
    this.notifyListeners();
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
    // Always enforce Firebase as default with provisioned credentials
    this.config.firebaseApiKey = firebaseAppletConfig.apiKey;
    this.config.firebaseProjectId = firebaseAppletConfig.projectId;
    this.config.firebaseAppId = firebaseAppletConfig.appId;
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

    // 3. Firestore instance
    this.firestoreDb = firestore;
  }

  // ===================== REAL-TIME FIRESTORE SYNC =====================
  private initFirestoreRealtimeSync(): void {
    if (this.isFirestoreInitialized) return;
    this.isFirestoreInitialized = true;

    try {
      // 1. Vessels Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'vessels'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Vessel[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as Vessel));
            this.vessels = list;
            this.setItem('vessels', list, false);
            this.notifyListeners();
          } else {
            // Seed if collection is currently empty
            this.seedFirestoreIfEmpty();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'vessels');
        }
      );

      // 2. Ports Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'ports'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Port[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as Port));
            this.ports = list;
            this.setItem('ports', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'ports');
        }
      );

      // 3. Crews Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'crews'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Crew[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as Crew));
            this.crews = list;
            this.setItem('crews', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'crews');
        }
      );

      // 4. Tariffs Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'tariffs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CargoTariff[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as CargoTariff));
            this.tariffs = list;
            this.setItem('tariffs', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'tariffs');
        }
      );

      // 5. Voyages Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'voyages'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Voyage[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as Voyage));
            this.voyages = list;
            this.setItem('voyages', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'voyages');
        }
      );

      // 6. Bunker Logs Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'bunker_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: BunkerLog[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as BunkerLog));
            this.bunkerLogs = list;
            this.setItem('bunker_logs', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'bunker_logs');
        }
      );

      // 7. Maintenances Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'maintenances'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Maintenance[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as Maintenance));
            this.maintenances = list;
            this.setItem('maintenances', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'maintenances');
        }
      );

      // 8. Manifests Snapshot Listener
      onSnapshot(
        collection(this.firestoreDb, 'manifests'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CargoManifest[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as CargoManifest));
            this.manifests = list;
            this.setItem('manifests', list, false);
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'manifests');
        }
      );
    } catch (e) {
      console.warn('Realtime Firestore subscription notice:', e);
    }
  }

  public async seedFirestoreIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(this.firestoreDb, 'vessels')).catch(() => null);
      if (!snap || snap.empty) {
        console.log('Seeding initial maritime dataset to live Firestore database...');
        for (const v of initialVessels) {
          await setDoc(doc(this.firestoreDb, 'vessels', v.id), v).catch(err => handleFirestoreError(err, OperationType.WRITE, 'vessels'));
        }
        for (const p of initialPorts) {
          await setDoc(doc(this.firestoreDb, 'ports', p.id), p).catch(err => handleFirestoreError(err, OperationType.WRITE, 'ports'));
        }
        for (const c of initialCrews) {
          await setDoc(doc(this.firestoreDb, 'crews', c.id), c).catch(err => handleFirestoreError(err, OperationType.WRITE, 'crews'));
        }
        for (const t of initialTariffs) {
          await setDoc(doc(this.firestoreDb, 'tariffs', t.id), t).catch(err => handleFirestoreError(err, OperationType.WRITE, 'tariffs'));
        }
        for (const voy of initialVoyages) {
          await setDoc(doc(this.firestoreDb, 'voyages', voy.id), voy).catch(err => handleFirestoreError(err, OperationType.WRITE, 'voyages'));
        }
        for (const b of initialBunkerLogs) {
          await setDoc(doc(this.firestoreDb, 'bunker_logs', b.id), b).catch(err => handleFirestoreError(err, OperationType.WRITE, 'bunker_logs'));
        }
        for (const m of initialMaintenances) {
          await setDoc(doc(this.firestoreDb, 'maintenances', m.id), m).catch(err => handleFirestoreError(err, OperationType.WRITE, 'maintenances'));
        }
        for (const mnf of initialManifests) {
          await setDoc(doc(this.firestoreDb, 'manifests', mnf.id), mnf).catch(err => handleFirestoreError(err, OperationType.WRITE, 'manifests'));
        }
        console.log('Live Firestore seeding completed successfully!');
      }
    } catch (e) {
      console.warn('Firestore seed check notice:', e);
    }
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
        const testClient = createClient(url, key);
        const { error } = await testClient.from('vessels').select('id').limit(1);
        if (error && error.code !== 'PGRST116' && !error.message.includes('relation "vessels" does not exist')) {
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

  private loadInitialLocalStorage(): void {
    this.vessels = this.getItem<Vessel[]>('vessels', initialVessels);
    this.ports = this.getItem<Port[]>('ports', initialPorts);
    this.crews = this.getItem<Crew[]>('crews', initialCrews);
    this.tariffs = this.getItem<CargoTariff[]>('tariffs', initialTariffs);
    this.voyages = this.getItem<Voyage[]>('voyages', initialVoyages);
    this.bunkerLogs = this.getItem<BunkerLog[]>('bunker_logs', initialBunkerLogs);
    this.maintenances = this.getItem<Maintenance[]>('maintenances', initialMaintenances);
    this.manifests = this.getItem<CargoManifest[]>('manifests', initialManifests);
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  private setItem<T>(key: string, data: T, triggerExternalSync = true): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
      if (triggerExternalSync) {
        this.syncToExternalDatabases(key, data);
      }
    } catch (e) {
      console.warn(`Error writing ${key} to storage:`, e);
    }
  }

  // Real-time synchronization to Firestore and other connected DBs
  private async syncToExternalDatabases(table: string, data: any): Promise<void> {
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

    if (this.config.provider === 'supabase' && this.supabaseClient) {
      try {
        if (Array.isArray(data)) {
          await this.supabaseClient.from(table).upsert(data);
        }
      } catch (err) {
        console.warn(`Supabase sync warning for ${table}:`, err);
      }
    }
  }

  // ===================== CRUD FOR MASTER KAPAL =====================
  public getVessels(): Vessel[] {
    return this.vessels.length > 0 ? [...this.vessels] : this.getItem<Vessel[]>('vessels', initialVessels);
  }

  public createVessel(vessel: Omit<Vessel, 'id' | 'lastUpdated'> & { lastUpdated?: string }): Vessel {
    const newVessel: Vessel = {
      ...vessel,
      id: 'vessel-' + Date.now(),
      lastUpdated: vessel.lastUpdated || 'Baru saja ditambahkan'
    };
    this.vessels = [newVessel, ...this.vessels];
    this.setItem('vessels', this.vessels);

    // Direct write to Firestore
    setDoc(doc(this.firestoreDb, 'vessels', newVessel.id), newVessel).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `vessels/${newVessel.id}`);
    });

    this.notifyListeners();
    return newVessel;
  }

  public updateVessel(id: string, updates: Partial<Vessel>): Vessel | null {
    const index = this.vessels.findIndex(v => v.id === id);
    if (index === -1) return null;
    const updated = { ...this.vessels[index], ...updates, lastUpdated: 'Baru diperbarui' };
    this.vessels[index] = updated;
    this.setItem('vessels', this.vessels);

    // Direct update to Firestore
    setDoc(doc(this.firestoreDb, 'vessels', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `vessels/${id}`);
    });

    this.notifyListeners();
    return updated;
  }

  public deleteVessel(id: string): boolean {
    const initialLen = this.vessels.length;
    this.vessels = this.vessels.filter(v => v.id !== id);
    if (this.vessels.length === initialLen) return false;
    this.setItem('vessels', this.vessels);

    // Direct delete from Firestore
    deleteDoc(doc(this.firestoreDb, 'vessels', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `vessels/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR MASTER PELABUHAN =====================
  public getPorts(): Port[] {
    return this.ports.length > 0 ? [...this.ports] : this.getItem<Port[]>('ports', initialPorts);
  }

  public createPort(port: Omit<Port, 'id'>): Port {
    const newPort: Port = {
      ...port,
      id: 'port-' + Date.now()
    };
    this.ports = [...this.ports, newPort];
    this.setItem('ports', this.ports);

    setDoc(doc(this.firestoreDb, 'ports', newPort.id), newPort).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `ports/${newPort.id}`);
    });

    this.notifyListeners();
    return newPort;
  }

  public updatePort(id: string, updates: Partial<Port>): Port | null {
    const index = this.ports.findIndex(p => p.id === id);
    if (index === -1) return null;
    const updated = { ...this.ports[index], ...updates };
    this.ports[index] = updated;
    this.setItem('ports', this.ports);

    setDoc(doc(this.firestoreDb, 'ports', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `ports/${id}`);
    });

    this.notifyListeners();
    return updated;
  }

  public deletePort(id: string): boolean {
    const initialLen = this.ports.length;
    this.ports = this.ports.filter(p => p.id !== id);
    if (this.ports.length === initialLen) return false;
    this.setItem('ports', this.ports);

    deleteDoc(doc(this.firestoreDb, 'ports', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `ports/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR MASTER KRU =====================
  public getCrews(): Crew[] {
    return this.crews.length > 0 ? [...this.crews] : this.getItem<Crew[]>('crews', initialCrews);
  }

  public createCrew(crew: Omit<Crew, 'id'>): Crew {
    const newCrew: Crew = {
      ...crew,
      id: 'crew-' + Date.now()
    };
    this.crews = [newCrew, ...this.crews];
    this.setItem('crews', this.crews);

    setDoc(doc(this.firestoreDb, 'crews', newCrew.id), newCrew).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `crews/${newCrew.id}`);
    });

    this.notifyListeners();
    return newCrew;
  }

  public updateCrew(id: string, updates: Partial<Crew>): Crew | null {
    const index = this.crews.findIndex(c => c.id === id);
    if (index === -1) return null;
    const updated = { ...this.crews[index], ...updates };
    this.crews[index] = updated;
    this.setItem('crews', this.crews);

    setDoc(doc(this.firestoreDb, 'crews', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `crews/${id}`);
    });

    this.notifyListeners();
    return updated;
  }

  public deleteCrew(id: string): boolean {
    const initialLen = this.crews.length;
    this.crews = this.crews.filter(c => c.id !== id);
    if (this.crews.length === initialLen) return false;
    this.setItem('crews', this.crews);

    deleteDoc(doc(this.firestoreDb, 'crews', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `crews/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR MASTER TARIF =====================
  public getTariffs(): CargoTariff[] {
    return this.tariffs.length > 0 ? [...this.tariffs] : this.getItem<CargoTariff[]>('tariffs', initialTariffs);
  }

  public createTariff(tariff: Omit<CargoTariff, 'id'>): CargoTariff {
    const newTariff: CargoTariff = {
      ...tariff,
      id: 'tariff-' + Date.now()
    };
    this.tariffs = [...this.tariffs, newTariff];
    this.setItem('tariffs', this.tariffs);

    setDoc(doc(this.firestoreDb, 'tariffs', newTariff.id), newTariff).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `tariffs/${newTariff.id}`);
    });

    this.notifyListeners();
    return newTariff;
  }

  public updateTariff(id: string, updates: Partial<CargoTariff>): CargoTariff | null {
    const index = this.tariffs.findIndex(t => t.id === id);
    if (index === -1) return null;
    const updated = { ...this.tariffs[index], ...updates };
    this.tariffs[index] = updated;
    this.setItem('tariffs', this.tariffs);

    setDoc(doc(this.firestoreDb, 'tariffs', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `tariffs/${id}`);
    });

    this.notifyListeners();
    return updated;
  }

  public deleteTariff(id: string): boolean {
    const initialLen = this.tariffs.length;
    this.tariffs = this.tariffs.filter(t => t.id !== id);
    if (this.tariffs.length === initialLen) return false;
    this.setItem('tariffs', this.tariffs);

    deleteDoc(doc(this.firestoreDb, 'tariffs', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `tariffs/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI VOYAGE =====================
  public getVoyages(): Voyage[] {
    return this.voyages.length > 0 ? [...this.voyages] : this.getItem<Voyage[]>('voyages', initialVoyages);
  }

  public createVoyage(voyage: Omit<Voyage, 'id'>): Voyage {
    const newVoyage: Voyage = {
      ...voyage,
      id: 'voy-' + Date.now()
    };
    this.voyages = [newVoyage, ...this.voyages];
    this.setItem('voyages', this.voyages);

    setDoc(doc(this.firestoreDb, 'voyages', newVoyage.id), newVoyage).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `voyages/${newVoyage.id}`);
    });

    if (voyage.status === 'Underway' && voyage.vesselId) {
      this.updateVessel(voyage.vesselId, {
        status: 'Berlayar',
        currentPortId: voyage.originPortId,
        destinationPortId: voyage.destinationPortId
      });
    }

    this.notifyListeners();
    return newVoyage;
  }

  public updateVoyage(id: string, updates: Partial<Voyage>): Voyage | null {
    const index = this.voyages.findIndex(v => v.id === id);
    if (index === -1) return null;
    const updated = { ...this.voyages[index], ...updates };
    this.voyages[index] = updated;
    this.setItem('voyages', this.voyages);

    setDoc(doc(this.firestoreDb, 'voyages', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `voyages/${id}`);
    });

    if (updates.status === 'Completed' || updates.status === 'Arrived') {
      const vesselId = this.voyages[index].vesselId;
      if (vesselId) {
        this.updateVessel(vesselId, {
          status: 'Bersandar',
          currentPortId: this.voyages[index].destinationPortId
        });
      }
    }

    this.notifyListeners();
    return updated;
  }

  public deleteVoyage(id: string): boolean {
    const initialLen = this.voyages.length;
    this.voyages = this.voyages.filter(v => v.id !== id);
    if (this.voyages.length === initialLen) return false;
    this.setItem('voyages', this.voyages);

    deleteDoc(doc(this.firestoreDb, 'voyages', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `voyages/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI BUNKER LOG =====================
  public getBunkerLogs(): BunkerLog[] {
    return this.bunkerLogs.length > 0 ? [...this.bunkerLogs] : this.getItem<BunkerLog[]>('bunker_logs', initialBunkerLogs);
  }

  public createBunkerLog(log: Omit<BunkerLog, 'id'>): BunkerLog {
    const newLog: BunkerLog = {
      ...log,
      id: 'bunk-' + Date.now()
    };
    this.bunkerLogs = [newLog, ...this.bunkerLogs];
    this.setItem('bunker_logs', this.bunkerLogs);

    setDoc(doc(this.firestoreDb, 'bunker_logs', newLog.id), newLog).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `bunker_logs/${newLog.id}`);
    });

    this.notifyListeners();
    return newLog;
  }

  public updateBunkerLog(id: string, updates: Partial<BunkerLog>): BunkerLog | null {
    const index = this.bunkerLogs.findIndex(b => b.id === id);
    if (index === -1) return null;
    const updated = { ...this.bunkerLogs[index], ...updates };
    this.bunkerLogs[index] = updated;
    this.setItem('bunker_logs', this.bunkerLogs);

    setDoc(doc(this.firestoreDb, 'bunker_logs', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `bunker_logs/${id}`);
    });

    this.notifyListeners();
    return updated;
  }

  public deleteBunkerLog(id: string): boolean {
    const initialLen = this.bunkerLogs.length;
    this.bunkerLogs = this.bunkerLogs.filter(b => b.id !== id);
    if (this.bunkerLogs.length === initialLen) return false;
    this.setItem('bunker_logs', this.bunkerLogs);

    deleteDoc(doc(this.firestoreDb, 'bunker_logs', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `bunker_logs/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI MAINTENANCE =====================
  public getMaintenances(): Maintenance[] {
    return this.maintenances.length > 0 ? [...this.maintenances] : this.getItem<Maintenance[]>('maintenances', initialMaintenances);
  }

  public createMaintenance(maint: Omit<Maintenance, 'id'>): Maintenance {
    const newMaint: Maintenance = {
      ...maint,
      id: 'maint-' + Date.now()
    };
    this.maintenances = [newMaint, ...this.maintenances];
    this.setItem('maintenances', this.maintenances);

    setDoc(doc(this.firestoreDb, 'maintenances', newMaint.id), newMaint).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `maintenances/${newMaint.id}`);
    });

    if (maint.status === 'Dalam Pengerjaan' && maint.vesselId) {
      this.updateVessel(maint.vesselId, { status: 'Perawatan' });
    }

    this.notifyListeners();
    return newMaint;
  }

  public updateMaintenance(id: string, updates: Partial<Maintenance>): Maintenance | null {
    const index = this.maintenances.findIndex(m => m.id === id);
    if (index === -1) return null;
    const updated = { ...this.maintenances[index], ...updates };
    this.maintenances[index] = updated;
    this.setItem('maintenances', this.maintenances);

    setDoc(doc(this.firestoreDb, 'maintenances', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `maintenances/${id}`);
    });

    if (updates.status === 'Selesai' && this.maintenances[index].vesselId) {
      this.updateVessel(this.maintenances[index].vesselId, { status: 'Bersandar' });
    }

    this.notifyListeners();
    return updated;
  }

  public deleteMaintenance(id: string): boolean {
    const initialLen = this.maintenances.length;
    this.maintenances = this.maintenances.filter(m => m.id !== id);
    if (this.maintenances.length === initialLen) return false;
    this.setItem('maintenances', this.maintenances);

    deleteDoc(doc(this.firestoreDb, 'maintenances', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `maintenances/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== CRUD FOR TRANSAKSI MANIFEST =====================
  public getManifests(): CargoManifest[] {
    return this.manifests.length > 0 ? [...this.manifests] : this.getItem<CargoManifest[]>('manifests', initialManifests);
  }

  public createManifest(manifest: Omit<CargoManifest, 'id'>): CargoManifest {
    const newManifest: CargoManifest = {
      ...manifest,
      id: 'mnf-' + Date.now()
    };
    this.manifests = [newManifest, ...this.manifests];
    this.setItem('manifests', this.manifests);

    setDoc(doc(this.firestoreDb, 'manifests', newManifest.id), newManifest).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `manifests/${newManifest.id}`);
    });

    this.notifyListeners();
    return newManifest;
  }

  public updateManifest(id: string, updates: Partial<CargoManifest>): CargoManifest | null {
    const index = this.manifests.findIndex(m => m.id === id);
    if (index === -1) return null;
    const updated = { ...this.manifests[index], ...updates };
    this.manifests[index] = updated;
    this.setItem('manifests', this.manifests);

    setDoc(doc(this.firestoreDb, 'manifests', id), updated).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `manifests/${id}`);
    });

    this.notifyListeners();
    return updated;
  }

  public deleteManifest(id: string): boolean {
    const initialLen = this.manifests.length;
    this.manifests = this.manifests.filter(m => m.id !== id);
    if (this.manifests.length === initialLen) return false;
    this.setItem('manifests', this.manifests);

    deleteDoc(doc(this.firestoreDb, 'manifests', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `manifests/${id}`);
    });

    this.notifyListeners();
    return true;
  }

  // ===================== REAL-TIME TELEMETRY SIMULATION =====================
  public simulateTelemetryTick(): Vessel[] {
    const vessels = this.getVessels();
    let changed = false;

    const updatedVessels = vessels.map(vessel => {
      if (vessel.status === 'Berlayar') {
        changed = true;
        const speedDelta = (Math.random() - 0.5) * 0.4;
        const newSpeed = Math.max(10, Math.min(22, +(vessel.speedKnots + speedDelta).toFixed(1)));

        const rad = (vessel.heading * Math.PI) / 180;
        const latDelta = Math.cos(rad) * 0.004;
        const lonDelta = Math.sin(rad) * 0.004;

        const fuelDelta = 0.02;
        const newFuel = Math.max(15, +(vessel.fuelLevelPercent - fuelDelta).toFixed(2));

        return {
          ...vessel,
          speedKnots: newSpeed,
          latitude: +(vessel.latitude + latDelta).toFixed(4),
          longitude: +(vessel.longitude + lonDelta).toFixed(4),
          fuelLevelPercent: newFuel,
          lastUpdated: 'Live Telemetri (Sinkron Firestore)'
        };
      }
      return vessel;
    });

    if (changed) {
      this.vessels = updatedVessels;
      this.setItem('vessels', updatedVessels, false);
      // Periodically update active sailing ship coordinates in Firestore
      const sailing = updatedVessels.find(v => v.status === 'Berlayar');
      if (sailing) {
        setDoc(doc(this.firestoreDb, 'vessels', sailing.id), sailing).catch(() => null);
      }
    }
    return updatedVessels;
  }

  // Reset to initial Indonesian shipping demo state
  public resetToFactoryData(): void {
    this.vessels = [...initialVessels];
    this.ports = [...initialPorts];
    this.crews = [...initialCrews];
    this.tariffs = [...initialTariffs];
    this.voyages = [...initialVoyages];
    this.bunkerLogs = [...initialBunkerLogs];
    this.maintenances = [...initialMaintenances];
    this.manifests = [...initialManifests];

    this.setItem('vessels', initialVessels);
    this.setItem('ports', initialPorts);
    this.setItem('crews', initialCrews);
    this.setItem('tariffs', initialTariffs);
    this.setItem('voyages', initialVoyages);
    this.setItem('bunker_logs', initialBunkerLogs);
    this.setItem('maintenances', initialMaintenances);
    this.setItem('manifests', initialManifests);

    this.seedFirestoreIfEmpty();
    this.notifyListeners();
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
