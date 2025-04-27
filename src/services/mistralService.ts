import { Mistral } from '@mistralai/mistralai';
import { DraftGenerationParams } from '../types/types';
import axios from 'axios';

const MISTRAL_API_KEY = process.env.REACT_APP_MISTRAL_API_KEY;

// Type for name variation results
interface NameVariation {
  name: string;
  confidence: number;
}

// Helper to validate the structure of the name variation response
function isValidNameVariationArray(data: any): data is NameVariation[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        typeof item.confidence === 'number'
    )
  );
}

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
      .replace('{transcribedText}', transcribedText);
    
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
    const generatedBody = Array.isArray(content) ? content.map(chunk => chunk.toString()).join('') : content;

    // Append the signature to the generated body
    const finalResult = `${generatedBody.trim()}\n\n${signature}`;

    console.log('Mistral draft generation successful, signature appended.');
    return finalResult;
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

/**
 * Generates likely name variations for a given name using Mistral AI.
 * @param name The name to generate variations for.
 * @returns A promise that resolves to an array of name variations with confidence scores.
 */
export const generateNameVariations = async (name: string): Promise<NameVariation[]> => {
  console.log(`Starting name variation generation for: "${name}"...`);

  if (!name) {
    console.log('Name provided is empty, returning empty array.');
    return [];
  }

  if (!MISTRAL_API_KEY) {
    console.error('Mistral API key is missing or not configured');
    throw new Error('Mistral API key is not configured');
  }

  // Construct the prompt using the provided template
  const prompt = `You are an onomastics (name‑science) and phonetics expert.\n\nTASK\nFor the spoken name **\"${name}\"**, list every real given‑name spelling that an English‑language ASR engine such as ElevenLabs could plausibly output when it hears that name— including alternate spellings, transliterations, common nicknames, and accent‑driven variants.\n\nCONSTRAINTS\n1. **Real names only** – every item must already exist as a personal name somewhere in the world.\n2. **No invented or nonsense strings.**\n3. **Ranking** – attach a probability‑like *confidence* score (0 – 1) reflecting your judgment of how likely the ASR model would output that variant (1 = the original spelling). Stop listing once the score would fall below **0.10**.\n4. **Output strictly as valid JSON** – an array of objects, each object containing exactly two keys:\n   * \"name\" → the spelling (string)\n   * \"confidence\" → the score (number)\n5. **No additional text, comments, or keys. Only the JSON array.**\n\nFEW‑SHOT EXAMPLES\n- Example 1 (spoken name **Sarah** → JSON answer):\n\\\`\\\`\\\`json\n[\n  {"name":"Sarah","confidence":1},\n  {"name":"Sara","confidence":0.79},\n  {"name":"Sareh","confidence":0.32},\n  {"name":"Sarai","confidence":0.25},\n  {"name":"Saira","confidence":0.21}\n]\n\\\`\\\`\\\`\n- Example 2 (spoken name **Luis** → JSON answer):\n\\\`\\\`\\\`json\n[\n  {"name":"Luis","confidence":1},\n  {"name":"Louis","confidence":0.82},\n  {"name":"Lewis","confidence":0.74},\n  {"name":"Luiz","confidence":0.34},\n  {"name":"Louie","confidence":0.28}\n]\n\\\`\\\`\\\`\n\nNOW ANSWER FOR **\"${name}\"**.`

  try {
    console.log('Initializing Mistral client for name variations...');
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });

    console.log('Making request to Mistral API for name variations...');
    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest", // Or potentially a smaller/faster model if sufficient
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      responseFormat: { type: 'json_object' }, // Request JSON output
    });

    console.log('Mistral API response received for name variations.');

    if (!chatResponse?.choices?.[0]?.message?.content) {
      console.error('Invalid response structure from Mistral API for variations', chatResponse);
      throw new Error('Invalid response structure from Mistral API');
    }

    const content = chatResponse.choices[0].message.content;
    console.log('Raw content received:', content);
    // Add logs for debugging the type issue
    console.log('Type of content:', typeof content);
    console.log('Is content an array?:', Array.isArray(content));

    // Parse the JSON string
    let parsedVariations: unknown;
    try {
      // Fix: Check if content is a string before parsing
      if (typeof content === 'string') {
        parsedVariations = JSON.parse(content);
        console.log('Parsed variations:', parsedVariations);
      } else {
        // This case should not happen with responseFormat: 'json_object'
        console.error('Unexpected response format: Expected a JSON string, but received:', typeof content, content);
        throw new Error('Unexpected response format received from Mistral API.');
      }
    } catch (jsonError) {
      console.error('Failed to parse JSON response from Mistral API:', jsonError);
      console.error('Raw content was:', content); // Log raw content on parse error
      throw new Error('Failed to parse JSON response from Mistral API');
    }

    // Validate the structure of the parsed JSON
    if (!isValidNameVariationArray(parsedVariations)) {
      console.error('Parsed JSON does not match the expected structure:', parsedVariations);
      throw new Error('Invalid data structure received from Mistral API');
    }
    
    // Add the original name with confidence 1 if not already present
    const originalNameLower = name.toLowerCase();
    const hasOriginal = parsedVariations.some(v => v.name.toLowerCase() === originalNameLower);
    if (!hasOriginal) {
        console.log('Original name not found in variations, adding it with confidence 1.');
        parsedVariations.unshift({ name: name, confidence: 1 });
    }

    console.log('Name variation generation successful!');
    return parsedVariations;

  } catch (error: unknown) {
    console.error('Error in generateNameVariations:', error);
    // Reuse existing error handling logic, potentially making it a shared function
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error Details:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.message.includes('API key')) {
        throw new Error('Invalid Mistral API key. Please check your configuration.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Mistral API rate limit exceeded. Please try again later.');
      }
    }
    // Specific error for variation generation failure
    throw new Error('Failed to generate name variations. Please try again.');
  }
}; 