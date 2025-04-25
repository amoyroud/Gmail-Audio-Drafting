import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Tooltip,
  Divider,
  useTheme,
  LinearProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import { transcribeSpeech } from '../services/elevenlabsService';

// Audio file extensions and MIME types
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.mp4'];
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

// Map of problematic MIME types to supported ones
const MIME_TYPE_MAP: Record<string, string> = {
  'audio/x-m4a': 'audio/mp4'
};

// Function to convert audio to a supported format if needed
const convertAudioFormat = async (file: File): Promise<Blob> => {
  // If the file type is already supported by the API, just return the blob
  if (SUPPORTED_MIME_TYPES.includes(file.type)) {
    const arrayBuffer = await file.arrayBuffer();
    return new Blob([arrayBuffer], { type: file.type });
  }
  
  // If we have a mapped type, convert it
  if (MIME_TYPE_MAP[file.type]) {
    console.log(`Converting ${file.type} to ${MIME_TYPE_MAP[file.type]}`);
    const arrayBuffer = await file.arrayBuffer();
    return new Blob([arrayBuffer], { type: MIME_TYPE_MAP[file.type] });
  }
  
  // For x-m4a files specifically (even if not in the map)
  if (file.type === 'audio/x-m4a' || file.name.toLowerCase().endsWith('.m4a')) {
    console.log('Converting x-m4a to mp4 audio format');
    const arrayBuffer = await file.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'audio/mp4' });
  }
  
  // If no conversion is available, throw an error
  throw new Error(`Unsupported audio format: ${file.type}. Please convert to a supported format first.`);
};

const FileTranscriptionPage: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editableTranscription, setEditableTranscription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    handleFileSelection(files[0]);
  }, []);
  
  // File validation and handling
  const handleFileSelection = (file: File) => {
    // Check if file is an audio file
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidExtension = SUPPORTED_AUDIO_EXTENSIONS.includes(fileExtension);
    // More permissive check for MIME types - just check if it starts with audio/
    const isAudioFile = file.type.startsWith('audio/');
    
    if (!isValidExtension && !isAudioFile) {
      setError(`Unsupported file type. Please upload one of the following formats: ${SUPPORTED_AUDIO_EXTENSIONS.join(', ')}`);
      return;
    }
    
    setAudioFile(file);
    setSuccess(`File "${file.name}" selected (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Transcription process
  const handleTranscribe = async () => {
    if (!audioFile) {
      setError('Please select an audio file first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if we need format conversion
      const needsConversion = !SUPPORTED_MIME_TYPES.includes(audioFile.type);
      
      if (needsConversion) {
        setIsConverting(true);
        setSuccess('Converting audio format for compatibility...');
      }
      
      // Convert audio format if needed
      const blob = await convertAudioFormat(audioFile);
      
      if (isConverting) {
        setIsConverting(false);
        setSuccess('Format conversion complete. Now transcribing...');
      }
      
      // Use the existing transcribeSpeech function
      const text = await transcribeSpeech(blob);
      
      setTranscription(text);
      setEditableTranscription(text);
      setSuccess('Transcription completed successfully');
    } catch (err: any) {
      console.error('Error transcribing audio:', err);
      setError(`Error transcribing audio: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setIsConverting(false);
    }
  };
  
  // Helper functions
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(isEditing ? editableTranscription : transcription);
    setSuccess('Copied to clipboard');
    
    // Hide success message after 2 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };
  
  const handleDownloadTranscription = () => {
    const text = isEditing ? editableTranscription : transcription;
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcription_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const handleStartEditing = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdits = () => {
    setTranscription(editableTranscription);
    setIsEditing(false);
    setSuccess('Edits saved');
    
    // Hide success message after 2 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };
  
  const handleCancelEdits = () => {
    setEditableTranscription(transcription);
    setIsEditing(false);
  };
  
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Audio File Transcription
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload an audio file to transcribe it directly to text using the same scribe_v1 model.
      </Typography>
      
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
      
      {/* File Upload Area */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: '12px',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging 
            ? theme.palette.mode === 'dark' 
              ? 'rgba(144, 202, 249, 0.08)' 
              : 'rgba(33, 150, 243, 0.08)'
            : theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(144, 202, 249, 0.05)' 
              : 'rgba(33, 150, 243, 0.05)'
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          accept={SUPPORTED_AUDIO_EXTENSIONS.join(',')}
        />
        
        {audioFile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AudioFileIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {audioFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(audioFile.size / 1024 / 1024).toFixed(2)} MB • {audioFile.type || 'Unknown format'}
            </Typography>
          </Box>
        ) : (
          <>
            <UploadFileIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & Drop your audio file here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: {SUPPORTED_AUDIO_EXTENSIONS.join(', ')}
            </Typography>
          </>
        )}
      </Paper>
      
      {/* Transcribe Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={!audioFile || isProcessing}
          onClick={handleTranscribe}
          startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: '8px',
            minWidth: '200px'
          }}
        >
          {isConverting ? 'Converting Format...' : isProcessing ? 'Transcribing...' : 'Transcribe Audio'}
        </Button>
      </Box>
      
      {audioFile && audioFile.size > 10 * 1024 * 1024 && !isProcessing && (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Large file detected ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB). Transcription may take up to 30 minutes.
          </Typography>
        </Box>
      )}
      
      {/* Processing indicator */}
      {isProcessing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
            <Box sx={{ position: 'relative', pt: 1 }}>
              <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={isConverting ? 30 : 70} />
                </Box>
              </Box>
              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Uploading
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: isConverting ? 'primary.main' : 'text.secondary' }}>
                  Converting
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: !isConverting && isProcessing ? 'primary.main' : 'text.secondary' }}>
                  Transcribing
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {isConverting 
              ? "Converting audio format for compatibility with transcription service..." 
              : audioFile && audioFile.size > 20 * 1024 * 1024
                ? "Processing large audio file. This may take several minutes..."
                : "Processing your audio file. This may take a minute for longer recordings..."}
          </Typography>
        </Box>
      )}
      
      {/* Transcription Results */}
      {transcription && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.02)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Transcription Result
            </Typography>
            <Box>
              {isEditing ? (
                <>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleCancelEdits}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={handleSaveEdits}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Tooltip title="Copy to clipboard">
                    <IconButton onClick={handleCopyToClipboard} sx={{ mr: 1 }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download as text file">
                    <IconButton onClick={handleDownloadTranscription} sx={{ mr: 1 }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleStartEditing}
                  >
                    Edit
                  </Button>
                </>
              )}
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              minRows={8}
              maxRows={20}
              value={editableTranscription}
              onChange={(e) => setEditableTranscription(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }
              }}
            />
          ) : (
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.8 
              }}
            >
              {transcription}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FileTranscriptionPage; 