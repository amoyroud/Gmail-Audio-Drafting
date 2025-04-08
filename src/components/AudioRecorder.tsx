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
  
  // Action mode state
  const [selectedAction, setSelectedAction] = useState<EmailActionType>(initialAction || 'ai-draft');
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Get templates from settings
  const { settings } = useSettings();
  
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Update local state when initialAction changes from parent
  useEffect(() => {
    if (initialAction) {
      setSelectedAction(initialAction);
      
      // Reset state when action changes
      setAudioBlob(null);
      setTranscription('');
      setDraftReply('');
      setEditMode(false);
      setSelectedTemplateId('');
      setSuccess(null);
      setError(null);
    }
  }, [initialAction]);

  useEffect(() => {
    if (selectedAction !== 'quick-decline') {
      setSelectedTemplateId('');
    }
  }, [selectedAction]);

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
      let mimeType = '';
      for (const type of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        console.warn('No supported MIME type found, using default');
      } else {
        console.log('Selected MIME type:', mimeType);
      }
      
      // Initialize with reasonable defaults for mobile
      const options = {
        mimeType,
        audioBitsPerSecond: 128000
      };
      
      audioChunksRef.current = [];
      setIsRecording(true);
      
      // Notify parent about recording state change
      if (onRecordingStateChange) {
        onRecordingStateChange(true);
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      // Set a shorter timeslice for mobile devices to improve quality
      const timeslice = isMobile ? 1000 : 10000; // 1 second for mobile, 10 seconds for desktop
      
      mediaRecorderRef.current.start(timeslice);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(audioBlob);
        setIsRecording(false);
        
        // Stop all audio tracks
        stream.getAudioTracks().forEach(track => track.stop());
        
        processAudioToText(audioBlob);
      };
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setError(`Error starting recording: ${error.message || 'Unknown error'}`);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    setIsRecording(false);
    // Notify parent about recording state change
    if (onRecordingStateChange) {
      onRecordingStateChange(false);
    }
    
    mediaRecorderRef.current.stop();
    
    // Release microphone access
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    mediaRecorderRef.current = null;
  };
  
  const processAudioToText = async (audioBlob: Blob) => {
    try {
      setProcessingAudio(true);
      setError(null);
      
      const text = await transcribeSpeech(audioBlob);
      setTranscription(text);
      
      // Process the transcription based on the selected action type
      processTranscription(text);
    } catch (error: any) {
      console.error('Error processing audio:', error);
      setError(`Error processing audio: ${error.message || 'Unknown error'}`);
      setProcessingAudio(false);
    }
  };
  
  const processTranscription = (text: string) => {
    if (selectedAction === 'ai-draft') {
      // Continue with AI draft generation
      generateReply(text);
    } else if (selectedAction === 'speech-to-text') {
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
        
        // Execute the AI draft action
        const result = await executeAction({
          type: 'ai-draft',
          email: stableEmail,
          transcription: transcribedText
        });
        
        if (result.success && result.data?.draft) {
          setDraftReply(result.data.draft);
          // Make sure we keep the transcription available even after AI enhancement
          if (selectedAction === 'speech-to-text') {
            setTranscription(transcribedText);
          }
        } else {
          setError(`Error generating reply: ${result.message}`);
        }
        
        setGeneratingDraft(false);
        setProcessingAudio(false);
      }
    } catch (error: any) {
      console.error('Error generating reply:', error);
      setError(`Error generating reply: ${error.message || 'Unknown error'}`);
      setGeneratingDraft(false);
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
          
        case 'ai-draft':
          // For AI draft, we've already generated the content
          result = await executeAction({
            type: 'speech-to-text', // Just save the draft, AI processing already done
            email: stableEmail,
            transcription: draftReply
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
  
  const getSuccessMessage = (action: EmailActionType): string => {
    switch (action) {
      case 'speech-to-text':
        return 'Draft saved successfully!';
      case 'ai-draft':
        return 'AI-generated draft saved successfully!';
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
      case 'ai-draft':
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
    if (!template) return;
    
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
      
      {/* Action Selector removed - now handled by parent component */}
      
      {/* Email Response Window - Step 3 in hierarchy - Only show when an action is selected or recording is in progress */}
      {(selectedAction || isRecording || processingAudio || audioBlob || transcription) && (
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
        {/* Action-specific UI */}
        {!isRecording && !processingAudio && !audioBlob && !transcription && selectedAction && (
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
            {(selectedAction === 'speech-to-text' || selectedAction === 'ai-draft') && (
              <>
                <IconButton
                  onClick={startRecording}
                  size="large"
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                    boxShadow: 3,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MicIcon sx={{ fontSize: 32 }} />
                </IconButton>
                <Typography 
                  variant="body2" 
                  sx={{ position: 'absolute', bottom: 20, color: 'text.secondary' }}
                >
                  Click to start recording
                </Typography>
              </>
            )}
            
            {/* Quick decline action */}
            {selectedAction === 'quick-decline' && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Select Template</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose a template to use for your email
                </Typography>
                
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
              </Box>
            )}
            
            {/* Move to read action */}
            {selectedAction === 'move-to-read' && (
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
            )}
            
            {/* Archive action */}
            {selectedAction === 'archive' && (
              <Button
                variant="contained"
                color="primary"
                onClick={performAction}
                disabled={isPerformingAction || !stableEmail}
                startIcon={<ArchiveIcon />}
                sx={{
                  ...primaryButtonStyles,
                  height: 4
                }}
              >
                {isPerformingAction ? 'Archiving...' : 'Archive Email'}
              </Button>
            )}
          </Box>
        )}
        
        {/* Recording in progress */}
        {isRecording && (
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

        {/* Transcription UI removed - now only shown in the draft reply section */}
        </Paper>
      )}

      {/* Draft Reply Section */}
      {((draftReply || transcription) && !isRecording && !processingAudio && stableEmail) && (
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
              {selectedAction === 'speech-to-text' && !generatingDraft && draftReply && (
                <Tooltip title="Enhance with AI">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      console.log('Enhance with AI clicked');
                      generateReply(draftReply);
                    }}
                    startIcon={<AutoFixHighIcon />}
                    sx={{ ml: 1, borderRadius: '8px', fontSize: '0.75rem' }}
                  >
                    Enhance with AI
                  </Button>
                </Tooltip>
              )}
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

          {((draftReply && !generatingDraft) || transcription || selectedAction === 'move-to-read' || selectedAction === 'archive') && (
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
                startIcon={selectedAction === 'archive' ? <ArchiveIcon /> : <SendIcon />}
                onClick={async () => {
                  // For archive action, directly call performAction
                  if (selectedAction === 'archive' && stableEmail) {
                    try {
                      setIsPerformingAction(true);
                      const result = await archiveEmail(stableEmail.id);
                      setSuccess('Email archived successfully!');
                      if (onActionComplete) onActionComplete();
                      setTimeout(() => setSuccess(null), 2000);
                    } catch (error) {
                      console.error('Error archiving email:', error);
                      setError('Failed to archive email. Please try again.');
                    } finally {
                      setIsPerformingAction(false);
                    }
                  } else {
                    // For other actions, use the normal flow
                    handleSaveDraft();
                  }
                }}
                disabled={
                  isPerformingAction || 
                  savingDraft || 
                  processingAudio ||
                  ((selectedAction !== 'speech-to-text' && selectedAction !== 'move-to-read' && selectedAction !== 'archive') && !draftReply) ||
                  (selectedAction === 'speech-to-text' && !transcription && !draftReply)
                }
                sx={{ 
                  ...primaryButtonStyles,
                  boxShadow: 2,
                  height: 48
                }}
              >
                {getActionButtonText()}
              </Button>
              
              {/* Show send button for draft actions (speech-to-text now shows both buttons) */}
              {(selectedAction === 'speech-to-text' || selectedAction === 'ai-draft' || selectedAction === 'quick-decline') && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendEmail}
                  disabled={!draftReply || processingAudio || isPerformingAction}
                  startIcon={<SendIcon />}
                  sx={{
                    ...primaryButtonStyles,
                    height: 48
                  }}
                >
                  Send Email
                </Button>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AudioRecorder;
