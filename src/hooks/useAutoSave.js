import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { saveAppData } from '../utils/storage';

export function useAutoSave(data, delay = 1500, tabId = 'unknown', skipNextSaveRef = null) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    return data.lastSaved ? formatTimestamp(data.lastSaved) : '';
  });

  const isFirstRender = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  const syncChannel = useMemo(() => new BroadcastChannel('todo_manager_sync'), []);

  // Fix #6: Only trigger save when actual persisted content changes,
  // not when activeSectionId changes (which is a UI-only concern)
  const saveTriggerSnapshot = useMemo(() => {
    return JSON.stringify({
      sections: data.sections,
      isEditMode: data.isEditMode
    });
  }, [data.sections, data.isEditMode]);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip auto-save if this state change came from a cross-tab sync
    if (skipNextSaveRef && skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setSaveStatus('saving');

    const timer = setTimeout(async () => {
      const now = Date.now();
      const updatedData = { ...dataRef.current, lastSaved: now };
      const success = await saveAppData(updatedData);

      if (success) {
        setSaveStatus('saved');
        setLastSavedTime(formatTimestamp(now));
        syncChannel.postMessage({ type: 'DATA_UPDATED', timestamp: now, sender: tabId });
      } else {
        setSaveStatus('error');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [saveTriggerSnapshot, delay, syncChannel, tabId]);

  return { saveStatus, lastSavedTime };
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
