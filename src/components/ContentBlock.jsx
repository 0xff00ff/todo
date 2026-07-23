import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import { convertContent } from '../utils/storage';

export function ContentBlock({
  block,
  isEditMode,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) {
  const [newItemText, setNewItemText] = useState('');
  const [imageError, setImageError] = useState(false);

  // Use persisted task filter or default to 'all'
  const taskFilter = block.taskFilter || 'all';

  // Handle Content Type switch (with auto-conversion)
  const handleTypeChange = (newType) => {
    if (newType === block.type) return;
    const convertedContent = convertContent(block.content, newType);
    onUpdate(block.id, { type: newType, content: convertedContent });
    setNewItemText('');
  };

  // --- TEXT MODE HANDLERS ---
  const handleTextChange = (e) => {
    onUpdate(block.id, { content: e.target.value });
  };

  // --- LIST MODE HANDLERS ---
  const handleAddListItem = () => {
    if (!newItemText.trim()) return;
    const currentList = Array.isArray(block.content) ? block.content : [];
    const newItem = { id: 'li-' + Date.now() + '-' + Math.floor(Math.random()*1000), text: newItemText.trim() };
    onUpdate(block.id, { content: [...currentList, newItem] });
    setNewItemText('');
  };

  const handleListItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddListItem();
    }
  };

  const handleEditListItem = (itemId, value) => {
    const currentList = Array.isArray(block.content) ? block.content : [];
    const updatedList = currentList.map(item => {
      if (item.id === itemId) return { ...item, text: value };
      return item;
    });
    onUpdate(block.id, { content: updatedList });
  };

  const handleRemoveListItem = (itemId) => {
    const currentList = Array.isArray(block.content) ? block.content : [];
    onUpdate(block.id, { content: currentList.filter(item => item.id !== itemId) });
  };

  // --- TASKS MODE HANDLERS ---
  const handleAddTask = () => {
    if (!newItemText.trim()) return;
    const currentTasks = Array.isArray(block.content) ? block.content : [];
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.floor(Math.random()*1000),
      title: newItemText.trim(),
      completed: false
    };
    onUpdate(block.id, { content: [...currentTasks, newTask] });
    setNewItemText('');
  };

  const handleTaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleToggleTask = (taskId) => {
    const currentTasks = Array.isArray(block.content) ? block.content : [];
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) return { ...t, completed: !t.completed };
      return t;
    });
    onUpdate(block.id, { content: updatedTasks });
  };

  const handleEditTaskTitle = (taskId, newTitle) => {
    const currentTasks = Array.isArray(block.content) ? block.content : [];
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) return { ...t, title: newTitle };
      return t;
    });
    onUpdate(block.id, { content: updatedTasks });
  };

  const handleRemoveTask = (taskId) => {
    const currentTasks = Array.isArray(block.content) ? block.content : [];
    onUpdate(block.id, { content: currentTasks.filter(t => t.id !== taskId) });
  };

  // --- IMAGE MODE HANDLERS ---
  const handleImageUrlChange = (e) => {
    setImageError(false);
    onUpdate(block.id, { content: e.target.value });
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
      onUpdate(block.id, { content: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageError(false);
          onUpdate(block.id, { content: event.target.result });
        };
        reader.readAsDataURL(file);
        e.preventDefault(); // Prevent text paste if we handled an image
        return;
      }
    }
  };

  // --- HELPERS & MEMOS ---
  const taskStats = useMemo(() => {
    if (block.type !== 'tasks' || !Array.isArray(block.content)) {
      return { total: 0, completed: 0, percent: 0 };
    }
    const total = block.content.length;
    const completed = block.content.filter(t => t.completed).length;
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [block.type, block.content]);

  const filteredTasks = useMemo(() => {
    if (block.type !== 'tasks' || !Array.isArray(block.content)) return [];
    if (taskFilter === 'active') return block.content.filter(t => !t.completed);
    if (taskFilter === 'completed') return block.content.filter(t => t.completed);
    return block.content;
  }, [block.type, block.content, taskFilter]);

  const listItems = block.type === 'list' && Array.isArray(block.content) ? block.content : [];
  
  const getItemText = (item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return item.text || item.title || '';
    return '';
  };

  const hasImageContent = block.type === 'image' && typeof block.content === 'string' && block.content.trim();

  return (
    <div className="content-block">
      {/* Block Controls (Edit Mode Only) */}
      {isEditMode && (
        <div className="block-controls-bar">
          <div className="block-type-selector">
            <span className="selector-label">Type:</span>
            <div className="tab-group small-tabs">
              <button
                className={`tab-btn ${block.type === 'text' ? 'active' : ''}`}
                onClick={() => handleTypeChange('text')}
              >
                📝 Text
              </button>
              <button
                className={`tab-btn ${block.type === 'list' ? 'active' : ''}`}
                onClick={() => handleTypeChange('list')}
              >
                ☑ List
              </button>
              <button
                className={`tab-btn ${block.type === 'tasks' ? 'active' : ''}`}
                onClick={() => handleTypeChange('tasks')}
              >
                ☑️ Tasks
              </button>
              <button
                className={`tab-btn ${block.type === 'image' ? 'active' : ''}`}
                onClick={() => handleTypeChange('image')}
              >
                🖼 Image
              </button>
            </div>
          </div>
          <div className="block-actions">
            <button
              className="btn-icon"
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              title="Move block up"
            >
              ↑
            </button>
            <button
              className="btn-icon"
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              title="Move block down"
            >
              ↓
            </button>
            <button
              className="btn-icon text-danger"
              onClick={() => onDelete(block.id)}
              title="Delete block"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Block Body */}
      <div className="block-body">
        {/* TEXT MODE */}
        {block.type === 'text' && (
          <div className="editor-mode-text">
            {isEditMode ? (
              <textarea
                value={typeof block.content === 'string' ? block.content : ''}
                onInput={handleTextChange}
                placeholder="Enter text here..."
                className="content-textarea"
                rows={6}
              />
            ) : (
              <div className="content-text-view">
                {typeof block.content === 'string' && block.content.trim() ? (
                  block.content
                ) : (
                  <span className="empty-text-placeholder">Empty text block.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* LIST MODE */}
        {block.type === 'list' && (
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
                />
                <button className="btn btn-secondary" onClick={handleAddListItem}>
                  + Add
                </button>
              </div>
            )}
            <ul className="content-list-items">
              {listItems.length === 0 ? (
                <li className="empty-list-notice">List is empty.</li>
              ) : (
                listItems.map((item) => {
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
                        />
                      ) : (
                        <span className="list-item-text">{itemText}</span>
                      )}
                      {isEditMode && (
                        <button
                          className="btn-icon btn-remove-item"
                          onClick={() => handleRemoveListItem(item.id)}
                          title="Delete item"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {/* TASKS MODE */}
        {block.type === 'tasks' && (
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
                  onClick={() => onUpdate(block.id, { taskFilter: 'all' })}
                >
                  All ({taskStats.total})
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'active' ? 'active' : ''}`}
                  onClick={() => onUpdate(block.id, { taskFilter: 'active' })}
                >
                  Active ({taskStats.total - taskStats.completed})
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => onUpdate(block.id, { taskFilter: 'completed' })}
                >
                  Completed ({taskStats.completed})
                </button>
              </div>
            </div>
            
            <div className="task-progress-track" style={{ margin: '12px 0' }}>
              <div className="task-progress-fill" style={{ width: `${taskStats.percent}%` }} />
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
                />
                <button className="btn btn-primary" onClick={handleAddTask}>
                  + Add
                </button>
              </div>
            )}

            <div className="task-items-container">
              {filteredTasks.length === 0 ? (
                <div className="empty-tasks-notice">
                  {taskStats.total === 0 ? 'Task list is empty.' : 'No tasks found'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                      />
                      <span className="checkmark" />
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={task.title}
                        onInput={(e) => handleEditTaskTitle(task.id, e.target.value)}
                        className="task-title-input"
                      />
                    ) : (
                      <span className="task-title-text">{task.title}</span>
                    )}
                    {isEditMode && (
                      <button
                        className="btn-icon btn-delete-task"
                        onClick={() => handleRemoveTask(task.id)}
                        title="Delete task"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* IMAGE MODE */}
        {block.type === 'image' && (
          <div className="editor-mode-image">
            {isEditMode && (
              <div className="image-input-group" onPaste={handleImagePaste}>
                <input
                  type="text"
                  value={typeof block.content === 'string' ? block.content : ''}
                  onInput={handleImageUrlChange}
                  placeholder="Paste URL or Ctrl+V image here"
                  className="image-url-input"
                />
                <label className="btn btn-secondary file-upload-label">
                  📁 Upload File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
            <div className="image-preview-wrapper">
              {hasImageContent && !imageError && (
                <img
                  src={block.content}
                  alt="Block Image"
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
