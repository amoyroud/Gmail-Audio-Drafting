import React, { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Container, 
  useMediaQuery, 
  useTheme, 
  Menu, 
  MenuItem, 
  Avatar, 
  Fab, 
  Modal, 
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import MicIcon from '@mui/icons-material/Mic';
import HomeIcon from '@mui/icons-material/Home';
import EmailIcon from '@mui/icons-material/Email';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NoteIcon from '@mui/icons-material/Note';
import ArchiveIcon from '@mui/icons-material/Archive';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CloseIcon from '@mui/icons-material/Close';
import { signOut, getEmailById } from '../services/gmailService';
import { Email, EmailActionType, EmailTemplate } from '../types/types';
import { useEmail } from '../context/EmailContext';
import AudioRecorder from './AudioRecorder';
import TemplateSelector from './TemplateSelector';

interface LayoutProps {
  children: ReactNode;
  onArchive?: (emailId: string) => Promise<void>;
  onMoveToRead?: (emailId: string) => Promise<void>;
  onQuickDecline?: (emailId: string) => Promise<void>;
  showTemplateDialog?: boolean;
  onCloseTemplateDialog?: () => void;
  currentDeclineEmailId?: string | null;
  onTemplateSelected?: (template: EmailTemplate) => void;
}

// Common styles for consistency
const spacing = {
  xs: 2,  // 16px
  sm: 3,  // 24px
  md: 4   // 32px
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onArchive, 
  onMoveToRead, 
  onQuickDecline,
  showTemplateDialog = false,
  onCloseTemplateDialog = () => {},
  currentDeclineEmailId = null,
  onTemplateSelected
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { selectedEmail, setSelectedEmail, isRecorderOpen, setIsRecorderOpen } = useEmail();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [navValue, setNavValue] = useState(0);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);
  const [loadingEmailForModal, setLoadingEmailForModal] = useState(false);
  const [emailForModal, setEmailForModal] = useState<Email | null>(null);
  const [emailForTemplate, setEmailForTemplate] = useState<Email | null>(null);

  // Check the URL for an email ID and use it as a fallback if the selectedEmail context is empty
  useEffect(() => {
    const path = location.pathname;
    console.log('Layout - Current URL path:', path);
    
    // Try different ways to extract the email ID
    let emailId = null;
    
    // Method 1: Standard regex match
    const match = path.match(/\/email\/([^\/]+)/);
    console.log('Layout - URL match result:', match);
    
    if (match && match[1]) {
      emailId = match[1];
    } 
    // Method 2: Simple string split (more reliable)
    else if (path.includes('/email/')) {
      const parts = path.split('/email/');
      if (parts.length > 1 && parts[1]) {
        emailId = parts[1];
      }
    }
    // Method 3: Check sessionStorage (for mobile)
    else {
      const storedEmailId = sessionStorage.getItem('currentEmailId');
      if (storedEmailId) {
        console.log('Layout - Found email ID in sessionStorage:', storedEmailId);
        emailId = storedEmailId;
      }
    }
    
    // Only update if we have a new email ID that differs from the current one
    if (emailId && emailId !== currentEmailId) {
      console.log('Layout - Found new email ID:', emailId);
      setCurrentEmailId(emailId);
      
      // If we have an email ID but no selectedEmail in context,
      // we'll need to fetch it for the modal
      if (!selectedEmail && isRecorderOpen) {
        console.log('Layout - No selectedEmail in context, will fetch it in modal');
      }
    } else if (!emailId && currentEmailId) {
      console.log('Layout - No email ID found, clearing currentEmailId');
      setCurrentEmailId(null);
    } else {
      console.log('Layout - Email ID unchanged, skipping update');
    }
  }, [location.pathname, selectedEmail, isRecorderOpen, currentEmailId]);
  
  // Debug log when component renders
  useEffect(() => {
    console.log('Layout component rendered');
  }, []);

  useEffect(() => {
    // Only log when the state actually changes
    if (selectedEmail || currentEmailId) {
      console.log('DEBUG - Layout - selectedEmail:', selectedEmail ? 
        `${selectedEmail.id} (${selectedEmail.subject})` : 'null');
      console.log('Layout - Bottom buttons should be active:', !!selectedEmail || !!currentEmailId);
    }
  }, [selectedEmail, currentEmailId]);

  // Determine active navigation based on current route
  React.useEffect(() => {
    const path = location.pathname;
    // Keep this function to maintain location awareness,
    // but we'll handle the active tab differently now
    if (path.includes('/home')) {
      setNavValue(0);
    } else if (path.includes('/email/')) {
      setNavValue(0);
    } else if (path.includes('/file-transcription')) {
      setNavValue(0);
    } else if (path.includes('/settings')) {
      setNavValue(0);
    } else {
      setNavValue(0); // Default to home
    }
  }, [location.pathname]);

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
    navigate('/settings');
  };

  const handleFileTranscriptionClick = () => {
    handleMenuClose();
    console.log('Navigating to file transcription page');
    navigate('/file-transcription');
  };

  const toggleMobileDrawer = (open: boolean) => {
    setMobileDrawerOpen(open);
  };

  const handleBottomNavChange = async (event: React.SyntheticEvent, newValue: number) => {
    // Don't update navValue immediately - will be updated on success in each handler
    console.log('Bottom navigation value changed to:', newValue);
    
    // Skip if no email is selected or if an action is already in progress
    if (!selectedEmail || actionInProgress) {
      console.log('Skipping action - no email selected or action in progress');
      return;
    }
    
    // Handle button interactions directly through the onClick handlers of each BottomNavigationAction
    // This function is kept for compatibility but action logic is now in the button handlers
  };

  // Mobile drawer content
  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        <ListItem 
          button 
          onClick={() => { 
            toggleMobileDrawer(false);
            navigate('/home');
          }}
        >
          <ListItemIcon><HomeIcon /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem 
          button 
          onClick={() => { 
            toggleMobileDrawer(false);
            navigate('/file-transcription');
          }}
        >
          <ListItemIcon><NoteIcon /></ListItemIcon>
          <ListItemText primary="File Transcription" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem 
          button 
          onClick={() => { 
            toggleMobileDrawer(false);
            navigate('/settings');
          }}
        >
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem 
          button 
          onClick={handleLogout}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  // Load email by ID for modal when needed
  const fetchEmailForModal = async (emailId: string) => {
    if (!emailId) return;
    
    setLoadingEmailForModal(true);
    try {
      console.log('Layout - Fetching email for modal:', emailId);
      const emailData = await getEmailById(emailId);
      console.log('Layout - Email fetched for modal:', emailData.id, emailData.subject);
      setEmailForModal(emailData);
    } catch (err) {
      console.error('Error fetching email for modal:', err);
    } finally {
      setLoadingEmailForModal(false);
    }
  };
  
  // Reset email for modal when recorder is closed
  useEffect(() => {
    if (!isRecorderOpen) {
      setEmailForModal(null);
    }
  }, [isRecorderOpen]);
  
  // When Record button is clicked, load the email if needed
  useEffect(() => {
    if (isRecorderOpen && !selectedEmail && currentEmailId && !emailForModal) {
      fetchEmailForModal(currentEmailId);
    }
  }, [isRecorderOpen, selectedEmail, currentEmailId, emailForModal]);

  // Fetch email for template when currentDeclineEmailId changes
  useEffect(() => {
    const fetchEmailForTemplate = async () => {
      if (currentDeclineEmailId) {
        try {
          setLoadingEmailForModal(true);
          const email = await getEmailById(currentDeclineEmailId);
          setEmailForTemplate(email);
        } catch (error) {
          console.error('Error fetching email for template:', error);
        } finally {
          setLoadingEmailForModal(false);
        }
      }
    };

    if (currentDeclineEmailId && showTemplateDialog) {
      fetchEmailForTemplate();
    }
  }, [currentDeclineEmailId, showTemplateDialog]);

  const handleTemplateSelect = async (template: EmailTemplate) => {
    // Call the parent component's handler if provided
    if (onTemplateSelected) {
      onTemplateSelected(template);
      return;
    }
    
    // Otherwise use the default implementation
    if (currentDeclineEmailId && emailForTemplate && onQuickDecline) {
      try {
        // Handle the template selection and create a draft
        console.log('Selected template:', template.name);
        // Close the dialog first
        onCloseTemplateDialog();
        
        // Perform the decline action
        await onQuickDecline(currentDeclineEmailId);
        
        // Navigate to home after creating the draft
        navigate('/home');
      } catch (error) {
        console.error('Error handling template selection:', error);
      }
    }
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
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => toggleMobileDrawer(true)}
              sx={{ mr: 1 }}
              size="small"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
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
          {!isMobile && (
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
          )}
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

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => toggleMobileDrawer(false)}
        onOpen={() => toggleMobileDrawer(true)}
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            top: '40px', // Match the AppBar height
            height: 'calc(100% - 40px)' // Subtract AppBar height
          },
        }}
      >
        {drawerContent}
      </SwipeableDrawer>
      
      <Container 
        maxWidth={false} 
        sx={{ 
          flexGrow: 1, 
          py: spacing.sm,
          px: isMobile ? 1 : spacing.md, // Reduced horizontal padding on mobile
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto',
          maxWidth: '1600px',
          mx: 'auto',
          mt: '40px', // Reduced from 64px to 40px
          pb: isMobile ? '80px' : spacing.sm, // Add padding at bottom for mobile to account for fixed bottom bar
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}>
        {children}
      </Container>
      
      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0,
            zIndex: 1000,
            // Ensure it doesn't get hidden behind content
            boxShadow: '0px -2px 10px rgba(0,0,0,0.1)',
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={navValue}
            onChange={handleBottomNavChange}
            showLabels
          >
            <BottomNavigationAction 
              label="Record" 
              icon={<MicIcon />} 
              disabled={false}
              sx={{
                opacity: (!selectedEmail && !currentEmailId) ? 0.8 : 1,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Record button clicked. Current state - isRecorderOpen:', isRecorderOpen);
                
                // Toggle the recorder modal visibility
                const shouldOpen = !isRecorderOpen;
                setIsRecorderOpen(shouldOpen);

                // If opening, set navValue (optional, based on desired visual feedback)
                if (shouldOpen) {
                  setNavValue(0);
                  // Check if we should use the fallback email ID
                  if (!selectedEmail && currentEmailId) {
                      console.log('Layout: Using URL email ID as fallback for recording modal');
                      // The fetch logic is handled within the Layout's useEffect for the modal
                  }
                } else {
                  // Optional: Reset navValue if closing? Or keep it?
                  // Maybe do nothing here, let the user navigate away
                }
              }}
            />
            <BottomNavigationAction 
              label="Decline" 
              icon={<CloseIcon />} 
              disabled={false}
              sx={{
                opacity: ((!selectedEmail && !currentEmailId) || !onQuickDecline) ? 0.8 : 1,
              }}
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                console.log('Decline button clicked, selectedEmail:', selectedEmail ? `${selectedEmail.id} (${selectedEmail.subject})` : 'none', 'currentEmailId:', currentEmailId);
                
                const emailIdToUse = selectedEmail?.id || currentEmailId;
                
                // Simply call the main handler from App.tsx
                // It will decide whether to open the dialog or use a template
                if (emailIdToUse && onQuickDecline && actionInProgress !== emailIdToUse) {
                  console.log('Layout: Calling onQuickDecline for:', emailIdToUse);
                  // We call onQuickDecline without a template, App.tsx will handle opening the dialog
                  onQuickDecline(emailIdToUse); 
                } else {
                  console.log('Cannot decline: no selected email or handler, selectedEmail exists:', !!selectedEmail, 'currentEmailId exists:', !!currentEmailId, 'onQuickDecline exists:', !!onQuickDecline, 'actionInProgress:', actionInProgress);
                  alert('Please select an email first or wait for the current action to complete.');
                }
              }}
            />
            <BottomNavigationAction 
              label="Archive" 
              icon={<ArchiveIcon />} 
              disabled={false}
              sx={{
                opacity: ((!selectedEmail && !currentEmailId) || !onArchive) ? 0.8 : 1,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Archive button clicked, selectedEmail:', selectedEmail ? `${selectedEmail.id} (${selectedEmail.subject})` : 'none', 'currentEmailId:', currentEmailId);
                
                const emailIdToUse = selectedEmail?.id || currentEmailId;
                
                if (emailIdToUse && onArchive && actionInProgress !== emailIdToUse) {
                  console.log('Archiving email:', emailIdToUse);
                  setActionInProgress(emailIdToUse);
                  onArchive(emailIdToUse)
                    .then(() => {
                      console.log('Archive completed for:', emailIdToUse);
                      setNavValue(2);
                    })
                    .catch(err => console.error('Error archiving email:', err))
                    .finally(() => setActionInProgress(null));
                } else {
                  console.log('Cannot archive: no selected email or handler, selectedEmail exists:', !!selectedEmail, 'currentEmailId exists:', !!currentEmailId, 'onArchive exists:', !!onArchive);
                  alert('Please select an email first');
                }
              }}
            />
            <BottomNavigationAction 
              label="To Read" 
              icon={<BookmarkIcon />} 
              disabled={false}
              sx={{
                opacity: ((!selectedEmail && !currentEmailId) || !onMoveToRead) ? 0.8 : 1,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('To Read button clicked, selectedEmail:', selectedEmail ? `${selectedEmail.id} (${selectedEmail.subject})` : 'none', 'currentEmailId:', currentEmailId);
                
                const emailIdToUse = selectedEmail?.id || currentEmailId;
                
                if (emailIdToUse && onMoveToRead && actionInProgress !== emailIdToUse) {
                  console.log('Moving email to read later:', emailIdToUse);
                  setActionInProgress(emailIdToUse);
                  onMoveToRead(emailIdToUse)
                    .then(() => {
                      console.log('Move to read completed for:', emailIdToUse);
                      setNavValue(3);
                    })
                    .catch(err => console.error('Error moving email to read:', err))
                    .finally(() => setActionInProgress(null));
                } else {
                  console.log('Cannot move to read: no selected email or handler, selectedEmail exists:', !!selectedEmail, 'currentEmailId exists:', !!currentEmailId, 'onMoveToRead exists:', !!onMoveToRead);
                  alert('Please select an email first');
                }
              }}
            />
          </BottomNavigation>
        </Paper>
      )}

      {/* Modal for mobile recorder */}
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
            height: '85vh',
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
            {loadingEmailForModal ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" gutterBottom>
                  Loading email...
                </Typography>
              </Box>
            ) : (selectedEmail || emailForModal) ? (
              <AudioRecorder
                selectedEmail={selectedEmail || emailForModal!}
                onDraftSaved={() => {
                  setIsRecorderOpen(false);
                  setEmailForModal(null);
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

      {/* Template Selector Dialog */}
      <TemplateSelector
        isOpen={showTemplateDialog}
        onClose={onCloseTemplateDialog}
        onSelectTemplate={handleTemplateSelect}
        templateType="decline"
      />
    </Box>
  );
};

export default Layout;