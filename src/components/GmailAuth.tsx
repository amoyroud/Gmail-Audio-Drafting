import React, { useState, useEffect, useCallback } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { initGmailClient, signIn, signOut, isSignedIn } from '../services/gmailService';

interface GmailAuthProps {
  onAuthStateChange?: (isSignedIn: boolean) => void;
}

const GmailAuth: React.FC<GmailAuthProps> = ({ onAuthStateChange }) => {
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth status with useCallback to avoid dependency issues
  const checkAuthStatus = useCallback(() => {
    console.log('GmailAuth: Checking auth status');
    const authStatus = isSignedIn();
    console.log('GmailAuth: Auth status is', authStatus);
    setAuthenticated(authStatus);
    onAuthStateChange?.(authStatus);
  }, [onAuthStateChange]);

  // Initialize client and set up listeners
  useEffect(() => {
    console.log('GmailAuth: Setting up auth');
    
    const handleAuthenticated = () => {
      console.log('GmailAuth: Authenticated event received');
      setAuthenticated(true);
      setLoading(false);
    };

    const handleUnauthenticated = () => {
      console.log('GmailAuth: Unauthenticated event received');
      setAuthenticated(false);
      setLoading(false);
    };

    const isSignedIn = async () => {
      if (!gapiLoaded || !gisLoaded) return false;
      try {
        const auth = window.gapi.auth2.getAuthInstance();
        return auth.isSignedIn.get();
      } catch (error) {
        console.error('Error checking sign-in status:', error);
        return false;
      }
    };

    const checkAuthStatus = async () => {
      const signedIn = await isSignedIn();
      if (onAuthStateChange && typeof signedIn === 'boolean') {
        onAuthStateChange(signedIn);
      }
    };

    const initializeGapi = async () => {
      try {
        await window.gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: process.env.REACT_APP_GMAIL_API_SCOPE,
          plugin_name: 'Gmail Audio Drafts'
        });

        console.log('GmailAuth: Gmail client initialized');
        setGapiLoaded(true);
        
        if (isMounted) {
          checkAuthStatus();
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Gmail client:', error);
        if (isMounted) {
          setError('Failed to initialize Gmail client');
          setLoading(false);
        }
      }
    };

    window.gapi.load('client', initializeGapi);

    return () => {
      setIsMounted(false);
    };
  }, [gapiLoaded, gisLoaded, onAuthStateChange]);

  // Handle sign-in click
  const handleSignIn = async () => {
    try {
      console.log('GmailAuth: Signing in');
      setLoading(true);
      setError(null);
      await signIn();
    } catch (error) {
      console.error('GmailAuth: Sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handle sign-out click
  const handleSignOut = async () => {
    try {
      console.log('GmailAuth: Signing out');
      setLoading(true);
      setError(null);
      await signOut();
    } catch (error) {
      console.error('GmailAuth: Sign-out error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {authenticated ? (
        <Button
          variant="outlined"
          color="primary"
          onClick={handleSignOut}
          fullWidth
        >
          Sign Out of Gmail
        </Button>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={handleSignIn}
          fullWidth
        >
          Sign In with Gmail
        </Button>
      )}
    </Box>
  );
};

export default GmailAuth; 