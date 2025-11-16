export function preprocessInput(text: string): string {
  // Remove extra whitespace and normalize line breaks
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n');
}

export function validateInput(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Input text cannot be empty' };
  }

  if (text.length > 5000) {
    return { valid: false, error: 'Input text is too long (max 5000 characters)' };
  }

  return { valid: true };
}

