// Extend Window interface
interface Window {
  gapi: Gapi;
  google: any;
  googleAuthInitialized: boolean;
  googleTokenClient: any;
}

declare global {
  interface GapiClient {
    init(params: {
      apiKey: string;
      discoveryDocs: string[];
    }): Promise<void>;
    setToken(token: { access_token: string }): void;
    load(api: string, version: string): Promise<void>;

    gmail: {
    users: {
      messages: {
        list: (params: {
          userId: string;
          maxResults?: number;
          q?: string;
        }) => Promise<{
          result: {
            messages?: Array<{
              id: string;
              threadId: string;
            }>;
            nextPageToken?: string;
          };
        }>;
        get: (params: {
          userId: string;
          id: string;
          format?: string;
        }) => Promise<{
          result: {
            id: string;
            threadId: string;
            labelIds: string[];
            snippet: string;
            payload: {
              headers: Array<{
                name: string;
                value: string;
              }>;
              body?: {
                data?: string;
                size?: number;
              };
              parts?: Array<{
                body: {
                  data?: string;
                  size?: number;
                };
              }>;
            };
          };
        }>;
      };
    };
  };
  client: {
    init: (params: {
      apiKey: string;
      discoveryDocs: string[];
    }) => Promise<void>;
    load: (api: string, version: string) => Promise<void>;
    setToken: (token: { access_token: string }) => void;
  };
}

  interface AuthResponse {
    access_token: string;
    id_token: string;
    scope: string;
    expires_in: number;
    first_issued_at: number;
    expires_at: number;
  }

  interface GoogleUser {
    getBasicProfile(): any;
    getAuthResponse(): AuthResponse;
  }

  interface Auth2 {
    getAuthInstance(): {
      isSignedIn: {
        get(): boolean;
        listen(callback: (isSignedIn: boolean) => void): void;
      };
      signIn(): Promise<any>;
      signOut(): Promise<any>;
      currentUser: {
        get(): GoogleUser;
        listen(callback: (user: GoogleUser) => void): void;
      };
    };
  }

  interface Gapi {
    load: (api: string, callback: () => void) => void;
    client: GapiClient;
    auth2: Auth2;
  }

  // Empty global declaration to allow module augmentation
}
