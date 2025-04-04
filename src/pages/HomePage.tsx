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
  ListItemButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';

// Services
import { archiveEmail, fetchEmails, getEmailById, getTotalEmailCount, moveToRead, type EmailsResponse } from '../services/gmailService';
import { Email, EmailActionType, TodoTask } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';
import ActionSelector from '../components/ActionSelector';
import TodoList from '../components/TodoList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GmailAuth from '../components/GmailAuth';
import EmptyState from '../components/EmptyState';
import { useEmail } from '../context/EmailContext';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<EmailActionType>('archive');
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [previousEmailId, setPreviousEmailId] = useState<string | null>(null);
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

  const filteredEmails = emails
    .filter(email => {
      return searchQuery === '' || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Use useCallback to prevent recreating this function on every render
  const handleEmailClick = useCallback(async (email: Email) => {
    try {
      // Don't unselect an email when clicking it again
      // This prevents the flickering effect
      if (selectedEmail?.id !== email.id) { 
        // Show loading state if needed
        const fullEmail = await getEmailById(email.id);
        setEmails(prev => prev.map(e => e.id === fullEmail.id ? fullEmail : e));
        setSelectedEmail(fullEmail);
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
      setError('Failed to load email details');
    }
  }, [selectedEmail]);

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

  // This effect is not needed and creates a circular dependency
  // We've removed it to prevent flickering
  // useEffect(() => {
  //  if (selectedEmail) {
  //    handleEmailClick(selectedEmail);
  //  }
  // }, [selectedEmail, handleEmailClick]);

  useEffect(() => {
    if (filteredEmails && filteredEmails.length > selectedEmailIndex) {
      const newEmail = filteredEmails[selectedEmailIndex];
      if (newEmail && newEmail.id !== selectedEmail?.id) {
        setSelectedEmail(newEmail);
      }
    }
  }, [selectedEmailIndex, filteredEmails, selectedEmail]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 8,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <Box 
          component="img"
          src="/logo.png"
          alt="Audio Email Assistant Logo"
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 3,
            opacity: 0.9
          }}
        />
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            mb: 2,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Audio Email Assistant
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, maxWidth: 450, color: 'text.secondary' }}>
          Record your voice to draft email responses quickly and efficiently. Sign in with your Gmail account to get started.
        </Typography>
        <GmailAuth onAuthStateChange={handleAuthStateChange} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '1600px', mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Search Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <TextField
              fullWidth
              placeholder="Search emails..."
              variant="standard"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mx: 1,
                '& .MuiInputBase-root': {
                  height: 40,
                }
              }}
            />
          </Paper>

          {/* Action Controls - now positioned ABOVE the email list */}
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              mb: 3
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Email Response
            </Typography>
            
            {actionSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {actionSuccess}
              </Alert>
            )}
            
            {selectedEmail ? (
            (selectedAction === 'speech-to-text' || selectedAction === 'ai-draft' || selectedAction === 'quick-decline') ? (
              <AudioRecorder 
                selectedEmail={selectedEmail} 
                initialAction={selectedAction}
                onActionComplete={() => setSelectedAction('archive')}
              />
            ) : (
              <EmptyState 
                type="noSelection" 
                message="Select an action mode below"
                icon="inbox"
              />
            )
          ) : (
            <EmptyState 
              type="noSelection" 
              message="Select an email from the list below"
              icon="inbox"
            />
          )}
        </Paper>

        {/* Action Selector Bar - now between email response and list */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Select Action Mode
            </Typography>
            <ActionSelector
              selectedAction={selectedAction}
              onActionSelect={handleActionSelect}
              onActionExecute={(action) => {
                if (selectedEmail) {
                  handleEmailAction(action, selectedEmail);
                }
              }}
              disabled={isActionInProgress}
            />
          </Box>
        </Paper>

        {/* Email List - now positioned at the bottom */}
        <Paper 
          elevation={0}
          sx={{ 
            width: '100%',
            maxHeight: 'calc(100vh - 550px)', /* Adjust height to fit screen with other elements */
            minHeight: '300px',
            overflow: 'auto',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider'
          }}
          tabIndex={0}
        >
          <List sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 2 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ p: 2 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            ) : filteredEmails.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography>No emails found</Typography>
              </Box>
            ) : (
              filteredEmails.map((email, index) => (
                <React.Fragment key={email.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemButton 
                      onClick={() => {
                        setSelectedEmailIndex(index);
                        handleEmailClick(email);
                      }}
                      selected={index === selectedEmailIndex}
                      sx={{
                        p: 2,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        minHeight: '100px',
                        '&:hover': {
                          '& .actions': {
                            opacity: 1
                          }
                        },
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                          p: 3,
                          minHeight: '300px',
                          '&:hover': {
                            bgcolor: 'action.selected'
                          }
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: email.unread ? 600 : 400,
                              color: email.unread ? 'text.primary' : 'text.secondary'
                            }}
                          >
                            {typeof email.from === 'string' ? email.from : email.from.email}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 'auto' }}
                          >
                            {formatDate(email.date)}
                          </Typography>
                        </Box>

                        {/* Subject */}
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: 'text.primary'
                          }}
                        >
                          {email.subject}
                        </Typography>

                        {/* Content */}
                        {index === selectedEmailIndex ? (
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'text.primary',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.7,
                              mt: 2
                            }}
                          >
                            {email.body}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {email.snippet}
                          </Typography>
                        )}
                      </Box>

                      {/* Actions */}
                      <Box
                        className="actions"
                        sx={{
                          position: 'absolute',
                          right: 16,
                          top: 16,
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
                            <CircularProgress size={20} />
                          ) : (
                            <ArchiveIcon />
                          )}
                        </IconButton>
                      </Box>
                    </ListItemButton>

                  </ListItem>
                </React.Fragment>
              ))
            )}
          </List>
          {nextPageToken && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fetchEmailsList(nextPageToken)}
                sx={{ textTransform: 'none' }}
              >
                Load More
              </Button>
            </Box>
          )}
        </Paper>
        </Box>

        {/* Task List Panel */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TodoList
            tasks={tasks}
            onTaskComplete={handleTaskComplete}
            onTaskDelete={handleTaskDelete}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;