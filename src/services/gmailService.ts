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
const GMAIL_SCOPES = process.env.REACT_APP_GMAIL_API_SCOPE?.split(' ') || [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.metadata'
];

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

declare global {
  interface Window {
    google: any;
    gapi: any;
    googleAuthInitialized: boolean;
    googleTokenClient: any;
    tokenClient: any;
  }
}

// Track initialization status
let isInitializing = false;
let initPromise: Promise<void> | null = null;

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
  
  isInitializing = true;
  initPromise = new Promise<void>(async (resolve, reject) => {
    try {
      if (!CLIENT_ID || !API_KEY) {
        throw new Error('Google client ID or API key not configured');
      }

      // Load GIS script
      console.log('Loading GIS script...');
      await loadGisScript();
      console.log('GIS script loaded successfully');

      // Initialize token client
      console.log('Initializing token client...');
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: GMAIL_SCOPES.join(' '),
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Token error:', tokenResponse);
            reject(tokenResponse);
            return;
          }

          try {
            // Load Gmail API
            await new Promise<void>((resolveGapi) => {
              const script = document.createElement('script');
              script.src = 'https://apis.google.com/js/api.js';
              script.onload = () => {
                window.gapi.load('client', async () => {
                  try {
                    await window.gapi.client.init({
                      apiKey: API_KEY,
                      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
                    });
                    
                    // Set the token
                    window.gapi.client.setToken({
                      access_token: tokenResponse.access_token
                    });
                    
                    localStorage.setItem('gmail_auth_code', tokenResponse.access_token);
                    window.googleAuthInitialized = true;
                    window.dispatchEvent(new Event('gmail_authenticated'));
                    resolveGapi();
                  } catch (error) {
                    console.error('GAPI init error:', error);
                    reject(error);
                  }
                });
              };
              script.onerror = () => reject(new Error('Failed to load GAPI'));
              document.head.appendChild(script);
            });

            resolve();
          } catch (error) {
            console.error('Token callback error:', error);
            reject(error);
          }
        }
      });

      // Store token client for later use
      window.tokenClient = tokenClient;
      
      // Request initial token
      tokenClient.requestAccessToken({ prompt: 'consent' });

    } catch (error) {
      console.error('Error in initGmailClient:', error);
      reject(error);
    } finally {
      isInitializing = false;
    }
  });
  
  return initPromise;
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
    const tokenClient = window.googleTokenClient;
    if (!tokenClient) {
      throw new Error('Token client not initialized');
    }

    // Request token with prompt
    return new Promise<void>((resolve, reject) => {
      tokenClient.callback = async (response: any) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }

        try {
          // Store the token
          const token = response.access_token;
          window.gapi.client.setToken({ access_token: token });
          localStorage.setItem('gmail_auth_code', token);
          window.dispatchEvent(new Event('gmail_authenticated'));
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      // Prompt the user to select an account
      tokenClient.requestAccessToken({
        prompt: 'select_account'
      });
    });
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out from Gmail
 */
export const signOut = async (): Promise<void> => {
  try {
    // Just clear local storage - there's no explicit revoke in this flow
    localStorage.removeItem('gmail_auth_code');
    localStorage.removeItem('gmail_token');
    
    // Dispatch event to update UI
    window.dispatchEvent(new Event('gmail_signed_out'));
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Check if user is signed in
 */
export const isSignedIn = (): boolean => {
  const token = localStorage.getItem('gmail_auth_code');
  return !!token && window.googleAuthInitialized === true;
};

/**
 * Ensure authentication is valid and refresh if needed
 */
const ensureAuthenticated = async (): Promise<void> => {
  if (!window.googleAuthInitialized) {
    await initGmailClient();
  }

  const token = localStorage.getItem('gmail_auth_code');
  if (!token) {
    await signIn();
    return;
  }

  try {
    // Try to make a test request
    await window.gapi.client.gmail.users.getProfile({ userId: 'me' });
  } catch (error: any) {
    if (error?.status === 401) {
      // Token is invalid or expired, try to refresh
      await signIn();
    } else {
      throw error;
    }
  }
};

export const fetchEmails = async (): Promise<Email[]> => {
  try {
    await ensureAuthenticated();

    // Get messages from Gmail API without search query
    const response = await window.gapi.client.gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      labelIds: ['INBOX']
    });

    if (!response.result.messages) {
      return [];
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

    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

export const getEmailById = async (emailId: string): Promise<Email> => {
  const emails = await fetchEmails();
  const email = emails.find(e => e.id === emailId);
  
  if (!email) {
    throw new Error('Email not found');
  }
  
  return email;
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
export const createDraft = async (draft: DraftEmail): Promise<string> => {
  try {
    // Validate draft fields
    if (!draft.to || !draft.subject || !draft.body) {
      throw new Error('Missing required fields in draft email');
    }

    // Clean and validate email - only keep the actual email address
    const cleanEmail = draft.to
      .split(' ')
      .find(part => part.includes('@')) // Find the part containing @
      ?.replace(/[<>]/g, '') // Remove any angle brackets
      .trim();
      
    console.log('Cleaned email for validation:', cleanEmail);
    
    if (!cleanEmail) {
      throw new Error('No valid email address found');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      console.log('Email validation failed for:', cleanEmail);
      throw new Error('Invalid recipient email address');
    }
    
    // Use the cleaned email
    draft.to = cleanEmail;

    await ensureAuthenticated();

    // Get user's email for From header
    const profile = await window.gapi.client.gmail.users.getProfile({
      userId: 'me'
    });
    const fromEmail = profile.result.emailAddress;

    // Format the email addresses with proper RFC 5322 format
    const formatEmailAddress = (email: string, name?: string) => {
      return name ? `${name} <${email}>` : `<${email}>`;
    };

    // Create RFC 5322 formatted email with proper headers
    const emailLines = [
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable',
      `From: ${formatEmailAddress(fromEmail)}`,
      `To: ${formatEmailAddress(draft.to)}`,
      `Subject: ${draft.subject}`,
      '',
      draft.body
    ];

    // Join with proper CRLF line endings
    const email = emailLines.join('\r\n');

    console.log('Raw email content:', email); // Debug log

    // Encode the email in base64URL format
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Creating draft with payload:', { // Debug log
      userId: 'me',
      resource: {
        message: {
          raw: encodedEmail.substring(0, 100) + '...' // Truncate for logging
        }
      }
    });

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