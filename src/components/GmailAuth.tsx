import React, { useState, useEffect, useCallback } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { initGmailClient, signIn, signOut, isSignedIn } from '../services/gmailService';

interface GmailAuthProps {
  onAuthStateChange?: (isSignedIn: boolean) => void;
}

const GmailAuth: React.FC<GmailAuthProps> = ({ onAuthStateChange }) => {
  const [loading, setLoading] = useState(true);
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
    let isMounted = true;
    
    const handleAuthenticated = () => {
      console.log('GmailAuth: Authenticated event received');
      if (isMounted) {
        setAuthenticated(true);
        onAuthStateChange?.(true);
      }
    };
    
    const handleSignedOut = () => {
      console.log('GmailAuth: Signed out event received');
      if (isMounted) {
        setAuthenticated(false);
        onAuthStateChange?.(false);
      }
    };
    
    // Set up event listeners
    window.addEventListener('gmail_authenticated', handleAuthenticated);
    window.addEventListener('gmail_signed_out', handleSignedOut);
    
    const setupAuth = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('GmailAuth: Initializing Gmail client');
        await initGmailClient();
        console.log('GmailAuth: Gmail client initialized');
        
        if (isMounted) {
          checkAuthStatus();
          setLoading(false);
        }
      } catch (error) {
        console.error('GmailAuth: Error setting up Gmail auth:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize Gmail client');
          setLoading(false);
        }
      }
    };
    
    setupAuth();
    
    return () => {
      isMounted = false;
      window.removeEventListener('gmail_authenticated', handleAuthenticated);
      window.removeEventListener('gmail_signed_out', handleSignedOut);
    };
  }, [checkAuthStatus]);

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