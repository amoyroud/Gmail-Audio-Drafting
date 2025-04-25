import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { initGmailClient, signIn, signOut, isSignedIn } from '../services/gmailService';

interface GmailAuthProps {
  onAuthStateChange?: (isSignedIn: boolean) => void;
}

const GmailAuth: React.FC<GmailAuthProps> = ({ onAuthStateChange }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if already signed in before initializing
        const authStatus = await isSignedIn();
        if (authStatus) {
          // Already authenticated with a valid token
          setAuthenticated(true);
          onAuthStateChange?.(true);
        } else {
          // Need to initialize but not prompt for auth yet
          await initGmailClient();
          setAuthenticated(false);
          onAuthStateChange?.(false);
        }
      } catch (error) {
        console.error('Error initializing Gmail client:', error);
        setError('Failed to initialize Gmail client');
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Listen for authentication events
    const handleAuthChange = () => {
      console.log('GmailAuth: Auth event received');
      setAuthenticated(true);
      setLoading(false);
    };

    const handleSignOutEvent = () => {
      setAuthenticated(false);
      onAuthStateChange?.(false);
    };

    window.addEventListener('gmail_authenticated', handleAuthChange);
    window.addEventListener('gmail_signed_out', handleSignOutEvent);

    return () => {
      window.removeEventListener('gmail_authenticated', handleAuthChange);
      window.removeEventListener('gmail_signed_out', handleSignOutEvent);
    };
  }, [onAuthStateChange]);

  // Handle sign-in click
  const handleSignIn = async () => {
    try {
      console.log('GmailAuth: Signing in');
      setLoading(true);
      setError(null);
      await signIn();
      // The authentication state will be updated via the event listener
    } catch (error) {
      console.error('GmailAuth: Sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      setAuthenticated(false);
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
      // The authentication state will be updated via the event listener
    } catch (error) {
      console.error('GmailAuth: Sign-out error:', error);
      // Even if there's an error, we should consider the user signed out
      setAuthenticated(false);
      onAuthStateChange?.(false);
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