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
import { archiveEmail, fetchEmails, getEmailById, getTotalEmailCount, type EmailsResponse } from '../services/gmailService';
import { Email } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';
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
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      setNextPageToken(response.nextPageToken);
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

  const handleEmailClick = async (email: Email) => {
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
    } else {
      const fullEmail = await getEmailById(email.id);
      setEmails(prev => prev.map(e => e.id === fullEmail.id ? fullEmail : e));
      setSelectedEmail(fullEmail);
    }
  };

  const handleArchive = async (emailId: string) => {
    try {
      setArchiving(emailId);
      await archiveEmail(emailId);
      setEmails(emails => emails.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to archive email:', error);
      setError('Failed to archive email');
    } finally {
      setArchiving(null);
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
    if (selectedEmail) {
      handleEmailClick(selectedEmail);
    }
  }, [selectedEmail, handleEmailClick]);

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
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar and Inbox Count */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
        />
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Inbox
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {emails.length}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%'
      }}>
        {/* Email List */}
        <Paper 
          elevation={0}
          sx={{ 
            flex: 1, 
            maxHeight: 'calc(100vh - 250px)', 
            overflow: 'auto',
            minWidth: isMobile ? '100%' : '50%',
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

        {/* Audio Recorder */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            flexGrow: 1,
            minWidth: 0,
            flexBasis: { xs: '100%', md: 0 },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Audio Response
          </Typography>
          {selectedEmail ? (
            <AudioRecorder selectedEmail={selectedEmail} />
          ) : (
            <EmptyState type="noSelection" />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default HomePage;