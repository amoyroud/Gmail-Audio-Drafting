import React, { useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import AudioRecorder from '../components/AudioRecorder';
import { Email } from '../types/types';

// Test email data
const testEmail: Email = {
  id: 'test123',
  from: {
    name: 'Test Sender',
    email: 'test@example.com'
  },
  subject: 'Test Email for Action Selector',
  snippet: 'This is a test email to verify the ActionSelector functionality...',
  body: 'This is a test email to verify that the ActionSelector component is correctly integrated into the AudioRecorder component.\n\nPlease test all actions: Speech-to-Text, AI Draft, Quick Decline, Move to Read, and Archive.',
  date: new Date().toISOString(),
  unread: true
};

const TestActionComponentPage: React.FC = () => {
  const [showComponent, setShowComponent] = useState(true);

  // Force component refresh
  const refreshComponent = () => {
    setShowComponent(false);
    setTimeout(() => setShowComponent(true), 100);
  };

  return (
    <Box sx={{ 
      p: 3,
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Action Selector Component Test
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={refreshComponent}
          sx={{ mr: 2 }}
        >
          Refresh Component
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This page tests the updated AudioRecorder with action-specific UI elements.
          You can click the refresh button to force a re-render of the component.
        </Typography>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Audio Recorder with Action Selector
        </Typography>
        
        {showComponent && (
          <AudioRecorder selectedEmail={testEmail} />
        )}
      </Paper>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Expected Behavior:
        </Typography>
        <ul>
          <li>The ActionSelector should appear at the top with 5 options</li>
          <li>For Speech-to-Text & AI Draft: A microphone recording button should appear</li>
          <li>For Decline: A "Choose Response Template" button should appear</li>
          <li>For To Read: A direct "Move Email to Read Later" button should appear</li>
          <li>For Archive: A direct "Archive Email" button should appear</li>
        </ul>
      </Box>
    </Box>
  );
};

export default TestActionComponentPage;
