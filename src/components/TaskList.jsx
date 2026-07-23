import { h } from 'preact';
import { useState } from 'preact/hooks';

export function TaskList({
  tasks,
  activeSectionId,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

  const sectionTasks = tasks.filter(task => task.sectionId === activeSectionId);
  const completedCount = sectionTasks.filter(t => t.completed).length;
  const totalCount = sectionTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = sectionTasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(activeSectionId, newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="task-list-section" id="task-list-section">
      <div className="task-list-header">
        <div className="task-header-title">
          <h3>Задачи раздела</h3>
          <span className="task-counter">
            {completedCount} из {totalCount} выполнено
          </span>
        </div>

        <div className="task-filter-tabs">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            id="filter-task-all"
          >
            Все ({totalCount})
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
            id="filter-task-active"
          >
            Активные ({totalCount - completedCount})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
            id="filter-task-completed"
          >
            Готовые ({completedCount})
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="task-progress-track">
        <div
          className="task-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* New Task Input */}
      <div className="task-input-row">
        <input
          type="text"
          value={newTaskTitle}
          onInput={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Новая задача для этого раздела..."
          className="task-add-input"
          id="task-add-input"
        />
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          id="btn-add-task"
        >
          + Добавить задачу
        </button>
      </div>

      {/* Tasks List */}
      <div className="task-items-container" id="task-items-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-tasks-notice">
            {totalCount === 0
              ? 'В этом разделе пока нет задач. Создайте первую!'
              : 'Задачи не найдены'}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-card ${task.completed ? 'completed' : ''}`}
              id={`task-card-${task.id}`}
            >
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  id={`checkbox-task-${task.id}`}
                />
                <span className="checkmark" />
              </label>

              <input
                type="text"
                value={task.title}
                onInput={(e) => onEditTask(task.id, e.target.value)}
                className="task-title-input"
                id={`task-title-input-${task.id}`}
              />

              <button
                className="btn-icon btn-delete-task"
                onClick={() => onDeleteTask(task.id)}
                title="Удалить задачу"
                id={`delete-task-btn-${task.id}`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
