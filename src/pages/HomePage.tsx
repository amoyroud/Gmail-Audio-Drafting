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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

// Services
import { fetchEmails, archiveEmail, signOut } from '../services/gmailService';
import { Email } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';
import GmailAuth from '../components/GmailAuth';
import ThemeToggle from '../components/ThemeToggle';
import EmptyState from '../components/EmptyState';
import { useEmail } from '../context/EmailContext';

type SortOption = 'date' | 'sender' | 'subject';
type FilterOption = 'all' | 'unread' | 'read';

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
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
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

  // Filter and sort emails
  const filteredEmails = emails
    .filter(email => {
      // Apply search filter
      const searchMatch = searchQuery === '' || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply read/unread filter
      const readMatch = filterBy === 'all' || 
        (filterBy === 'unread' && email.unread) ||
        (filterBy === 'read' && !email.unread);

      return searchMatch && readMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'sender':
          return (a.from.name || a.from.email).localeCompare(b.from.name || b.from.email);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        default:
          return 0;
      }
    });

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
      {/* Header with app name and sign out */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: { xs: 2, sm: 2 },
        flexDirection: { xs: isMobile ? 'column' : 'row', sm: 'row' },
        width: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          width: { xs: isMobile ? '100%' : 'auto', sm: 'auto' },
          justifyContent: { xs: isMobile ? 'center' : 'flex-start', sm: 'flex-start' }
        }}>
          <Box 
            component="img"
            src="/logo.png"
            alt="Audio Email Assistant Logo"
            sx={{ 
              width: 32, 
              height: 32,
              display: { xs: 'none', sm: 'block' }
            }}
          />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}
          >
            Audio Email Assistant
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: { xs: isMobile ? '100%' : 'auto', sm: 'auto' },
          justifyContent: { xs: isMobile ? 'center' : 'flex-end', sm: 'flex-end' }
        }}>
          <ThemeToggle />
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => signOut().then(() => setIsAuthenticated(false))}
            startIcon={<Box component="span" sx={{ fontSize: '1.2rem' }}>👋</Box>}
            sx={{ borderRadius: '20px' }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

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

      {/* Search and Filters */}
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
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          width: '100%',
          flexDirection: { xs: isMobile ? 'column' : 'row', sm: 'row' }
        }}>
          <TextField
            placeholder="Search emails"
            variant="outlined"
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
            sx={{ 
              flexGrow: 1,
              width: { xs: isMobile ? '100%' : 'auto', sm: 'auto' }
            }}
          />
          <Tooltip title="Show filters">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "primary" : "default"}
              sx={{ 
                border: '1px solid',
                borderColor: showFilters ? 'primary.main' : 'divider',
                borderRadius: '8px',
                p: 1
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>

      {showFilters && (
        <Box 
          sx={{ 
            mt: 2, 
            pt: 2,
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'primary.main' },
              }
            }}
          >
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              startAdornment={<SortIcon sx={{ ml: 1, mr: 1, fontSize: '1.2rem', color: 'action.active' }} />}
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="sender">Sender</MenuItem>
              <MenuItem value="subject">Subject</MenuItem>
            </Select>
          </FormControl>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'primary.main' },
              }
            }}
          >
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterBy}
              label="Filter"
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              startAdornment={<FilterListIcon sx={{ ml: 1, mr: 1, fontSize: '1.2rem', color: 'action.active' }} />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
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
              type={searchQuery || filterBy !== 'all' ? 'noResults' : 'noEmails'}
              onAction={() => {
                setSearchQuery('');
                setFilterBy('all');
                setSortBy('date');
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
              actionLabel={searchQuery || filterBy !== 'all' ? 'Clear Filters' : 'Refresh'}
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