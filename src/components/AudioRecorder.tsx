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
import { Email, DraftEmail, EmailActionType, ActionResult } from '../types/types';
import theme, { ThemeMode } from '../theme/theme';

// Services
import { transcribeSpeech } from '../services/elevenlabsService';
import { executeAction } from '../services/actionService';
import { searchContacts, Contact } from '../services/contactService';

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
  onActionComplete?: (emailId: string) => void;
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
  minWidth: { xs: '200px', sm: '200px' }
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
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  
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

  // Snackbar state for EA notification
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // --- CC Autocomplete State ---
  const [ccInputValue, setCcInputValue] = useState('');
  const [ccRecipients, setCcRecipients] = useState<Contact[]>([]);
  const [ccOptions, setCcOptions] = useState<Contact[]>([]);
  const [ccLoading, setCcLoading] = useState(false);
  // --- End CC Autocomplete State ---

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
            if (onActionComplete) onActionComplete(stableEmail?.id || '');
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
  
  // Debounce function (simple implementation)
  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Debounced function to fetch contact options
  const fetchContactsDebounced = useCallback(debounce(async (query: string) => {
    if (query) {
      setCcLoading(true);
      const results = await searchContacts(query);
      setCcOptions(results);
      setCcLoading(false);
    } else {
      setCcOptions([]); // Clear options if query is empty
    }
  }, 300), []); // 300ms debounce

  const processAudioToText = async (audioBlob: Blob) => {
    setProcessingAudio(true);
    try {
      // Process the audio using the API
      console.log('[AudioRecorder] processAudioToText: Transcribing...');
      const text = await transcribeSpeech(audioBlob);
      console.log('[AudioRecorder] processAudioToText: Transcription received:', text);

      // --- Update EA Detection Logic ---
      const { eaName, eaEmail } = settings;
      if (eaName && eaEmail && text && text.toLowerCase().includes(eaName.toLowerCase())) {
        console.log(`[AudioRecorder] processAudioToText: EA Name "${eaName}" detected. Adding to CC recipients.`);
        // Add EA to recipients state, avoid duplicates
        setCcRecipients(prev => {
          if (!prev.some(r => r.email.toLowerCase() === eaEmail.toLowerCase())) {
            // Create a temporary Contact object for the EA
            return [...prev, { resourceName: 'ea', name: eaName, email: eaEmail }];
          } 
          return prev;
        });
      } else {
         console.log(`[AudioRecorder] processAudioToText: EA Name "${eaName || '(not set)'}" not detected or EA not configured.`);
      }
      // --- End EA Detection Update ---

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
    if (!stableEmail) {
      setError('No email selected to perform action on.');
      return;
    }

    // Reset previous states
    setError(null);
    setSuccess(null);
    setIsPerformingAction(true);

    let result: ActionResult | null = null;
    let actionToPerform = selectedAction;

    try {
      switch (actionToPerform) {
        case 'speech-to-text':
        case 'ai-draft':
          if (!transcription && !audioBlob) {
            throw new Error('No recording or text available to create a draft.');
          }
          let textToUse = transcription;
          if (!textToUse && audioBlob) {
            console.log('performAction: Transcribing audio blob before creating draft...');
            setProcessingAudio(true);
            textToUse = await transcribeSpeech(audioBlob);
            setTranscription(textToUse); // Update state
            setProcessingAudio(false);
            console.log('performAction: Transcription complete.');
          }
          
          // --- Use ccRecipients State for Draft --- 
          const draftCcList = ccRecipients.map(r => r.email).filter(email => !!email);
          console.log(`[AudioRecorder] performAction (draft): Using CC list:`, draftCcList);
          // --- End Use ccRecipients ---
          
          setGeneratingDraft(true); 
          console.log(`performAction: Calling executeAction for ${actionToPerform}...`);
          result = await executeAction({
            type: actionToPerform,
            email: stableEmail,
            transcription: textToUse,
            enhance: actionToPerform === 'ai-draft',
            // Add the cc list from state
            cc: draftCcList 
          });
          if (result.success && result.data?.draft) {
            setDraftReply(result.data.draft);
          }
          break;

        case 'quick-decline':
          const selectedTemplate = settings.templates.find(t => t.id === selectedTemplateId);
          if (!selectedTemplate) {
            throw new Error('Selected template not found for quick decline.');
          }
          console.log('performAction: Calling executeAction for quick-decline...');
          // Construct the template object expected by executeAction/EmailAction type
          const templateForAction = {
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            body: selectedTemplate.content, // Map content to body
            subject: `Re: ${stableEmail.subject}`, // Construct subject
            type: selectedTemplate.type
          };
          result = await executeAction({
            type: 'quick-decline',
            email: stableEmail,
            template: templateForAction // Pass the correctly shaped object
          });
          break;

        case 'archive':
          console.log('performAction: Calling executeAction for archive...');
          result = await executeAction({
            type: 'archive',
            email: stableEmail
          });
          break;
        
        // Add cases for other actions like 'move-to-read' if needed

        default:
          throw new Error(`Unsupported action type: ${actionToPerform}`);
      }

      if (result?.success) {
        setSuccess(result.message || getSuccessMessage(actionToPerform));
        // Clear CC recipients on success
        if (actionToPerform === 'speech-to-text' || actionToPerform === 'ai-draft' || actionToPerform === 'quick-decline') {
            setCcRecipients([]);
            setCcInputValue('');
        }
        if (onActionComplete && stableEmail?.id) onActionComplete(stableEmail.id);
      } else {
        setError(result?.message || 'Action failed. Please try again.');
      }

    } catch (err: any) {
      console.error(`Error performing action ${actionToPerform}:`, err);
      setError(err.message || `Failed to perform action: ${actionToPerform}.`);
    } finally {
      setIsPerformingAction(false);
      setGeneratingDraft(false);
      setProcessingAudio(false);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!stableEmail || !draftReply) return;
    
    // Call performAction to initiate the draft saving process.
    // The function itself will update state (setSuccess, setError, etc.)
    performAction(); 
    
    // Note: We might need additional logic here if we want to 
    // specifically know if the *save draft* part succeeded *within* performAction, 
    // but for now, we rely on performAction to handle its own success/error state updates.
    // The onDraftSaved/onActionComplete calls should ideally happen *within* performAction 
    // after the relevant async operation completes successfully.

    // If performAction handles calling onDraftSaved and onActionComplete internally,
    // this function might become simpler or primarily focus on setting the saving state.
    // For now, let's assume performAction handles the necessary callbacks.

    // Example: Setting saving state (if needed, though performAction might handle this too)
    // setSavingDraft(true); // performAction likely sets setIsPerformingAction already
    
    // We could potentially add a check here after a short delay 
    // to see if an error state was set by performAction, but 
    // relying on performAction's internal state updates is cleaner.
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
      setError(null); 
      setSuccess(null); 
    
      // --- Use ccRecipients State for Send --- 
      const sendCcList = ccRecipients.map(r => r.email).filter(email => !!email);
      console.log(`[AudioRecorder] handleSendEmail: Using CC list:`, sendCcList);
      // --- End Use ccRecipients ---
          
      const draft: DraftEmail = { 
        to: stableEmail.from.email,
        subject: `Re: ${stableEmail.subject}`,
        body: draftReply,
        cc: sendCcList // Use the list derived from state
      };
      
      console.log('[AudioRecorder] handleSendEmail: Sending email with CC:', draft.cc);
      const messageId = await sendEmail(draft);
      
      if (messageId) {
        setSuccess('Email sent successfully! Archiving original email...'); // Update message
        
        // Attempt to archive the ORIGINAL email being replied to
        if (stableEmail?.id) {
          try {
            console.log(`[AudioRecorder] handleSendEmail: Attempting to archive ORIGINAL email ID: ${stableEmail.id}`);
            const archiveResult = await archiveEmail(stableEmail.id); // Use stableEmail.id
            if (archiveResult.success) {
              console.log(`[AudioRecorder] handleSendEmail: Original email ${stableEmail.id} archived successfully.`);
              setSuccess('Email sent and original email archived!'); // Final success message
            } else {
              console.error(`[AudioRecorder] handleSendEmail: Failed to archive original email ${stableEmail.id}:`, archiveResult.data);
              setSuccess('Email sent successfully (archive failed).'); 
            }
          } catch (archiveError) {
            console.error(`[AudioRecorder] handleSendEmail: Error during archiving original email ${stableEmail.id}:`, archiveError);
            setSuccess('Email sent successfully (archive error).');
          }
        } else {
          console.error('[AudioRecorder] handleSendEmail: Cannot archive original email, ID is missing.');
          setSuccess('Email sent successfully (could not archive original - missing ID).');
        }

        if (onActionComplete && stableEmail?.id) onActionComplete(stableEmail.id);
        setTimeout(() => {
          setAudioBlob(null);
          setTranscription('');
          setDraftReply('');
          setSuccess(null);
          setCcRecipients([]); // Clear CC recipients on successful send
          setCcInputValue(''); // Clear input value too
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
      {stableEmail && !isRecording && !processingAudio && (
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

          {/* --- CC Autocomplete Input --- */}
          <Autocomplete
            multiple
            freeSolo // Allow entering emails not in contacts
            options={ccOptions} // Options fetched from API
            value={ccRecipients} // Controlled state for selected recipients
            onChange={(event, newValue) => {
              // newValue can be an array of Contact objects or strings (from freeSolo)
              const newRecipients = newValue.map(item => {
                if (typeof item === 'string') {
                  // Basic validation for freeSolo email entry
                  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)) { 
                    return { resourceName: 'freeSolo', name: item, email: item };
                  } else {
                    // Optionally handle invalid email format here (e.g., show an error)
                    console.warn('[AudioRecorder] Invalid email entered in CC:', item);
                    return null; // Or handle differently
                  }
                } 
                return item; // It's already a Contact object
              }).filter(item => item !== null) as Contact[]; // Filter out invalid entries
              setCcRecipients(newRecipients);
            }}
            inputValue={ccInputValue} // Controlled state for input text
            onInputChange={(event, newInputValue) => {
              setCcInputValue(newInputValue);
              // Fetch contacts when input changes (debounced)
              fetchContactsDebounced(newInputValue);
            }}
            getOptionLabel={(option) => {
              // Handle both string (from freeSolo initial input) and Contact objects
              if (typeof option === 'string') {
                return option;
              }
              return `${option.name} <${option.email}>`;
            }}
            renderTags={(value: readonly Contact[], getTagProps) =>
              value.map((option: Contact, index: number) => (
                <Chip 
                  variant="outlined" 
                  label={`${option.name} <${option.email}>`}
                  {...getTagProps({ index })} 
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Cc"
                placeholder="Add recipients (name or email)"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {ccLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
                sx={{ mt: 2 }} // Margin top to space from text area
              />
            )}
            // Render option to show name and email
            renderOption={(props, option) => (
              <li {...props} key={option.email}> 
                {option.name} ({option.email})
              </li>
            )}
            // Filter options based on input value (client-side filtering, API provides initial list)
            filterOptions={(options, state) => {
              let filtered = options;
              // Optional: Add further client-side filtering if needed
              // or rely solely on API results by returning options directly
              return filtered;
            }}
            // Ensure options are unique based on email
            isOptionEqualToValue={(option, value) => option.email === value.email}
            loading={ccLoading}
          />
          {/* --- End CC Autocomplete Input --- */}

          {/* Original EA Detected Indicator Logic (Remains commented out) */}
          {/* {isEaDetected && settings.eaEmail && ( <Box> ... </Box> )} */}
          {/* Keep this commented out or removed for now */} 

          {/* Action Buttons Box */} 
          {stableEmail && !isRecording && !processingAudio && (
            <Box 
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', sm: 'center' },
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
              {/* Action Buttons - Keep original logic for rendering buttons inside */}
              {(draftReply || transcription) && ( // Add this inner condition specifically for the buttons
                <>
                  {/* Enhance with AI Button */}
                  {(selectedAction === 'speech-to-text' || selectedAction === 'ai-draft') && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => generateReply(draftReply || transcription)} // Use existing text
                      disabled={isPerformingAction || generatingDraft || !draftReply}
                      startIcon={<AutoFixHighIcon />}
                      sx={{ ...commonButtonStyles }}
                    >
                      {generatingDraft ? 'Enhancing...' : 'Enhance with AI'}
                    </Button>
                  )}

                  {/* Save Draft Button */}
                  {(selectedAction === 'speech-to-text' || selectedAction === 'quick-decline' || selectedAction === 'ai-draft') && (
                     <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleSaveDraft}
                        disabled={isPerformingAction || savingDraft || !draftReply}
                        sx={{ ...commonButtonStyles }}
                      >
                        {getActionButtonText()} {/* Handles 'Save as Draft', 'Save Decline Draft' */}
                      </Button>
                  )}

                  {/* Send Button */}
                   {(selectedAction === 'speech-to-text' || selectedAction === 'quick-decline' || selectedAction === 'ai-draft') && (
                     <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSendEmail}
                        disabled={isPerformingAction || !draftReply}
                        startIcon={<SendIcon />}
                        sx={{ ...primaryButtonStyles }}
                     >
                        Send Email
                     </Button>
                  )}

                  {/* Add other action-specific buttons here if needed later */}
                </>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Recording Button - RENDER THIS OUTSIDE the specific state blocks, but hide when processing OR draft is shown */}
      {!processingAudio && !(draftReply || transcription) && renderRecordingButton()}

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
