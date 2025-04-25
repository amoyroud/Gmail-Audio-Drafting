import { Mistral } from '@mistralai/mistralai';
import { DraftGenerationParams } from '../types/types';
import axios from 'axios';

const MISTRAL_API_KEY = process.env.REACT_APP_MISTRAL_API_KEY;

/**
 * Generate a draft response using Mistral AI
 * @param params Parameters for draft generation
 * @returns Generated draft text
 */
export const generateDraftResponse = async (
  params: DraftGenerationParams
): Promise<string> => {
  console.log('Starting Mistral draft generation...');
  console.log('Mistral API key present:', !!MISTRAL_API_KEY);
  
  if (!MISTRAL_API_KEY) {
    console.error('Mistral API key is missing or not configured');
    throw new Error('Mistral API key is not configured');
  }

  try {
    console.log('Initializing Mistral client...');
    const client = new Mistral({
      apiKey: MISTRAL_API_KEY
    });

    const { emailSubject, emailBody, transcribedText, senderName } = params;
    console.log('Draft generation params received:', {
      emailSubject,
      senderName,
      transcribedTextLength: transcribedText?.length || 0
    });

    // Get user settings for the prompt template
    console.log('Loading settings for prompt template...');
    const { getSettings } = await import('./settingsService');
    const { emailPromptTemplate, signature } = getSettings();
    console.log('Settings loaded, prompt template length:', emailPromptTemplate?.length || 0);
    
    // Replace variables in the template
    const prompt = emailPromptTemplate
      .replace('{emailSubject}', emailSubject)
      .replace('{senderName}', senderName)
      .replace('{emailBody}', emailBody)
      .replace('{transcribedText}', transcribedText)
      .replace('{signature}', signature);
    
    console.log('Prompt prepared, length:', prompt.length);
    console.log('Making request to Mistral API...');

    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('Mistral API response received');
    
    if (!chatResponse?.choices?.[0]?.message?.content) {
      console.error('Invalid response structure from Mistral API', chatResponse);
      throw new Error('Invalid response from Mistral API');
    }

    const content = chatResponse.choices[0].message.content;
    console.log('Content type:', typeof content, 'Is array:', Array.isArray(content));
    // If content is an array of chunks, join them together
    const result = Array.isArray(content) ? content.map(chunk => chunk.toString()).join('') : content;
    console.log('Mistral draft generation successful!');
    return result;
  } catch (error: unknown) {
    console.error('Error in generateDraftResponse:', error);
    
    // Handle Axios errors specifically
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error Details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    }
    
    // Handle MistralAI SDK errors
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      // Return a more specific error message if available
      if (error.message.includes('API key')) {
        throw new Error('Invalid Mistral API key. Please check your configuration.');
      }
      
      if (error.message.includes('rate limit')) {
        throw new Error('Mistral API rate limit exceeded. Please try again later.');
      }
    }
    
    throw new Error('Failed to generate draft response. Please try again.');
  }
}; 