import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import { loadAppData } from './utils/storage';
import { useAutoSave } from './hooks/useAutoSave';
import { Sidebar } from './components/Sidebar';
import { SectionDetail } from './components/SectionDetail';
import { SaveStatusIndicator } from './components/SaveStatusIndicator';

export function App() {
  const [appData, setAppData] = useState(() => loadAppData());
  const isEditMode = appData.isEditMode;

  const setIsEditMode = (newValue) => {
    setAppData(prev => ({ ...prev, isEditMode: newValue }));
  };

  const { saveStatus, lastSavedTime } = useAutoSave(appData, 1500);

  const activeSection = useMemo(() => {
    return appData.sections.find(s => s.id === appData.activeSectionId) || appData.sections[0] || null;
  }, [appData.sections, appData.activeSectionId]);

  const activeSectionId = activeSection ? activeSection.id : null;

  // Handler: Select Section
  const handleSelectSection = (id) => {
    setAppData(prev => ({
      ...prev,
      activeSectionId: id
    }));
  };

  // Handler: Create Section
  const handleCreateSection = () => {
    const newId = 'sec-' + Date.now();
    const newSection = {
      id: newId,
      title: 'New Section',
      blocks: [
        {
          id: 'blk-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          type: 'text',
          content: ''
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setAppData(prev => ({
      ...prev,
      sections: [newSection, ...prev.sections],
      activeSectionId: newId
    }));
  };

  // Handler: Update Section
  const handleUpdateSection = (id, fields) => {
    setAppData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id === id) {
          return { ...sec, ...fields, updatedAt: Date.now() };
        }
        return sec;
      })
    }));
  };

  // Handler: Delete Section
  const handleDeleteSection = (id) => {
    setAppData(prev => {
      const updatedSections = prev.sections.filter(sec => sec.id !== id);
      let nextActiveId = prev.activeSectionId;

      if (prev.activeSectionId === id) {
        nextActiveId = updatedSections.length > 0 ? updatedSections[0].id : null;
      }

      return {
        ...prev,
        sections: updatedSections,
        activeSectionId: nextActiveId
      };
    });
  };

  return (
    <div className="app-container" id="app-container">
      {/* Left Sidebar */}
      <Sidebar
        sections={appData.sections}
        activeSectionId={activeSectionId}
        onSelectSection={handleSelectSection}
        onCreateSection={handleCreateSection}
        onDeleteSection={handleDeleteSection}
        isEditMode={isEditMode}
      />

      {/* Right Content Panel */}
      <main className="main-content" id="main-content">
        {/* Top Header Bar with Mode Toggle & Save Indicator */}
        <header className="top-mode-bar" id="top-mode-bar">
          <div className="mode-toggle-group">
            <button
              className={`mode-btn ${isEditMode ? 'active' : ''}`}
              onClick={() => setIsEditMode(true)}
              id="mode-edit-btn"
            >
              ✏️ Edit Mode
            </button>
            <button
              className={`mode-btn ${!isEditMode ? 'active' : ''}`}
              onClick={() => setIsEditMode(false)}
              id="mode-work-btn"
            >
              👁️ Work Mode
            </button>
          </div>

          {/* Top Save Status Indicator */}
          <SaveStatusIndicator
            saveStatus={saveStatus}
            lastSavedTime={lastSavedTime}
          />
        </header>

        {activeSection ? (
          <div className="active-section-wrapper">
            <SectionDetail
              section={activeSection}
              onUpdateSection={handleUpdateSection}
              isEditMode={isEditMode}
            />
          </div>
        ) : (
          <div className="empty-workspace">
            <div className="empty-icon">📁</div>
            <h2>No Section Selected</h2>
            <p>Select an existing section on the left or create a new one to get started.</p>
            {isEditMode && (
              <button className="btn btn-primary" onClick={handleCreateSection}>
                + Create Section
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
