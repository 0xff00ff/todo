const STORAGE_KEY = 'todo_manager_app_data_v1';
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

/**
 * Load app state from LocalStorage
 */
export function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    
    let parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sections)) {
      return DEFAULT_DATA;
    }

    // Apply migrations if necessary
    if (parsed.version !== CURRENT_VERSION) {
      parsed = migrateData(parsed);
      saveAppData(parsed); // Immediately persist the migrated format
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load data from localStorage:', err);
    return DEFAULT_DATA;
  }
}

/**
 * Save app state to LocalStorage
 */
export function saveAppData(data) {
  try {
    // Ensure we always save with the current version
    const dataToSave = { ...data, version: CURRENT_VERSION };
    const payload = JSON.stringify(dataToSave);
    localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
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

  if (targetType === 'text') {
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
