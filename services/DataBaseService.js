const DB_NAME = 'AdNetDB';
const DB_VERSION = 1;
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = e => reject(e.target.error);
    request.onsuccess = e => resolve(e.target.result);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('balance')) db.createObjectStore('balance', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('ads')) db.createObjectStore('ads', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { autoIncrement: true, keyPath: 'id' });
    };
  });
  return dbPromise;
}

async function performTransaction(storeName, mode, action) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let request;
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = e => reject(e.target.error);
    request = action(store);
  });
}

export const DBService = {
  saveBalance: (balance) => performTransaction('balance', 'readwrite', store => store.put({ id: 1, value: balance })),
  getBalance: async () => {
    const result = await performTransaction('balance', 'readonly', store => store.get(1));
    return result ? result.value : 0;
  },
  saveAllTransactions: (transactions) => performTransaction('transactions', 'readwrite', store => {
    store.clear();
    transactions.forEach(tx => store.put(tx));
  }),
  addTransaction: (transaction) => performTransaction('transactions', 'readwrite', store => store.add(transaction)),
  getAllTransactions: () => performTransaction('transactions', 'readonly', store => store.getAll()),
  saveProfile: (profileData) => performTransaction('profile', 'readwrite', store => store.put({ id: 1, ...profileData })),
  getProfile: async () => await performTransaction('profile', 'readonly', store => store.get(1)),
  saveAllAds: (ads) => performTransaction('ads', 'readwrite', store => {
    store.clear();
    ads.forEach(ad => store.put(ad));
  }),
  saveAd: (ad) => performTransaction('ads', 'readwrite', store => store.put(ad)),
  addAd: (ad) => performTransaction('ads', 'readwrite', store => store.add(ad)),
  getAllAds: () => performTransaction('ads', 'readonly', store => store.getAll()),
  getAdById: (id) => performTransaction('ads', 'readonly', store => store.get(id)),
  deleteAd: (id) => performTransaction('ads', 'readwrite', store => store.delete(id)),

  addToSyncQueue: (task) => performTransaction('syncQueue', 'readwrite', store => store.add(task)),
};