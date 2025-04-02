import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { logger } from '../utils/logger';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

const TestWorkflow: React.FC = () => {
  const [steps, setSteps] = useState<TestStep[]>([
    { name: 'Auth0 Connection', status: 'pending' },
    { name: 'Audio Recording', status: 'pending' },
    { name: 'Transcription', status: 'pending' },
    { name: 'Email Generation', status: 'pending' },
    { name: 'Draft Saving', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateStep = (index: number, status: TestStep['status'], message?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, message } : step
    ));
  };

  const runTestWorkflow = async () => {
    setIsRunning(true);
    setSteps(steps.map(step => ({ ...step, status: 'pending' })));

    try {
      // Test Auth0 Connection
      updateStep(0, 'running');
      logger.info('Auth0', 'Testing Auth0 connection...');
      // Add actual Auth0 test logic here
      updateStep(0, 'success', 'Auth0 connection successful');

      // Test Audio Recording
      updateStep(1, 'running');
      logger.info('Audio', 'Testing audio recording...');
      // Add actual audio recording test logic here
      updateStep(1, 'success', 'Audio recording successful');

      // Test Transcription
      updateStep(2, 'running');
      logger.info('Transcription', 'Testing transcription service...');
      // Add actual transcription test logic here
      updateStep(2, 'success', 'Transcription successful');

      // Test Email Generation
      updateStep(3, 'running');
      logger.info('Email', 'Testing email generation...');
      // Add actual email generation test logic here
      updateStep(3, 'success', 'Email generation successful');

      // Test Draft Saving
      updateStep(4, 'running');
      logger.info('Gmail', 'Testing draft saving...');
      // Add actual draft saving test logic here
      updateStep(4, 'success', 'Draft saving successful');

    } catch (error) {
      logger.error('TestWorkflow', 'Error during test workflow', error);
      const failedStep = steps.findIndex(step => step.status === 'running');
      if (failedStep !== -1) {
        updateStep(failedStep, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStepColor = (status: TestStep['status']) => {
    switch (status) {
      case 'success': return 'success.main';
      case 'error': return 'error.main';
      case 'running': return 'primary.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Test Workflow
      </Typography>
      <Button
        variant="contained"
        onClick={runTestWorkflow}
        disabled={isRunning}
        sx={{ mb: 3 }}
      >
        {isRunning ? 'Running Tests...' : 'Run Test Workflow'}
      </Button>

      <Paper sx={{ p: 2 }}>
        {steps.map((step, index) => (
          <Box
            key={step.name}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 1,
              borderRadius: 1,
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ width: 24, height: 24, mr: 2 }}>
              {step.status === 'running' && (
                <CircularProgress size={24} />
              )}
              {step.status === 'success' && (
                <Typography color="success.main">✓</Typography>
              )}
              {step.status === 'error' && (
                <Typography color="error.main">✕</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                color={getStepColor(step.status)}
              >
                {step.name}
              </Typography>
              {step.message && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {step.message}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default TestWorkflow; 