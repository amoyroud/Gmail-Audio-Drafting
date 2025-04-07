/*
This is a comprehensive email formatter for handling special characters in emails.
You can copy the formatEmailBody function from this file into your HomePage.tsx.
*/

// Format email body with proper spacing and handling encoding issues
const formatEmailBody = (body) => {
  if (!body) return null;
  
  // Advanced text processing to handle encoding issues
  let processedBody = body;
  
  // Step 1: Try using TextDecoder for primary decoding
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const bytes = new Uint8Array(body.split('').map(char => char.charCodeAt(0)));
    const decodedText = decoder.decode(bytes);
    if (decodedText) processedBody = decodedText;
  } catch (e) {
    console.log('TextDecoder failed, falling back to pattern replacements');
  }
  
  // Step 2: Fix common encoding issues with special characters
  // French characters
  const frenchChars = [
    { pattern: /Ã©/g, replacement: 'é' },
    { pattern: /Ã¨/g, replacement: 'è' },
    { pattern: /Ã /g, replacement: 'à' },
    { pattern: /Ã¢/g, replacement: 'â' },
    { pattern: /Ãª/g, replacement: 'ê' },
    { pattern: /Ã®/g, replacement: 'î' },
    { pattern: /Ã´/g, replacement: 'ô' },
    { pattern: /Ã»/g, replacement: 'û' },
    { pattern: /Ã§/g, replacement: 'ç' },
    { pattern: /Ã€/g, replacement: 'À' },
    { pattern: /Ã‰/g, replacement: 'É' },
    { pattern: /Ãˆ/g, replacement: 'È' },
    { pattern: /Ã‡/g, replacement: 'Ç' },
    { pattern: /Ã'/g, replacement: 'Ô' },
    { pattern: /Ã"/g, replacement: 'Û' },
    { pattern: /Ã­/g, replacement: 'Ù' },
    // Additional common character variations
    { pattern: /[Ã¤Ã¤Ã¤]/g, replacement: 'ä' },
    { pattern: /[Ã¶Ã¶Ã¶]/g, replacement: 'ö' },
    { pattern: /[Ã¼Ã¼Ã¼]/g, replacement: 'ü' },
    
    // Handle nbsp and other spaces
    { pattern: /Â /g, replacement: ' ' },
  ];
  
  // Spanish characters
  const spanishChars = [
    { pattern: /Ã±/g, replacement: 'ñ' },
    { pattern: /Ã¯/g, replacement: 'ï' },
    { pattern: /Â¿/g, replacement: '¿' },
    { pattern: /Â¡/g, replacement: '¡' },
  ];
  
  // German characters
  const germanChars = [
    { pattern: /Ã¤/g, replacement: 'ä' },
    { pattern: /Ã¶/g, replacement: 'ö' },
    { pattern: /Ã¼/g, replacement: 'ü' },
    { pattern: /ÃŸ/g, replacement: 'ß' },
  ];
  
  // Nordic characters
  const nordicChars = [
    { pattern: /Ã¦/g, replacement: 'æ' },
    { pattern: /Ã¸/g, replacement: 'ø' },
    { pattern: /Ã¥/g, replacement: 'å' },
    { pattern: /Ã†/g, replacement: 'Æ' },
    { pattern: /Ã˜/g, replacement: 'Ø' },
    { pattern: /Ã…/g, replacement: 'Å' },
  ];
  
  // Common punctuation and symbols
  const punctuation = [
    { pattern: /â€™/g, replacement: "'" },  // Smart single quote
    { pattern: /[â€œâ€]/g, replacement: '"' }, // Smart double quotes
    { pattern: /â€¦/g, replacement: '...' },  // Ellipsis
    { pattern: /â€"/g, replacement: '—' },    // Em dash
    { pattern: /â€"/g, replacement: '–' },    // En dash
    { pattern: /Â©/g, replacement: '©' },     // Copyright
    { pattern: /Â®/g, replacement: '®' },     // Registered
    { pattern: /â„¢/g, replacement: '™' },     // Trademark
    { pattern: /Â°/g, replacement: '°' },     // Degree
    { pattern: /Â²/g, replacement: '²' },     // Superscript 2
    { pattern: /Â³/g, replacement: '³' },     // Superscript 3
    { pattern: /Â½/g, replacement: '½' },     // Half
    { pattern: /Â¼/g, replacement: '¼' },     // Quarter
    { pattern: /Â¾/g, replacement: '¾' },     // Three quarters
    { pattern: /Â±/g, replacement: '±' },     // Plus-minus
    { pattern: /Â§/g, replacement: '§' },     // Section
    { pattern: /Â¶/g, replacement: '¶' },     // Paragraph
    { pattern: /â‚¬/g, replacement: '€' },     // Euro
    { pattern: /Â£/g, replacement: '£' },     // Pound
    { pattern: /Â¥/g, replacement: '¥' },     // Yen
  ];
  
  // Combine all character sets
  const allCharacterFixes = [
    ...frenchChars,
    ...spanishChars,
    ...germanChars,
    ...nordicChars,
    ...punctuation,
  ];
  
  // Apply all fixes
  allCharacterFixes.forEach(fix => {
    processedBody = processedBody.replace(fix.pattern, fix.replacement);
  });
  
  // Step 3: Fix Unicode escape sequences
  processedBody = processedBody.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => 
    String.fromCharCode(parseInt(hex, 16))
  );
  
  // Step 4: Additional text cleanup
  processedBody = processedBody
    // Fix double spaces
    .replace(/\s{2,}/g, ' ')
    // Fix quotes that might be incorrectly placed
    .replace(/(['"])\s+([.,;:!?])/g, '$1$2')
    // Fix spaces before punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    // Ensure proper spacing after punctuation
    .replace(/([.,;:!?])(?=[a-zA-Z])/g, '$1 ');
  
  return processedBody;
};
