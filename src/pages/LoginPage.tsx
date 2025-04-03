import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { signIn, isSignedIn, initGmailClient } from '../services/gmailService';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    console.log('LoginPage: Checking auth status');
    
    const checkAuthStatus = async () => {
      try {
        // Initialize Google client
        console.log('LoginPage: Initializing Gmail client');
        await initGmailClient();
        console.log('LoginPage: Gmail client initialized');
        
        // Check if already authenticated
        const authenticated = isSignedIn();
        console.log('LoginPage: Auth status is', authenticated);
        
        if (authenticated) {
          console.log('LoginPage: Already signed in, navigating to homepage');
          navigate('/');
          return;
        }
        
        // Listen for authentication events
        const handleAuthChange = () => {
          console.log('LoginPage: Authentication event received, navigating to homepage');
          navigate('/');
        };
        
        window.addEventListener('gmail_authenticated', handleAuthChange);
        
        return () => {
          window.removeEventListener('gmail_authenticated', handleAuthChange);
        };
      } catch (err) {
        console.error('LoginPage: Error initializing Google auth:', err);
        setError('Failed to initialize Google authentication. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [navigate]);

  const handleSignIn = async () => {
    try {
      console.log('LoginPage: Starting sign-in process');
      setInitializing(true);
      setError(null);
      await signIn();
      // The navigation will be handled by the event listener
    } catch (err) {
      console.error('LoginPage: Error signing in:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.primary.light,
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <EmailIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight="bold">
            Audio Email Assistant
          </Typography>
        </Box>
        
        <Typography variant="body1" textAlign="center" sx={{ mb: 3 }}>
          Manage your Gmail responses on the go with speech-to-text and AI assistance.
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSignIn}
          disabled={initializing}
          sx={{ 
            py: 1.5, 
            fontSize: '1.1rem',
            textTransform: 'none',
            mb: 2
          }}
        >
          {initializing ? <CircularProgress size={24} /> : 'Sign In with Gmail'}
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Securely log in to access your Gmail account.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage; 