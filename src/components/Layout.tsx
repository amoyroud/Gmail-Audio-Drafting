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

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
    }}>
      <AppBar position="fixed" sx={{ borderRadius: 0, zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Box 
            component="div" 
            onClick={() => navigate('/')} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              mr: 2 
            }}
          >
            <Box 
              sx={{ 
                width: 32, 
                height: 32,
                mr: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <MicIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Audio Email Assistant
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="large"
            aria-label="settings menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px',
            }}
          >
            <SettingsIcon />
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
          mt: '64px', // Add margin top to account for AppBar height
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
            maxHeight: '90vh', 
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: '8px',
            p: { xs: 1, sm: spacing.xs },
            boxShadow: theme.shadows[24],
            m: 1,
            pb: '100px', // Add extra padding at bottom to ensure send button is accessible
            // Making scrolling smoother on mobile
            '-webkit-overflow-scrolling': 'touch',
            // Ensure proper scroll behavior on iOS
            display: 'flex',
            flexDirection: 'column',
            // Prevent overscroll behavior issues
            overscrollBehavior: 'contain',
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