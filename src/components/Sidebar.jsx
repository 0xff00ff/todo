import { h } from 'preact';
import { useState } from 'preact/hooks';

export function Sidebar({
  sections,
  activeSectionId,
  onSelectSection,
  onCreateSection,
  onDeleteSection,
  isEditMode
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = sections.filter(sec =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="sidebar" id="sidebar-container">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-icon">📋</span>
          <h2>Разделы</h2>
        </div>
        {isEditMode && (
          <button
            className="btn btn-primary btn-add-section"
            onClick={onCreateSection}
            id="add-section-btn"
            title="Создать новый раздел"
          >
            <span>+</span> Новый раздел
          </button>
        )}
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Поиск разделов..."
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          id="section-search-input"
        />
      </div>

      <div className="sections-list" id="sections-list">
        {filteredSections.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? 'Разделы не найдены' : 'Нет разделов. Создайте первый!'}
          </div>
        ) : (
          filteredSections.map(section => {
            const isActive = section.id === activeSectionId;
            
            let typeBadge = 'Текст';
            let itemCountInfo = null;

            if (section.contentType === 'list' && Array.isArray(section.content)) {
              typeBadge = 'Список';
              itemCountInfo = `${section.content.length} эл.`;
            } else if (section.contentType === 'tasks' && Array.isArray(section.content)) {
              typeBadge = 'Задачи';
              const completed = section.content.filter(t => t.completed).length;
              itemCountInfo = `${completed}/${section.content.length}`;
            } else if (section.contentType === 'image') {
              typeBadge = 'Картинка';
            }

            return (
              <div
                key={section.id}
                className={`section-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSection(section.id)}
                id={`section-item-${section.id}`}
              >
                <div className="section-item-main">
                  <span className="section-item-title">
                    {section.title || 'Без названия'}
                  </span>
                  <div className="section-item-meta">
                    <span className={`type-badge badge-${section.contentType}`}>
                      {typeBadge}
                    </span>
                    {itemCountInfo && (
                      <span className="task-count-badge">
                        {itemCountInfo}
                      </span>
                    )}
                  </div>
                </div>

                {isEditMode && (
                  <button
                    className="btn-icon btn-delete-section"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить раздел "${section.title}"?`)) {
                        onDeleteSection(section.id);
                      }
                    }}
                    title="Удалить раздел"
                    id={`delete-section-btn-${section.id}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
