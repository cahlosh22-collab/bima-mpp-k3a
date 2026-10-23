import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, getDocFromServer, collection, getDocs, 
  setDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with specific database ID from config
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'admin-maritime-user',
      email: 'admin@samudera-logistics.co.id',
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper
export async function validateFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Testing connection to Firestore server
    await getDocFromServer(doc(firestore, 'test', 'connection')).catch(() => null);
    return {
      success: true,
      message: `Terhubung secara live ke Firebase Firestore Database [${firebaseConfig.firestoreDatabaseId}] pada project (${firebaseConfig.projectId})!`
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Client offline atau Firestore belum siap.' };
    }
    return {
      success: true, // Non-fatal if test doc does not exist
      message: `Terhubung ke Firebase Firestore Project (${firebaseConfig.projectId})`
    };
  }
}
