import { ChemicalComponent, OrganicCompound } from '../types';
import { COMMON_COMPONENTS, ORGANIC_DATA } from '../constants';

const DB_NAME = 'ChemistryAppDB';
const DB_VERSION = 3; // Bumped version to force a clean upgrade

export const DB = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // --- Valence Store ---
        // Clean up old stores if they exist to prevent schema conflicts
        if (db.objectStoreNames.contains('valence')) {
          db.deleteObjectStore('valence');
        }
        
        // Create with 'id' as keyPath.
        const valenceStore = db.createObjectStore('valence', { keyPath: 'id' });
        
        // Seed default data
        // Use .put() instead of .add() to prevent ConstraintError if duplicates theoretically exist
        COMMON_COMPONENTS.forEach((item, index) => {
            // Generate a deterministic unique ID
            // Using index as fallback suffix to guarantee uniqueness during seed
            const id = `${item.symbol}_${item.valence}_${item.type}_${index}`.replace(/[^a-zA-Z0-9_]/g, '');
            valenceStore.put({ ...item, id });
        });

        // --- Organic Store ---
        if (db.objectStoreNames.contains('organic')) {
             db.deleteObjectStore('organic');
        }
        
        const organicStore = db.createObjectStore('organic', { keyPath: 'id' });
        // Seed default organic data
        ORGANIC_DATA.forEach(item => organicStore.put(item));
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllValence(): Promise<ChemicalComponent[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('valence', 'readonly');
      const store = tx.objectStore('valence');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async addValence(item: ChemicalComponent): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('valence', 'readwrite');
      const store = tx.objectStore('valence');
      
      // Ensure ID exists for user-added items
      if (!item.id) {
         item.id = `${item.symbol}_${item.valence}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '');
      }
      
      const request = store.put(item); 
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteValence(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('valence', 'readwrite');
      const store = tx.objectStore('valence');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllOrganic(): Promise<OrganicCompound[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('organic', 'readonly');
      const store = tx.objectStore('organic');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveOrganic(item: OrganicCompound): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('organic', 'readwrite');
      const store = tx.objectStore('organic');
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteOrganic(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('organic', 'readwrite');
      const store = tx.objectStore('organic');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async resetData(): Promise<void> {
     const db = await this.open();
     
     const tx1 = db.transaction('valence', 'readwrite');
     const vStore = tx1.objectStore('valence');
     vStore.clear();
     COMMON_COMPONENTS.forEach((c, idx) => {
         const id = `${c.symbol}_${c.valence}_${c.type}_${idx}`.replace(/[^a-zA-Z0-9_]/g, '');
         vStore.put({ ...c, id });
     });
     
     const tx2 = db.transaction('organic', 'readwrite');
     const oStore = tx2.objectStore('organic');
     oStore.clear();
     ORGANIC_DATA.forEach(o => oStore.put(o));
     
     return new Promise(resolve => {
         tx2.oncomplete = () => resolve();
     });
  }
};