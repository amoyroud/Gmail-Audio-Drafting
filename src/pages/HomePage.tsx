import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  List,
  ListItem,
  Typography,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  ListItemButton,
  ListItemText,
  Avatar,
  Tooltip,
  Modal
} from '@mui/material';
// Icons
// import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import StopIcon from '@mui/icons-material/Stop';
import EmailIcon from '@mui/icons-material/Email';
import MicIcon from '@mui/icons-material/Mic';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';

// Services
import { archiveEmail, fetchEmails, getEmailById, getTotalEmailCount, moveToRead, type EmailsResponse } from '../services/gmailService';
import { Email, EmailActionType, TodoTask } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';
import ActionSelector from '../components/ActionSelector';
import TodoList from '../components/TodoList';
import GmailAuth from '../components/GmailAuth';
import EmptyState from '../components/EmptyState';
import { useEmail } from '../context/EmailContext';
import { fixEncodingIssues } from '../utils/textFormatter';
import Layout from '../components/Layout';

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);
  // Search removed
  // const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<EmailActionType>('archive');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingAction, setRecordingAction] = useState<EmailActionType | null>(null);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [previousEmailId, setPreviousEmailId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const { setIsRecorderOpen } = useEmail();
  const [showEmailList, setShowEmailList] = useState(true);
  const [refreshingEmails, setRefreshingEmails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchEmailsList = useCallback(async (pageToken?: string) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response: EmailsResponse = await fetchEmails(pageToken);
      if (pageToken) {
        setEmails(prev => [...prev, ...response.emails]);
      } else {
        setEmails(response.emails as Email[]);
      }
      setNextPageToken(response.nextPageToken || null);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchEmailsList();
  }, [isAuthenticated, fetchEmailsList]);

  const handleAuthStateChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEmails = emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to get initial avatar text
  const getAvatarInitial = (from: string | {name?: string, email: string}) => {
    if (typeof from === 'string') {
      return from.charAt(0).toUpperCase();
    } 
    
    if (from && typeof from === 'object') {
      if (from.name && from.name.length > 0) {
        return from.name.charAt(0).toUpperCase();
      }
      if (from.email && from.email.length > 0) {
        return from.email.charAt(0).toUpperCase();
      }
    }
    
    return '?';
  };

  // Format email body with proper spacing and handling encoding issues
  const formatEmailBody = (body: string) => {
    if (!body) return null;
    
    // Apply comprehensive encoding fixes from our utility
    const processedBody = fixEncodingIssues(body);
    
    // Split by lines and format each line
    return processedBody.split('\n').map((line, i) => {
      // Handle quoted text (lines starting with '>')
      if (line.trim().startsWith('>')) {
        return (
          <Typography 
            key={i} 
            variant="body2" 
            component="div"
            sx={{ 
              pl: 2, 
              borderLeft: '2px solid', 
              borderColor: 'divider',
              color: 'text.secondary',
              my: 0.5,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {line.replace(/^>\s*/, '')}
          </Typography>
        );
      }
      
      // Handle email signatures (lines with -- or __)
      if (line.trim() === '--' || line.trim() === '__') {
        return (
          <Box key={i}>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              {/* Signature section */}
            </Typography>
          </Box>
        );
      }
      
      // Regular text
      return line.trim() === '' ? 
        <Box key={i} sx={{ height: '0.75em' }} /> : 
        <Typography 
          key={i} 
          variant="body2" 
          sx={{ 
            mb: 1,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}
        >
          {line}
        </Typography>;
    });
  };

  // Check if email is unread
  const isUnread = (email: Email) => {
    // The Email interface has 'unread' property but the actual emails
    // might have either 'unread' or 'labelIds' for determining read status
    // @ts-ignore - ignore TypeScript error since we know the email object shape
    return email.unread || (email.labelIds && email.labelIds.includes('UNREAD')) || false;
  };

  // Use useCallback to prevent recreating this function on every render
  const handleEmailDetails = useCallback(async () => {
    if (!selectedEmail) return;
    try {
      // For now we have all the email details
      const fullEmail = await getEmailById(selectedEmail.id) as Email;
      if (fullEmail) {
        setSelectedEmail(fullEmail);
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
      setError('Failed to load email details');
    }
  }, [selectedEmail]);

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (isMobile) {
      setPreviousEmailId(email.id);
      setSidebarVisible(false); // Hide sidebar when email is selected on mobile
    }
  }

  const handleArchive = async (emailId: string) => {
    setArchiving(emailId);
    try {
      await archiveEmail(emailId);
      // Remove the email from the list
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      // Reset selected email if it was archived
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
        setSelectedAction('archive');
      }
      setActionSuccess('Email archived successfully');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error archiving email:', err);
      setError('Failed to archive email. Please try again.');
    } finally {
      setArchiving(null);
    }
  };

  const handleMoveToRead = async (emailId: string) => {
    try {
      setIsActionInProgress(true);
      
      // Use the moveToRead service which will find or create the To Read label
      const result = await moveToRead(emailId);
      
      if (!result.success) {
        throw new Error('Failed to move email to To Read');
      }
      
      // Update local state
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      setActionSuccess('Email moved to "To Read" label');
      setTimeout(() => setActionSuccess(null), 3000);
      setSelectedAction('archive');
    } catch (error) {
      console.error('Error moving email to To Read:', error);
      setError('Failed to move email to To Read. Please try again.');
    } finally {
      setIsActionInProgress(false);
    }
  }
  
  // Handle action selector click
  const handleTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleActionSelect = (action: EmailActionType) => {
    setSelectedAction(action);
    
    // For certain actions (archive, move-to-read), execute immediately if an email is selected
    if (selectedEmail && (action === 'archive' || action === 'move-to-read')) {
      setIsActionInProgress(true);
      handleEmailAction(action, selectedEmail)
        .then(result => {
          if (result && result.success) {
            setActionSuccess(result.message);
            setTimeout(() => setActionSuccess(null), 3000);
          }
        })
        .finally(() => {
          setIsActionInProgress(false);
        });
    }
  };

  const handleEmailAction = async (action: EmailActionType, email: Email) => {
    // Always update the selected action - this allows switching between actions
    setSelectedAction(action);
    
    // If Archive or To Read actions, execute them directly
    if (selectedEmail) {
      if (action === 'archive') {
        await handleArchive(selectedEmail.id);
        return { success: true, message: 'Email archived successfully' };
      } else if (action === 'move-to-read') {
        await handleMoveToRead(selectedEmail.id);
        return { success: true, message: 'Email moved to To Read folder' };
      }
      // Other actions (speech-to-text, quick-decline) will be handled by AudioRecorder
    }
    return { success: false, message: 'Action not handled' };
  };

  const handleBackButtonClick = () => {
    setSelectedEmail(null);
    // Also stop any active recording if user is navigating back
    if (isRecording) {
      setIsRecording(false);
      setRecordingAction(null);
    }
    // Show sidebar when going back
    if (isMobile) {
      setSidebarVisible(true);
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (isMobile) {
      setPreviousEmailId(email.id);
      setSidebarVisible(false); // Hide sidebar when email is selected on mobile
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleActionComplete = (action: EmailActionType) => {
    setSelectedAction(action);
    setShowModal(false);
  };

  const handleRefreshEmails = async () => {
    setRefreshingEmails(true);
    try {
      await fetchEmailsList();
    } catch (err) {
      console.error('Error refreshing emails:', err);
      setError('Failed to refresh emails. Please try again.');
    } finally {
      setRefreshingEmails(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!filteredEmails || filteredEmails.length === 0) return;

      switch (event.key) {
        case 'ArrowUp':
          const newUpIndex = Math.max(0, selectedEmailIndex - 1);
          setSelectedEmailIndex(newUpIndex);
          const upEmail = filteredEmails[newUpIndex];
          if (upEmail) {
            const fullEmail = await getEmailById(upEmail.id);
            setEmails(prev => prev.map(e => e.id === fullEmail.id ? fullEmail : e));
          }
          break;
        case 'ArrowDown':
          const newDownIndex = Math.min(filteredEmails.length - 1, selectedEmailIndex + 1);
          setSelectedEmailIndex(newDownIndex);
          const downEmail = filteredEmails[newDownIndex];
          if (downEmail) {
            const fullEmail = await getEmailById(downEmail.id);
            setEmails(prev => prev.map(e => e.id === fullEmail.id ? fullEmail : e));
          }
          break;
        case 'Enter':
          const email = filteredEmails[selectedEmailIndex];
          if (email) {
            handleEmailClick(email);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEmails, selectedEmailIndex]);

  useEffect(() => {
    if (filteredEmails && filteredEmails.length > selectedEmailIndex) {
      const newEmail = filteredEmails[selectedEmailIndex];
      if (newEmail && newEmail.id !== selectedEmail?.id) {
        setSelectedEmail(newEmail);
      }
    }
  }, [selectedEmailIndex, filteredEmails, selectedEmail]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(prevState => !prevState);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, p: { xs: 2, sm: 4 } }}>
          <GmailAuth onAuthStateChange={handleAuthStateChange} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}
    >
      <Header
        showBackButton={Boolean(selectedEmail || showEmailList)}
        onBack={handleBackButtonClick}
        signOut={signOut}
        loading={loading}
      />

      <Box
        id="main-content-container"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', md: sidebarWidth },
            display: { xs: showEmailList || !selectedEmail ? 'block' : 'none', md: 'block' },
            borderRight: { xs: 'none', md: '1px solid' },
            borderColor: 'divider',
            height: { xs: 'auto', md: 'calc(100vh - 64px)' },
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Sidebar content */}
          <Box
            sx={{
              p: { xs: spacing.xs, md: spacing.sm },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" component="h1">
              Inbox
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={handleRefreshEmails}
                  disabled={refreshingEmails}
                  size="small"
                >
                  {refreshingEmails ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Email list section - keep it scrollable */}
          <Box
            sx={{
              overflowY: 'auto',
              flexGrow: 1,
              height: { xs: 'calc(100vh - 180px)', md: 'calc(100vh - 128px)' }
            }}
          >
            {loading ? (
              <Box sx={{ p: spacing.md, textAlign: 'center' }}>
                <CircularProgress size={40} />
              </Box>
            ) : emails.length > 0 ? (
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmail?.id}
                onSelectEmail={handleSelectEmail}
              />
            ) : (
              <Box sx={{ p: spacing.md, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {error || "No emails found"}
                </Typography>
                {error && (
                  <Button
                    variant="outlined"
                    onClick={handleRefreshEmails}
                    sx={{ mt: 2 }}
                  >
                    Try Again
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Email content section - make sure it's scrollable */}
        <Box
          sx={{
            flexGrow: 1,
            display: { xs: !showEmailList && selectedEmail ? 'block' : 'none', md: 'block' },
            height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 64px)' },
            overflow: 'auto', // Make this area scrollable
            pb: { xs: 6, sm: 2 }, // Add bottom padding especially on mobile
          }}
        >
          {selectedEmail ? (
            <EmailContent
              email={selectedEmail}
              onAction={handleEmailAction}
              goBack={() => setSelectedEmail(null)}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: spacing.md,
              }}
            >
              <Typography color="text.secondary" align="center">
                Select an email to view its content
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Audio recording modal */}
      <Layout activeTab="home">
        <Modal
          open={showModal}
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            sx={{
              width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
              maxWidth: '800px',
              maxHeight: '90vh',
              p: { xs: spacing.xs, sm: spacing.sm, md: spacing.md },
              borderRadius: '12px',
              overflow: 'auto', // Make modal content scrollable
              outline: 'none',
            }}
          >
            {selectedAction && selectedEmail && (
              <AudioRecorder
                email={selectedEmail}
                action={selectedAction}
                onClose={handleCloseModal}
                onActionComplete={handleActionComplete}
              />
            )}
          </Paper>
        </Modal>
      </Layout>
    </Box>
  );
};

export default HomePage;