import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '../types';

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'deskpad_settings';

// Helper to convert snake_case object to camelCase typed settings
function parseDbSettings(dbSettings: Record<string, string>): Partial<UserSettings> {
  const parsed: Partial<UserSettings> = {};
  
  const booleanKeys = ['showWeekNumbers', 'showSecondsHand'];
  const numberKeys = ['weekStartsOn'];

  for (const [dbKey, val] of Object.entries(dbSettings)) {
    // convert dbKey from snake_case to camelCase
    const key = dbKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof UserSettings;
    
    if (booleanKeys.includes(key)) {
      (parsed as any)[key] = val === 'true';
    } else if (numberKeys.includes(key)) {
      const parsedNum = parseInt(val, 10);
      (parsed as any)[key] = isNaN(parsedNum) ? 0 : parsedNum;
    } else {
      (parsed as any)[key] = val;
    }
  }
  return parsed;
}

// Helper to convert single key/value to snake_case db payload
function formatDbSetting(key: keyof UserSettings, value: any): Record<string, string> {
  const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return { [dbKey]: String(value) };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse local storage settings', e);
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  // Load from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        
        if (data && data.settings) {
          const parsed = parseDbSettings(data.settings);
          setSettings((prev) => {
            const merged = { ...prev, ...parsed };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not load settings from backend, falling back to local storage', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    // 1. Update local state immediately (optimistic UI update)
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // 2. Sync to backend
    try {
      const payload = { settings: formatDbSetting(key, value) };
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update setting on backend');
      }
    } catch (err) {
      console.error('Backend sync failed', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
