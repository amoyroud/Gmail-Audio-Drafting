import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { runAllTests } from '../utils/serviceTests';
import { logger } from '../utils/logger';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

const TestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Audio Recording', status: 'pending' },
    { name: 'Transcription Service', status: 'pending' },
    { name: 'Email Generation', status: 'pending' },
    { name: 'Gmail Draft Saving', status: 'pending' },
  ]);

  const runTests = async () => {
    setIsRunning(true);
    setResults(prev => prev.map(result => ({ ...result, status: 'pending' })));

    try {
      const testResults = await runAllTests();
      
      setResults(prev => prev.map((result, index) => ({
        ...result,
        status: testResults[index]?.success ? 'success' : 'error',
        message: testResults[index]?.message
      })));
    } catch (error) {
      logger.error('TestPage', 'Error running tests', error);
      setResults(prev => prev.map(result => 
        result.status === 'running' 
          ? { ...result, status: 'error', message: 'Unexpected error occurred' }
          : result
      ));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Service Test Suite
      </Typography>
      
      <Button
        variant="contained"
        onClick={runTests}
        disabled={isRunning}
        sx={{ mb: 3 }}
      >
        {isRunning ? 'Running Tests...' : 'Run All Tests'}
      </Button>

      <Paper sx={{ p: 2 }}>
        {results.map((result) => (
          <Box
            key={result.name}
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
              {result.status === 'running' && (
                <CircularProgress size={24} />
              )}
              {result.status === 'success' && (
                <Typography color="success.main">✓</Typography>
              )}
              {result.status === 'error' && (
                <Typography color="error.main">✕</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                color={
                  result.status === 'success'
                    ? 'success.main'
                    : result.status === 'error'
                    ? 'error.main'
                    : 'text.primary'
                }
              >
                {result.name}
              </Typography>
              {result.message && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {result.message}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default TestPage; 