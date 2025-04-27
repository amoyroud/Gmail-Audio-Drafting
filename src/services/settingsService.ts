import { useEffect, useState, useCallback } from 'react';
import { generateNameVariations } from './mistralService'; // Import the generation function

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
  eaName?: string;
  eaEmail?: string;
  eaNameVariations?: Array<{ name: string; confidence: number }> | null;
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
3. Don't write anything with "Subject:" 

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
  ],
  eaName: '',
  eaEmail: '',
  eaNameVariations: null
};

// Store settings in localStorage
const SETTINGS_KEY = 'user_settings';

// Type guard to check if an object is UserSettings
function isUserSettings(obj: any): obj is UserSettings {
  return typeof obj === 'object' && obj !== null && 
         'emailPromptTemplate' in obj && 
         'signature' in obj && 
         'templates' in obj; // Basic check, add more fields if needed for robustness
}

export const saveSettings = (settings: Partial<UserSettings>): UserSettings => {
  console.log("Saving settings:", settings); // Log settings being saved
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...settings };
  
  // Ensure eaNameVariations is handled correctly if eaName is cleared
  if ('eaName' in settings && !settings.eaName) {
      console.log("EA name cleared, clearing variations as well.");
      newSettings.eaNameVariations = null;
  }
  
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  console.log("Settings saved to localStorage:", newSettings);
  return newSettings;
};

export const getSettings = (): UserSettings => {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (!savedSettings) {
    console.log("No saved settings found, returning default.");
    return DEFAULT_SETTINGS;
  }
  
  try {
    const parsed = JSON.parse(savedSettings);
    // Validate parsed settings structure before merging
    if (isUserSettings(parsed)) {
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        // Ensure eaNameVariations is null if eaName is empty, for consistency after load
        if (!merged.eaName) {
            merged.eaNameVariations = null;
        }
        // console.log("Loaded and merged settings:", merged); // Commented out the looping log
        return merged;
    } else {
        console.warn("Saved settings structure is invalid, returning default.");
        localStorage.removeItem(SETTINGS_KEY); // Clear invalid settings
        return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error("Error parsing saved settings, returning default:", error);
    localStorage.removeItem(SETTINGS_KEY); // Clear corrupted settings
    return DEFAULT_SETTINGS;
  }
};

// React hook for settings
export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the change is for our settings key
      if (event.key === SETTINGS_KEY) {
          console.log("Storage changed externally, reloading settings...");
          setSettings(getSettings());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Make updateSettings async to handle variation generation
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<void> => {
    console.log("useSettings.updateSettings called with:", newSettings);
    let settingsToSave = { ...newSettings };
    let variationsGenerated = false;

    // Check if eaName is being updated and is not empty
    if (newSettings.eaName && newSettings.eaName.trim() !== '') {
      console.log(`Attempting to generate variations for EA name: ${newSettings.eaName}`);
      try {
        const variations = await generateNameVariations(newSettings.eaName);
        console.log("Successfully generated variations:", variations);
        settingsToSave.eaNameVariations = variations; // Add variations to the settings being saved
        variationsGenerated = true;
      } catch (error) {
        console.error("Failed to generate name variations:", error);
        // Save settings but explicitly set variations to null on failure
        settingsToSave.eaNameVariations = null;
        // Rethrow the error so the UI can catch it
        throw new Error(`Failed to generate name variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (newSettings.hasOwnProperty('eaName') && newSettings.eaName?.trim() === '') {
        // If eaName is explicitly set to empty, ensure variations are cleared
        console.log("EA name is being cleared, ensuring variations are null.");
        settingsToSave.eaNameVariations = null;
    }

    // Save the potentially updated settings (with or without variations)
    const updated = saveSettings(settingsToSave);
    setSettings(updated); // Update the hook's state
    console.log("Settings updated in hook state.", updated);

  }, []); // No dependencies needed as it uses functions defined outside or passed in

  return { settings, updateSettings };
};
