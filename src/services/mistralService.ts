import { Mistral } from '@mistralai/mistralai';
import { DraftGenerationParams } from '../types/types';

const MISTRAL_API_KEY = process.env.REACT_APP_MISTRAL_API_KEY;

/**
 * Generate a draft response using Mistral AI
 * @param params Parameters for draft generation
 * @returns Generated draft text
 */
export const generateDraftResponse = async (
  params: DraftGenerationParams
): Promise<string> => {
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API key is not configured');
  }

  try {
    const client = new Mistral({
      apiKey: MISTRAL_API_KEY
    });

    const { emailSubject, emailBody, transcribedText, senderName } = params;

    // Create a prompt that includes all the context
    const prompt = `You are an AI assistant helping to draft an email response for a venture capitalist.

Context:
- Email subject: "${emailSubject}"
- Sender name: ${senderName}
- Original email body: "${emailBody}"
- My transcribed voice notes about how to respond: "${transcribedText}"

Task: Write a professional and friendly email response that:
1. Addresses the sender appropriately
2. References the original email subject and content
3. Incorporates the key points from my transcribed voice notes
4. Maintains a friendly tone
5. Sign with Antoine


Write the complete email response:`;

    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    if (!chatResponse?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Mistral API');
    }

    const content = chatResponse.choices[0].message.content;
    // If content is an array of chunks, join them together
    return Array.isArray(content) ? content.map(chunk => chunk.toString()).join('') : content;
  } catch (error) {
    console.error('Error in generateDraftResponse:', error);
    throw new Error('Failed to generate draft response. Please try again.');
  }
}; 