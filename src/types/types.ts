export interface EmailSender {
  name: string;
  email: string;
}

export interface Email {
  id: string;
  subject: string;
  from: EmailSender;
  date: string;
  body: string;
  snippet: string;
  unread: boolean;
}

export interface DraftEmail {
  to: string;
  subject: string;
  body: string;
}

export interface DraftGenerationParams {
  transcribedText: string;
  emailSubject: string;
  emailBody: string;
  senderName: string;
}

export interface TodoTask {
  id: string;
  emailId: string;
  subject: string;
  snippet: string;
  from: EmailSender;
  date: string;
  completed: boolean;
  createdAt: string;
}

export type EmailActionType = 
  | 'speech-to-text'      // Direct speech to text without AI
  | 'ai-draft'            // Current AI drafting functionality
  | 'quick-decline'       // Use template to decline
  | 'move-to-read'        // Move to "To Read" label
  | 'archive'             // Archive the email
  | 'task';               // Convert email to task

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'decline' | 'general';
  lastUsed?: string;
}

export interface EmailAction {
  type: EmailActionType;
  email: Email;
  template?: EmailTemplate;
  transcription?: string;
  draft?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}