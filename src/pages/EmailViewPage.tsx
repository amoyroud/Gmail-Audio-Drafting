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
    setSelectedEmail(undefined); // Clear any previously selected email
    
    const fetchEmailDetails = async () => {
      if (!emailId) return;
      
      try {
        const emailData = await getEmailById(emailId);
        setEmail(emailData);
        setSelectedEmail(emailData); // Set the email in context
      } catch (err) {
        console.error('Error fetching email details:', err);
        setError('Failed to load email details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmailDetails();
  }, [emailId, setSelectedEmail]);

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