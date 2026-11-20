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
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: `Nickname is too short (currently ${trimmed.length} / min 2 chars).`,
      trimmed,
      hasLeadingTrailingSpaces,
      hasMultipleInternalSpaces
    };
  }

  // 3. Maximum length check
  if (trimmed.length > 24) {
    return {
      isValid: false,
      error: `Nickname is too long (currently ${trimmed.length} / max 24 chars).`,
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

/**
 * Validates player's date of birth (DOB).
 * Enforces non-empty, valid calendar date, strictly non-future, and year >= 1900.
 */
export const validateDob = (dobString) => {
  if (!dobString || typeof dobString !== 'string' || dobString.trim().length === 0) {
    return {
      isValid: false,
      error: 'Date of birth is required.'
    };
  }

  const date = new Date(dobString.trim());
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid calendar date.'
    };
  }

  const today = new Date();
  if (date > today) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future.'
    };
  }

  if (date.getFullYear() < 1900) {
    return {
      isValid: false,
      error: 'Date of birth year must be 1900 or later.'
    };
  }

  return {
    isValid: true,
    error: null,
    isoString: date.toISOString().split('T')[0]
  };
};
