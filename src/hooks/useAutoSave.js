import { useState, useEffect, useRef } from 'preact/hooks';
import { saveAppData } from '../utils/storage';

export function useAutoSave(data, delay = 1500) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    return data.lastSaved ? formatTimestamp(data.lastSaved) : formatTimestamp(Date.now());
  });

  const isFirstRender = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');

    const timer = setTimeout(() => {
      const now = Date.now();
      const updatedData = { ...dataRef.current, lastSaved: now };
      const success = saveAppData(updatedData);

      if (success) {
        setSaveStatus('saved');
        setLastSavedTime(formatTimestamp(now));
      } else {
        setSaveStatus('error');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [data, delay]);

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
