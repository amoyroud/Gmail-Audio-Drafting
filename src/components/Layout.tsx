import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Box, Container, useMediaQuery, useTheme, Menu, MenuItem, Avatar, Fab, Modal, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import MicIcon from '@mui/icons-material/Mic';
import { signOut } from '../services/gmailService';
import { Email } from '../types/types';
import { useEmail } from '../context/EmailContext';
import AudioRecorder from './AudioRecorder';

interface LayoutProps {
  children: ReactNode;
}

// Common styles for consistency
const spacing = {
  xs: 2,  // 16px
  sm: 3,  // 24px
  md: 4   // 32px
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { selectedEmail, setSelectedEmail, isRecorderOpen, setIsRecorderOpen } = useEmail();

  // Add effect to hide empty boxes
  React.useEffect(() => {
    // Hide empty MuiBox elements
    const style = document.createElement('style');
    style.textContent = `
      .MuiBox-root:empty, 
      .css-lk6p76, 
      div:empty[class^="MuiBox-root"] { 
        display: none !important; 
        height: 0 !important; 
        padding: 0 !important; 
        margin: 0 !important; 
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
    navigate('/');
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    console.log('Navigating to settings page');
    // Force hard navigation to ensure it works
    window.location.href = '/settings';
  };

  const handleFileTranscriptionClick = () => {
    handleMenuClose();
    console.log('Navigating to file transcription page');
    // Force hard navigation to ensure it works
    window.location.href = '/file-transcription';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
    }}>
      <AppBar position="fixed" sx={{ borderRadius: 0, zIndex: theme.zIndex.drawer + 1, height: '40px' }}>
        <Toolbar sx={{ minHeight: '40px !important', padding: '0px 16px' }}>
          <Box 
            component="div" 
            onClick={() => navigate('/')} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              mr: 1
            }}
          >
            <Box 
              sx={{ 
                width: 24, 
                height: 24,
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <MicIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1 }}>
              Audio Email Assistant
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="small"
            aria-label="settings menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '6px',
              padding: '4px'
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            <MenuItem onClick={handleFileTranscriptionClick}>File Transcription</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container 
        maxWidth={false} 
        sx={{ 
          flexGrow: 1, 
          py: spacing.sm,
          px: isMobile ? spacing.xs : spacing.md,
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto',
          maxWidth: '1600px',
          mx: 'auto',
          mt: '40px', // Reduced from 64px to 40px
          pb: isMobile ? '80px' : spacing.sm // Add padding at bottom for mobile to account for fixed bottom bar
        }}>
        {children}
      </Container>
      <Box 
        component="footer" 
        sx={{ 
          py: spacing.xs, 
          px: spacing.xs, 
          mt: 'auto', 
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.grey[100],
          textAlign: 'center',
          fontSize: '0.8rem',
          borderTop: '1px solid',
          borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Audio Email Assistant
        </Typography>
      </Box>

      {isMobile && isRecorderOpen && (
        <Modal
          open={isRecorderOpen}
          onClose={() => setIsRecorderOpen(false)}
          aria-labelledby="audio-recorder-modal"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1
          }}
        >
          <Box sx={{
            width: '100%',
            maxWidth: '600px',
            height: '80vh',
            overflowY: 'scroll',
            bgcolor: 'background.paper',
            borderRadius: '8px',
            p: { xs: 1, sm: spacing.xs },
            boxShadow: theme.shadows[24],
            m: 1,
            pb: { xs: 4, sm: 3 },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': {
              width: '6px',
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.2) rgba(0,0,0,0.05)',
          }}>
            {selectedEmail ? (
              <AudioRecorder
                selectedEmail={selectedEmail}
                onDraftSaved={() => {
                  setIsRecorderOpen(false);
                  setSelectedEmail(undefined);
                }}
              />
            ) : (
              <Box sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  No email selected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Please select an email from your inbox to respond to.
                </Typography>
              </Box>
            )}
          </Box>
        </Modal>
      )}
    </Box>
  );
};

export default Layout; 