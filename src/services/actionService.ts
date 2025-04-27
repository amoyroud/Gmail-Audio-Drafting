import { Email, EmailTemplate, EmailAction, ActionResult, DraftEmail, EmailActionType } from '../types/types';
import { createDraft, modifyLabels, archiveEmail, sendEmail } from '../services/gmailService';
import { generateDraftResponse } from './mistralService';
import { getSettings } from './settingsService';

// Response type for createDraft function
interface CreateDraftResponse {
  success: boolean;
  data?: any;
  id?: string;
}

// We don't need this interface anymore since mistralService returns a string directly

/**
 * Executes the appropriate action based on the action type
 * @param action The email action to perform
 * @returns ActionResult indicating success/failure and any relevant data
 */
export const executeAction = async (action: EmailAction): Promise<ActionResult> => {
  console.log('executeAction: Starting with action type:', action.type);
  console.log('executeAction: Action payload:', {
    type: action.type,
    enhance: action.enhance,
    hasTranscription: !!action.transcription,
    transcriptionLength: action.transcription?.length || 0,
    hasEmail: !!action.email,
    hasTemplate: !!action.template,
    templateName: action.template?.name
  });
  
  try {
    switch (action.type) {
      case 'speech-to-text':
        console.log('executeAction: Handling speech-to-text action');
        return await handleSpeechToText(action);
      case 'ai-draft':
        console.log('executeAction: Handling ai-draft action (converting to speech-to-text with enhance)');
        // AI Draft is like speech-to-text but with AI enhancement always on
        return await handleSpeechToText({
          ...action,
          type: 'speech-to-text',
          enhance: true
        });
      case 'quick-decline':
        console.log('executeAction: Handling quick-decline action');
        return await handleQuickDecline(action);
      case 'move-to-read':
        console.log('executeAction: Handling move-to-read action');
        return await handleMoveToRead(action);
      case 'archive':
        console.log('executeAction: Handling archive action');
        return await handleArchive(action);
      default:
        console.log('executeAction: Unknown action type:', action.type);
        return {
          success: false,
          message: `Unknown action type: ${action.type}`
        };
    }
  } catch (error) {
    console.error('executeAction: Error executing action:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Handles speech-to-text action
 */
const handleSpeechToText = async (action: EmailAction): Promise<ActionResult> => {
  console.log('handleSpeechToText: Starting with action type:', action.type);
  console.log('handleSpeechToText: Enhance flag is:', action.enhance);
  
  if (!action.transcription) {
    console.log('handleSpeechToText: No transcription provided');
    return {
      success: false,
      message: 'No transcription provided for speech-to-text action'
    };
  }

  try {
    let emailContent = action.transcription;
    const transcriptLower = action.transcription.toLowerCase(); // Lowercase transcript once for efficiency
    console.log('handleSpeechToText: Transcription length:', emailContent.length);
    
    const { eaName, eaEmail, eaNameVariations } = getSettings();
    let ccList: string[] = [];
    let eaWasAdded = false;

    console.log('handleSpeechToText: Checking for EA mention. Settings:', { eaName, eaEmail, hasVariations: !!eaNameVariations });

    if (eaName && eaEmail && action.transcription) {
      let foundMatch = false;
      // Prioritize checking variations if they exist and are valid
      if (Array.isArray(eaNameVariations) && eaNameVariations.length > 0) {
          console.log(`handleSpeechToText: Checking ${eaNameVariations.length} EA name variations...`);
          for (const variation of eaNameVariations) {
              if (transcriptLower.includes(variation.name.toLowerCase())) {
                  console.log(`handleSpeechToText: EA Variation "${variation.name}" detected in transcription.`);
                  foundMatch = true;
                  break; // Stop checking once a match is found
              }
          }
      }
      
      // If no variations matched (or variations didn't exist), fall back to exact eaName check
      if (!foundMatch && transcriptLower.includes(eaName.toLowerCase())) {
          console.log(`handleSpeechToText: EA Name (exact) "${eaName}" detected in transcription.`);
          foundMatch = true;
      }

      // If any match was found, add the EA email
      if (foundMatch) {
          console.log(`handleSpeechToText: Adding EA email "${eaEmail}" to CC list.`);
          ccList.push(eaEmail);
          eaWasAdded = true;
      } else {
          console.log(`handleSpeechToText: No EA name or variation detected for "${eaName}".`);
      }
    } else {
      console.log(`handleSpeechToText: EA triggering skipped (missing eaName, eaEmail, or transcription).`);
    }
    
    // If enhance flag is set, use the Mistral LLM to enhance the transcription
    if (action.enhance) {
      console.log('handleSpeechToText: Enhancement with Mistral requested');
      try {
        console.log('handleSpeechToText: Calling generateDraftResponse...');
        // Generate AI draft using the transcription
        emailContent = await generateDraftResponse({
          transcribedText: action.transcription, // Use original transcription for context
          emailSubject: action.email.subject,
          emailBody: action.email.body,
          senderName: action.email.from.name
        });
        console.log('handleSpeechToText: Mistral enhancement successful');
        console.log('handleSpeechToText: Enhanced content length:', emailContent.length);
      } catch (error) {
        console.error('handleSpeechToText: Error enhancing transcription with AI:', error);
        // Continue with the original transcription if enhancement fails
        // Email content remains action.transcription in this case
      }
    } else {
      console.log('handleSpeechToText: No enhancement requested, using raw transcription');
    }

    // Create a draft email object (using ccList determined above)
    const draftEmail: DraftEmail = {
      to: action.email.from.email,
      subject: `Re: ${action.email.subject}`,
      body: emailContent,
      cc: ccList // Include the CC list (might be empty or contain eaEmail)
    };

    try {
      // Create a draft in Gmail
      console.log('handleSpeechToText: Creating Gmail draft with CC:', draftEmail.cc);
      const draftId = await createDraft(draftEmail);
      console.log('handleSpeechToText: Draft created successfully with ID:', draftId);
      
      return {
        success: true,
        message: action.enhance ? 'AI-enhanced draft created' : 'Speech draft created',
        data: { 
          draft: emailContent, 
          draftId, 
          eaAddedToCc: eaWasAdded // Pass the flag indicating if EA was added
        }
      };
    } catch (error) {
      console.error('handleSpeechToText: Error creating draft:', error);
      return {
        success: false,
        message: `Failed to create draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { 
          draft: emailContent, // Still return the processed content
          eaAddedToCc: false // EA wasn't successfully added if draft creation failed
        } 
      };
    }
  } catch (error) {
    console.error('handleSpeechToText: Error in speech-to-text:', error);
    return {
      success: false,
      message: `Error in speech-to-text: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Handles quick decline using a template
 */
const handleQuickDecline = async (action: EmailAction): Promise<ActionResult> => {
  console.log('handleQuickDecline: Starting with template:', action.template?.name);
  
  if (!action.template) {
    console.log('handleQuickDecline: No template provided');
    return {
      success: false,
      message: 'No template provided for quick decline action'
    };
  }

  try {
    // Format the email content using the template and recipient information
    const formattedBody = action.template.body
      .replace(/{sender}/g, action.email.from.name || action.email.from.email.split('@')[0])
      .replace(/{subject}/g, action.email.subject)
      .replace(/{name}/g, 'Me'); // TODO: Get user's name from profile

    console.log('handleQuickDecline: Formatted email body:', formattedBody.substring(0, 100) + '...');

    const draftEmail: DraftEmail = {
      to: action.email.from.email,
      subject: `Re: ${action.email.subject}`,
      body: formattedBody
    };

    // Send the email directly instead of creating a draft
    console.log('handleQuickDecline: Sending decline email response to:', draftEmail.to);
    const emailId = await sendEmail(draftEmail);
    
    if (!emailId) {
      console.error('handleQuickDecline: Failed to send email, no emailId returned');
      return {
        success: false,
        message: 'Failed to send decline email',
        data: null
      };
    }
    
    console.log('handleQuickDecline: Email sent successfully with ID:', emailId);
    
    // Now archive the original email
    console.log('handleQuickDecline: Archiving original email:', action.email.id);
    const archiveResult = await archiveEmail(action.email.id);
    
    if (!archiveResult.success) {
      console.error('handleQuickDecline: Failed to archive email:', archiveResult);
      return {
        success: false,
        message: 'Email sent but failed to archive original email',
        data: { emailId }
      };
    }
    
    console.log('handleQuickDecline: Original email archived successfully');
    
    return {
      success: true,
      message: 'Decline email sent and original email archived',
      data: { emailId }
    };
  } catch (error) {
    console.error('handleQuickDecline: Error:', error);
    return {
      success: false,
      message: `Failed to create decline draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
};

/**
 * Handles moving an email to the "To Read" label
 */
const handleMoveToRead = async (action: EmailAction): Promise<ActionResult> => {
  try {
    // We'll use a generic label ID for now - this will be customizable later
    const result = await modifyLabels(action.email.id, {
      addLabelIds: ['Label_ToRead'],
      removeLabelIds: []
    });
    
    if (result.success) {
      return {
        success: true,
        message: 'Email moved to To Read folder',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: 'Failed to move email to To Read folder',
        data: result.data
      };
    }
  } catch (error) {
    console.error('Error moving email to To Read:', error);
    return {
      success: false,
      message: `Error moving email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Handles archiving an email
 */
const handleArchive = async (action: EmailAction): Promise<ActionResult> => {
  try {
    const result = await archiveEmail(action.email.id);
    
    if (result.success) {
      return {
        success: true,
        message: 'Email archived successfully',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: 'Failed to archive email',
        data: result.data
      };
    }
  } catch (error) {
    console.error('Error archiving email:', error);
    return {
      success: false,
      message: `Error archiving email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Chains multiple actions together to be executed in sequence
 * @param actions Array of actions to execute in sequence
 * @returns ActionResult for the combined operation
 */
export const chainActions = async (actions: EmailAction[]): Promise<ActionResult> => {
  const results: ActionResult[] = [];
  let anyFailed = false;
  
  for (const action of actions) {
    const result = await executeAction(action);
    results.push(result);
    
    if (!result.success) {
      anyFailed = true;
    }
  }
  
  return {
    success: !anyFailed,
    message: anyFailed ? 'One or more actions failed' : 'All actions completed successfully',
    data: { results }
  };
};
