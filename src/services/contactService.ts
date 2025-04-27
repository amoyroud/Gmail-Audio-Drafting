import { ensureAuthenticated } from './gmailService'; // Assuming ensureAuthenticated handles gapi loading/auth

// Define a simple Contact type
export interface Contact {
  resourceName: string; // People API resource name (needed for certain operations)
  name: string;
  email: string;
}

/**
 * Searches Google Contacts for people matching the query.
 * @param query The search string (name or email).
 * @returns A promise that resolves to an array of Contacts.
 */
export const searchContacts = async (query: string): Promise<Contact[]> => {
  console.log(`[contactService] Searching contacts for query: "${query}"`);
  if (!query || query.trim().length === 0) {
    return []; // Don't search for empty queries
  }

  try {
    await ensureAuthenticated();

    // Ensure People API client is loaded and available
    if (!window.gapi?.client?.people) {
      console.error('[contactService] People API client is not available. Check discoveryDocs.');
      throw new Error('People API client not loaded');
    }

    const response = await window.gapi.client.people.people.searchContacts({
      query: query,
      readMask: 'names,emailAddresses', // Request name and email fields
      pageSize: 10 // Limit results for performance
    });

    console.log('[contactService] People API response:', response.result);

    const results = response.result.results || [];
    const contacts: Contact[] = results
      .map((personResult: any) => personResult.person)
      .filter((person: any) => person && person.emailAddresses && person.emailAddresses.length > 0)
      .map((person: any) => {
        const name = person.names && person.names.length > 0 ? person.names[0].displayName : person.emailAddresses[0].value;
        return {
          resourceName: person.resourceName,
          name: name || 'No Name',
          email: person.emailAddresses[0].value
        };
      });

    console.log('[contactService] Found contacts:', contacts);
    return contacts;

  } catch (error: any) {
    console.error('[contactService] Error searching contacts:', {
      error,
      errorMessage: error.message,
      errorDetails: error.result?.error?.message,
      errorResponse: error.result
    });
    // Avoid throwing error to UI, just return empty list on failure
    return []; 
  }
}; 