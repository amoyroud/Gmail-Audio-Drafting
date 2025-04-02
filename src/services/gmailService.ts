import axios from 'axios';
import { Email, DraftEmail } from '../types/types';

// Gmail API base URL
const API_BASE_URL = 'https://www.googleapis.com/gmail/v1';

// Mock data for development - will be replaced with actual API calls
const mockEmails: Email[] = [
  {
    id: 'email1',
    subject: 'Project Update - Q2 Roadmap',
    from: {
      name: 'John Smith',
      email: 'john.smith@example.com'
    },
    date: '2024-03-15T10:00:00Z',
    body: `Hi there,

I wanted to provide an update on our Q2 roadmap. We've made significant progress on the key initiatives we discussed last month. Here's a quick summary:

1. Mobile App Redesign - 75% complete, on track for May 15 release
2. API Integration - Completed ahead of schedule
3. Performance Optimization - Started last week, initial results are promising

Let me know if you have any questions or concerns about the timeline.

Best regards,
John`,
    snippet: 'I wanted to provide an update on our Q2 roadmap. We\'ve made significant progress...',
    unread: true
  },
  {
    id: 'email2',
    subject: 'Meeting Invitation: Strategy Planning',
    from: {
      name: 'Sarah Johnson',
      email: 'sarah.j@example.org'
    },
    date: '2024-03-14T15:30:00Z',
    body: `Hello,

I'd like to invite you to our quarterly strategy planning session next Friday at 10:00 AM EST. Please come prepared with your team's goals for Q3.

The meeting will be held in Conference Room A and will last approximately 2 hours. Remote participation is available through the usual video conferencing link.

Please confirm your attendance by Wednesday.

Regards,
Sarah Johnson
Director of Operations`,
    snippet: 'I\'d like to invite you to our quarterly strategy planning session next Friday...',
    unread: false
  },
  {
    id: 'email3',
    subject: 'Urgent: System Maintenance Tonight',
    from: {
      name: 'IT Department',
      email: 'it-noreply@example.com'
    },
    date: '2024-03-14T09:00:00Z',
    body: `NOTICE: PLANNED SYSTEM MAINTENANCE

Our team will be performing critical system updates tonight between 11:00 PM and 3:00 AM EST. During this time, the following services will be unavailable:

- Customer Portal
- Internal Knowledge Base
- Email System (intermittent outages only)

Please save any work in progress before 10:30 PM to avoid data loss. The maintenance is necessary to apply security patches and performance improvements.

If you have any concerns, please contact the IT help desk at ext. 4567.

Thank you for your understanding.

IT Department`,
    snippet: 'Our team will be performing critical system updates tonight between 11:00 PM and 3:00 AM EST...',
    unread: true
  }
];

/**
 * Fetch emails from Gmail
 * @param token Auth token
 * @returns List of emails
 */
export const fetchEmails = async (token: string): Promise<Email[]> => {
  // In a production environment, this would fetch emails from the Gmail API
  // For development, we return mock data
  
  // This function would normally look like this:
  /*
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        maxResults: 10,
        q: 'in:inbox',
      },
    });

    // Process and return the email data
    return processGmailResponse(response.data);
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
  */
  
  // Return mock data for now
  return Promise.resolve([...mockEmails]); // Remove setTimeout to prevent potential memory leaks
};

/**
 * Get a specific email by ID
 * @param token Auth token
 * @param emailId Email ID
 * @returns Email details
 */
export const getEmailById = async (token: string, emailId: string): Promise<Email> => {
  const email = mockEmails.find(e => e.id === emailId);
  if (email) {
    return Promise.resolve({...email});
  }
  return Promise.reject(new Error('Email not found'));
};

/**
 * Create a draft email in Gmail
 * @param token Auth token
 * @param draft Draft email details
 */
export const createDraft = async (token: string, draft: DraftEmail): Promise<void> => {
  // In a production environment, this would create a draft in Gmail
  // For development, we just log the draft data
  
  // This function would normally look like this:
  /*
  try {
    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      'Content-Transfer-Encoding: 7bit',
      `To: ${draft.to}`,
      `Subject: ${draft.subject}`,
      '',
      draft.body
    ].join('\n');

    const encodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await axios.post(`${API_BASE_URL}/users/me/drafts`, {
      message: {
        raw: encodedEmail
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
  */
  
  // Log the draft for development
  console.log('Draft created:', draft);
  
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000); // Simulate network delay
  });
}; 