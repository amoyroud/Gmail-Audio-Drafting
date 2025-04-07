import { Email, DraftEmail } from '../types/types';

// Load Google Identity Services script
const loadGisScript = async (): Promise<void> => {
  if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
    return new Promise<void>((resolve) => {
      if (window.google?.accounts) {
        resolve();
      } else {
        const checkGis = setInterval(() => {
          if (window.google?.accounts) {
            clearInterval(checkGis);
            resolve();
          }
        }, 100);
      }
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const checkGis = setInterval(() => {
        if (window.google?.accounts) {
          clearInterval(checkGis);
          resolve();
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
};

// Gmail API configuration
// Use the full Gmail scope for complete access
const GMAIL_SCOPES = process.env.REACT_APP_GMAIL_API_SCOPE?.split(' ') || [
  'https://mail.google.com/'
];

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

declare global {
  interface Window {
    google: any;
    gapi: any;
    googleAuthInitialized: boolean;
    tokenClient: any;
  }
}

// Track initialization status
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Token storage keys
const TOKEN_STORAGE_KEY = 'gmail_auth_token';
const TOKEN_EXPIRY_KEY = 'gmail_auth_expiry';
const USER_EMAIL_KEY = 'gmail_user_email';

/**
 * Initialize the Gmail API client using Google Identity Services
 */
export const initGmailClient = async (): Promise<void> => {
  console.log('initGmailClient: Starting initialization');
  
  if (window.googleAuthInitialized) {
    console.log('initGmailClient: Already initialized');
    return;
  }
  
  if (isInitializing && initPromise) {
    console.log('initGmailClient: Already initializing');
    return initPromise;
  }
  
  // Check if we have a valid token before initializing
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (token && expiry && Date.now() < parseInt(expiry)) {
    console.log('initGmailClient: Found valid token');
  }
  
  isInitializing = true;
  initPromise = new Promise<void>(async (resolve, reject) => {
    try {
      if (!CLIENT_ID || !API_KEY) {
        throw new Error('Missing required environment variables');
      }

      // Load Google Identity Services
      await loadGisScript();

      // Load GAPI first
      await new Promise<void>((resolveGapi, rejectGapi) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          window.gapi.load('client', async () => {
            try {
              await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
              });
              resolveGapi();
            } catch (error) {
              rejectGapi(error);
            }
          });
        };
        script.onerror = () => rejectGapi(new Error('Failed to load GAPI script'));
        document.head.appendChild(script);
      });

      // Initialize the tokenClient
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: GMAIL_SCOPES.join(' '),
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Token error:', tokenResponse);
            reject(tokenResponse);
            return;
          }

          try {
            // Set the token
            window.gapi.client.setToken({
              access_token: tokenResponse.access_token
            });
            
            // Store token with expiration information
            const expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour
            const expiryTime = Date.now() + (expiresIn * 1000);
            
            localStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
            window.googleAuthInitialized = true;
            
            // Get and store user email
            try {
              const profile = await window.gapi.client.gmail.users.getProfile({ userId: 'me' });
              if (profile?.result?.emailAddress) {
                localStorage.setItem(USER_EMAIL_KEY, profile.result.emailAddress);
              }
            } catch (e) {
              console.error('Error fetching user profile:', e);
            }
            
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });

      // Request an access token
      window.tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Error in initGmailClient:', error);
      reject(error);
    }
  });

  try {
    await initPromise;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
};

/**
 * Sign in to Gmail
 */


export const signIn = async (): Promise<void> => {
  try {
    // Initialize client if not already done
    if (!window.googleAuthInitialized) {
      await initGmailClient();
    }

    // Get token client
    const tokenClient = window.tokenClient;
    if (!tokenClient) {
      throw new Error('Token client not initialized');
    }

    // Request token with redirect flow
    return new Promise<void>((resolve, reject) => {
      // Check if we have a stored token that's not expired
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      const now = Date.now();
      
      // Check if token exists and is not expired (with 5-minute buffer)
      if (storedToken && tokenExpiry && parseInt(tokenExpiry) > now + 300000) {
        try {
          window.gapi.client.setToken({ access_token: storedToken });
          window.googleAuthInitialized = true;
          window.dispatchEvent(new Event('gmail_authenticated'));
          resolve();
          return;
        } catch (error) {
          console.error('Error using stored token:', error);
          // Token has expired or is about to expire
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(TOKEN_EXPIRY_KEY);
          localStorage.removeItem(USER_EMAIL_KEY);
          // Set session expired flag before triggering sign out
          window.sessionStorage.setItem('sessionExpired', 'true');
          window.dispatchEvent(new Event('gmail_signed_out'));
        }
      } else if (storedToken && tokenExpiry) {
        console.log('Token expired, requesting new token');
        // Clear expired tokens
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      }

      tokenClient.callback = async (response: any) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }

        try {
          // Store the token with expiration (default Google OAuth tokens last 1 hour)
          const token = response.access_token;
          const expiresIn = response.expires_in || 3600; // Default to 1 hour if not specified
          const expiryTime = Date.now() + (expiresIn * 1000);
          
          window.gapi.client.setToken({ access_token: token });
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
          
          // Get and store user email for future reference
          try {
            const profile = await window.gapi.client.gmail.users.getProfile({ userId: 'me' });
            if (profile?.result?.emailAddress) {
              localStorage.setItem(USER_EMAIL_KEY, profile.result.emailAddress);
            }
          } catch (e) {
            console.error('Error fetching user profile:', e);
          }
          
          window.googleAuthInitialized = true;
          window.dispatchEvent(new Event('gmail_authenticated'));
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      // Request new token - don't prompt if we're just refreshing an expired token
      const promptMode = storedToken ? undefined : 'consent';
      tokenClient.requestAccessToken({ prompt: promptMode });
    });
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};
/**
 * Archive an email by removing it from the inbox
 * @param emailId The ID of the email to archive
 * @returns Object indicating success or failure
 */
export const archiveEmail = async (emailId: string): Promise<{success: boolean, data?: any}> => {
  try {
    await ensureAuthenticated();
    
    const response = await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      resource: {
        removeLabelIds: ['INBOX']
      }
    });
    
    return {
      success: true,
      data: response.result
    };
  } catch (error) {
    console.error('Error archiving email:', error);
    return {
      success: false,
      data: error
    };
  }
};

/**
 * Get all user's Gmail labels
 * @returns Array of label objects
 */
export const getLabels = async (): Promise<any[]> => {
  try {
    await ensureAuthenticated();
    
    const response = await window.gapi.client.gmail.users.labels.list({
      userId: 'me'
    });
    
    return response.result.labels || [];
  } catch (error) {
    console.error('Error fetching labels:', error);
    return [];
  }
};

/**
 * Get or create the To Read label
 * @returns Label ID of the To Read label
 */
export const getOrCreateToReadLabel = async (): Promise<string> => {
  try {
    await ensureAuthenticated();
    
    // First check if the label already exists
    const labels = await getLabels();
    const toReadLabel = labels.find(label => 
      label.name.toLowerCase() === 'to read' || 
      label.name.toLowerCase() === 'to-read'
    );
    
    if (toReadLabel) {
      console.log('Found existing To Read label:', toReadLabel.id);
      return toReadLabel.id;
    }
    
    // Create the label if it doesn't exist
    const response = await window.gapi.client.gmail.users.labels.create({
      userId: 'me',
      resource: {
        name: 'To Read',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
    
    console.log('Created new To Read label:', response.result.id);
    return response.result.id;
  } catch (error) {
    console.error('Error getting or creating To Read label:', error);
    throw error;
  }
};

/**
 * Modify labels for an email
 * @param emailId The ID of the email to modify
 * @param labelModification Object with addLabelIds and removeLabelIds arrays
 * @returns Object indicating success or failure
 */
export const modifyLabels = async (
  emailId: string, 
  labelModification: {addLabelIds: string[], removeLabelIds: string[]}
): Promise<{success: boolean, data?: any}> => {
  try {
    await ensureAuthenticated();
    
    const response = await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      resource: labelModification
    });
    
    return {
      success: true,
      data: response.result
    };
  } catch (error) {
    console.error('Error modifying email labels:', error);
    return {
      success: false,
      data: error
    };
  }
};

/**
 * Move an email to the To Read label
 * @param emailId The ID of the email to move
 * @returns Object indicating success or failure
 */
export const moveToRead = async (emailId: string): Promise<{success: boolean, data?: any}> => {
  try {
    await ensureAuthenticated();
    
    // First get or create the To Read label
    const toReadLabelId = await getOrCreateToReadLabel();
    
    // Now apply the label and remove from inbox
    const response = await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      resource: {
        addLabelIds: [toReadLabelId],
        removeLabelIds: ['INBOX']
      }
    });
    
    return {
      success: true,
      data: response.result
    };
  } catch (error) {
    console.error('Error moving email to To Read:', error);
    return {
      success: false,
      data: error
    };
  }
};

/**
 * Sign out and clear all tokens
 */
export const signOut = async (): Promise<void> => {
  try {
    // Clear token from gapi client
    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }

    // Clear stored tokens
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);

    // Dispatch sign out event
    window.dispatchEvent(new Event('gmail_signed_out'));

    // Clear initialization flags
    window.googleAuthInitialized = false;
    isInitializing = false;
    initPromise = null;

    // Redirect to Google logout page to ensure complete sign out
    window.location.href = 'https://accounts.google.com/logout';
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

/**
 * Check if user is signed in with a valid token and restore session if valid
 */
export const isSignedIn = (): boolean => {
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!storedToken || !expiry) {
    return false;
  }
  
  // Check if token is expired or about to expire (within 5 minutes)
  const expiryTime = parseInt(expiry);
  const fiveMinutes = 5 * 60 * 1000;
  const isValid = Date.now() < (expiryTime - fiveMinutes);
  
  if (!isValid) {
    // Clear invalid token
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    return false;
  }
  
  // Restore token in gapi client if available
  if (window.gapi?.client) {
    window.gapi.client.setToken({
      access_token: storedToken
    });
  }
  
  return true;
};

/**
 * Ensure authentication is valid and refresh if needed
 */
const ensureAuthenticated = async (): Promise<void> => {
  // Initialize client if needed
  if (!window.googleAuthInitialized) {
    await initGmailClient();
  }

  // Check if token exists and is not expired
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  const now = Date.now();
  
  // If no token or token is expired (or about to expire in 5 minutes), sign in again
  if (!token || !tokenExpiry || parseInt(tokenExpiry) < now + 300000) {
    console.log('Token missing or expiring soon, refreshing authentication');
    await signIn();
    return;
  }

  // Set the token in gapi client if it's not already set
  if (!window.gapi.client.getToken()) {
    window.gapi.client.setToken({ access_token: token });
  }

  try {
    // Try to make a test request to verify token is still valid
    await window.gapi.client.gmail.users.getProfile({ userId: 'me' });
  } catch (error: any) {
    console.error('Token validation error:', error);
    if (error?.status === 401 || error?.result?.error?.code === 401) {
      // Token is invalid or expired, clear it and sign in again
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      await signIn();
    } else {
      throw error;
    }
  }
};

export interface EmailsResponse {
  emails: Email[];
  totalCount: number;
  nextPageToken?: string;
}

export const getTotalEmailCount = async (): Promise<number> => {
  try {
    await ensureAuthenticated();
    // Get the total count from Gmail API for primary inbox
    const response = await window.gapi.client.gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX', 'CATEGORY_PRIMARY'],
      maxResults: 1
    });
    return response.result.resultSizeEstimate || 0;
  } catch (error) {
    console.error('Error fetching email count:', error);
    throw error;
  }
};

export const fetchEmails = async (pageToken?: string): Promise<EmailsResponse> => {
  try {
    await ensureAuthenticated();

    // Get messages from Gmail API without search query
    const response = await window.gapi.client.gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      labelIds: ['INBOX'],
      pageToken
    });

    if (!response.result.messages) {
      return {
        emails: [],
        totalCount: 0,
        nextPageToken: undefined
      };
    }

    // Fetch detailed information for each message
    const emails = await Promise.all(
      response.result.messages.map(async (message: any) => {
        const details = await window.gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date']
        });

        const headers = details.result.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)';
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';

        // Parse the from field
        const fromMatch = from.match(/(?:"?([^"]*?)"?\s)?(?:<)?([^>]+)(?:>)?/);
        const fromName = fromMatch ? fromMatch[1] || fromMatch[2] : from;
        const fromEmail = fromMatch ? fromMatch[2] : from;

        return {
          id: message.id,
          subject,
          from: {
            name: fromName,
            email: fromEmail
          },
          date: new Date(date).toISOString(),
          snippet: details.result.snippet || '',
          body: details.result.snippet || '', // For now, just using snippet as body
          unread: details.result.labelIds?.includes('UNREAD') || false
        };
      })
    );

    return {
      emails,
      totalCount: response.result.resultSizeEstimate || 0,
      nextPageToken: response.result.nextPageToken
    };
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

export const getEmailById = async (emailId: string): Promise<Email> => {
  await ensureAuthenticated();

  try {
    // Get the full message including body
    const response = await window.gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full'
    });

    const message = response.result;

    // Parse headers
    const headers = message.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h: any) => h.name === 'From')?.value || '';
    const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();

    // Extract and clean the message body
    const extractTextFromPart = (part: any): string => {
      if (!part) return '';

      // If we have direct content, decode it
      if (part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }

      // Handle multipart messages
      if (part.parts) {
        // First try to find a plain text version
        const plainTextPart = part.parts.find((p: any) => p.mimeType === 'text/plain');
        if (plainTextPart) {
          return extractTextFromPart(plainTextPart);
        }

        // If no plain text, try to find HTML version
        const htmlPart = part.parts.find((p: any) => p.mimeType === 'text/html');
        if (htmlPart) {
          return extractTextFromPart(htmlPart);
        }

        // If neither found, try nested parts
        for (const p of part.parts) {
          if (p.parts) {
            const nestedContent = extractTextFromPart(p);
            if (nestedContent) return nestedContent;
          }
        }
      }

      return '';
    };

    const cleanContent = (content: string): string => {
  // First extract URLs to preserve them
  const urls: string[] = [];
  let cleaned = content.replace(/https?:\/\/[^\s<]+/g, (url) => {
    urls.push(url);
    return `__URL${urls.length - 1}__`;
  });

  // Handle HTML content
  if (cleaned.includes('<!DOCTYPE html>') || cleaned.includes('<html>') || cleaned.includes('<div')) {
    // Extract text from HTML while preserving some formatting
    cleaned = cleaned
      // Convert common block elements to newlines
      .replace(/<(?:div|p|h[1-6]|article|section|header|footer)[^>]*>/gi, '\n')
      .replace(/<\/(?:div|p|h[1-6]|article|section|header|footer)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      
      // Handle lists
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<\/?(?:ul|ol)>/gi, '\n')
      
      // Special formatting
      .replace(/<hr[^>]*>/gi, '\n---\n')
      .replace(/<blockquote[^>]*>/gi, '\n> ')
      .replace(/<\/blockquote>/gi, '\n')
      
      // Preserve some inline formatting
      .replace(/<(?:b|strong)[^>]*>(.*?)<\/(?:b|strong)>/gi, '*$1*')
      .replace(/<(?:i|em)[^>]*>(.*?)<\/(?:i|em)>/gi, '_$1_')
      
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '');
  } else {
    // For plain text, just remove any stray HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  }
  
  // Replace HTML entities (common first, then generic)
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&[#A-Za-z0-9]+;/g, ' '); // Replace any remaining entities with space
  
  // Remove email metadata while preserving content
  cleaned = cleaned
    .replace(/Content-Type:[^\n]*\n/g, '')
    .replace(/Content-Transfer-Encoding:[^\n]*\n/g, '')
    .replace(/--[0-9a-zA-Z]+(?:-)*(?:[0-9a-zA-Z]+)*$/gm, '') // Remove MIME boundaries
    .replace(/charset=[^\n]*\n/g, '')
    .replace(/=\r\n/g, '') // Remove quoted-printable line breaks
    .replace(/=[0-9A-F]{2}/g, ''); // Remove quoted-printable hex codes
  
  // Restore URLs with proper formatting
  urls.forEach((url, index) => {
    cleaned = cleaned.replace(`__URL${index}__`, url);
  });

  // Clean up line breaks and whitespace while preserving formatting
  return cleaned
    .split(/\r?\n/) // Split on both \r\n and \n
    .filter(line => 
      !line.startsWith('Content-') && 
      !line.startsWith('--') && 
      !line.includes('charset=')
    )
    .map(line => line.trimRight()) // Only trim right to preserve indentation
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Replace multiple blank lines with double line break
    .trim();
    };

    // Get raw content and clean it
    const rawContent = extractTextFromPart(message.payload);
    const body = rawContent ? cleanContent(rawContent) : message.snippet;

    // Parse the from field to extract name and email
    const fromMatch = from.match(/(?:"?([^"]*?)"?\s)?(?:<)?([^>]+)(?:>)?/);
    const fromName = fromMatch ? fromMatch[1] || fromMatch[2] : from;
    const fromEmail = fromMatch ? fromMatch[2] : from;

    return {
      id: message.id,
      subject,
      from: {
        name: fromName,
        email: fromEmail
      },
      date: new Date(date).toISOString(),
      snippet: message.snippet || '',
      body: body || message.snippet || '',
      unread: message.labelIds?.includes('UNREAD') || false
    };
  } catch (error) {
    console.error('Error fetching email details:', error);
    throw error;
  }
};

/**
 * Create a draft email using Gmail API
 * @param draft The draft email to create
 * @returns The ID of the created draft
 */
/**
 * Create a draft email using Gmail API
 * @param draft The draft email to create
 * @returns The ID of the created draft
 */
// Format email address with proper RFC 5322 format
const formatEmailAddress = (email: string, name?: string) => {
  return name ? `${name} <${email}>` : `<${email}>`;
};

// Send an email directly
export const sendEmail = async (draft: DraftEmail): Promise<string> => {
  try {
    // Validate draft fields
    if (!draft.to || !draft.subject || !draft.body) {
      throw new Error('Missing required fields in draft email');
    }

    await ensureAuthenticated();

    const { raw: encodedEmail } = await createEmailContent(draft);

    // Send the email using Gmail API
    const response = await window.gapi.client.gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: encodedEmail
      }
    });

    console.log('Email sent successfully:', response.result);
    return response.result.id;
  } catch (error: any) {
    console.error('Error sending email:', {
      error,
      errorMessage: error.message,
      errorDetails: error.result?.error?.message,
      errorResponse: error.result
    });
    throw error;
  }
};

// Create RFC 5322 formatted email content
const createEmailContent = async (draft: DraftEmail): Promise<{ raw: string, recipientEmail: string }> => {
  // Get user's email for From header
  const profile = await window.gapi.client.gmail.users.getProfile({
    userId: 'me'
  });
  const fromEmail = profile.result.emailAddress;

  // Clean and validate email - only keep the actual email address
  const cleanEmail = draft.to
    .split(' ')
    .find(part => part.includes('@')) // Find the part containing @
    ?.replace(/[<>]/g, '') // Remove any angle brackets
    .trim();
    
  if (!cleanEmail) {
    throw new Error('No valid email address found');
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Invalid recipient email address');
  }

  // Create RFC 5322 formatted email with proper headers
  const emailLines = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    `From: ${formatEmailAddress(fromEmail)}`,
    `To: ${formatEmailAddress(cleanEmail)}`,
    `Subject: ${draft.subject}`,
    '',
    draft.body
  ];

  // Join with proper CRLF line endings
  const email = emailLines.join('\r\n');

  // Encode the email in base64URL format
  const encodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { raw: encodedEmail, recipientEmail: cleanEmail };
};

// Create a draft email
export const createDraft = async (draft: DraftEmail): Promise<string> => {
  try {
    // Validate draft fields
    if (!draft.to || !draft.subject || !draft.body) {
      throw new Error('Missing required fields in draft email');
    }

    await ensureAuthenticated();

    const { raw: encodedEmail } = await createEmailContent(draft);

    // Create the draft using Gmail API
    const response = await window.gapi.client.gmail.users.drafts.create({
      userId: 'me',
      resource: {
        message: {
          raw: encodedEmail
        }
      }
    });

    console.log('Draft created successfully:', response.result);
    return response.result.id;
  } catch (error: any) {
    console.error('Error creating draft:', {
      error,
      errorMessage: error.message,
      errorDetails: error.result?.error?.message,
      errorResponse: error.result
    });
    throw error;
  }
}; 