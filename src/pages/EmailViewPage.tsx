import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  Tooltip,
  Divider,
  Alert,
  TextField,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import SendIcon from '@mui/icons-material/Send';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useNavigate, useParams } from 'react-router-dom';
import { Email, EmailActionType } from '../types/types';
import { getEmailById, createDraft, archiveEmail } from '../services/gmailService';
import AudioRecorder from '../components/AudioRecorder';
import { useEmail } from '../context/EmailContext';
import { Fab, useMediaQuery, useTheme } from '@mui/material';

const EmailViewPage: React.FC = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftReply, setDraftReply] = useState('');
  const [showArchiveButton, setShowArchiveButton] = useState(false);
  const { setSelectedEmail, setIsRecorderOpen } = useEmail();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Don't clear the selected email until we have the new one
    console.log('EmailViewPage - useEffect triggered with emailId:', emailId);
    console.log('EmailViewPage - Component props:', { emailId });
    
    // Track if this component is still mounted
    let isMounted = true;
    
    const fetchEmailDetails = async () => {
      if (!emailId) return;
      
      console.log('EmailViewPage - Fetching email details for ID:', emailId);
      try {
        const emailData = await getEmailById(emailId);
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        console.log('EmailViewPage - Email data fetched successfully:', emailData.id, emailData.subject);
        
        // Set the email in local state
        setEmail(emailData);
        
        // Set the email in global context for other components to access
        console.log('EmailViewPage - About to set selectedEmail in context');
        setSelectedEmail(emailData);
        console.log('EmailViewPage - Selected email set in context:', emailData.id);
        
        // If we're on mobile, tell the Layout component about the current email ID
        if (isMobile) {
          // Add the email ID to sessionStorage for temporary fallback
          sessionStorage.setItem('currentEmailId', emailData.id);
          console.log('EmailViewPage - Saved email ID to sessionStorage:', emailData.id);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching email details:', err);
        setError('Failed to load email details');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchEmailDetails();
    
    // Clean up function
    return () => {
      isMounted = false;
      
      // Fix: Only remove the currentEmailId from sessionStorage if we're *really* navigating away,
      // not during re-renders or route changes to the same email
      const currentPath = window.location.pathname;
      
      // Don't remove the email from sessionStorage during component unmounts that are part of
      // the same email view (like when navigating between the same email routes or during re-renders)
      if (isMobile && (!currentPath.includes('/email/') || (emailId && !currentPath.includes(emailId)))) {
        console.log('EmailViewPage - Actually navigating away to another page, safe to remove from sessionStorage');
        sessionStorage.removeItem('currentEmailId');
      } else {
        console.log('EmailViewPage - Not navigating away or rendering the same email, keeping sessionStorage intact');
      }
    };
  }, [emailId, setSelectedEmail, isMobile]);

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftReply(e.target.value);
  };

  const handleDraftSaved = () => {
    setSuccess('Draft saved successfully!');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!email) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>Email not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      maxWidth: 1200, 
      mx: 'auto',
      display: 'flex',
      gap: { xs: 0, md: 3 },
      flexDirection: { xs: 'column', md: 'row' },
      height: 'calc(100vh - 120px)',
      overflow: 'hidden'
    }}>
      <script type="application/json" id="current-email-id">{JSON.stringify({ emailId: email.id })}</script>
      <Paper sx={{ 
        p: { xs: 1.5, sm: 3 }, 
        mb: { xs: 3, md: 0 }, 
        backgroundColor: theme.palette.background.paper,
        flex: { xs: '1 1 auto', md: '0 0 65%' },
        overflowY: 'auto',
        height: isMobile ? 'calc(100% - 16px)' : '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ mb: { xs: 1.5, sm: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
          <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 0 } }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontSize: { xs: '1.15rem', sm: '1.25rem' },
                fontWeight: 600,
                color: 'text.primary',
                lineHeight: 1.3
              }}
            >
              {email.subject}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    fontWeight: 500
                  }}
                >
                  {`From: ${email.from.name || email.from.email}`}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }
                }}
              >
                {new Date(email.date).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: { xs: 1, sm: 2 } }} />
        <Typography 
          variant="body1" 
          component="div" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            color: 'text.primary',
            overflowWrap: 'break-word',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            flex: 1,
            overflow: 'auto',
            maxHeight: isMobile ? 'calc(100vh - 200px)' : 'none', 
            mb: isMobile ? '60px' : 0, 
            '& a': { 
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            },
            '& p': {
              marginBottom: 2
            },
            '& ul, & ol': {
              marginLeft: 3,
              marginBottom: 2
            },
            '& li': {
              marginBottom: 1
            },
            '& hr': {
              margin: '16px 0',
              border: 'none',
              borderTop: `1px solid ${theme.palette.divider}`
            }
          }}
          dangerouslySetInnerHTML={{
            __html: email.body
              .split(/\r?\n/)
              .map(line => {
                // Convert URLs to clickable links
                return line
                  .replace(/^\s+/, match => '&nbsp;'.repeat(match.length)) // Preserve leading spaces
                  .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;') // Convert tabs to spaces
                  .replace(
                    /(https?:\/\/[^\s<]+)/g,
                    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
                  );
              })
              .join('<br />')
              .replace(/(<br \/>){3,}/g, '<br /><br />') // Reduce multiple line breaks to max two
              .replace(/•/g, '&bull;') // Convert bullet points to HTML entity
          }}
        />
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {!isMobile && (
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor: theme.palette.background.paper,
          flex: { md: '0 0 35%' },
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <AudioRecorder
            selectedEmail={email}
            onDraftSaved={handleDraftSaved}
          />
        </Paper>
      )}

      {editMode ? (
        <Paper sx={{ mt: 3, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
              placeholder="Type your reply..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                }
              }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={() => {
                  createDraft({
                    to: email.from.email,
                    subject: `Re: ${email.subject}`,
                    body: draftReply
                  });
                  handleDraftSaved();
                }}
              >
                Save Draft
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : null}
    </Box>
  );
};

export default EmailViewPage; 