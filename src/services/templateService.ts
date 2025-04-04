import { EmailTemplate } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const TEMPLATES_STORAGE_KEY = 'email_templates';

/**
 * Get all templates from storage
 * @returns Array of email templates
 */
export const getAllTemplates = (): EmailTemplate[] => {
  try {
    const templatesJson = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!templatesJson) {
      return getDefaultTemplates();
    }
    return JSON.parse(templatesJson);
  } catch (error) {
    console.error('Error getting templates:', error);
    return getDefaultTemplates();
  }
};

/**
 * Get templates by type
 * @param type Template type to filter by
 * @returns Filtered templates
 */
export const getTemplatesByType = (type: 'decline' | 'general'): EmailTemplate[] => {
  const templates = getAllTemplates();
  return templates.filter(template => template.type === type);
};

/**
 * Get a template by ID
 * @param id Template ID
 * @returns Template or null if not found
 */
export const getTemplateById = (id: string): EmailTemplate | null => {
  const templates = getAllTemplates();
  const template = templates.find(template => template.id === id);
  return template || null;
};

/**
 * Create a new template
 * @param template Template data (ID will be generated)
 * @returns The created template with ID
 */
export const createTemplate = (template: Omit<EmailTemplate, 'id'>): EmailTemplate => {
  const templates = getAllTemplates();
  
  const newTemplate: EmailTemplate = {
    id: uuidv4(),
    ...template,
    lastUsed: new Date().toISOString()
  };
  
  const updatedTemplates = [...templates, newTemplate];
  saveTemplates(updatedTemplates);
  
  return newTemplate;
};

/**
 * Update an existing template
 * @param template Template with ID to update
 * @returns Updated template or null if not found
 */
export const updateTemplate = (template: EmailTemplate): EmailTemplate | null => {
  const templates = getAllTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedTemplate = {
    ...template,
    lastUsed: new Date().toISOString()
  };
  
  templates[index] = updatedTemplate;
  saveTemplates(templates);
  
  return updatedTemplate;
};

/**
 * Delete a template by ID
 * @param id Template ID to delete
 * @returns True if deletion was successful
 */
export const deleteTemplate = (id: string): boolean => {
  const templates = getAllTemplates();
  const filteredTemplates = templates.filter(template => template.id !== id);
  
  if (filteredTemplates.length === templates.length) {
    return false;
  }
  
  saveTemplates(filteredTemplates);
  return true;
};

/**
 * Update the lastUsed timestamp for a template
 * @param id Template ID
 */
export const updateTemplateUsage = (id: string): void => {
  const templates = getAllTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index !== -1) {
    templates[index].lastUsed = new Date().toISOString();
    saveTemplates(templates);
  }
};

/**
 * Save templates to local storage
 * @param templates Templates to save
 */
const saveTemplates = (templates: EmailTemplate[]): void => {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
};

/**
 * Get default templates
 * @returns Array of default templates
 */
const getDefaultTemplates = (): EmailTemplate[] => {
  return [
    {
      id: uuidv4(),
      name: 'Polite Decline',
      subject: 'Re: {subject}',
      body: `Dear {sender},\n\nThank you for your email regarding {subject}.\n\nUnfortunately, I need to decline at this time due to prior commitments. I appreciate your understanding.\n\nBest regards,\n{name}`,
      type: 'decline',
      lastUsed: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Schedule Meeting',
      subject: 'Re: {subject}',
      body: `Hi {sender},\n\nI'd like to schedule a meeting to discuss this further. Would you be available any of these times:\n\n- Monday between 10am-12pm\n- Tuesday between 2pm-4pm\n- Wednesday between 9am-11am\n\nPlease let me know which works best for you.\n\nBest,\n{name}`,
      type: 'general',
      lastUsed: new Date().toISOString()
    }
  ];
};
