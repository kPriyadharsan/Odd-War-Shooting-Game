/**
 * Player Profile Validation Utilities
 */

export const validateNickname = (rawNickname) => {
  if (typeof rawNickname !== 'string') {
    return {
      isValid: false,
      error: 'Nickname must be text.',
      trimmed: '',
      hasLeadingTrailingSpaces: false,
      hasMultipleInternalSpaces: false
    };
  }

  const trimmed = rawNickname.trim();
  const hasLeadingTrailingSpaces = rawNickname !== trimmed;
  const hasMultipleInternalSpaces = /\s{2,}/.test(trimmed);

  // 1. Empty check
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Nickname cannot be empty.',
      trimmed,
      hasLeadingTrailingSpaces,
      hasMultipleInternalSpaces
    };
  }

  // 2. Minimum length check
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: `Nickname is too short (currently ${trimmed.length} / min 3 chars).`,
      trimmed,
      hasLeadingTrailingSpaces,
      hasMultipleInternalSpaces
    };
  }

  // 3. Maximum length check
  if (trimmed.length > 16) {
    return {
      isValid: false,
      error: `Nickname is too long (currently ${trimmed.length} / max 16 chars).`,
      trimmed,
      hasLeadingTrailingSpaces,
      hasMultipleInternalSpaces
    };
  }

  // 4. Inappropriate control characters check (only allow letters, numbers, spaces, underscores, hyphens)
  // Rejects control characters, emojis, HTML tags, null bytes, backslashes
  const validPattern = /^[a-zA-Z0-9_\- ]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Allowed characters: letters (A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-).',
      trimmed,
      hasLeadingTrailingSpaces,
      hasMultipleInternalSpaces
    };
  }

  return {
    isValid: true,
    error: null,
    trimmed,
    hasLeadingTrailingSpaces,
    hasMultipleInternalSpaces
  };
};
