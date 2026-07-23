import { h } from 'preact';
import { ContentBlock } from './ContentBlock';

export function SectionDetail({ section, onUpdateSection, isEditMode }) {
  if (!section) {
    return (
      <div className="section-detail-empty">
        <p>Select a section on the left or create a new one.</p>
      </div>
    );
  }

  // Handle Title change
  const handleTitleChange = (e) => {
    onUpdateSection(section.id, { title: e.target.value });
  };

  const blocks = Array.isArray(section.blocks) ? section.blocks : [];

  // --- BLOCK HANDLERS ---
  const handleAddBlock = (type) => {
    const newBlock = {
      id: 'blk-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: type,
      content: ''
    };
    onUpdateSection(section.id, { blocks: [...blocks, newBlock] });
  };

  const handleUpdateBlock = (blockId, partialUpdate) => {
    const updatedBlocks = blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, ...partialUpdate };
      }
      return b;
    });
    onUpdateSection(section.id, { blocks: updatedBlocks });
  };

  const handleDeleteBlock = (blockId) => {
    const updatedBlocks = blocks.filter(b => b.id !== blockId);
    onUpdateSection(section.id, { blocks: updatedBlocks });
  };

  const handleMoveBlockUp = (blockId) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index <= 0) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    onUpdateSection(section.id, { blocks: newBlocks });
  };

  const handleMoveBlockDown = (blockId) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1 || index >= blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    onUpdateSection(section.id, { blocks: newBlocks });
  };

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

      {/* Blocks List */}
      <div className="blocks-list">
        {blocks.map((block, index) => (
          <ContentBlock
            key={block.id}
            block={block}
            isEditMode={isEditMode}
            onUpdate={handleUpdateBlock}
            onDelete={handleDeleteBlock}
            onMoveUp={handleMoveBlockUp}
            onMoveDown={handleMoveBlockDown}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          />
        ))}
        {blocks.length === 0 && !isEditMode && (
          <div className="empty-blocks-notice">This section has no content yet.</div>
        )}
      </div>

      {/* Add Block Bar (Edit Mode Only) */}
      {isEditMode && (
        <div className="add-block-bar">
          <span className="selector-label">Add Block:</span>
          <div className="tab-group">
            <button className="tab-btn" onClick={() => handleAddBlock('text')}>📝 Text</button>
            <button className="tab-btn" onClick={() => handleAddBlock('list')}>☑ List</button>
            <button className="tab-btn" onClick={() => handleAddBlock('tasks')}>☑️ Tasks</button>
            <button className="tab-btn" onClick={() => handleAddBlock('image')}>🖼 Image</button>
          </div>
        </div>
      )}
    </div>
  );
}
