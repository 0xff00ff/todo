import { h } from 'preact';

export function SaveStatusIndicator({ saveStatus, lastSavedTime }) {
  return (
    <div className={`save-status-badge ${saveStatus}`} id="save-status-indicator">
      {saveStatus === 'saving' && (
        <>
          <span className="spinner" />
          <span>Сохранение...</span>
        </>
      )}

      {saveStatus === 'saved' && (
        <>
          <span className="icon-check">✓</span>
          <span>Сохранено {lastSavedTime ? `в ${lastSavedTime}` : ''}</span>
        </>
      )}

      {saveStatus === 'error' && (
        <>
          <span className="icon-error">⚠</span>
          <span>Ошибка сохранения</span>
        </>
      )}
    </div>
  );
}
