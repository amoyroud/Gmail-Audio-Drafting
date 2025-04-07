import { useEffect, useState } from 'react';

export interface EmailTemplate {
  id: string;
  name: string;
  content: string;
  type: 'decline' | 'general';
}

export interface UserSettings {
  emailPromptTemplate: string;
  signature: string;
  templates: EmailTemplate[];
}

const DEFAULT_SETTINGS: UserSettings = {
  emailPromptTemplate: `You are an AI assistant supporting a venture investor helping to draft an email response.

Context:
- Email subject: "{emailSubject}"
- Sender name: {senderName}
- Original email body: "{emailBody}"
- My transcribed voice notes about how to respond: "{transcribedText}"

Task: Write a professional and friendly email response that:
1. Incorporates the key points from my transcribed voice notes
2. Maintains a friendly, empathetic tone that is short and to the point, not verbose
3. Sign with {signature}

Write the complete email response:`,
  signature: 'Antoine',
  templates: [
    {
      id: 'decline-busy',
      name: 'Decline - Busy',
      content: 'Thank you for your email regarding [Meeting Request].\n\nUnfortunately, I need to decline at this time due to prior commitments. I appreciate your understanding.\n\nBest regards,\n{signature}',
      type: 'decline'
    },
    {
      id: 'decline-not-interested',
      name: 'Decline - Not Interested',
      content: 'Thank you for reaching out about [Topic].\n\nAfter careful consideration, I must decline as this does not align with my current priorities.\n\nBest regards,\n{signature}',
      type: 'decline'
    }
  ]
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
