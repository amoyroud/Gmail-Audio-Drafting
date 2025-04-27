import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import ArchiveIcon from '@mui/icons-material/Archive';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
import LinearProgress from '@mui/material/LinearProgress';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useSettings } from '../services/settingsService';
import { generateDraftResponse } from '../services/mistralService';
import { 
  sendEmail, 
  createDraft, 
  archiveEmail
} from '../services/gmailService';
import { Email, DraftEmail, DraftGenerationParams } from '../types/types';
import theme, { ThemeMode } from '../theme/theme';

// Services
import { transcribeSpeech } from '../services/elevenlabsService';
import { searchContacts, Contact } from '../services/contactService';

// Components
// import ActionSelector from './ActionSelector'; // Keep if still used elsewhere, remove if only for post-recording choice

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
  onActionComplete?: (emailId: string) => void;
  isRecordingFromParent?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  autoStartRecording?: boolean;
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
  minWidth: { xs: '200px', sm: '200px' }
};

const primaryButtonStyles = {
  ...commonButtonStyles,
  bgcolor: '#1a73e8',
  '&:hover': {
    bgcolor: '#1557b0'
  }
};

// Define debounce HERE, outside the component but in the module scope
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  selectedEmail, 
  onDraftSaved, 
  onActionComplete,
  isRecordingFromParent,
  onRecordingStateChange,
  autoStartRecording = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Debug log the selectedEmail prop
  useEffect(() => {
    console.log('AudioRecorder - selectedEmail prop:', selectedEmail ? 
      `${selectedEmail.id} (${selectedEmail.subject})` : 'null or undefined');
  }, [selectedEmail]);
  
  // State to stabilize selectedEmail and prevent flickering
  const [stableEmail, setStableEmail] = useState<Email | null>(null);
  
  // Once we have a selectedEmail, keep it stable to prevent flickering
  useEffect(() => {
    if (selectedEmail) {
      setStableEmail(selectedEmail);
    }
  }, [selectedEmail]);
  
  // Handle recording state changes from parent
  useEffect(() => {
    if (isRecordingFromParent !== undefined) {
      // If parent wants to start recording and we're not already recording
      if (isRecordingFromParent && !isRecording) {
        startRecording();
      } 
      // If parent wants to stop recording and we are recording
      else if (!isRecordingFromParent && isRecording) {
        stopRecording();
      }
    }
  }, [isRecordingFromParent]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Basic recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [draftReply, setDraftReply] = useState('');
  const [processingAudio, setProcessingAudio] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');
  
  // Add recording time visualization
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add audio visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Get templates from settings
  const { settings } = useSettings();

  // Snackbar state for EA notification
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // --- Helper Functions --- 
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  // --- End Helper Functions ---

  // --- CC Autocomplete State & Logic ---
  const [ccInputValue, setCcInputValue] = useState('');
  const [ccRecipients, setCcRecipients] = useState<Contact[]>([]);
  const [ccOptions, setCcOptions] = useState<Contact[]>([]);
  const [ccLoading, setCcLoading] = useState(false);
  const debouncedSearchContacts = useCallback(
    // debounce is now defined in the module scope
    debounce(async (query: string) => {
      if (!query) {
        setCcOptions([]);
        return;
      }
      setCcLoading(true);
      try {
        const results = await searchContacts(query);
        setCcOptions(results);
      } catch (err) {
        console.error('Failed to search contacts:', err);
        // Handle error appropriately, maybe show a snackbar message
        setCcOptions([]); // Clear options on error
      } finally {
        setCcLoading(false);
      }
    }, 300),
    [] 
  );
  // --- End CC Autocomplete State ---

  // Clean up audio visualization
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Audio visualization
  const updateAudioLevel = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    let sum = 0;
    
    // Calculate average audio level
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    
    const average = sum / dataArrayRef.current.length;
    // Scale to 0-100 for easier use
    const scaledLevel = Math.min(100, Math.max(0, average * 1.5));
    setAudioLevel(scaledLevel);
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  // --- Auto-start Effect ---
  useEffect(() => {
    // Only auto-start if the prop is true AND we are not already in a recording/processing state
    if (autoStartRecording && !isRecording && !processingAudio && !generatingDraft && !draftReply) {
      console.log('[AudioRecorder] Auto-starting recording due to prop...');
      startRecording();
    }
    // Intentionally run only once on mount when autoStartRecording is initially true
    // Or if the prop dynamically changes, though that's less likely for this use case.
    // Adding other state dependencies could cause unwanted restarts.
  }, [autoStartRecording]); 
  // --- End Auto-start Effect ---

  const startRecording = async () => {
    if (isRecording || processingAudio || generatingDraft) return; 
    
    // Reset relevant states before starting a new recording
      setError(null);
    setSuccess(null);
    setAudioBlob(null);
    setTranscription('');
    setDraftReply('');
    setEditedDraft(''); // Reset edited draft
    setEditMode(false); // Exit edit mode
    setGeneratingDraft(false);
    setSavingDraft(false);
    setSendingEmail(false); // Reset sending state
    setProcessingAudio(false); // Reset processing state
    setRecordingTime(0);
    audioChunksRef.current = [];
    setCcRecipients([]); // Clear CC recipients for new recording
    setCcInputValue('');
    setCcOptions([]);

    try {
      console.log('Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioContext = audioContextRef.current;
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start visualizing audio
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      
      // Create and configure media recorder with appropriate settings
      let mimeType = 'audio/webm;codecs=opus';
      
      // For mobile, try to use more compatible formats
      if (isMobile) {
        // Try each mobile preferred MIME type until one works
        for (const type of MOBILE_PREFERRED_MIME_TYPES) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
      } else {
        // For desktop, try to use the high-quality formats
        for (const type of SUPPORTED_MIME_TYPES) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
      }
      
      const options = {
        mimeType,
        audioBitsPerSecond: isMobile ? 96000 : 128000 // Lower bitrate for mobile to save bandwidth
      };
      
      try {
        // Initialize the MediaRecorder with best available format
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn('Could not use preferred codec, falling back to default', e);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }
      
      // Set up data handlers
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped.');
        
        // Stop the audio visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Stop the recording timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        
        // Only process if we have audio data
        if (audioChunksRef.current.length === 0) {
          setError('No audio data captured. Please try again and speak into your microphone.');
          setProcessingAudio(false);
          return;
        }
        
        const blobOptions = {
          type: 'audio/webm;codecs=opus'
        };
        
        try {
          // First try with specific MIME type
          const blob = new Blob(audioChunksRef.current, blobOptions);
          console.log('Audio blob created, size:', blob.size, 'bytes');
          
          if (blob.size < 1000) {
            // Too small, likely no actual audio
            setError('Recording too short or no audio detected. Please try again.');
            setProcessingAudio(false);
            return;
          }
          
          setAudioBlob(blob);
          await processAudioToText(blob);
        } catch (blobError) {
          console.error('Error creating audio blob:', blobError);
          setError('Failed to process audio. Please try again.');
          setProcessingAudio(false);
        } finally {
          // Reset audio visualization state
          setAudioLevel(0);
          setRecordingTime(0);
        }
      };
      
      mediaRecorderRef.current.start(1000); // Collect data in 1-second chunks
      setIsRecording(true);
      
      // Update recording time every second
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      onRecordingStateChange?.(true); 

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
      setIsRecording(false); 
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.warn('Stop recording called but not in a valid recording state.');
      return;
    }
    
    console.log('Stopping recording...');
    // Set recording state immediately
      setIsRecording(false);
    onRecordingStateChange?.(false); // Notify parent immediately
    
    // Stop timer and visualization
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setAudioLevel(0);
    
    mediaRecorderRef.current.onstop = async () => {
      console.log('MediaRecorder stopped event.');
      if (audioChunksRef.current.length === 0) {
          console.warn('No audio chunks recorded.');
          setError('No audio data captured. Please try recording again.');
          setProcessingAudio(false); // Ensure processing is false
        return;
      }
      
      const completeAudioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' });
      setAudioBlob(completeAudioBlob); // Keep the blob for potential future use?
      audioChunksRef.current = []; // Clear chunks
      
      // --- Start Processing Chain ---
    setProcessingAudio(true);
      setError(null);
      setSuccess(null);
      setDraftReply(''); // Clear previous draft
      setEditedDraft(''); // Clear previous edit
      setEditMode(false); // Ensure not in edit mode initially
      setGeneratingDraft(false); // Ensure generating state is false initially
      
      try {
        console.log('Processing audio to text...');
        // Correct call to transcribeSpeech
        const transcribedText = await transcribeSpeech(completeAudioBlob);
        console.log('Transcription received:', transcribedText);
        setTranscription(transcribedText);

        // --- Simple EA Detection Logic ---
      const { eaName, eaEmail } = settings;
        if (eaName && eaEmail && transcribedText && transcribedText.toLowerCase().includes(eaName.toLowerCase())) {
           console.log(`[AudioRecorder] EA Name "${eaName}" detected. Adding to CC.`);
           // Correct Contact object creation
           const newContact: Contact = { 
               resourceName: `detected:${eaEmail}`, 
               name: eaName, 
               email: eaEmail 
           };
        setCcRecipients(prev => {
              if (!prev.some(c => c.email.toLowerCase() === newContact.email.toLowerCase())) {
                 showSnackbar(`Adding ${newContact.name} to CC`, 'info');
                 return [...prev, newContact];
          } 
          return prev;
        });
      } else {
             console.log(`[AudioRecorder] EA Name "${eaName || '(not set)'}" not detected or EA not configured.`);
        }
        // --- End EA Detection ---

        // --- Always Generate Reply (AI Enhancement) ---
        console.log('Generating AI-enhanced reply...');
        setGeneratingDraft(true); 
        setProcessingAudio(false); // Transcription done, now generating

        if (!stableEmail) {
            throw new Error("Cannot generate reply without stable email context.");
        }
        
        // Correctly prepare params for generateDraftResponse
        const draftParams: DraftGenerationParams = {
            transcribedText: transcribedText,
            emailSubject: stableEmail.subject,
            emailBody: stableEmail.body, 
            senderName: stableEmail.from?.name || stableEmail.from?.email || 'Sender'
        };

        // Correct call to generateDraftResponse
        const enhancedReply = await generateDraftResponse(draftParams);
        console.log('AI-enhanced reply generated:', enhancedReply);
        setDraftReply(enhancedReply);
        setEditedDraft(enhancedReply); 
        setSuccess('Draft generated successfully!');

      } catch (err: any) {
        console.error('Error during post-recording processing:', err);
        setError(`Processing failed: ${err.message || 'Unknown error'}`);
        setDraftReply(''); // Clear draft on error
        setEditedDraft(''); // Clear edit on error
      } finally {
        // Reset processing/generating flags regardless of success/failure
        setProcessingAudio(false);
      setGeneratingDraft(false);
        // Clean up audio stream tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }
      // --- End Processing Chain ---
    };
    
    // Stop the recorder instance
    try {
        mediaRecorderRef.current.stop();
    } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
        // Handle potential errors if stop() fails or onstop handler has issues
        setError("Failed to finalize recording.");
            setProcessingAudio(false);
        setIsRecording(false);
        // Clean up tracks defensively
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
    }
  };

  const processAudioToText = async (blobToProcess: Blob): Promise<string> => {
    if (!blobToProcess) {
      throw new Error('No audio blob available to process.');
    }
    console.log('Sending audio blob for transcription:', blobToProcess);
    setProcessingAudio(true);
    setError(null);
    try {
      const transcription = await transcribeSpeech(blobToProcess);
      
      return transcription; // Return only the transcription text
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(`Transcription failed: ${err.message || 'Please try again.'}`);
      throw err; // Re-throw error to be caught by the caller (stopRecording)
    } finally {
      // Processing state is handled in the caller (stopRecording)
      // setProcessingAudio(false); 
    }
  };
  
  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // When entering edit mode, ensure editedDraft reflects the current draftReply
      setEditedDraft(draftReply); 
    }
  };

  const handleEditedDraftChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedDraft(event.target.value);
  };

  const handleSaveDraft = async () => {
    if (!stableEmail || (!draftReply && !editedDraft)) {
      setError('No draft content available to save.');
      return;
    }
    console.log('Saving draft...');
    setSavingDraft(true);
    setError(null);
    setSuccess(null);
    
    const contentToSave = editMode ? editedDraft : draftReply;

    // Use DraftEmail type which matches the service requirement (no threadId)
    const draftData: DraftEmail = {
      to: stableEmail.from.email, 
      subject: stableEmail.subject.startsWith('Re:') ? stableEmail.subject : `Re: ${stableEmail.subject}`,
      cc: ccRecipients.map(c => c.email),
      body: contentToSave,
    };

    try {
      await createDraft(draftData);
      setSuccess('Draft saved successfully!');
      // Reset state after saving
      setAudioBlob(null);
      setTranscription('');
      setDraftReply('');
      setEditedDraft('');
      setEditMode(false);
      setCcRecipients([]);
      onDraftSaved?.(); 
      onActionComplete?.(stableEmail.id); 

    } catch (err: any) {
      console.error('Save draft error:', err);
      setError(`Failed to save draft: ${err.message || 'Please try again.'}`);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSendEmail = async () => {
    if (!stableEmail || (!draftReply && !editedDraft)) {
      setError('No content available to send.');
      return;
    }
    console.log('Sending email...');
    setSendingEmail(true); 
    setSavingDraft(false); 
      setError(null); 
      setSuccess(null); 
    
    const contentToSend = editMode ? editedDraft : draftReply;
          
    // Use DraftEmail type
    const emailData: DraftEmail = {
        to: stableEmail.from.email,
      subject: stableEmail.subject.startsWith('Re:') ? stableEmail.subject : `Re: ${stableEmail.subject}`,
      cc: ccRecipients.map(c => c.email),
      body: contentToSend,
    };

    try {
      await sendEmail(emailData);
      setSuccess('Email sent successfully!');
      // Reset state after sending
        setAudioBlob(null);
        setTranscription('');
        setDraftReply('');
      setEditedDraft('');
      setEditMode(false);
        setCcRecipients([]); 
      onActionComplete?.(stableEmail.id); 

    } catch (err: any) {
      console.error('Send email error:', err);
      setError(`Failed to send email: ${err.message || 'Please try again.'}`);
    } finally {
      setSendingEmail(false); 
    }
  };

  // Format recording time to MM:SS
  const formatRecordingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render recording button differently on mobile
  const renderRecordingButton = () => {
    if (isMobile) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 2
        }}>
          {isRecording ? (
            <Zoom in={true}>
              <Fab 
                color="secondary" 
                aria-label="stop recording"
                onClick={stopRecording}
                sx={{
                  width: 64,
                  height: 64,
                  mb: 1,
                  animation: audioLevel > 5 ? `pulse ${(110 - audioLevel) / 50}s infinite` : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.3)',
                    },
                    '70%': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)',
                    },
                    '100%': {
                      transform: 'scale(1)',
                      boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)',
                    },
                  },
                }}
              >
                <StopIcon />
              </Fab>
            </Zoom>
          ) : (
            <Zoom in={true}>
              <Fab 
                color="primary" 
                aria-label="start recording"
                onClick={startRecording}
                sx={{
                  width: 64,
                  height: 64,
                  mb: 1
                }}
              >
                <MicIcon />
              </Fab>
            </Zoom>
          )}
          
          {isRecording && (
            <Box sx={{ textAlign: 'center', mt: 1, mb: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                {formatRecordingTime(recordingTime)}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={Math.min(audioLevel, 100)} 
                sx={{ 
                  mt: 1, 
                  height: 6, 
                  borderRadius: 3,
                  width: '200px',
                  '& .MuiLinearProgress-bar': {
                    transition: 'transform 0.1s ease-in-out',
                  }
                }} 
              />
            </Box>
          )}
        </Box>
      );
    }
    
    // Desktop version (original button)
    return (
      <Button
        variant="contained"
        color={isRecording ? "secondary" : "primary"}
        size="large"
        startIcon={isRecording ? <StopIcon /> : <MicIcon />}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={processingAudio || generatingDraft}
        sx={{
          ...primaryButtonStyles,
          my: 2,
          backgroundColor: isRecording ? theme.palette.error.main : theme.palette.primary.main,
          '&:hover': {
            backgroundColor: isRecording ? theme.palette.error.dark : theme.palette.primary.dark,
          },
        }}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
    );
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Status Messages */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)} // Add close button
          sx={{ mb: 2, borderRadius: '8px' }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          onClose={() => setSuccess(null)} // Add close button
          sx={{ mb: 2, borderRadius: '8px' }}
        >
          {success}
        </Alert>
      )}
      
      {/* Active Recording UI - Show only on Desktop */}
      {isRecording && !isMobile && (
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: spacing.xs, sm: spacing.sm }, 
            mb: 0,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: '40px',
            overflow: 'visible'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center', 
              py: 3
            }}
          >
            <Box
                  sx={{
                    width: 80,
                    height: 80,
                borderRadius: '50%',
                bgcolor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)'
                  },
                  '70%': {
                    boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)'
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
          </Box>
        </Paper>
      )}

      {/* Processing UI */}
      {processingAudio && (
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: spacing.xs, sm: spacing.sm }, 
            mb: 0,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: '40px',
            overflow: 'visible'
          }}
        >
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
        </Paper>
      )}
      
      {/* 1. Idle / Ready to Record */}
      {!isRecording && !processingAudio && !generatingDraft && !draftReply && (
         renderRecordingButton()
      )}

      {/* 3. Recording UI */} 
      {/* This is the block that shows when isRecording is true */}
      {isRecording && (
        <Paper 
          elevation={0}
          sx={{ 
              p: spacing.sm, 
              mb: 2,
            borderRadius: '12px',
            border: '1px solid',
              borderColor: theme.palette.error.light, // Use theme palette
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)', // Use theme palette
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
              gap: 2
            }}
          >
            {/* Render Stop button */} 
            {renderRecordingButton()} 
            {/* Recording Indicator */} 
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold' }}>
                    Recording: {formatRecordingTime(recordingTime)}
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={Math.min(audioLevel, 100)} 
                    color="error"
                    sx={{ mt: 1, height: 6, borderRadius: 3, width: '200px' }} 
                />
              </Box>
        </Paper>
      )}
      
      {/* 4. Processing Audio (Transcription) UI */} 
      {/* This is the block that shows when processingAudio is true */}
      {processingAudio && (
        <Paper 
          elevation={0}
          sx={{ p: spacing.sm, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">Transcribing audio...</Typography>
        </Paper>
      )}
      
      {/* 5. Generating Draft (AI) UI */} 
      {/* This is the block that shows when generatingDraft is true */}
       {generatingDraft && (
        <Paper 
          elevation={0}
            sx={{ p: spacing.sm, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Generating AI draft...</Typography>
        </Paper>
      )}

      {/* 6. Draft Ready UI (Display, Edit, CC, Actions) */}
      {/* This is the block that shows when draftReply is available */}
      {draftReply && !processingAudio && !generatingDraft && (
        <Box sx={{ mt: spacing.sm, width: '100%' }}>
          {/* Edit/View Area */}
          <Box sx={{ position: 'relative', mb: spacing.xs }}>
             <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>Generated Draft:</Typography>
             {editMode ? (
            <TextField
              fullWidth
              multiline
              rows={8}
                   value={editedDraft}
                   onChange={handleEditedDraftChange}
              variant="outlined"
                   onKeyDown={(e) => e.stopPropagation()}
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, mb: 1 }}
            />
          ) : (
                <Paper variant="outlined" sx={{ p: 2, mb: 1, whiteSpace: 'pre-wrap', maxHeight: { xs: '30vh', sm: '40vh' }, overflowY: 'auto', minHeight: '150px' }}>
                   <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{draftReply}</Typography>
                </Paper>
             )}
             <Tooltip title={editMode ? "View Original Draft" : "Edit Draft"}>
                 <IconButton 
                    onClick={handleEditToggle} 
                    disabled={savingDraft || sendingEmail}
                    color={editMode ? "primary" : "default"}
                    size="small"
                    sx={{ position: 'absolute', top: 0, right: 0, mt: -4.5, mr: 0.5 }}
                 >
                   <EditIcon fontSize="small" />
                 </IconButton>
              </Tooltip>
            </Box>

           {/* CC Autocomplete */}
          <Autocomplete
            multiple
              id="cc-recipients-autocomplete"
              options={ccOptions}
              getOptionLabel={(option) => option.name || option.email} 
              value={ccRecipients}
              onChange={(_event, newValue) => setCcRecipients(newValue)}
              inputValue={ccInputValue}
              onInputChange={(_event, newInputValue) => {
              setCcInputValue(newInputValue);
                 debouncedSearchContacts(newInputValue);
              }}
              filterOptions={(x) => x} 
              loading={ccLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                   label="CC Recipients"
                   placeholder="Search contacts..."
                   onKeyDown={(e) => e.stopPropagation()}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {ccLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
                   sx={{ width: '100%', my: spacing.xs }}
                 />
              )}
              renderTags={(value: readonly Contact[], getTagProps) =>
                 value.map((option: Contact, index: number) => (
                   <Chip 
                      variant="outlined" 
                      label={option.name || option.email} 
                      {...getTagProps({ index })} 
                      key={option.email}
                   />
                 ))
              }
            isOptionEqualToValue={(option, value) => option.email === value.email}
              noOptionsText={ccLoading ? "Loading..." : "No contacts found"}
           />

           {/* Action Buttons: Save, Send */}
           <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: spacing.sm, gap: spacing.xs }}>
                     <Button
                        variant="outlined"
                        color="primary"
                 startIcon={<SaveIcon />}
                        onClick={handleSaveDraft}
                 disabled={savingDraft || sendingEmail || (!editMode && !draftReply) || (editMode && !editedDraft)}
                 sx={commonButtonStyles}
                      >
                {savingDraft ? <CircularProgress size={24} /> : 'Save Draft'}
                      </Button>
                     <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SendIcon />}
                 onClick={handleSendEmail}
                 disabled={savingDraft || sendingEmail || (!editMode && !draftReply) || (editMode && !editedDraft)}
                 sx={primaryButtonStyles}
                     >
                {sendingEmail ? <CircularProgress size={24} color="inherit" /> : 'Send'}
                     </Button>
            </Box>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} // Hide after 4 seconds
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position at bottom center
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AudioRecorder;
