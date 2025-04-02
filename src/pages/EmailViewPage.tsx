import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  TextField,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Services
import { getEmailById, createDraft } from '../services/gmailService';
import { transcribeSpeech } from '../services/elevenlabsService';
import { generateDraftResponse } from '../services/mistralService';
import { Email } from '../types/types';

const EmailViewPage: React.FC = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [draftReply, setDraftReply] = useState('');
  const [processingAudio, setProcessingAudio] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchEmailDetails = async () => {
      if (!emailId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = await getAccessTokenSilently();
        const emailData = await getEmailById(token, emailId);
        setEmail(emailData);
      } catch (err) {
        console.error('Error fetching email details:', err);
        setError('Failed to load email details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmailDetails();
  }, [emailId, getAccessTokenSilently]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        processAudioToText(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processAudioToText = async (audioBlob: Blob) => {
    setProcessingAudio(true);
    setError(null);
    
    try {
      const text = await transcribeSpeech(audioBlob);
      setTranscription(text);
      
      // Once we have transcription, generate a draft reply
      await generateReply(text);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setProcessingAudio(false);
    }
  };

  const generateReply = async (transcribedText: string) => {
    if (!email) return;
    
    setGeneratingDraft(true);
    setError(null);
    
    try {
      const draft = await generateDraftResponse({
        transcribedText,
        emailSubject: email.subject,
        emailBody: email.body,
        senderName: email.from.name || email.from.email
      });
      
      setDraftReply(draft);
      setEditMode(true);
    } catch (err) {
      console.error('Error generating draft:', err);
      setError('Failed to generate draft reply. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!email || !draftReply) return;
    
    setSavingDraft(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = await getAccessTokenSilently();
      await createDraft(token, {
        to: email.from.email,
        subject: `Re: ${email.subject}`,
        body: draftReply
      });
      
      setSuccess('Draft saved successfully! You can review and send it from your Gmail account.');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
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
        <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Inbox
        </Button>
      </Box>
    );
  }

  if (!email) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>Email not found.</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Inbox
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          edge="start" 
          onClick={() => navigate('/')}
          aria-label="back to inbox"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ ml: 1 }}>
          View Email
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {email.subject}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexDirection: isMobile ? 'column' : 'row',
          mb: 2
        }}>
          <Typography variant="body2">
            From: <strong>{email.from.name || email.from.email}</strong> {email.from.name ? `<${email.from.email}>` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(email.date)}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {email.body}
        </Typography>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Record Your Response
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            {!isRecording ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<MicIcon />}
                onClick={startRecording}
                disabled={isRecording || processingAudio || generatingDraft}
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<StopIcon />}
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            )}
          </Box>

          {processingAudio && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Transcribing audio...</Typography>
            </Box>
          )}

          {transcription && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transcription:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2">{transcription}</Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {transcription && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2 
            }}>
              <Typography variant="h6">
                AI Generated Draft
              </Typography>
              <Box>
                <IconButton 
                  size="small" 
                  onClick={() => setEditMode(!editMode)}
                  color={editMode ? "primary" : "default"}
                  title="Edit draft"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => navigator.clipboard.writeText(draftReply)}
                  title="Copy to clipboard"
                >
                  <ContentCopyIcon />
                </IconButton>
              </Box>
            </Box>

            {generatingDraft ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>Generating draft reply...</Typography>
              </Box>
            ) : editMode ? (
              <TextField
                fullWidth
                multiline
                rows={8}
                value={draftReply}
                onChange={(e) => setDraftReply(e.target.value)}
                variant="outlined"
                placeholder="Your AI-generated draft will appear here"
              />
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {draftReply || "Your AI-generated draft will appear here"}
                </Typography>
              </Paper>
            )}

            {draftReply && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={handleSaveDraft}
                  disabled={savingDraft || !draftReply}
                >
                  {savingDraft ? 'Saving...' : 'Save as Draft in Gmail'}
                </Button>
              </Box>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmailViewPage; 