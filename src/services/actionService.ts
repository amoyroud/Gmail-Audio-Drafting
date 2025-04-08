import { Email, EmailTemplate, EmailAction, ActionResult, DraftEmail, EmailActionType } from '../types/types';
import { createDraft, sendEmail, archiveEmail, modifyLabels } from './gmailService';
import { generateDraftResponse } from './mistralService';

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
  try {
    switch (action.type) {
      case 'speech-to-text':
        return await handleSpeechToText(action);
      case 'quick-decline':
        return await handleQuickDecline(action);
      case 'move-to-read':
        return await handleMoveToRead(action);
      case 'archive':
        return await handleArchive(action);
      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`
        };
    }
  } catch (error) {
    console.error('Error executing action:', error);
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
  if (!action.transcription) {
    return {
      success: false,
      message: 'No transcription provided for speech-to-text action'
    };
  }

  try {
    let emailContent = action.transcription;
    
    // If enhance flag is set, use the Mistral LLM to enhance the transcription
    if (action.enhance) {
      try {
        // Generate AI draft using the transcription
        emailContent = await generateDraftResponse({
          transcribedText: action.transcription,
          emailSubject: action.email.subject,
          emailBody: action.email.body,
          senderName: action.email.from.name
        });
      } catch (error) {
        console.error('Error enhancing transcription with AI:', error);
        // Continue with the original transcription if enhancement fails
      }
    }

    // Create a draft email with the transcription or AI-enhanced content
    const draftEmail: DraftEmail = {
      to: action.email.from.email,
      subject: `Re: ${action.email.subject}`,
      body: emailContent
    };

    try {
      // Create a draft in Gmail
      const draftId = await createDraft(draftEmail);
      
      return {
        success: true,
        message: action.enhance ? 'AI-enhanced draft created' : 'Speech draft created',
        data: { draft: emailContent, draftId }
      };
    } catch (error) {
      console.error('Error creating draft:', error);
      return {
        success: false,
        message: `Failed to create draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { draft: emailContent }
      };
    }
  } catch (error) {
    console.error('Error in speech-to-text:', error);
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
  if (!action.template) {
    return {
      success: false,
      message: 'No template provided for quick decline action'
    };
  }

  const draftEmail: DraftEmail = {
    to: action.email.from.email,
    subject: `Re: ${action.email.subject}`,
    body: action.template.body
  };

  try {
    const draftId = await createDraft(draftEmail);
    
    return {
      success: true,
      message: 'Decline template draft created',
      data: { draftId }
    };
  } catch (error) {
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
