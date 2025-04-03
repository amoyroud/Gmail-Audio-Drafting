import React, { useState, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
  Alert,
  Tooltip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';

// Services
import { transcribeSpeech } from '../services/elevenlabsService';
import { generateDraftResponse } from '../services/mistralService';
import { createDraft, sendEmail } from '../services/gmailService';
import { Email, DraftGenerationParams } from '../types/types';

// Supported audio formats for ElevenLabs API
const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/mpeg'
];

interface AudioRecorderProps {
  selectedEmail: Email;
  onDraftSaved?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ selectedEmail, onDraftSaved }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [draftReply, setDraftReply] = useState('');
  const [processingAudio, setProcessingAudio] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Find the first supported MIME type
      const mimeType = SUPPORTED_MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      console.log('Using audio format:', mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128 kbps
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Recording stopped. Blob type:', audioBlob.type, 'size:', audioBlob.size);
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
    setGeneratingDraft(true);
    setError(null);
    
    try {
      const params: DraftGenerationParams = {
        transcribedText,
        emailSubject: selectedEmail?.subject || '',
        emailBody: selectedEmail?.body || '',
        senderName: selectedEmail?.from.name || selectedEmail?.from.email || ''
      };
      
      const draft = await generateDraftResponse(params);
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
    setSavingDraft(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate we have the necessary data
      if (!selectedEmail?.from?.email) {
        throw new Error('No recipient email address found');
      }
      if (!selectedEmail?.subject) {
        throw new Error('No subject found');
      }
      if (!draftReply) {
        throw new Error('Draft reply is empty');
      }

      // Log the original email format
      console.log('Original from email:', selectedEmail.from.email);
      
      // Extract just the email address part
      let recipientEmail = selectedEmail.from.email;
      
      // First try to extract email from angle brackets format
      const emailMatch = recipientEmail.match(/<([^>]+)>/)?.[1];
      if (emailMatch) {
        recipientEmail = emailMatch;
      } else {
        // If no angle brackets, take the last part after space (assuming "Name email@domain.com" format)
        const parts = recipientEmail.split(' ');
        recipientEmail = parts[parts.length - 1];
      }
      
      // Clean up any remaining brackets and trim
      recipientEmail = recipientEmail.replace(/[<>]/g, '').trim();
      
      console.log('Extracted email:', recipientEmail);
      
      // Create draft email object
      const draft = {
        to: recipientEmail,
        subject: `Re: ${selectedEmail.subject}`,
        body: draftReply
      };

      console.log('Creating draft with:', draft); // Debug log

      // Save draft using Gmail API
      const draftId = await createDraft(draft);
      console.log('Draft saved with ID:', draftId);
      
      setSuccess('Draft saved successfully in Gmail!');
      if (onDraftSaved) {
        onDraftSaved();
      }

      // Clear the form
      setTranscription('');
      setDraftReply('');
      setAudioBlob(null);
      setEditMode(false);
    } catch (err: any) {
      console.error('Error saving draft:', {
        error: err,
        message: err.message,
        details: err.result?.error?.message
      });
      setError(
        err.message || 
        err.result?.error?.message || 
        'Failed to save draft in Gmail. Please try again.'
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const messageId = await sendEmail({
        to: selectedEmail?.from.email || '',
        subject: `Re: ${selectedEmail?.subject || ''}`,
        body: draftReply
      });
      console.log('Email sent with ID:', messageId);
      if (onDraftSaved) onDraftSaved(); // Refresh the email list
      // Clear the transcription and draft
      setTranscription('');
      setDraftReply('');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const theme = useTheme();
  
  return (
    <Box>
      {/* Email Subject Header */}
      <Box 
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Replying to:
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            lineHeight: 1.3
          }}
        >
          {selectedEmail?.subject || "Email Subject"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          From: {selectedEmail?.from?.name || selectedEmail?.from?.email || "Sender"}
        </Typography>
      </Box>
      
      {/* Status Messages */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {success}
        </Alert>
      )}
      
      {/* Recording UI */}
      <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: '200px',
            overflow: 'visible'
          }}
        >
        {!audioBlob && !isRecording && !processingAudio && (
          <Box sx={{ textAlign: 'center', mb: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Record Your Response
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
              Click the microphone button below to start recording your response. Speak clearly for best results.
            </Typography>
          </Box>
        )}
        
        {isRecording && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              zIndex: 2,
              padding: { xs: 2, sm: 3 }
            }}
          >
            <Box 
              sx={{ 
                width: { xs: 70, sm: 80 }, 
                height: { xs: 70, sm: 80 }, 
                borderRadius: '50%',
                backgroundColor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 rgba(244, 67, 54, 0.4)',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)'
                  },
                  '70%': {
                    boxShadow: '0 0 0 20px rgba(244, 67, 54, 0)'
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)'
                  }
                }
              }}
            >
              <MicIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ mt: 2, color: 'error.main', fontWeight: 600, textAlign: 'center' }}>
              Recording...
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={stopRecording}
              startIcon={<StopIcon />}
              sx={{ mt: 2, borderRadius: '8px', whiteSpace: 'nowrap' }}
            >
              Stop Recording
            </Button>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, position: 'relative', zIndex: 1, width: '100%' }}>
          {!isRecording ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<MicIcon />}
              onClick={startRecording}
              disabled={isRecording || processingAudio || generatingDraft}
              sx={{ 
                borderRadius: '8px', 
                px: 3,
                py: 1.5,
                boxShadow: 2,
                minWidth: { xs: '180px', sm: '200px' }
              }}
            >
              Start Recording
            </Button>
          ) : null}
        </Box>

        {processingAudio && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              my: 3,
              gap: 2
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="subtitle1">
              Transcribing your audio...
            </Typography>
          </Box>
        )}

        {transcription && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 3,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
              <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>

              </Typography>
            </Box>
            <Box sx={{
              p: 2,
              borderRadius: '8px',
              backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {transcription}
              </Typography>
            </Box>
          </Paper>
        )}
      </Paper>

      {/* Draft Reply Section */}
      {draftReply && (
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: 3, 
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              AI-Generated Draft
            </Typography>
            <Box>
              <Tooltip title={editMode ? "Editing mode active" : "Edit draft"}>
                <IconButton 
                  size="small" 
                  onClick={() => setEditMode(!editMode)}
                  color={editMode ? "primary" : "default"}
                  sx={{ 
                    border: editMode ? '1px solid' : 'none',
                    borderColor: editMode ? 'primary.main' : 'transparent',
                    mr: 1
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy to clipboard">
                <IconButton 
                  size="small" 
                  onClick={() => {
                    navigator.clipboard.writeText(draftReply);
                    // Show a temporary success message
                    const tempSuccess = setSuccess;
                    tempSuccess("Copied to clipboard!");
                    setTimeout(() => tempSuccess(null), 2000);
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {generatingDraft ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 4,
              gap: 2
            }}>
              <CircularProgress size={40} />
              <Typography variant="subtitle1">
                Generating your email draft...
              </Typography>
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
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: 'divider' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                }
              }}
            />
          ) : (
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: '8px',
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {draftReply || "Your AI-generated draft will appear here"}
              </Typography>
            </Box>
          )}

          {draftReply && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSaveDraft}
                disabled={savingDraft || !draftReply}
                sx={{ 
                  borderRadius: '8px', 
                  px: 3,
                  py: 1.5,
                  boxShadow: 2,
                  minWidth: { xs: '200px', sm: '240px' }
                }}
              >
                {savingDraft ? 'Saving...' : 'Save as Draft in Gmail'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendEmail}
                disabled={!draftReply || processingAudio}
                startIcon={<SendIcon />}
                sx={{
                  mt: 2,
                  mb: 2,
                  width: '100%',
                  bgcolor: '#1a73e8',
                  '&:hover': {
                    bgcolor: '#1557b0'
                  }
                }}
              >
                Send Email
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AudioRecorder; 