// Validation utilities for form fields
export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  custom?: (value: string) => string | undefined;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export const validateEmail = (email: string): string | undefined => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return undefined;
};

export const validateField = (
  fieldName: string,
  value: string,
  rules: ValidationRule
): string | undefined => {
  // Check required
  if (rules.required) {
    if (!value || value.trim() === '') {
      return typeof rules.required === 'string'
        ? rules.required
        : `${fieldName} is required`;
    }
  }

  // Skip other validations if field is empty and not required
  if (!value && !rules.required) {
    return undefined;
  }

  // Check minLength
  if (rules.minLength && value.length < rules.minLength.value) {
    return rules.minLength.message;
  }

  // Check maxLength
  if (rules.maxLength && value.length > rules.maxLength.value) {
    return rules.maxLength.message;
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.value.test(value)) {
    return rules.pattern.message;
  }

  // Check custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return undefined;
};

// Preset validators for common cases
export const validators = {
  email: (value: string) => validateEmail(value),
  password: (value: string) => validatePassword(value),
  confirmPassword: (value: string, password: string) => {
    if (value !== password) {
      return 'Passwords do not match';
    }
    return undefined;
  },
  name: (value: string) => {
    if (value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    return undefined;
  },
  phone: (value: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid 10-digit phone number';
    }
    return undefined;
  },
};