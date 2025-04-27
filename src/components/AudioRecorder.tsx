import React, { useState, useRef, useEffect } from 'react';
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
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import ArchiveIcon from '@mui/icons-material/Archive';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fab from '@mui/material/Fab';
import Slide from '@mui/material/Slide';
import Zoom from '@mui/material/Zoom';
import LinearProgress from '@mui/material/LinearProgress';

// Services
import { transcribeSpeech } from '../services/elevenlabsService';
import { createDraft, sendEmail, archiveEmail } from '../services/gmailService';
import { executeAction } from '../services/actionService';
import { Email, EmailActionType } from '../types/types';
import { useSettings, EmailTemplate } from '../services/settingsService';

// Components
import ActionSelector from './ActionSelector';

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
  initialAction?: EmailActionType;
  onActionComplete?: () => void;
  isRecordingFromParent?: boolean;
  recordingAction?: EmailActionType | null;
  onRecordingStateChange?: (isRecording: boolean) => void;
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

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  selectedEmail, 
  onDraftSaved, 
  initialAction, 
  onActionComplete,
  isRecordingFromParent,
  recordingAction,
  onRecordingStateChange
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
  
  // Update action type based on parent's recording action
  useEffect(() => {
    if (recordingAction && recordingAction !== selectedAction) {
      setSelectedAction(recordingAction);
    }
  }, [recordingAction]);
  
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Add recording time visualization
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add audio visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Action mode state
  const [selectedAction, setSelectedAction] = useState<EmailActionType>(initialAction || 'speech-to-text');
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Get templates from settings
  const { settings } = useSettings();
  
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Update local state when initialAction changes from parent
  useEffect(() => {
    if (initialAction) {
      setSelectedAction('speech-to-text'); // Always start with first action
      // Reset state when action changes
      setAudioBlob(null);
      setTranscription('');
      setDraftReply('');
      setEditMode(false);
      setSelectedTemplateId('');
      setSuccess(null);
      setError(null);
      setIsWarmingUp(false);
      // Do NOT start recording automatically
    }
  }, [initialAction]);

  useEffect(() => {
    if (selectedAction !== 'quick-decline') {
      setSelectedTemplateId('');
    } else if (selectedAction === 'quick-decline' && settings.templates.length > 0) {
      // Set the first available template ID when quick-decline is selected
      const declineTemplates = settings.templates.filter(t => t.type === 'decline');
      if (declineTemplates.length > 0) {
        setSelectedTemplateId(declineTemplates[0].id);
      }
    }
  }, [selectedAction, settings.templates]);

  // Add state for warm-up phase
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  // When selectedAction changes to 'speech-to-text', start recording immediately if not already recording
  useEffect(() => {
    // Only start recording automatically if:
    // 1. Action is speech-to-text
    // 2. Not currently recording
    // 3. Not currently processing audio
    // 4. No transcription or audio blob exists yet (this is the important new check)
    if (selectedAction === 'speech-to-text' && !isRecording && !processingAudio && !audioBlob && !transcription && !draftReply) {
      startRecording();
    }
  }, [selectedAction, isRecording, processingAudio, audioBlob, transcription, draftReply]);

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

  const startRecording = async () => {
    if (isRecording) return;
    
    try {
      setError(null);
      console.log('Starting recording...');
      
      // Request microphone access first
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
      
      // Inform parent about recording state
      if (onRecordingStateChange) {
        onRecordingStateChange(true);
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    console.log('Stopping recording...');
    
    try {
      setProcessingAudio(true);
      // MediaRecorder's onstop handler will process the audio
    mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // The MediaRecorder.onstop event handler will handle the audio processing
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Failed to stop recording. Please try again.');
      setIsRecording(false);
      setProcessingAudio(false);
    }
  };

  // Add keyboard event handling after function declarations
  useEffect(() => {
    // Improved function to detect if element is an editable field
    const isEditableField = (element: EventTarget | null): boolean => {
      if (!element) return false;
      
      // Check if element is an input field or textarea
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        return true;
      }
      
      // Check for contentEditable elements
      if ((element as HTMLElement)?.isContentEditable) {
        return true;
      }
      
      // Check for MUI input components
      if ((element as HTMLElement)?.closest('.MuiInputBase-root, .MuiOutlinedInput-root, .MuiFilledInput-root, .MuiInput-root')) {
        return true;
      }
      
      return false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // If user is typing in an editable field, don't interfere with any keys
      if (isEditableField(event.target)) {
        return; // Allow normal text editing behavior
      }
      
      // Skip handling ArrowUp and ArrowDown to allow email navigation in parent component
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        return;
      }
      
      // Prevent default space behavior only when not in editable fields
      if (event.key === ' ') {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // If user is typing in an editable field, don't process any shortcuts
      if (isEditableField(event.target)) {
        return; // Allow normal text editing behavior
      }

      // Skip handling ArrowUp and ArrowDown to allow email navigation in parent component
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        return;
      }

      const actions: EmailActionType[] = ['speech-to-text', 'quick-decline', 'move-to-read', 'archive'];
      const currentIndex = actions.indexOf(selectedAction);

      switch (event.key) {
        case ' ':
        case 'Enter':
          // Trigger the current action
          if (selectedAction === 'speech-to-text' || selectedAction === 'quick-decline') {
            if (isRecording) {
              stopRecording();
            } else {
              startRecording();
            }
          } else {
            // For other actions, trigger save or perform
            handleSaveDraft();
          }
          break;
        case 'ArrowLeft':
          if (currentIndex === 0) {
            // On first action, close modal and return focus
            if (onActionComplete) onActionComplete();
          } else {
            const prevIndex = (currentIndex - 1 + actions.length) % actions.length;
            setSelectedAction(actions[prevIndex]);
          }
          break;
        case 'ArrowRight':
          const nextIndex = (currentIndex + 1) % actions.length;
          setSelectedAction(actions[nextIndex]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, selectedAction, startRecording, stopRecording]);
  
  const processAudioToText = async (audioBlob: Blob) => {
    setProcessingAudio(true);
    try {
      // Process the audio using the API
      const text = await transcribeSpeech(audioBlob);
      processTranscription(text);
    } catch (error: any) {
      console.error('Error processing audio:', error);
      setError(`Error processing audio: ${error.message || 'Unknown error'}`);
      setProcessingAudio(false);
    }
  };
  
  const processTranscription = (text: string) => {
    if (selectedAction === 'speech-to-text') {
      // For the merged Speech-to-Text functionality:
      // 1. Set the raw transcription as the draft
      setDraftReply(text);
      // 2. Ensure we keep the transcription available
      setTranscription(text);
      // 3. Finish processing to show the UI with the Enhance with AI button
      setProcessingAudio(false);
      console.log('Speech-to-text processed:', text); // Debug log
    } else if (selectedAction === 'quick-decline' && selectedTemplateId) {
      // Use the selected template
      const template = settings.templates.find(t => t.id === selectedTemplateId);
      if (template) {
        // Apply signature to template content
        const contentWithSignature = template.content.replace('{signature}', settings.signature);
        setDraftReply(contentWithSignature);
      } else {
        setError('Selected template not found');
      }
      setProcessingAudio(false);
    } else if (selectedAction === 'move-to-read' || selectedAction === 'archive') {
      // These actions don't need a draft, just perform them directly
      performAction();
    }
  };
  
  const generateReply = async (transcribedText: string) => {
    try {
      if (stableEmail) {
        setGeneratingDraft(true);
        console.log('AudioRecorder.generateReply: Starting AI draft generation...');
        console.log('AudioRecorder.generateReply: Transcribed text length:', transcribedText.length);
        
        // Execute the AI draft action with speech-to-text type but using the AI generation
        console.log('AudioRecorder.generateReply: Calling executeAction with enhance=true');
        const result = await executeAction({
          type: 'speech-to-text',
          email: stableEmail,
          transcription: transcribedText,
          enhance: true // Add flag to indicate this should use AI enhancement
        });
        
        if (result.success && result.data?.draft) {
          console.log('AudioRecorder.generateReply: AI draft generation successful');
          console.log('AudioRecorder.generateReply: Generated draft length:', result.data.draft.length);
          setDraftReply(result.data.draft);
          // Make sure we keep the transcription available even after AI enhancement
          setTranscription(transcribedText);
        } else {
          console.error('AudioRecorder.generateReply: Error response from executeAction:', result);
          setError(`Error generating reply: ${result.message}`);
        }
        
        setGeneratingDraft(false);
        setProcessingAudio(false);
      } else {
        console.error('AudioRecorder.generateReply: No email available for generating reply');
      }
    } catch (error: any) {
      console.error('AudioRecorder.generateReply: Error generating reply:', error);
      setError(`Error generating reply: ${error.message || 'Unknown error'}`);
      setGeneratingDraft(false);
      setProcessingAudio(false);
    }
  };
  
  const performAction = async () => {
    if (!stableEmail) return { success: false, message: 'No email selected' };
    
    setIsPerformingAction(true);
    setError(null);
    
    try {
      let result;
      
      switch (selectedAction) {
        case 'speech-to-text':
          result = await executeAction({
            type: 'speech-to-text',
            email: stableEmail,
            transcription: draftReply || transcription
          });
          break;
          
        case 'quick-decline':
          if (selectedTemplateId) {
            // Get the template
            const template = settings.templates.find(t => t.id === selectedTemplateId);
            if (template) {
              // Apply signature to template content
              const contentWithSignature = template.content.replace('{signature}', settings.signature);
              
              // Send with template
              result = await executeAction({
                type: 'quick-decline',
                email: stableEmail,
                template: {
                  id: template.id,
                  name: template.name,
                  body: contentWithSignature,
                  subject: `Re: ${stableEmail.subject}`,
                  type: 'decline'
                }
              });
            }
          } else {
            setError('No template selected');
            setIsPerformingAction(false);
            return { success: false, message: 'No template selected' };
          }
          break;
          
        case 'move-to-read':
          result = await executeAction({
            type: 'move-to-read',
            email: stableEmail
          });
          break;
          
        case 'archive':
          result = await executeAction({
            type: 'archive',
            email: stableEmail
          });
          break;
          
        default:
          const errorMsg = `Unknown action type: ${selectedAction}`;
          setError(errorMsg);
          setIsPerformingAction(false);
          return { success: false, message: errorMsg };
      }
      
      // Set success message if operation succeeded
      if (result && result.success) {
        // Don't set success here, let the caller handle it
        return {
          success: true,
          message: result.message || getSuccessMessage(selectedAction)
        };
      } else {
        const errorMsg = result?.message || 'Unknown error occurred';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = `Error performing action: ${error.message || 'Unknown error'}`;
      console.error(errorMsg, error);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsPerformingAction(false);
      setSavingDraft(false);
      setProcessingAudio(false);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!stableEmail || !draftReply) return;
    
    try {
      setSavingDraft(true);
      setError(null);
      
      // Execute the appropriate action based on the selected action type
      const result = await performAction();
      
      if (result && result.success) {
        setSuccess(result.message || getSuccessMessage(selectedAction));
        // Reset email draft after successful save
        if (onDraftSaved) onDraftSaved();
        if (onActionComplete) onActionComplete();
        setTimeout(() => {
          // Reset component state
          setAudioBlob(null);
          setTranscription('');
          setDraftReply('');
          setSuccess(null);
        }, 2000);
      } else if (result) {
        setError(result.message || 'Failed to save draft');
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      setError(`Error saving draft: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingDraft(false);
    }
  };
  
  const getSuccessMessage = (action: EmailActionType): string => {
    switch (action) {
      case 'speech-to-text':
        return 'Draft saved successfully!';
      case 'quick-decline':
        return 'Decline email drafted successfully!';
      case 'move-to-read':
        return 'Email moved to To Read folder!';
      case 'archive':
        return 'Email archived successfully!';
      default:
        return 'Action completed successfully!';
    }
  };
  
  const getActionButtonText = (): string => {
    switch (selectedAction) {
      case 'speech-to-text':
        return savingDraft ? 'Saving...' : 'Save as Draft';
      case 'quick-decline':
        return savingDraft ? 'Saving...' : 'Save Decline Draft';
      case 'move-to-read':
        return isPerformingAction ? 'Moving...' : 'Move to Read';
      case 'archive':
        return isPerformingAction ? 'Archiving...' : 'Archive Email';
      default:
        return 'Save';
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    const template = settings.templates.find(t => t.id === templateId);
    if (!template) {
      console.error(`Template with ID ${templateId} not found`);
      // If the template was not found, select the first available template
      const declineTemplates = settings.templates.filter(t => t.type === 'decline');
      if (declineTemplates.length > 0) {
        setSelectedTemplateId(declineTemplates[0].id);
        
        // Apply signature to template content
        const contentWithSignature = declineTemplates[0].content.replace('{signature}', settings.signature);
        setDraftReply(contentWithSignature);
      } else {
        // Clear the invalid template ID
        setSelectedTemplateId('');
      }
      return;
    }
    
    // Apply signature to template content
    const contentWithSignature = template.content.replace('{signature}', settings.signature);
    
    setSelectedTemplateId(templateId);
    setDraftReply(contentWithSignature);
  };
  
  const handleSendEmail = async () => {
    if (!stableEmail || !draftReply) return;

    try {
      setIsPerformingAction(true);
      
      // Create draft email object
      const draft = {
        to: stableEmail.from.email,
        subject: `Re: ${stableEmail.subject}`,
        body: draftReply
      };
      
      // Send the email
      const messageId = await sendEmail(draft);
      
      if (messageId) {
        setSuccess('Email sent successfully!');
        // Notify parent component that action is complete
        if (onActionComplete) onActionComplete();
        // Clear the form after successful sending
        setTimeout(() => {
          setAudioBlob(null);
          setTranscription('');
          setDraftReply('');
          setSuccess(null);
        }, 2000);
      } else {
        setError('Failed to send email.');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setError(`Error sending email: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPerformingAction(false);
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

  return (
    <Box sx={{ width: '100%' }}>
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
      
      {/* Warm-up UI */}
      {!isRecording && !processingAudio && !audioBlob && !transcription && selectedAction === 'speech-to-text' && (
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
              justifyContent: 'center', 
              alignItems: 'center',
              p: 2,
              flexGrow: 1,
              minHeight: '40px',
              position: 'relative'
            }}
          >
            <CircularProgress size={40} />
                <Typography 
                  variant="body2" 
                  sx={{ position: 'absolute', bottom: 20, color: 'text.secondary' }}
                >
              {isWarmingUp ? "Preparing microphone..." : "Starting recording..."}
                </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Quick decline UI */}
      {!isRecording && !processingAudio && !audioBlob && !transcription && selectedAction === 'quick-decline' && (
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
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Select Template</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose a template to use for your email
                </Typography>
                
                {settings.templates.filter(template => template.type === 'decline').length > 0 ? (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={selectedTemplateId}
                      onChange={(e: SelectChangeEvent<string>) => {
                        const templateId = e.target.value;
                        if (templateId) {
                          handleTemplateSelect(templateId);
                        }
                      }}
                      label="Template"
                    >
                      {settings.templates
                        .filter(template => template.type === 'decline')
                        .map(template => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No decline templates available. Please add templates in the Settings page.
                  </Alert>
                )}
                
                {selectedTemplateId && draftReply && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'background.default', 
                      borderRadius: 1, 
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9rem' 
                    }}>
                      {draftReply}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleSendEmail}
                        disabled={isPerformingAction}
                        startIcon={<SendIcon />}
                      >
                        {isPerformingAction ? 'Sending...' : 'Send Email'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
        </Paper>
      )}
      
      {/* Move to read UI */}
      {!isRecording && !processingAudio && !audioBlob && !transcription && selectedAction === 'move-to-read' && (
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
              justifyContent: 'center', 
              alignItems: 'center',
              p: 2,
              flexGrow: 1,
              minHeight: '40px',
              position: 'relative'
            }}
          >
              <Button
                variant="contained"
                color="primary"
                onClick={performAction}
                disabled={isPerformingAction || !stableEmail}
                startIcon={<MicIcon />}
                sx={{
                  ...primaryButtonStyles,
                  height: 48
                }}
              >
                {isPerformingAction ? 'Moving...' : 'Move Email to Read Later'}
              </Button>
          </Box>
        </Paper>
      )}
      
      {/* Archive UI */}
      {!isRecording && !processingAudio && !audioBlob && !transcription && selectedAction === 'archive' && (
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
                justifyContent: 'center',
              alignItems: 'center',
              p: 2,
              flexGrow: 1,
              minHeight: '40px',
              position: 'relative'
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={performAction}
              disabled={isPerformingAction || !stableEmail}
              startIcon={<ArchiveIcon />}
            sx={{ 
                ...primaryButtonStyles,
                height: 48
              }}
            >
              {isPerformingAction ? 'Archiving...' : 'Archive Email'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Draft Reply Section */}
      {((draftReply || transcription) && !isRecording && !processingAudio && stableEmail) && (
        <Box 
          sx={{ 
            mt: spacing.sm, 
            mb: { xs: 2, sm: 3 },
            position: 'relative',
            overflow: 'hidden' // Ensure no overflow
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Edit draft">
                <IconButton 
                  size="small" 
                  onClick={() => setEditMode(!editMode)}
                  sx={{ mr: 1 }}
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
                    setSuccess("Copied to clipboard!");
                    setTimeout(() => setSuccess(null), 2000);
                  }}
                  sx={{ mr: 1 }}
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraftReply(e.target.value)}
              variant="outlined"
              placeholder="Your transcribed text will appear here"
              onKeyDown={(e) => {
                // Stop propagation of all key events to prevent global shortcuts from firing
                e.stopPropagation();
              }}
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
              ref={(el: HTMLDivElement | null) => {
                // Remove the console log causing spam
                // if (el) {
                //   console.log('Scrollable box dimensions:', {
                //     width: el.clientWidth,
                //     height: el.clientHeight,
                //     scrollHeight: el.scrollHeight,
                //     offsetHeight: el.offsetHeight,
                //     scrollTop: el.scrollTop,
                //     viewportHeight: window.innerHeight,
                //     offsetTop: el.offsetTop,
                //     bottomSpace: window.innerHeight - (el.offsetTop + el.offsetHeight)
                //   });
                // }
              }}
              sx={{ 
                p: spacing.xs, 
                borderRadius: '8px',
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                border: '1px solid',
                borderColor: 'divider',
                height: 'auto',
                maxHeight: { xs: '40vh', sm: '60vh' }, 
                minHeight: { xs: '100px', sm: '200px' },
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: { xs: '16px', sm: '16px' },
                marginBottom: { xs: '80px', sm: 0 }, // Add bottom margin on mobile to avoid buttons overlap
                position: 'relative',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '3px',
                },
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,0,0,0.3) rgba(0,0,0,0.1)',
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {draftReply || "Your transcribed text will appear here"}
              </Typography>
            </Box>
          )}

          {((draftReply || transcription) && !isRecording && !processingAudio && stableEmail) && (
            <Box 
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
                alignItems: 'center',
                mt: { xs: 4, sm: 2 },
                mb: { xs: 2, sm: 1 },
                gap: 2,
                position: { xs: 'sticky', sm: 'relative' },
                bottom: { xs: 0, sm: 'auto' },
                width: '100%',
                py: 2,
                backgroundColor: { xs: theme => theme.palette.background.default, sm: 'transparent' },
                borderTop: { xs: '1px solid', sm: 'none' },
                borderColor: 'divider',
                zIndex: 2,
                '& .MuiButton-root': {
                  width: { xs: '100%', sm: 'auto' },
                },
              }}
            >
              {/* Send Email button (always first) */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendEmail}
                disabled={!draftReply || processingAudio || isPerformingAction}
                startIcon={<SendIcon />}
                sx={{
                  ...primaryButtonStyles,
                  height: 48,
                  borderRadius: '8px',
                  minWidth: 180
                }}
              >
                Send Email
              </Button>

              {/* Enhance with AI button (always visible if draftReply) */}
              <Button
                variant="contained"
                color="primary"
                onClick={() => generateReply(draftReply)}
                startIcon={<AutoFixHighIcon />}
                sx={{ borderRadius: '8px', fontSize: '0.95rem', height: 48, minWidth: 180 }}
                disabled={!draftReply || generatingDraft}
              >
                Enhance with AI
              </Button>

              {/* Save as Draft button (always last) */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<ArchiveIcon />}
                onClick={handleSaveDraft}
                disabled={
                  isPerformingAction || 
                  savingDraft || 
                  processingAudio ||
                  !draftReply
                }
                sx={{ 
                  ...primaryButtonStyles,
                  height: 48,
                  borderRadius: '8px',
                  minWidth: 180
                }}
              >
                Save as Draft
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Recording Button - RENDER THIS OUTSIDE the specific state blocks, but hide when processing OR draft is shown */}
      {!processingAudio && !(draftReply || transcription) && renderRecordingButton()}
    </Box>
  );
};

export default AudioRecorder;
