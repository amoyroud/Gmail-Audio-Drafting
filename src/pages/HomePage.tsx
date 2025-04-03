import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';

// Services
import { fetchEmails, archiveEmail } from '../services/gmailService';
import { Email } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';
import GmailAuth from '../components/GmailAuth';
import EmptyState from '../components/EmptyState';
import { useEmail } from '../context/EmailContext';



const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null); // Track which email is being archived
  const { selectedEmail, setSelectedEmail, setIsRecorderOpen } = useEmail();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchEmailsList = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const emailList = await fetchEmails();
        setEmails(emailList);
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError('Failed to load emails. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmailsList();
  }, [isAuthenticated]);

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

  // Filter emails by search query and sort by date (newest first)
  const filteredEmails = emails
    .filter(email => {
      // Apply search filter
      return searchQuery === '' || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto', overflowX: 'hidden' }}>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
          width: '100%'
        }}
      >
        <TextField
          placeholder="Search emails"
          variant="outlined"
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon color="action" sx={{ mr: 1 }} />
            ),
            sx: { 
              borderRadius: '8px',
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: 'primary.main' },
            }
          }}
        />
      </Paper>

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
      >
        <List sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredEmails.length === 0 ? (
            <EmptyState 
              type={searchQuery ? 'noResults' : 'noEmails'}
              onAction={() => {
                setSearchQuery('');
                // Refresh emails
                setLoading(true);
                fetchEmails().then(emailList => {
                  setEmails(emailList);
                  setLoading(false);
                }).catch(err => {
                  console.error('Error fetching emails:', err);
                  setError('Failed to load emails. Please try again.');
                  setLoading(false);
                });
              }}
              actionLabel={searchQuery ? 'Clear Search' : 'Refresh'}
            />
          ) : (
            filteredEmails.map((email, index) => (
              <React.Fragment key={email.id}>
                {index > 0 && <Divider />}
                <ListItemButton 
                  selected={selectedEmail?.id === email.id}
                  onClick={() => navigate(`/email/${email.id}`)}
                  disabled={archiving === email.id}
                  sx={{
                    py: 1.5,
                    pl: 2,
                    pr: 7,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.04)'
                    },
                    ...(email.unread && {
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(25, 118, 210, 0.04)'
                    }),
                    ...(!email.unread && {
                      borderLeft: '4px solid transparent'
                    })
                  }}
                >
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ mb: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: email.unread ? 600 : 500,
                            color: email.unread ? 'text.primary' : 'text.secondary',
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          {email.unread && (
                            <Box 
                              component="span" 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                display: 'inline-block'
                              }}
                            />
                          )}
                          {email.subject}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: email.unread ? 'text.primary' : 'text.secondary',
                              fontWeight: email.unread ? 500 : 400
                            }}
                          >
                            {email.from.name || email.from.email}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontWeight: email.unread ? 500 : 400
                            }}
                          >
                            {formatDate(email.date)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          opacity: email.unread ? 0.9 : 0.7
                        }}
                      >
                        {email.snippet}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Archive">
                      <IconButton
                        edge="end"
                        aria-label="archive"
                        onClick={async (e) => {
                          e.stopPropagation(); // Prevent navigation
                          try {
                            setArchiving(email.id);
                            await archiveEmail(email.id);
                            // Remove the email from the list
                            setEmails(emails.filter(e => e.id !== email.id));
                          } catch (error) {
                            setError('Failed to archive email');
                          } finally {
                            setArchiving(null);
                          }
                        }}
                        disabled={archiving === email.id}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        {archiving === email.id ? <CircularProgress size={20} /> : <ArchiveIcon />}
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </React.Fragment>
            ))
          )}
        </List>
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