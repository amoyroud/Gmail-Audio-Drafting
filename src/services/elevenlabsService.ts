import axios from 'axios';

// Elevenlabs API base URL
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;

// Supported audio formats
const SUPPORTED_AUDIO_FORMATS = [
  'audio/wav', 
  'audio/mpeg', 
  'audio/mp3', 
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/webm;codecs=pcm',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus'
];

interface TranscriptionResponse {
  text: string;
  language_code?: string;
  language_probability?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    type: 'word' | 'spacing' | 'audio_event';
    speaker_id?: string;
  }>;
}

/**
 * Transcribe speech using Elevenlabs Scribe API
 * @param audioBlob Audio blob to transcribe
 * @returns Transcribed text
 */
export const transcribeSpeech = async (audioBlob: Blob): Promise<string> => {
  // Validate API key
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key is missing. Check your .env file.');
    throw new Error('ElevenLabs API key is not configured');
  }

  // Validate audio format - use a more flexible check for mobile compatibility
  const baseType = audioBlob.type.split(';')[0]; // Get the base MIME type without codecs
  const isSupported = SUPPORTED_AUDIO_FORMATS.some(format => 
    audioBlob.type === format || format.startsWith(baseType)
  );
  
  if (!isSupported) {
    console.error(`Unsupported audio format: ${audioBlob.type}`);
    console.error('Supported formats:', SUPPORTED_AUDIO_FORMATS.join(', '));
    throw new Error(`Unsupported audio format: ${audioBlob.type}. Please use one of: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`);
  }

  try {
    console.log('Starting transcription with ElevenLabs API...');
    console.log('Audio blob type:', audioBlob.type);
    console.log('Audio blob size:', audioBlob.size, 'bytes');

    // Convert blob to FormData
    const formData = new FormData();
    
    // Get file extension based on MIME type
    let fileExtension = 'webm'; // Default extension
    const mimeType = audioBlob.type.toLowerCase();
    
    if (mimeType.includes('wav')) {
      fileExtension = 'wav';
    } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      fileExtension = 'mp3';
    } else if (mimeType.includes('mp4')) {
      fileExtension = 'mp4';
    } else if (mimeType.includes('ogg')) {
      fileExtension = 'ogg';
    }
    
    console.log(`Using file extension: ${fileExtension} for MIME type: ${mimeType}`);
    
    // Make sure we're sending a valid audio file
    // Check blob size and adjust if needed
    if (audioBlob.size === 0) {
      throw new Error('Audio recording is empty. Please try again.');
    }
    
    // For very large files, you might need to adjust or compress
    if (audioBlob.size > 25 * 1024 * 1024) { // > 25MB
      console.warn('Audio file is very large, which might cause API issues');
    }
    
    // Append file with proper extension and required model_id
    formData.append('file', audioBlob, `audio.${fileExtension}`);
    formData.append('model_id', 'scribe_v1');

    // Log the form data contents without iterating
    console.log('FormData contains file and model_id fields');
    
    console.log('Making request to ElevenLabs API...');
    console.log('API URL:', `${ELEVENLABS_API_URL}/speech-to-text`);
    console.log('API Key present:', !!ELEVENLABS_API_KEY);

    // Make request to ElevenLabs Speech-to-Text API
    const response = await axios.post<TranscriptionResponse>(
      `${ELEVENLABS_API_URL}/speech-to-text`,
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Accept': 'application/json',
        },
        timeout: 1800000, // 30 minute timeout for larger files
      }
    );

    // Check for valid response
    if (!response.data || !response.data.text) {
      console.error('Invalid API response:', response.data);
      throw new Error('Invalid response from ElevenLabs API');
    }

    console.log('Transcription successful!');
    return response.data.text;
  } catch (error) {
    console.error('Error in transcribeSpeech:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error('API Error Details:', {
        status,
        data,
        headers: error.response?.headers,
      });

      if (status === 401) {
        throw new Error('Authentication failed. Please check your ElevenLabs API key.');
      }
      
      if (status === 400) {
        console.error('Bad Request Error. Full details:', error.response?.data);
        throw new Error('Audio format issue. Please try speaking more clearly or for a longer duration.');
      }
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED') {
        console.error('Timeout Error. The request took too long to complete.');
        throw new Error('Transcription timed out. Your audio file may be too large or the service is currently experiencing high load. Please try a shorter recording or try again later.');
      }
      
      const message = data?.detail || data?.message || JSON.stringify(data) || 'Please try again.';
      throw new Error(`Transcription failed: ${message}`);
    }
    
    throw new Error('Failed to transcribe speech. Please try again.');
  }
}; 