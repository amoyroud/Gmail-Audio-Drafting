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