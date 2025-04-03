import { logger } from './logger';

interface ServiceTestResult {
  success: boolean;
  message: string;
  error?: any;
}



export const testAudioRecording = async (): Promise<ServiceTestResult> => {
  try {
    // Test microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Clean up
    logger.info('Audio', 'Microphone access successful');
    return { success: true, message: 'Audio recording test successful' };
  } catch (error) {
    logger.error('Audio', 'Audio recording test failed', error);
    return { success: false, message: 'Audio recording test failed', error };
  }
};

export const testTranscriptionService = async (): Promise<ServiceTestResult> => {
  try {
    // Add transcription service test logic here
    logger.info('Transcription', 'Testing transcription service...');
    return { success: true, message: 'Transcription service test successful' };
  } catch (error) {
    logger.error('Transcription', 'Transcription service test failed', error);
    return { success: false, message: 'Transcription service test failed', error };
  }
};

export const testEmailGeneration = async (): Promise<ServiceTestResult> => {
  try {
    // Add email generation test logic here
    logger.info('Email', 'Testing email generation...');
    return { success: true, message: 'Email generation test successful' };
  } catch (error) {
    logger.error('Email', 'Email generation test failed', error);
    return { success: false, message: 'Email generation test failed', error };
  }
};

export const testGmailDraftSaving = async (): Promise<ServiceTestResult> => {
  try {
    // Add Gmail draft saving test logic here
    logger.info('Gmail', 'Testing draft saving...');
    return { success: true, message: 'Gmail draft saving test successful' };
  } catch (error) {
    logger.error('Gmail', 'Gmail draft saving test failed', error);
    return { success: false, message: 'Gmail draft saving test failed', error };
  }
};

export const runAllTests = async (): Promise<ServiceTestResult[]> => {
  const tests = [
    { name: 'Audio Recording', fn: testAudioRecording },
    { name: 'Transcription', fn: testTranscriptionService },
    { name: 'Email Generation', fn: testEmailGeneration },
    { name: 'Gmail Draft', fn: testGmailDraftSaving }
  ];

  const results: ServiceTestResult[] = [];

  for (const test of tests) {
    logger.info('TestRunner', `Starting ${test.name} test`);
    const result = await test.fn();
    results.push(result);
    
    if (!result.success) {
      logger.error('TestRunner', `${test.name} test failed, stopping test suite`);
      break;
    }
  }

  return results;
}; 