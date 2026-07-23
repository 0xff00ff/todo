const STORAGE_KEY = 'todo_manager_app_data_v1';

// Default initial data for first-time visitors
const DEFAULT_DATA = {
  activeSectionId: 'sec-1',
  sections: [
    {
      id: 'sec-1',
      title: 'План работы на неделю',
      contentType: 'tasks',
      content: [
        { id: 't-1', title: 'Разработать прототип приложения', completed: true },
        { id: 't-2', title: 'Настроить автоматическое сохранение в LocalStorage', completed: true },
        { id: 't-3', title: 'Проверить взаимную конвертацию между типами', completed: false },
        { id: 't-4', title: 'Оптимизировать производительность интерфейса', completed: false }
      ],
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000
    },
    {
      id: 'sec-2',
      title: 'Заметки и идеи',
      contentType: 'text',
      content: 'Идея для проекта: Создать простой и быстрый менеджер задач без лишних элементов.\nОсобый акцент сделать на быстродействие и мгновенное сохранение.\nПоддерживать текстовый режим, списки, задачи и картинки.',
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000
    }
  ],
  lastSaved: Date.now()
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
