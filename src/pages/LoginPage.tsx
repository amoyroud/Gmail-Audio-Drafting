import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Box, Button, Typography, Paper, useMediaQuery, useTheme } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const LoginPage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
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
            Email Assistant
          </Typography>
        </Box>
        
        <Typography variant="body1" textAlign="center" sx={{ mb: 3 }}>
          Manage your Gmail responses on the go with speech-to-text and AI assistance.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => loginWithRedirect()}
          sx={{ 
            py: 1.5, 
            fontSize: '1.1rem',
            textTransform: 'none'
          }}
        >
          Sign In with Auth0
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Securely log in to access your Gmail account.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage; 