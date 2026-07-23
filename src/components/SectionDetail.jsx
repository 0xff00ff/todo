import { h } from 'preact';
import { useState } from 'preact/hooks';
import { convertContent } from '../utils/storage';

export function SectionDetail({ section, onUpdateSection, isEditMode }) {
  if (!section) {
    return (
      <div className="section-detail-empty">
        <p>Выберите раздел слева или создайте новый.</p>
      </div>
    );
  }

  const [newItemText, setNewItemText] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'active' | 'completed'

  // Handle Title change
  const handleTitleChange = (e) => {
    onUpdateSection(section.id, { title: e.target.value });
  };

  // Handle Content Type switch (with auto-conversion)
  const handleContentTypeChange = (newType) => {
    if (newType === section.contentType) return;

    const convertedContent = convertContent(section.content, newType);
    onUpdateSection(section.id, {
      contentType: newType,
      content: convertedContent
    });
  };

  // --- TEXT MODE HANDLER ---
  const handleTextChange = (e) => {
    onUpdateSection(section.id, { content: e.target.value });
  };

  // --- LIST MODE HANDLERS ---
  const handleAddListItem = () => {
    if (!newItemText.trim()) return;
    const currentList = Array.isArray(section.content) ? section.content : [];
    const updatedList = [...currentList, newItemText.trim()];
    onUpdateSection(section.id, { content: updatedList });
    setNewItemText('');
  };

  const handleListItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddListItem();
    }
  };

  const handleEditListItem = (index, value) => {
    const currentList = Array.isArray(section.content) ? [...section.content] : [];
    currentList[index] = value;
    onUpdateSection(section.id, { content: currentList });
  };

  const handleRemoveListItem = (index) => {
    const currentList = Array.isArray(section.content) ? [...section.content] : [];
    currentList.splice(index, 1);
    onUpdateSection(section.id, { content: currentList });
  };

  // --- TASKS MODE HANDLERS ---
  const handleAddTask = () => {
    if (!newItemText.trim()) return;
    const currentTasks = Array.isArray(section.content) ? section.content : [];
    const newTask = {
      id: 'task-' + Date.now(),
      title: newItemText.trim(),
      completed: false
    };
    onUpdateSection(section.id, { content: [...currentTasks, newTask] });
    setNewItemText('');
  };

  const handleTaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleToggleTask = (taskId) => {
    const currentTasks = Array.isArray(section.content) ? section.content : [];
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) return { ...t, completed: !t.completed };
      return t;
    });
    onUpdateSection(section.id, { content: updatedTasks });
  };

  const handleEditTaskTitle = (taskId, newTitle) => {
    const currentTasks = Array.isArray(section.content) ? section.content : [];
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) return { ...t, title: newTitle };
      return t;
    });
    onUpdateSection(section.id, { content: updatedTasks });
  };

  const handleRemoveTask = (taskId) => {
    const currentTasks = Array.isArray(section.content) ? section.content : [];
    const updatedTasks = currentTasks.filter(t => t.id !== taskId);
    onUpdateSection(section.id, { content: updatedTasks });
  };

  // --- IMAGE MODE HANDLERS ---
  const handleImageUrlChange = (e) => {
    onUpdateSection(section.id, { content: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateSection(section.id, { content: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const listItems = Array.isArray(section.content) ? section.content : [];
  const tasksList = Array.isArray(section.content) ? section.content : [];
  const completedTasksCount = tasksList.filter(t => t.completed).length;
  const totalTasksCount = tasksList.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const filteredTasks = tasksList.filter(t => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="section-detail-container" id="section-detail-container">
      {/* Title Header */}
      <div className="section-title-wrapper">
        {isEditMode ? (
          <input
            type="text"
            value={section.title}
            onInput={handleTitleChange}
            placeholder="Заголовок раздела..."
            className="section-title-input"
            id="section-title-input"
          />
        ) : (
          <h2 className="section-title-heading">{section.title || 'Без названия'}</h2>
        )}
      </div>

      {/* Content Type Selector Tabs (Only in Edit Mode) */}
      {isEditMode && (
        <div className="content-type-selector">
          <span className="selector-label">Тип контента:</span>
          <div className="tab-group">
            <button
              className={`tab-btn ${section.contentType === 'text' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('text')}
              id="tab-btn-text"
            >
              📝 Текст
            </button>
            <button
              className={`tab-btn ${section.contentType === 'list' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('list')}
              id="tab-btn-list"
            >
              ☑ Список
            </button>
            <button
              className={`tab-btn ${section.contentType === 'tasks' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('tasks')}
              id="tab-btn-tasks"
            >
              ☑️ Задачи
            </button>
            <button
              className={`tab-btn ${section.contentType === 'image' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('image')}
              id="tab-btn-image"
            >
              🖼 Картинка
            </button>
          </div>
        </div>
      )}

      {/* Content Editor Body */}
      <div className="section-content-box">
        {/* TEXT MODE */}
        {section.contentType === 'text' && (
          <div className="editor-mode-text">
            {isEditMode ? (
              <>
                <textarea
                  value={typeof section.content === 'string' ? section.content : ''}
                  onInput={handleTextChange}
                  placeholder="Введите текст раздела здесь..."
                  className="content-textarea"
                  id="content-textarea"
                  rows={8}
                />
                <div className="conversion-hint">
                  💡 <span>Подсказка: переключение на "Список" или "Задачи" автоматически разбьет текст по строкам.</span>
                </div>
              </>
            ) : (
              <div className="content-text-view">
                {typeof section.content === 'string' && section.content.trim() ? (
                  section.content
                ) : (
                  <span className="empty-text-placeholder">Текст раздела отсутствует.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* LIST MODE */}
        {section.contentType === 'list' && (
          <div className="editor-mode-list">
            {isEditMode && (
              <div className="list-add-row">
                <input
                  type="text"
                  value={newItemText}
                  onInput={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleListItemKeyDown}
                  placeholder="Добавить пункт в список..."
                  className="list-add-input"
                  id="list-add-input"
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleAddListItem}
                  id="btn-add-list-item"
                >
                  + Добавить
                </button>
              </div>
            )}

            <ul className="content-list-items" id="content-list-items">
              {listItems.length === 0 ? (
                <li className="empty-list-notice">Список пуст.</li>
              ) : (
                listItems.map((item, idx) => (
                  <li key={idx} className="content-list-row">
                    <span className="list-bullet">•</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={typeof item === 'string' ? item : item.title || ''}
                        onInput={(e) => handleEditListItem(idx, e.target.value)}
                        className="list-item-input"
                        id={`list-item-input-${idx}`}
                      />
                    ) : (
                      <span className="list-item-text">
                        {typeof item === 'string' ? item : item.title || ''}
                      </span>
                    )}

                    {isEditMode && (
                      <button
                        className="btn-icon btn-remove-item"
                        onClick={() => handleRemoveListItem(idx)}
                        title="Удалить пункт"
                        id={`btn-remove-list-item-${idx}`}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
            {isEditMode && (
              <div className="conversion-hint">
                💡 <span>Подсказка: переключение на "Текст" объединит все пункты через перенос строки.</span>
              </div>
            )}
          </div>
        )}

        {/* TASKS MODE */}
        {section.contentType === 'tasks' && (
          <div className="editor-mode-tasks">
            <div className="task-list-header">
              <div className="task-header-title">
                <span className="task-counter">
                  {completedTasksCount} из {totalTasksCount} выполнено
                </span>
              </div>

              <div className="task-filter-tabs">
                <button
                  className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('all')}
                  id="filter-task-all"
                >
                  Все ({totalTasksCount})
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('active')}
                  id="filter-task-active"
                >
                  Активные ({totalTasksCount - completedTasksCount})
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('completed')}
                  id="filter-task-completed"
                >
                  Готовые ({completedTasksCount})
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="task-progress-track" style={{ margin: '12px 0' }}>
              <div
                className="task-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isEditMode && (
              <div className="list-add-row" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newItemText}
                  onInput={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleTaskKeyDown}
                  placeholder="Новая задача..."
                  className="task-add-input"
                  id="task-add-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddTask}
                  id="btn-add-task"
                >
                  + Добавить
                </button>
              </div>
            )}

            <div className="task-items-container" id="task-items-container">
              {filteredTasks.length === 0 ? (
                <div className="empty-tasks-notice">
                  {totalTasksCount === 0 ? 'Список задач пуст.' : 'Задачи не найдены'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-card ${task.completed ? 'completed' : ''}`}
                    id={`task-card-${task.id}`}
                  >
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        id={`checkbox-task-${task.id}`}
                      />
                      <span className="checkmark" />
                    </label>

                    {isEditMode ? (
                      <input
                        type="text"
                        value={task.title}
                        onInput={(e) => handleEditTaskTitle(task.id, e.target.value)}
                        className="task-title-input"
                        id={`task-title-input-${task.id}`}
                      />
                    ) : (
                      <span className="task-title-text">{task.title}</span>
                    )}

                    {isEditMode && (
                      <button
                        className="btn-icon btn-delete-task"
                        onClick={() => handleRemoveTask(task.id)}
                        title="Удалить задачу"
                        id={`delete-task-btn-${task.id}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            {isEditMode && (
              <div className="conversion-hint" style={{ marginTop: '12px' }}>
                💡 <span>Подсказка: при переключении на "Текст" или "Список" наименования задач сохраняются.</span>
              </div>
            )}
          </div>
        )}

        {/* IMAGE MODE */}
        {section.contentType === 'image' && (
          <div className="editor-mode-image">
            {isEditMode && (
              <div className="image-input-group">
                <input
                  type="text"
                  value={typeof section.content === 'string' ? section.content : ''}
                  onInput={handleImageUrlChange}
                  placeholder="Вставьте URL изображения (http://...)"
                  className="image-url-input"
                  id="image-url-input"
                />
                <label className="btn btn-secondary file-upload-label">
                  📁 Загрузить файл
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="image-file-input"
                  />
                </label>
              </div>
            )}

            <div className="image-preview-wrapper">
              {typeof section.content === 'string' && section.content.trim() ? (
                <img
                  src={section.content}
                  alt={section.title || 'Изображение раздела'}
                  className="section-preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    e.target.nextSibling.style.display = 'none';
                  }}
                />
              ) : null}
              <div className="image-error-fallback" style={{ display: !section.content ? 'block' : 'none' }}>
                {section.content ? 'Не удалось загрузить изображение по указанному URL' : 'Изображение не выбрано'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
