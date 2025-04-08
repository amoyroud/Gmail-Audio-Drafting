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
  Tooltip
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
import TaskAltIcon from '@mui/icons-material/TaskAlt';

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
    
    // For certain actions (archive, move-to-read, task), execute immediately if an email is selected
    if (selectedEmail && (action === 'archive' || action === 'move-to-read' || action === 'task')) {
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
    if (action === 'task') {
      const newTask: TodoTask = {
        id: `task-${Date.now()}`,
        emailId: email.id,
        subject: email.subject,
        snippet: email.snippet,
        from: email.from,
        date: email.date,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      return { success: true, message: 'Email added to tasks' };
    }
    // Always update the selected action - this allows switching between actions
    setSelectedAction(action);
    
    // If Archive or To Read actions, execute them directly
    if (selectedEmail) {
      if (action === 'archive') {
        handleArchive(selectedEmail.id);
      } else if (action === 'move-to-read') {
        handleMoveToRead(selectedEmail.id);
      }
      // Other actions (speech-to-text, ai-draft, quick-decline) will be handled by AudioRecorder
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

  // Handle back navigation
  const handleBackNavigation = () => {
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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      width: '100%',
      top: 0,
      left: 0,
      paddingBottom: isMobile ? '60px' : 0 // Reserve space for mobile action bar
    }}>
      {/* Empty header - search bar removed */}

      {/* Main Content Area - Gmail Layout */}
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 64px - 60px)', // Subtract header and action bar heights
        overflow: 'hidden',
        width: '100%',
      }}>
        {/* Email List - Left Side */}
        <Box 
          sx={{
            width: { xs: '100%', md: '350px' },
            height: '100%',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
            display: { 
              xs: selectedEmail ? 
                (sidebarVisible ? 'block' : 'none') : 
                'block', 
              md: 'block' 
            },
            pt: 2 // Add padding at the top to prevent content from being cropped by app bar
          }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : filteredEmails.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No emails found
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 1, pb: 0, px: 0, width: '100%' }}>
              {filteredEmails.map((email, index) => (
                <React.Fragment key={email.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemButton
                      selected={selectedEmailIndex === index}
                      onClick={() => {
                        setSelectedEmailIndex(index);
                        handleEmailClick(email);
                      }}
                      sx={{
                        py: 1.8,
                        px: 2,
                        backgroundColor: index % 2 === 0
                          ? 'transparent'
                          : theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(144, 202, 249, 0.16)' 
                            : 'rgba(33, 150, 243, 0.08)',
                          borderLeft: '3px solid',
                          borderColor: 'primary.main',
                          pl: 1.7, // Adjust padding to accommodate the border
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.04)',
                          '.actions': {
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        {/* From and date */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.7
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '70%' }}>
                            {!isUnread(email) && (
                              <Box 
                                component="span" 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: 'primary.main', 
                                  display: 'inline-block', 
                                  mr: 1,
                                  flexShrink: 0
                                }} 
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: !isUnread(email) ? 600 : 500,
                                color: !isUnread(email) ? 'text.primary' : 'text.secondary',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {typeof email.from === 'string' ? email.from : email.from.name || email.from.email}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontWeight: !isUnread(email) ? 500 : 400, 
                              ml: 1,
                              flexShrink: 0,
                              fontSize: '0.7rem',
                              bgcolor: !isUnread(email) ? (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)') : 'transparent',
                              px: !isUnread(email) ? 0.8 : 0,
                              py: !isUnread(email) ? 0.3 : 0,
                              borderRadius: 1
                            }}
                          >
                            {formatDate(email.date)}
                          </Typography>
                        </Box>

                        {/* Subject */}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: !isUnread(email) ? 500 : 400,
                            mb: 0.7,
                            color: !isUnread(email) ? 'text.primary' : 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            letterSpacing: !isUnread(email) ? '0.01em' : 'normal'
                          }}
                        >
                          {email.subject}
                        </Typography>

                        {/* Snippet */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            opacity: 0.85,
                            height: '1.2em', // Fixed height for consistent spacing
                            lineHeight: 1.2
                          }}
                        >
                          {email.snippet}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box
                        className="actions"
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          display: 'flex',
                          gap: 1,
                          opacity: { xs: 1, sm: 0 },
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(email.id);
                          }}
                          disabled={archiving === email.id}
                        >
                          {archiving === email.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <ArchiveIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Email Content + Recorder - Right Side */}
        {(selectedEmail || !isMobile) && (
          <Box 
            sx={{ 
              flex: 1, 
              display: { 
                xs: !selectedEmail ? 
                  'none' : 
                  (sidebarVisible && isMobile ? 'none' : 'flex'), 
                md: 'flex' 
              },
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Mobile Header Bar */}
            {isMobile && selectedEmail && (
              <Box sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                position: 'sticky',
                top: 0,
                zIndex: 5,
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackNavigation}
                    sx={{ 
                      mr: 1,
                      minWidth: 'auto',
                      py: 0.5,
                      px: 1.5,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      boxShadow: 2,
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500, maxWidth: { xs: '160px', sm: '300px' } }}>
                    {selectedEmail?.subject || ''}
                  </Typography>
                </Box>
                <IconButton 
                  aria-label="toggle sidebar"
                  onClick={toggleSidebar}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
            {actionSuccess && (
              <Alert 
                severity="success" 
                sx={{ m: 2 }} 
                onClose={() => setActionSuccess(null)}
              >
                {actionSuccess}
              </Alert>
            )}

            {selectedEmail ? (
              <>
                {/* Email Header */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    flexShrink: 0
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {selectedEmail.subject}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: 'primary.main',
                          mr: 1.5,
                          fontSize: '0.875rem' 
                        }}
                      >
                        {getAvatarInitial(selectedEmail.from)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                          {typeof selectedEmail.from === 'string' ? selectedEmail.from : 
                            selectedEmail.from.name ? selectedEmail.from.name : selectedEmail.from.email}
                        </Typography>
                        {selectedEmail.from.email && (
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                            {typeof selectedEmail.from === 'string' ? '' : selectedEmail.from.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        '& svg': { ml: 0.5, opacity: 0.7, fontSize: '1rem' }
                      }}
                    >
                      {formatDate(selectedEmail.date)}
                      <AccessTimeIcon fontSize="small" />
                    </Typography>
                  </Box>
                </Paper>

                {/* Email Content */}
                <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100% - 180px)' }}>
                  {selectedEmail.body ? (
                    <Box component="div">
                      {formatEmailBody(selectedEmail.body)}
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      {selectedEmail.snippet}
                    </Typography>
                  )}
                </Box>

                {/* Audio Recorder Component */}
                <Box sx={{ p: 2, flexShrink: 0 }}>

                  <AudioRecorder 
                    selectedEmail={selectedEmail}
                    initialAction={selectedAction}
                    onActionComplete={() => {
                      setSelectedEmail(null);
                      setSelectedEmailIndex(0); // Use 0 instead of null to fix type error
                      setIsRecording(false);
                      setRecordingAction(null);
                      // Refresh emails after action if needed
                      fetchEmailsList();
                    }}
                    isRecordingFromParent={isRecording}
                    recordingAction={recordingAction}
                    onRecordingStateChange={(recording) => {
                      setIsRecording(recording);
                      if (!recording) {
                        setRecordingAction(null);
                      }
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                p: 4
              }}>
                <EmptyState 
                  type="noSelection"
                  message="Select an email from the list to get started."
                  icon="email"
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Fixed Action Bar at Bottom - Desktop Only */}
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            padding: '0 16px'
          }}
        >
        {/* Speech-to-Text Button */}
        {!selectedEmail ? (
          <Tooltip title="Select an email first">
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<MicIcon />}
              disabled={true}
            >
              Speech-to-Text
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title={isRecording && recordingAction === 'speech-to-text' ? "Click to stop recording" : "Record Speech to Text"}>
            <Button 
              variant="contained" 
              color={isRecording && recordingAction === 'speech-to-text' ? "error" : "primary"}
              startIcon={isRecording && recordingAction === 'speech-to-text' ? <StopIcon /> : <MicIcon />}
              onClick={() => {
                if (isRecording && recordingAction === 'speech-to-text') {
                  // Stop recording
                  setIsRecording(false);
                  setRecordingAction(null);
                  // The AudioRecorder component will handle the stop recording logic
                } else if (!isRecording) {
                  // Start recording for speech-to-text
                  setSelectedAction('speech-to-text');
                  setIsRecording(true);
                  setRecordingAction('speech-to-text');
                }
              }}
              disabled={isRecording && recordingAction !== 'speech-to-text'}
            >
              {isRecording && recordingAction === 'speech-to-text' ? "Stop Recording" : "Speech-to-Text"}
            </Button>
          </Tooltip>
        )}

        {/* AI Draft Button */}
        {!selectedEmail ? (
          <Tooltip title="Select an email first">
            <Button 
              variant="outlined"
              startIcon={<SmartToyIcon />}
              disabled={true}
            >
              AI Draft
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title={isRecording && recordingAction === 'ai-draft' ? "Click to stop recording" : "Generate AI Draft"}>
            <Button 
              variant="outlined"
              color={isRecording && recordingAction === 'ai-draft' ? "error" : "primary"}
              startIcon={isRecording && recordingAction === 'ai-draft' ? <StopIcon /> : <SmartToyIcon />}
              onClick={() => {
                if (isRecording && recordingAction === 'ai-draft') {
                  setIsRecording(false);
                  setRecordingAction(null);
                } else if (!isRecording) {
                  setSelectedAction('ai-draft');
                  setIsRecording(true);
                  setRecordingAction('ai-draft');
                }
              }}
              disabled={isRecording && recordingAction !== 'ai-draft'}
            >
              {isRecording && recordingAction === 'ai-draft' ? "Stop Recording" : "AI Draft"}
            </Button>
          </Tooltip>
        )}

        {/* Quick Decline Button */}
        <Tooltip title="Quick Decline">
          {!selectedEmail ? (
            <span>
              <Button 
                variant="outlined"
                startIcon={<CancelScheduleSendIcon />}
                disabled={true}
              >
                Quick Decline
              </Button>
            </span>
          ) : (
            <Button 
              variant="outlined"
              startIcon={<CancelScheduleSendIcon />}
              onClick={() => setSelectedAction('quick-decline')}
            >
              Quick Decline
            </Button>
          )}
        </Tooltip>

        {/* Move to Read Button */}
        <Tooltip title="Move to Read">
          {!selectedEmail || isActionInProgress ? (
            <span>
              <Button 
                variant="outlined"
                startIcon={<BookmarkIcon />}
                disabled={true}
              >
                Move to Read
              </Button>
            </span>
          ) : (
            <Button 
              variant="outlined"
              startIcon={<BookmarkIcon />}
              onClick={() => handleActionSelect('move-to-read')}
            >
              Move to Read
            </Button>
          )}
        </Tooltip>

        {/* Archive Button */}
        <Tooltip title="Archive">
          <span>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArchiveIcon />}
              disabled={!selectedEmail}
              onClick={() => {
                if (selectedEmail) handleArchive(selectedEmail.id);
              }}
            >
              Archive
            </Button>
          </span>
        </Tooltip>

        {/* Task Actions Button */}
        <Tooltip title="Create Task">
          <span>
            <Button
              variant="outlined"
              startIcon={<TaskAltIcon />}
              disabled={!selectedEmail}
              onClick={() => {setSelectedAction('task');
              }}
            >
              Task
            </Button>
          </span>
        </Tooltip>
        </Box>
      )}

      {/* Fixed Bottom Action Bar for Mobile */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            zIndex: theme.zIndex.appBar - 1,
            backgroundColor: theme.palette.background.paper,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2
          }}
        >
          {/* Speech-to-Text */}
          <IconButton
            color="primary"
            disabled={!selectedEmail}
            onClick={() => {
              if (selectedEmail) {
                if (isRecording && recordingAction === 'speech-to-text') {
                  setIsRecording(false);
                  setRecordingAction(null);
                } else if (!isRecording) {
                  setSelectedAction('speech-to-text');
                  setIsRecording(true);
                  setRecordingAction('speech-to-text');
                }
              }
            }}
            sx={{
              bgcolor: isRecording && recordingAction === 'speech-to-text' ? 'error.main' : 'transparent',
              color: isRecording && recordingAction === 'speech-to-text' ? 'white' : 'primary.main'
            }}
          >
            {isRecording && recordingAction === 'speech-to-text' ? <StopIcon /> : <MicIcon />}
          </IconButton>

          {/* Quick Decline */}
          <IconButton
            color="primary"
            disabled={!selectedEmail}
            onClick={() => {
              if (selectedEmail) {
                setSelectedAction('quick-decline');
              }
            }}
          >
            <CancelScheduleSendIcon />
          </IconButton>

          {/* Move to Read */}
          <IconButton
            color="primary"
            disabled={!selectedEmail || isActionInProgress}
            onClick={() => {
              if (selectedEmail) {
                handleActionSelect('move-to-read');
              }
            }}
          >
            <BookmarkIcon />
          </IconButton>

          {/* Archive */}
          <IconButton
            color="primary"
            disabled={!selectedEmail}
            onClick={() => {
              if (selectedEmail) handleArchive(selectedEmail.id);
            }}
          >
            <ArchiveIcon />
          </IconButton>

          {/* Task */}
          <IconButton
            color="primary"
            disabled={!selectedEmail}
            onClick={() => {
              if (selectedEmail) {
                setSelectedAction('task');
              }
            }}
          >
            <TaskAltIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;