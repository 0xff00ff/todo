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
 * Convert content between text, list, tasks, and image formats
 */
export function convertContent(content, targetType) {
  // Extract items as string array from any input format
  const extractLines = (raw) => {
    if (Array.isArray(raw)) {
      return raw.map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && item.title) return item.title.trim();
        return '';
      }).filter(Boolean);
    }
    if (typeof raw === 'string') {
      return raw.split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  if (targetType === 'text') {
    const lines = extractLines(content);
    return lines.join('\n');
  }

  if (targetType === 'list') {
    return extractLines(content);
  }

  if (targetType === 'tasks') {
    if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'object' && 'completed' in content[0]) {
      return content;
    }
    const lines = extractLines(content);
    return lines.map((title, idx) => ({
      id: 'task-' + Date.now() + '-' + idx,
      title,
      completed: false
    }));
  }

  if (targetType === 'image') {
    if (typeof content === 'string') return content;
    const lines = extractLines(content);
    return lines.join('\n');
  }

  return content;
}
