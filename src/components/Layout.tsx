import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Box, Container, useMediaQuery, useTheme, Menu, MenuItem, Avatar, Fab, Modal } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MicIcon from '@mui/icons-material/Mic';
import { signOut } from '../services/gmailService';
import { Email } from '../types/types';
import { useEmail } from '../context/EmailContext';
import AudioRecorder from './AudioRecorder';

interface LayoutProps {
  children: ReactNode;
}

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
    navigate('/login');
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
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
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
              <AccountCircleIcon />
            </Avatar>
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
      <Container maxWidth="lg" sx={{ 
        flexGrow: 1, 
        py: 3,
        px: isMobile ? 1 : 3,
        position: 'relative',
        overflowX: 'hidden'
      }}>
        {children}
      </Container>
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: theme.palette.grey[200],
          textAlign: 'center',
          fontSize: '0.8rem'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Audio Email Assistant
        </Typography>
      </Box>

      {isMobile ? (
        <>
          <Fab
            color="primary"
            aria-label="record audio"
            onClick={() => setIsRecorderOpen(true)}
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: theme.zIndex.modal + 1,
              transform: 'scale(1)',
              '&:hover': {
                transform: 'scale(1.1)'
              },
              transition: 'transform 0.2s ease-in-out',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
            }}
          >
            <MicIcon />
          </Fab>

          <Modal
            open={isRecorderOpen}
            onClose={() => setIsRecorderOpen(false)}
            aria-labelledby="audio-recorder-modal"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
          >
            <Box sx={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: '12px',
              p: { xs: 2, sm: 3 },
              boxShadow: theme.shadows[24]
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
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" gutterBottom>
                    No email selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please select an email from your inbox to respond to.
                  </Typography>
                </Box>
              )}
            </Box>
          </Modal>
        </>
      ) : null}
    </Box>
  );
};

export default Layout; 