import { useEffect, useState } from 'react';

export interface UserSettings {
  emailPromptTemplate: string;
  signature: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  emailPromptTemplate: `You are an AI assistant helping to draft an email response.

Context:
- Email subject: "{emailSubject}"
- Sender name: {senderName}
- Original email body: "{emailBody}"
- My transcribed voice notes about how to respond: "{transcribedText}"

Task: Write a professional and friendly email response that:
1. Addresses the sender appropriately
2. References the original email subject and content
3. Incorporates the key points from my transcribed voice notes
4. Maintains a friendly tone
5. Sign with {signature}

Write the complete email response:`,
  signature: 'Best regards'
};

// Store settings in localStorage
const SETTINGS_KEY = 'user_settings';

export const saveSettings = (settings: Partial<UserSettings>) => {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  return newSettings;
};

export const getSettings = (): UserSettings => {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (!savedSettings) {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const parsed = JSON.parse(savedSettings);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// React hook for settings
export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());

  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getSettings());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
  };

  return { settings, updateSettings };
};
