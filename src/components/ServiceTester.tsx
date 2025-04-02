import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';
import { transcribeSpeech } from '../services/elevenlabsService';
import { generateDraftResponse } from '../services/mistralService';
import { logger } from '../utils/logger';

const ServiceTester: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [testEmailSubject, setTestEmailSubject] = useState('Project Update - Q2 Roadmap');
  const [testSenderName, setTestSenderName] = useState('John Smith');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      logger.info('Recording', 'Started audio recording');
    } catch (error) {
      logger.error('Recording', 'Error starting recording:', error);
      alert('Error starting recording. Please make sure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      logger.info('Recording', 'Stopped audio recording');
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      alert('Please record some audio first');
      return;
    }

    setIsTranscribing(true);
    try {
      const text = await transcribeSpeech(audioBlob);
      setTranscribedText(text);
      logger.info('Transcription', 'Successfully transcribed audio');
    } catch (error) {
      logger.error('Transcription', 'Error transcribing audio:', error);
      alert('Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!transcribedText) {
      alert('Please transcribe some audio first');
      return;
    }

    setIsGenerating(true);
    try {
      const draft = await generateDraftResponse({
        emailSubject: testEmailSubject,
        transcribedText,
        senderName: testSenderName,
        emailBody: ''
      });
      setGeneratedDraft(draft);
      logger.info('Draft Generation', 'Successfully generated draft');
    } catch (error) {
      logger.error('Draft Generation', 'Error generating draft:', error);
      alert('Error generating draft. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Service Tester
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Test Parameters
        </Typography>
        <TextField
          fullWidth
          label="Test Email Subject"
          value={testEmailSubject}
          onChange={(e) => setTestEmailSubject(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Test Sender Name"
          value={testSenderName}
          onChange={(e) => setTestSenderName(e.target.value)}
        />
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          1. Record Audio
        </Typography>
        <Button
          variant="contained"
          onClick={isRecording ? stopRecording : startRecording}
          color={isRecording ? 'secondary' : 'primary'}
          sx={{ mb: 2 }}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        {audioBlob && (
          <Typography variant="body2" color="text.secondary">
            Audio recorded! ({Math.round(audioBlob.size / 1024)} KB)
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          2. Transcribe Audio
        </Typography>
        <Button
          variant="contained"
          onClick={handleTranscribe}
          disabled={!audioBlob || isTranscribing}
          sx={{ mb: 2 }}
        >
          {isTranscribing ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Transcribing...
            </>
          ) : (
            'Transcribe Audio'
          )}
        </Button>
        {transcribedText && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Transcribed Text:</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
              <Typography>{transcribedText}</Typography>
            </Paper>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          3. Generate Draft
        </Typography>
        <Button
          variant="contained"
          onClick={handleGenerateDraft}
          disabled={!transcribedText || isGenerating}
          sx={{ mb: 2 }}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Generating...
            </>
          ) : (
            'Generate Draft'
          )}
        </Button>
        {generatedDraft && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Generated Draft:</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
              <Typography style={{ whiteSpace: 'pre-line' }}>{generatedDraft}</Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ServiceTester; 