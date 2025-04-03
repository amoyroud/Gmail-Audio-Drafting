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
  TextField
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Email } from '../types/types';
import { getEmailById, createDraft } from '../services/gmailService';
import AudioRecorder from '../components/AudioRecorder';

const EmailViewPage: React.FC = () => {
  const { emailId } = useParams<{ emailId: string }>();
  
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftReply, setDraftReply] = useState('');

  useEffect(() => {
    const fetchEmailDetails = async () => {
      if (!emailId) return;
      
      try {
        const emailData = await getEmailById(emailId);
        setEmail(emailData);
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
        <Typography variant="h6">{email.subject}</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          From: {email.from.name} ({email.from.email})
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1">{email.body}</Typography>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <AudioRecorder
        selectedEmail={email}
        onDraftSaved={handleDraftSaved}
      />

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