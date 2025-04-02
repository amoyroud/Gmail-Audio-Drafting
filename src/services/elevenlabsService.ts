import axios from 'axios';

// Elevenlabs API base URL
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;

// Supported audio formats
const SUPPORTED_AUDIO_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];

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

  // Validate audio format
  if (!SUPPORTED_AUDIO_FORMATS.includes(audioBlob.type)) {
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
    formData.append('file', audioBlob, `audio.${audioBlob.type.split('/')[1]}`);
    formData.append('model_id', 'whisper-1');

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
      
      const message = data?.detail || data?.message || 'Please try again.';
      throw new Error(`Transcription failed: ${message}`);
    }
    
    throw new Error('Failed to transcribe speech. Please try again.');
  }
}; 