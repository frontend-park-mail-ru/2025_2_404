import type { Transaction, Ad, BalanceRecord, ProfileRecord } from '../src/types';

const DB_NAME = 'AdNetDB';
const DB_VERSION = 1;
let dbPromise: Promise<IDBDatabase> | null = null;

type StoreName = 'profile' | 'balance' | 'transactions' | 'ads' | 'syncQueue';

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('balance')) db.createObjectStore('balance', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('ads')) db.createObjectStore('ads', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { autoIncrement: true, keyPath: 'id' });
    };
  });
  
  return dbPromise;
}

async function performTransaction<T>(
  storeName: StoreName, 
  mode: IDBTransactionMode, 
  action: (store: IDBObjectStore) => IDBRequest
): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let request: IDBRequest;
    
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
    
    request = action(store);
  });
}

export const DBService = {
  saveBalance: (balance: number): Promise<void> => 
    performTransaction<void>('balance', 'readwrite', store => store.put({ id: 1, value: balance })),
  
  getBalance: async (): Promise<number> => {
    const result = await performTransaction<BalanceRecord>('balance', 'readonly', store => store.get(1));
    return result ? result.value : 0;
  },
  
  saveAllTransactions: (transactions: Transaction[]): Promise<void> => 
    performTransaction<void>('transactions', 'readwrite', store => {
      store.clear();
      transactions.forEach(tx => store.put(tx));
      return store.put(transactions[0] || { id: 0 });
    }),
  
  addTransaction: (transaction: Transaction): Promise<number | undefined> => 
    performTransaction<number>('transactions', 'readwrite', store => store.add(transaction)),
  
  getAllTransactions: (): Promise<Transaction[]> => 
    performTransaction<Transaction[]>('transactions', 'readonly', store => store.getAll()) as Promise<Transaction[]>,
  
  saveProfile: (profileData: ProfileRecord): Promise<void> => 
    performTransaction<void>('profile', 'readwrite', store => store.put({ id: 1, ...profileData })),
  
  getProfile: async (): Promise<ProfileRecord | undefined> => 
    await performTransaction<ProfileRecord>('profile', 'readonly', store => store.get(1)),
  
  saveAllAds: (ads: Ad[]): Promise<void> => 
    performTransaction<void>('ads', 'readwrite', store => {
      store.clear();
      ads.forEach(ad => store.put(ad));
      return store.put(ads[0] || { id: 0 });
    }),
  
  saveAd: (ad: Ad): Promise<void> => 
    performTransaction<void>('ads', 'readwrite', store => store.put(ad)),
  
  addAd: (ad: Ad): Promise<number | undefined> => 
    performTransaction<number>('ads', 'readwrite', store => store.add(ad)),
  
  getAllAds: (): Promise<Ad[]> => 
    performTransaction<Ad[]>('ads', 'readonly', store => store.getAll()) as Promise<Ad[]>,
  
  getAdById: (id: number | string): Promise<Ad | undefined> => 
    performTransaction<Ad>('ads', 'readonly', store => store.get(Number(id))),
  
  deleteAd: (id: number | string): Promise<void> => 
    performTransaction<void>('ads', 'readwrite', store => store.delete(Number(id))),

  addToSyncQueue: (task: unknown): Promise<number | undefined> => 
    performTransaction<number>('syncQueue', 'readwrite', store => store.add(task)),
};
