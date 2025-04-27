# Gmail Audio Drafting Project

This document serves as the central documentation for the Gmail Audio Drafting project.

**Core Goal:** To enable users to draft and send Gmail messages using audio recordings.

## Project Guidelines

- **Always read this file (`gmail-audio-drafting.md`) before writing any code.**
- **After adding a major feature or completing a milestone, update this file.**
- **Document the entire database schema in this file.**

## High-Level Architecture

*(To be filled in as the project progresses)*

- Frontend (e.g., Chrome Extension UI)
- Backend (e.g., Flask/FastAPI server)
- Transcription Service (e.g., Eleven Labs)
- Gmail API Integration

### Project Directory Structure (Top-Level)

```
.
├── .git/                     # Git version control files
├── .netlify/                 # Netlify deployment configuration
├── backup/                   # Backup files (if any)
├── build/                    # Compiled output directory
├── node_modules/             # Node.js dependencies
├── public/                   # Static assets served publicly
├── src/                      # Main source code directory
├── .gitignore                # Files/directories ignored by Git
├── .npmrc                    # npm configuration file
├── emailFormatter.js         # Standalone email formatting script?
├── gmail-audio-drafting.md   # This documentation file
├── netlify.toml              # Netlify configuration file
├── package-lock.json         # Exact dependency versions
├── package.json              # Project metadata and dependencies
├── README.md                 # Project README
├── tsconfig.json             # TypeScript configuration
└── windsurf_deployment.yaml  # Deployment configuration (Windsurf?)
```

## Database Schema

While this project primarily uses `localStorage` for settings currently, this section documents the structure for clarity and potential future migration.

**`UserSettings` (Stored in localStorage under key `user_settings`)**

| Field Name          | Data Type                                                 | Description                                                                                             | Default Value                  |
|---------------------|-----------------------------------------------------------|---------------------------------------------------------------------------------------------------------|--------------------------------|
| `emailPromptTemplate` | `string`                                                  | Template used by the AI (Mistral) to generate email drafts. Includes placeholders like `{transcribedText}`. | See `settingsService.ts`       |
| `signature`         | `string`                                                  | User's email signature, appended to the AI-generated text *after* generation.                    | 'Antoine'                    |
| `templates`         | `EmailTemplate[]`                                         | Array of predefined email templates (e.g., for quick declines).                                         | See `settingsService.ts`       |
| `eaName`            | `string?`                                                 | Optional: The name/trigger phrase the user says in the audio to automatically CC the EA.                  | `''` (Empty string)           |
| `eaEmail`           | `string?`                                                 | Optional: The email address of the Executive Assistant to be CC'd when `eaName` is detected.            | `''` (Empty string)           |
| `eaNameVariations`  | `Array<{ name: string; confidence: number }> \| null?` | Optional: AI-generated list of likely spelling variations for `eaName` to improve detection accuracy.   | `null`                         |

*(Other tables like Users, Drafts, etc., might be added if a backend database is implemented.)*

## Features

### Audio Drafting Workflow (Simplified)

1.  **Start Recording:** The user clicks the microphone button or presses the spacebar (when the component is focused) associated with an email.
2.  **Recording:** The component captures audio input.
3.  **Stop Recording:** The user clicks the stop button or releases the spacebar.
4.  **Processing:**
    *   The recorded audio is sent to the transcription service (`elevenlabsService.transcribeSpeech`).
    *   During transcription, specific keywords (like an EA name) can trigger actions (e.g., adding the EA's email to the CC list).
    *   The returned transcription text is then automatically sent to the AI service (`mistralService.generateDraftResponse`) along with context from the original email.
5.  **Display Draft:** The AI-enhanced draft reply is displayed to the user.
6.  **User Actions:** The user is presented with the following options:
    *   **Edit:** Allows the user to modify the generated draft text directly in a text area.
    *   **Add CC:** Users can search for and add contacts to the CC list using an autocomplete field.
    *   **Save Draft:** Saves the current draft (edited or original AI-generated) to Gmail using `gmailService.createDraft`.
    *   **Send:** Sends the current draft (edited or original AI-generated) as an email reply using `gmailService.sendEmail`.

*This flow removes the previous explicit "Enhance with AI" step, making it an integral part of the speech-to-text process.*

### Add Executive Assistant (EA) via Voice

- **Configuration:** Users can set an "EA Trigger Name/Phrase" and "EA Email Address" in the Settings page (`src/pages/SettingsPage.tsx`).
- **Name Variation Generation:** When the `eaName` is saved in settings, an AI call (`src/services/mistralService.ts#generateNameVariations`) is triggered to generate a list of likely phonetic/spelling variations (e.g., "Sarah" -> "Sara", "Sareh"). This list is stored in `localStorage` alongside the name and email (`eaNameVariations`). If generation fails, an error is shown, and the variations are not stored.
- **Trigger Detection:** When processing an audio recording's transcription (`src/services/actionService.ts#handleSpeechToText`), the system checks if the configured `eaEmail` exists.
    - If `eaNameVariations` are available, it checks if *any* of these variations (case-insensitive) are present in the transcription.
    - If variations are *not* available (or none matched), it falls back to checking if the exact `eaName` (case-insensitive) is present.
- **Action:** If a match is found (either via variation or exact name) and an `eaEmail` is configured, the `eaEmail` is automatically added to the CC list of the generated Gmail draft.
- **Implementation:** Settings are managed via `src/services/settingsService.ts` (using `localStorage`). The detection logic is in `handleSpeechToText` within `src/services/actionService.ts`. Name variations are generated by `generateNameVariations` in `src/services/mistralService.ts`.

## Feature Backlog

- [X] Basic audio recording and transcription.
- [X] Gmail draft creation via API.
- [ ] User authentication (OAuth with Google).
- [X] Project Documentation Setup (`gmail-audio-drafting.md`).
- [X] Settings page for configuration (e.g., API keys, EA email).
- [X] "Add EA" feature triggered by voice command.
- [X] EA Name Variation Generation & Usage for Robust Detection.
- [X] Streamlined Audio-to-Draft Workflow (Automatic AI Enhancement).
- [ ] Error handling and logging (ongoing improvement).

## Setup and Installation

*(To be added - instructions on how to set up the development environment and run the project)* 