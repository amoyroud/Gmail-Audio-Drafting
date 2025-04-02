import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
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
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

// Services
import { fetchEmails } from '../services/gmailService';
import { Email } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';

type SortOption = 'date' | 'sender' | 'subject';
type FilterOption = 'all' | 'unread' | 'read';

const HomePage: React.FC = () => {
  console.log('HomePage: Component rendering');
  
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Memoize the token getter to prevent unnecessary re-renders
  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }, [getAccessTokenSilently]);

  const fetchEmailsList = useCallback(async (mounted: boolean) => {
    console.log('HomePage: Fetching emails, mounted:', mounted);
    if (!mounted) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('HomePage: Getting access token');
      const token = await getToken();
      console.log('HomePage: Got access token, fetching emails');
      const emailList = await fetchEmails(token);
      console.log('HomePage: Got emails:', emailList.length);
      if (mounted) {
        setEmails(emailList);
      }
    } catch (err) {
      console.error('HomePage: Error fetching emails:', err);
      if (mounted) {
        setError('Failed to load emails. Please try again.');
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [getToken]);

  // Use a ref to track if we've already fetched emails
  const initialFetchDone = React.useRef(false);

  useEffect(() => {
    console.log('HomePage: useEffect running, initialFetchDone:', initialFetchDone.current);
    let mounted = true;
    
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchEmailsList(mounted);
    }

    return () => {
      console.log('HomePage: useEffect cleanup');
      mounted = false;
    };
  }, [fetchEmailsList]);

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    navigate(`/email/${email.id}`);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h5" component="h1">
          Your Inbox
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sort options">
            <IconButton>
              <SortIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search emails"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter by</InputLabel>
              <Select
                value={filterBy}
                label="Filter by"
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="read">Read</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="sender">Sender</MenuItem>
                <MenuItem value="subject">Subject</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Email List */}
        <Paper sx={{ 
          flex: 1, 
          maxHeight: 'calc(100vh - 200px)', 
          overflow: 'auto',
          minWidth: isMobile ? '100%' : '50%'
        }}>
          <List>
            {filteredEmails.map((email, index) => (
              <React.Fragment key={email.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={selectedEmail?.id === email.id}
                    onClick={() => handleEmailClick(email)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            component="span" 
                            variant="subtitle1"
                            sx={{ fontWeight: email.unread ? 'bold' : 'normal' }}
                          >
                            {email.from.name || email.from.email}
                          </Typography>
                          <Typography 
                            component="span" 
                            variant="body2" 
                            color="text.secondary"
                          >
                            {formatDate(email.date)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            component="div" 
                            variant="body2"
                            sx={{ fontWeight: email.unread ? 'bold' : 'normal' }}
                          >
                            {email.subject}
                          </Typography>
                          <Typography 
                            component="div"
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {email.snippet}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < filteredEmails.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Audio Recorder and Draft Section */}
        {selectedEmail && (
          <Box sx={{ 
            flex: 1, 
            minWidth: isMobile ? '100%' : '50%'
          }}>
            <AudioRecorder 
              selectedEmail={selectedEmail}
              onDraftSaved={() => {
                // Optionally refresh the email list or update the selected email's status
                setSelectedEmail(null);
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage; 