const STORAGE_KEY = 'todo_manager_app_data';
const LEGACY_STORAGE_KEY = 'todo_manager_app_data_v1';
const CURRENT_VERSION = 3;

// Default initial data for first-time visitors (empty state)
const DEFAULT_DATA = {
  version: CURRENT_VERSION,
  isEditMode: true,
  activeSectionId: null,
  sections: [],
  lastSaved: null
};

/**
 * Migrate data format from older versions to the current version.
 */
function migrateData(data) {
  let migrated = { ...data };

  // v1 -> v2: Single content to blocks array
  if (!migrated.version || migrated.version === 1) {
    console.log('Migrating data from v1 to v2 (multi-block support)...');
    migrated.sections = migrated.sections.map(sec => {
      const blockId = 'blk-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const type = sec.contentType || 'text';
      const content = sec.content !== undefined ? sec.content : '';

      return {
        id: sec.id,
        title: sec.title,
        createdAt: sec.createdAt,
        updatedAt: sec.updatedAt,
        blocks: [
          {
            id: blockId,
            type: type,
            content: content
          }
        ]
      };
    });
    migrated.version = 2;
  }

  // v2 -> v3: Add isEditMode to root, add taskFilter to blocks
  if (migrated.version === 2) {
    console.log('Migrating data from v2 to v3 (persist UI state)...');
    if (migrated.isEditMode === undefined) {
      migrated.isEditMode = true;
    }
    
    migrated.sections = migrated.sections.map(sec => ({
      ...sec,
      blocks: Array.isArray(sec.blocks) ? sec.blocks.map(b => ({
        ...b,
        taskFilter: b.taskFilter || 'all'
      })) : []
    }));
    
    migrated.version = 3;
  }

  return migrated;
}

const DB_NAME = 'TodoManagerDB';
const DB_VERSION = 2; // Incremented for new split schema
const STORE_SETTINGS = 'settings';
const STORE_SECTIONS = 'sections';
const STORE_BLOCKS = 'blocks';

let dbInstance = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORE_SECTIONS)) {
          db.createObjectStore(STORE_SECTIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BLOCKS)) {
          db.createObjectStore(STORE_BLOCKS, { keyPath: 'id' });
        }

        // Migration from V1 (monolithic) to V2 (split)
        if (oldVersion === 1 && db.objectStoreNames.contains('appData')) {
          const tx = event.currentTarget.transaction;
          const oldStore = tx.objectStore('appData');
          
          const getReq = oldStore.get('main_state');
          getReq.onsuccess = (e) => {
            const data = e.target.result;
            if (data) {
              const settingsStore = tx.objectStore(STORE_SETTINGS);
              const sectionsStore = tx.objectStore(STORE_SECTIONS);
              const blocksStore = tx.objectStore(STORE_BLOCKS);

              settingsStore.put(data.isEditMode, 'isEditMode');
              settingsStore.put(data.activeSectionId, 'activeSectionId');
              settingsStore.put(data.lastSaved, 'lastSaved');
              settingsStore.put(CURRENT_VERSION, 'version');

              if (Array.isArray(data.sections)) {
                data.sections.forEach(sec => {
                  const blockIds = [];
                  if (Array.isArray(sec.blocks)) {
                    sec.blocks.forEach(block => {
                      blockIds.push(block.id);
                      blocksStore.put({ ...block, sectionId: sec.id });
                    });
                  }
                  const { blocks, ...sectionMeta } = sec;
                  sectionsStore.put({ ...sectionMeta, blockIds });
                });
              }
            }
          };
          // We intentionally do not delete 'appData' store here to avoid race conditions.
          // It will just be left as a legacy unused store.
        }
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      db.onversionchange = () => {
        db.close();
        alert("A new version of this application is ready. Please reload the page!");
      };
      dbInstance = db;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Load app state from IndexedDB (with fallback to LocalStorage migration)
 */
export async function loadAppData() {
  try {
    const db = await initDB();
    
    const data = await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SETTINGS, STORE_SECTIONS, STORE_BLOCKS], 'readonly');
      
      const settingsStore = tx.objectStore(STORE_SETTINGS);
      const sectionsStore = tx.objectStore(STORE_SECTIONS);
      const blocksStore = tx.objectStore(STORE_BLOCKS);

      const appData = {
        version: CURRENT_VERSION,
        sections: []
      };

      let pending = 4;
      const checkDone = () => {
        pending--;
        if (pending === 0) resolve(appData);
      };

      const reqEditMode = settingsStore.get('isEditMode');
      reqEditMode.onsuccess = () => { appData.isEditMode = reqEditMode.result !== undefined ? reqEditMode.result : true; checkDone(); };
      reqEditMode.onerror = reject;

      const reqActiveSec = settingsStore.get('activeSectionId');
      reqActiveSec.onsuccess = () => { appData.activeSectionId = reqActiveSec.result || null; checkDone(); };
      reqActiveSec.onerror = reject;

      const reqLastSaved = settingsStore.get('lastSaved');
      reqLastSaved.onsuccess = () => { appData.lastSaved = reqLastSaved.result || null; checkDone(); };
      reqLastSaved.onerror = reject;

      const sectionsReq = sectionsStore.getAll();
      sectionsReq.onsuccess = () => {
        const sections = sectionsReq.result || [];
        
        const blocksReq = blocksStore.getAll();
        blocksReq.onsuccess = () => {
          const blocks = blocksReq.result || [];
          const blocksById = {};
          blocks.forEach(b => blocksById[b.id] = b);
          
          sections.forEach(sec => {
            sec.blocks = (sec.blockIds || []).map(id => blocksById[id]).filter(Boolean);
            delete sec.blockIds; // Clean up before passing to React state
          });
          
          // Re-sort sections by createdAt descending to match UI behavior
          appData.sections = sections.sort((a, b) => b.createdAt - a.createdAt);
          checkDone();
        };
        blocksReq.onerror = reject;
      };
      sectionsReq.onerror = reject;
    });

    if (data && data.sections.length > 0) {
      // V2 loaded successfully
      return data;
    }

    // Fallback to localStorage migration
    let raw = localStorage.getItem(STORAGE_KEY);
    let usedLegacyKey = false;
    
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) usedLegacyKey = true;
    }

    if (raw) {
      let parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
        if (parsed.version !== CURRENT_VERSION || usedLegacyKey) {
          parsed = migrateData(parsed);
        }
        console.log('Migrating data from localStorage to IndexedDB V2...');
        await saveAppData(parsed);
        
        // Remove old data from localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return parsed;
      }
    }

    // Default empty state
    if (data && data.sections.length === 0 && data.activeSectionId === null && !raw) {
      return DEFAULT_DATA;
    }

    return data;
  } catch (err) {
    console.error('Failed to load data:', err);
    return DEFAULT_DATA;
  }
}

/**
 * Save app state to IndexedDB
 */
export async function saveAppData(data) {
  try {
    const db = await initDB();
    
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SETTINGS, STORE_SECTIONS, STORE_BLOCKS], 'readwrite');
      const settingsStore = tx.objectStore(STORE_SETTINGS);
      const sectionsStore = tx.objectStore(STORE_SECTIONS);
      const blocksStore = tx.objectStore(STORE_BLOCKS);
      
      settingsStore.put(data.isEditMode, 'isEditMode');
      settingsStore.put(data.activeSectionId, 'activeSectionId');
      settingsStore.put(data.lastSaved, 'lastSaved');
      settingsStore.put(CURRENT_VERSION, 'version');

      const currentSectionIds = new Set();
      const currentBlockIds = new Set();

      data.sections.forEach(sec => {
        currentSectionIds.add(sec.id);
        const blockIds = [];
        sec.blocks.forEach(block => {
          currentBlockIds.add(block.id);
          blockIds.push(block.id);
          blocksStore.put({ ...block, sectionId: sec.id });
        });
        const { blocks, ...sectionMeta } = sec;
        sectionsStore.put({ ...sectionMeta, blockIds });
      });

      // Cleanup orphaned sections (deleted by user)
      const reqSec = sectionsStore.getAllKeys();
      reqSec.onsuccess = () => {
        reqSec.result.forEach(id => {
          if (!currentSectionIds.has(id)) sectionsStore.delete(id);
        });
      };

      // Cleanup orphaned blocks (deleted by user)
      const reqBlk = blocksStore.getAllKeys();
      reqBlk.onsuccess = () => {
        reqBlk.result.forEach(id => {
          if (!currentBlockIds.has(id)) blocksStore.delete(id);
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    return true;
  } catch (err) {
    console.error('Failed to save data to IndexedDB:', err);
    return false;
  }
}

/**
 * Extract display text from any item format (string, {text}, {title})
 */
function itemToString(item) {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    return (item.text || item.title || '').trim();
  }
  return '';
}

/**
 * Convert content between text, list, tasks, and image formats.
 * List items use {id, text} objects for stable keys.
 * Task items use {id, title, completed} objects.
 */
export function convertContent(content, targetType) {
  // Extract plain string array from any input format
  const extractLines = (raw) => {
    if (Array.isArray(raw)) {
      return raw.map(itemToString).filter(Boolean);
    }
    if (typeof raw === 'string') {
      return raw.split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  if (targetType === 'text' || targetType === 'markdown') {
    return extractLines(content).join('\n');
  }

  if (targetType === 'list') {
    // Convert to {id, text} objects with stable IDs
    return extractLines(content).map((text, idx) => ({
      id: 'li-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000),
      text
    }));
  }

  if (targetType === 'tasks') {
    // Preserve existing task objects if already in correct format
    if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'object' && 'completed' in content[0]) {
      return content;
    }
    return extractLines(content).map((title, idx) => ({
      id: 'task-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000),
      title,
      completed: false
    }));
  }

  if (targetType === 'image') {
    if (typeof content === 'string') return content;
    return extractLines(content).join('\n');
  }

  return content;
}
