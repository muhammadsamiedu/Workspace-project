const DB_NAME = 'WorkspaceManagerDB';
const DB_VERSION = 1;

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not supported in this environment');
    }
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const storeNames = ['workspaces', 'projects', 'tasks', 'comments', 'activity', 'notifications', 'app_state'];
        storeNames.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  async saveItems<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB saveItems error on store ${storeName}:`, err);
    }
  }

  async getAllItems<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB getAllItems error on store ${storeName}:`, err);
      return [];
    }
  }

  async saveSingle<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB saveSingle error on store ${storeName}:`, err);
    }
  }

  async deleteItem(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB deleteItem error on store ${storeName}:`, err);
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      const db = await this.getDB();
      const storeNames = ['workspaces', 'projects', 'tasks', 'comments', 'activity', 'notifications', 'app_state'];
      const tx = db.transaction(storeNames, 'readwrite');
      storeNames.forEach((name) => {
        if (db.objectStoreNames.contains(name)) {
          tx.objectStore(name).clear();
        }
      });
    } catch (err) {
      console.warn('IndexedDB clearDatabase error:', err);
    }
  }
}

export const idbManager = new IndexedDBManager();
