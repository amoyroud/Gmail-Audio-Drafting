import React, { useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Services
import { transcribeSpeech } from '../services/elevenlabsService';
import { generateDraftResponse } from '../services/mistralService';
import { createDraft } from '../services/gmailService';
import { Email, DraftGenerationParams } from '../types/types';

// Supported audio formats for ElevenLabs API
const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/mpeg'
];

interface AudioRecorderProps {
  selectedEmail: Email;
  onDraftSaved?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ selectedEmail, onDraftSaved }) => {
  const { getAccessTokenSilently } = useAuth0();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
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
        emailSubject: selectedEmail.subject,
        transcribedText,
        senderName: selectedEmail.from.name || selectedEmail.from.email,
        emailBody: ''
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
      const token = await getAccessTokenSilently();
      await createDraft(token, {
        to: selectedEmail.from.email,
        subject: `Re: ${selectedEmail.subject}`,
        body: draftReply
      });
      
      setSuccess('Draft saved successfully! You can review and send it from your Gmail account.');
      onDraftSaved?.();
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Record Your Response
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}
        
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

        {transcription && (
          <Box sx={{ mt: 3 }}>
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
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder; 