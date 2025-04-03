import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArchiveIcon from '@mui/icons-material/Archive';
import MicIcon from '@mui/icons-material/Mic';
import { Email } from '../types/types';
import { getEmailById, createDraft, archiveEmail } from '../services/gmailService';
import { useNavigate } from 'react-router-dom';
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
  }, [emailId]);

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
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontSize: '1.25rem',
                fontWeight: 500,
                color: 'text.primary'
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
                  variant="subtitle2" 
                  sx={{ 
                    color: 'text.primary',
                    fontWeight: 500
                  }}
                >
                  {email.from.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ color: 'text.secondary' }}
                >
                  {email.from.email && `<${email.from.email}>`}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ color: 'text.secondary' }}
              >
                {new Date(email.date).toLocaleString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Archive">
              <IconButton
                onClick={async () => {
                  try {
                    if (emailId) {
                      await archiveEmail(emailId);
                      // Show success message
                      setSuccess('Email archived successfully');
                      // Navigate back to inbox after a short delay
                      setTimeout(() => navigate('/'), 1500);
                    }
                  } catch (error) {
                    setError('Failed to archive email');
                  }
                }}
                color="inherit"
                sx={{ ml: 1 }}
              >
                <ArchiveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography 
          variant="body1" 
          component="div" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
            '& a': { 
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }
          }}
          dangerouslySetInnerHTML={{
            __html: email.body.split('\n').map(line => {
              // Convert URLs to clickable links
              return line.replace(
                /(https?:\/\/[^\s<]+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
              );
            }).join('<br />')
          }}
        />
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Record Response FAB */}
      <Fab
        color="primary"
        aria-label="record response"
        onClick={() => setIsRecorderOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <MicIcon />
      </Fab>

      {editMode ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
              placeholder="Type your reply..."
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
                }}
              >
                Save Draft
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
};

export default EmailViewPage; 