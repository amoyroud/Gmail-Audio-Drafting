import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
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
  'audio/webm;codecs=opus',
  'audio/webm;codecs=pcm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/ogg;codecs=opus'
];

// Default to these MIME types on mobile devices which often have limited support
const MOBILE_PREFERRED_MIME_TYPES = [
  'audio/mp4',
  'audio/webm',
  'audio/mpeg'
];

interface AudioRecorderProps {
  selectedEmail: Email;
  onDraftSaved?: () => void;
}

// Common styles for consistency
const spacing = {
  xs: 2,  // 16px
  sm: 3,  // 24px
  md: 4   // 32px
};

const commonButtonStyles = {
  borderRadius: '8px',
  px: 3,
  py: 1.5,
  minWidth: { xs: '200px', sm: '240px' }
};

const primaryButtonStyles = {
  ...commonButtonStyles,
  bgcolor: '#1a73e8',
  '&:hover': {
    bgcolor: '#1557b0'
  }
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({ selectedEmail, onDraftSaved }) => {
  // State to stabilize selectedEmail and prevent flickering
  const [stableEmail, setStableEmail] = useState<Email | null>(null);
  
  // Once we have a selectedEmail, keep it stable to prevent flickering
  useEffect(() => {
    if (selectedEmail) {
      setStableEmail(selectedEmail);
    }
  }, [selectedEmail]);
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Detect if user is on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Device detected as:', isMobile ? 'mobile' : 'desktop');
      
      // Use different MIME type priorities based on device type
      const mimeTypesToTry = isMobile ? MOBILE_PREFERRED_MIME_TYPES : SUPPORTED_MIME_TYPES;
      
      // Find the first supported MIME type
      let mimeType = mimeTypesToTry.find(type => MediaRecorder.isTypeSupported(type));
      
      // Fall back to any supported type if none of the preferred types are supported
      if (!mimeType) {
        mimeType = SUPPORTED_MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type));
      }
      
      if (!mimeType) {
        throw new Error('No supported audio format found on this device');
      }

      console.log('Using audio format:', mimeType);
      
      const options: MediaRecorderOptions = {
        mimeType,
        audioBitsPerSecond: 128000 // 128 kbps
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      // Request data more frequently on mobile to ensure we capture everything
      const timeslice = isMobile ? 1000 : 10000; // 1 second chunks on mobile, 10 seconds on desktop

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received audio chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Create blob with the correct mime type
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Recording stopped. Blob type:', audioBlob.type, 'size:', audioBlob.size);
        
        if (audioBlob.size === 0) {
          setError('No audio data was captured. Please try again with a different browser or device.');
          return;
        }
        
        setAudioBlob(audioBlob);
        processAudioToText(audioBlob);
      };

      // Start recording with timeslice to get data more frequently
      mediaRecorderRef.current.start(timeslice);
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Failed to access microphone: ${err instanceof Error ? err.message : 'Unknown error'}. Please check permissions and try again.`);
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
      console.log(`Processing audio for transcription: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      // Check if the audio blob is valid
      if (audioBlob.size < 1000) { // Less than 1KB is probably too small
        throw new Error('Audio recording is too short or empty');
      }
      
      const text = await transcribeSpeech(audioBlob);
      console.log('Transcription successful:', text);
      setTranscription(text);
      
      // Once we have transcription, generate a draft reply
      await generateReply(text);
    } catch (err) {
      console.error('Error processing audio:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to transcribe audio: ${errorMessage}. Please try again.`);
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
  // For debugging
  // console.log('AudioRecorder render, selectedEmail:', selectedEmail?.id, 'stableEmail:', stableEmail?.id);
  
  // Use stableEmail to prevent flickering
  const emailToUse = stableEmail || selectedEmail;

  // If we don't have a stable or selected email, show the empty state
  if (!emailToUse) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '300px',
        width: '100%',
        textAlign: 'center'
      }}>
        <Box 
          sx={{ 
            width: { xs: 70, sm: 90 }, 
            height: { xs: 70, sm: 90 }, 
            borderRadius: '50%',
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <MicIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'text.secondary', opacity: 0.7 }} />
        </Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Select an Email to Reply
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          Choose an email from the list to start recording your audio response.
        </Typography>
      </Box>
    );
  }

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
          {emailToUse?.subject || "Email Subject"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          From: {emailToUse?.from?.name || emailToUse?.from?.email || "Sender"}
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
          p: { xs: spacing.xs, sm: spacing.sm }, 
          mt: spacing.sm, 
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
        {/* Record Your Response UI */}
        {!isRecording && !processingAudio && !audioBlob && !transcription && (
          <Box sx={{ textAlign: 'center', mb: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Record Your Response
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
              Click the microphone button below to start recording your response. Speak clearly for best results.
            </Typography>
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
                mt: 2,
                minWidth: { xs: '180px', sm: '200px' }
              }}
            >
              Start Recording
            </Button>
          </Box>
        )}
        
        {/* Recording in progress UI */}
        {isRecording && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '100%',
              my: 2
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

        {/* Processing audio UI */}
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

        {/* Transcription UI */}
        {transcription && !isRecording && !processingAudio && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: spacing.xs, sm: spacing.sm },
              mt: spacing.sm,
              mb: 3,
              borderRadius: '12px',
              backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              border: '1px solid',
              borderColor: 'divider',
              width: '100%'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {transcription}
            </Typography>
          </Paper>
        )}
      </Paper>

      {/* Draft Reply Section */}
      {draftReply && !isRecording && !processingAudio && stableEmail && (
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: spacing.xs, sm: spacing.sm }, 
            mt: spacing.sm, 
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
                p: spacing.xs, 
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

          {draftReply && !generatingDraft && (
            <Box sx={{ 
              display: 'flex', 
              gap: spacing.sm,
              mt: spacing.sm,
              '& > button': {
                flex: 1,
                minWidth: 0
              }
            }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSaveDraft}
                disabled={savingDraft || !draftReply}
                sx={{ 
                  ...primaryButtonStyles,
                  boxShadow: 2,
                  height: 48
                }}
              >
                {savingDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendEmail}
                disabled={!draftReply || processingAudio}
                startIcon={<SendIcon />}
                sx={{
                  ...primaryButtonStyles,
                  height: 48
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