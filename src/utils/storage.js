const STORAGE_KEY = 'todo_manager_app_data_v1';

// Default initial data for first-time visitors (empty state)
const DEFAULT_DATA = {
  activeSectionId: null,
  sections: [],
  lastSaved: null
};

/**
 * Load app state from LocalStorage
 */
export function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sections)) {
      return DEFAULT_DATA;
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
    const payload = JSON.stringify(data);
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
      id: 'li-' + Date.now() + '-' + idx,
      text
    }));
  }

  if (targetType === 'tasks') {
    // Preserve existing task objects if already in correct format
    if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'object' && 'completed' in content[0]) {
      return content;
    }
    return extractLines(content).map((title, idx) => ({
      id: 'task-' + Date.now() + '-' + idx,
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
