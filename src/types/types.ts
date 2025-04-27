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
  cc?: string[];
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
  | 'speech-to-text'
  | 'ai-draft'
  | 'quick-decline'
  | 'move-to-read'
  | 'archive';

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
  transcription?: string;
  enhance?: boolean;
  cc?: string[];
  template?: {
    id: string;
    name: string;
    body: string;
    subject: string;
    type: string;
  };
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}