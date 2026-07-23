import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import { convertContent } from '../utils/storage';

export function SectionDetail({ section, onUpdateSection, isEditMode }) {
  if (!section) {
    return (
      <div className="section-detail-empty">
        <p>Select a section on the left or create a new one.</p>
      </div>
    );
  }

  const [newItemText, setNewItemText] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [imageError, setImageError] = useState(false);

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
    // Fix #2: Reset input when switching content types
    setNewItemText('');
  };

  // --- TEXT MODE HANDLER ---
  const handleTextChange = (e) => {
    onUpdateSection(section.id, { content: e.target.value });
  };

  // --- LIST MODE HANDLERS ---
  const handleAddListItem = () => {
    if (!newItemText.trim()) return;
    const currentList = Array.isArray(section.content) ? section.content : [];
    const newItem = { id: 'li-' + Date.now(), text: newItemText.trim() };
    onUpdateSection(section.id, { content: [...currentList, newItem] });
    setNewItemText('');
  };

  const handleListItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddListItem();
    }
  };

  const handleEditListItem = (itemId, value) => {
    const currentList = Array.isArray(section.content) ? section.content : [];
    const updatedList = currentList.map(item => {
      if (item.id === itemId) return { ...item, text: value };
      return item;
    });
    onUpdateSection(section.id, { content: updatedList });
  };

  const handleRemoveListItem = (itemId) => {
    const currentList = Array.isArray(section.content) ? section.content : [];
    onUpdateSection(section.id, { content: currentList.filter(item => item.id !== itemId) });
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
    setImageError(false);
    onUpdateSection(section.id, { content: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageError(false);
      onUpdateSection(section.id, { content: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  // Fix #3: Gate task computations to only run for tasks content type
  const taskStats = useMemo(() => {
    if (section.contentType !== 'tasks' || !Array.isArray(section.content)) {
      return { total: 0, completed: 0, percent: 0 };
    }
    const total = section.content.length;
    const completed = section.content.filter(t => t.completed).length;
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [section.contentType, section.content]);

  const filteredTasks = useMemo(() => {
    if (section.contentType !== 'tasks' || !Array.isArray(section.content)) return [];
    if (taskFilter === 'active') return section.content.filter(t => !t.completed);
    if (taskFilter === 'completed') return section.content.filter(t => t.completed);
    return section.content;
  }, [section.contentType, section.content, taskFilter]);

  // List items helper (content is array of {id, text} objects)
  const listItems = section.contentType === 'list' && Array.isArray(section.content) ? section.content : [];

  // Helper to extract display text from list items (backward compat with plain strings)
  const getItemText = (item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return item.text || item.title || '';
    return '';
  };

  const hasImageContent = section.contentType === 'image' && typeof section.content === 'string' && section.content.trim();

  return (
    <div className="section-detail-container" id="section-detail-container">
      {/* Title Header */}
      <div className="section-title-wrapper">
        {isEditMode ? (
          <input
            type="text"
            value={section.title}
            onInput={handleTitleChange}
            placeholder="Section Title..."
            className="section-title-input"
            id="section-title-input"
          />
        ) : (
          <h2 className="section-title-heading">{section.title || 'Untitled'}</h2>
        )}
      </div>

      {/* Content Type Selector Tabs (Only in Edit Mode) */}
      {isEditMode && (
        <div className="content-type-selector">
          <span className="selector-label">Content Type:</span>
          <div className="tab-group">
            <button
              className={`tab-btn ${section.contentType === 'text' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('text')}
              id="tab-btn-text"
            >
              📝 Text
            </button>
            <button
              className={`tab-btn ${section.contentType === 'list' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('list')}
              id="tab-btn-list"
            >
              ☑ List
            </button>
            <button
              className={`tab-btn ${section.contentType === 'tasks' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('tasks')}
              id="tab-btn-tasks"
            >
              ☑️ Tasks
            </button>
            <button
              className={`tab-btn ${section.contentType === 'image' ? 'active' : ''}`}
              onClick={() => handleContentTypeChange('image')}
              id="tab-btn-image"
            >
              🖼 Image
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
                  placeholder="Enter section text here..."
                  className="content-textarea"
                  id="content-textarea"
                  rows={8}
                />
                <div className="conversion-hint">
                  💡 <span>Hint: Switching to "List" or "Tasks" will automatically split text by lines.</span>
                </div>
              </>
            ) : (
              <div className="content-text-view">
                {typeof section.content === 'string' && section.content.trim() ? (
                  section.content
                ) : (
                  <span className="empty-text-placeholder">No section text available.</span>
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
                  placeholder="Add item to list..."
                  className="list-add-input"
                  id="list-add-input"
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleAddListItem}
                  id="btn-add-list-item"
                >
                  + Add
                </button>
              </div>
            )}

            <ul className="content-list-items" id="content-list-items">
              {listItems.length === 0 ? (
                <li className="empty-list-notice">List is empty.</li>
              ) : (
                listItems.map((item) => {
                  // Fix #10: Use stable item ID as key
                  const itemId = item.id || item;
                  const itemText = getItemText(item);
                  return (
                    <li key={itemId} className="content-list-row">
                      <span className="list-bullet">•</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={itemText}
                          onInput={(e) => handleEditListItem(item.id, e.target.value)}
                          className="list-item-input"
                          id={`list-item-input-${itemId}`}
                        />
                      ) : (
                        <span className="list-item-text">{itemText}</span>
                      )}

                      {isEditMode && (
                        <button
                          className="btn-icon btn-remove-item"
                          onClick={() => handleRemoveListItem(item.id)}
                          title="Delete item"
                          id={`btn-remove-list-item-${itemId}`}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
            {isEditMode && (
              <div className="conversion-hint">
                💡 <span>Hint: Switching to "Text" will join all items with line breaks.</span>
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
                  {taskStats.completed} of {taskStats.total} completed
                </span>
              </div>

              <div className="task-filter-tabs">
                <button
                  className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('all')}
                  id="filter-task-all"
                >
                  All ({taskStats.total})
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('active')}
                  id="filter-task-active"
                >
                  Active ({taskStats.total - taskStats.completed})
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('completed')}
                  id="filter-task-completed"
                >
                  Completed ({taskStats.completed})
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="task-progress-track" style={{ margin: '12px 0' }}>
              <div
                className="task-progress-fill"
                style={{ width: `${taskStats.percent}%` }}
              />
            </div>

            {isEditMode && (
              <div className="list-add-row" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newItemText}
                  onInput={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleTaskKeyDown}
                  placeholder="New task..."
                  className="task-add-input"
                  id="task-add-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddTask}
                  id="btn-add-task"
                >
                  + Add
                </button>
              </div>
            )}

            <div className="task-items-container" id="task-items-container">
              {filteredTasks.length === 0 ? (
                <div className="empty-tasks-notice">
                  {taskStats.total === 0 ? 'Task list is empty.' : 'No tasks found'}
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
                        title="Delete task"
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
                💡 <span>Hint: Switching to "Text" or "List" preserves task titles.</span>
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
                  placeholder="Paste image URL (http://...)"
                  className="image-url-input"
                  id="image-url-input"
                />
                <label className="btn btn-secondary file-upload-label">
                  📁 Upload File
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

            {/* Fix #5: Use state-driven image loading instead of DOM manipulation */}
            <div className="image-preview-wrapper">
              {hasImageContent && !imageError && (
                <img
                  src={section.content}
                  alt={section.title || 'Section Image'}
                  className="section-preview-image"
                  onError={() => setImageError(true)}
                />
              )}
              {(!hasImageContent || imageError) && (
                <div className="image-error-fallback">
                  {imageError ? 'Failed to load image from URL' : 'No image selected'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
