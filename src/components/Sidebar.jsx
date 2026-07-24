import { h } from 'preact';
import { useState } from 'preact/hooks';

export function Sidebar({
  sections,
  activeSectionId,
  onSelectSection,
  onCreateSection,
  onDeleteSection,
  onTogglePin,
  onToggleArchive,
  isEditMode
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filteredSections = sections
    .filter(sec => sec.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // 1. Pinned items at top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 2. Archived items at bottom
      if (a.isArchived && !b.isArchived) return 1;
      if (!a.isArchived && b.isArchived) return -1;
      return 0;
    });

  // Fix #9: Inline delete confirmation instead of native confirm()
  const handleDeleteClick = (e, sectionId) => {
    e.stopPropagation();
    if (confirmDeleteId === sectionId) {
      // Second click — actually delete
      onDeleteSection(sectionId);
      setConfirmDeleteId(null);
    } else {
      // First click — enter confirmation mode
      setConfirmDeleteId(sectionId);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmDeleteId((prev) => prev === sectionId ? null : prev), 3000);
    }
  };

  return (
    <aside className="sidebar" id="sidebar-container">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-icon">📋</span>
          <h2>Sections</h2>
        </div>
        {isEditMode && (
          <button
            className="btn btn-primary btn-add-section"
            onClick={onCreateSection}
            id="add-section-btn"
            title="Create new section"
          >
            <span>+</span> New Section
          </button>
        )}
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search sections..."
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          id="section-search-input"
        />
      </div>

      <div className="sections-list" id="sections-list">
        {filteredSections.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? 'No sections found' : 'No sections yet. Create your first one!'}
          </div>
        ) : (
          filteredSections.map(section => {
            const isActive = section.id === activeSectionId;
            const blocksCount = Array.isArray(section.blocks) ? section.blocks.length : 0;
            const isConfirming = confirmDeleteId === section.id;

            return (
              <div
                key={section.id}
                className={`section-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSection(section.id)}
                id={`section-item-${section.id}`}
              >
                <div className="section-item-main">
                  <span className="section-item-title">
                    {section.title || 'Untitled'}
                  </span>
                  <div className="section-item-meta">
                    <span className="type-badge badge-text">
                      {blocksCount} {blocksCount === 1 ? 'block' : 'blocks'}
                    </span>

                  </div>
                </div>

                {isEditMode && (
                  <div className="section-actions-group" style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className={`btn-icon btn-pin-section ${section.isPinned ? 'pinned' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(section.id);
                      }}
                      title={section.isPinned ? 'Unpin section' : 'Pin section to top'}
                    >
                      {section.isPinned ? '📌' : '📍'}
                    </button>
                    <button
                      className={`btn-icon btn-archive-section ${section.isArchived ? 'archived' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleArchive) onToggleArchive(section.id);
                      }}
                      title={section.isArchived ? 'Unarchive section' : 'Move to bottom (Anti-pin)'}
                    >
                      {section.isArchived ? '⬆️' : '⬇️'}
                    </button>
                    <button
                      className={`btn-icon btn-delete-section ${isConfirming ? 'confirming' : ''}`}
                      onClick={(e) => handleDeleteClick(e, section.id)}
                      title={isConfirming ? 'Click again to confirm' : 'Delete section'}
                    >
                      {isConfirming ? '⚠ Sure?' : '✕'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
