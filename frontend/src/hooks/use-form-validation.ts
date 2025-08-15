import { useState, useCallback } from 'react';
import { validateEmail } from '@/lib/utils';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => { isValid: boolean; message: string };
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

export interface ValidationState {
  errors: ValidationErrors;
  isValid: boolean;
  touched: { [fieldName: string]: boolean };
}

export const useFormValidation = (rules: ValidationRules) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: true,
    touched: {}
  });

  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const rule = rules[fieldName];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.trim() === '')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value.trim() === '') return null;

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (!result.isValid) {
        return result.message;
      }
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((formData: { [key: string]: string }): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName] || '');
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setValidationState(prev => ({
      ...prev,
      errors: newErrors,
      isValid
    }));

    return isValid;
  }, [rules, validateField]);

  const validateSingleField = useCallback((fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error || ''
      },
      isValid: Object.keys(prev.errors).length === 0 || !error
    }));

    return error;
  }, [validateField]);

  const markFieldAsTouched = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [fieldName]: true
      }
    }));
  }, []);

  const resetValidation = useCallback(() => {
    setValidationState({
      errors: {},
      isValid: true,
      touched: {}
    });
  }, []);

  const getFieldError = useCallback((fieldName: string): string | null => {
    return validationState.errors[fieldName] || null;
  }, [validationState.errors]);

  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return validationState.touched[fieldName] || false;
  }, [validationState.touched]);

  const hasErrors = useCallback((): boolean => {
    return Object.keys(validationState.errors).length > 0;
  }, [validationState.errors]);

  return {
    validationState,
    validateField,
    validateForm,
    validateSingleField,
    markFieldAsTouched,
    resetValidation,
    getFieldError,
    isFieldTouched,
    hasErrors
  };
};

// Predefined validation rules for common fields
export const commonValidationRules = {
  email: {
    required: true,
    custom: validateEmail
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters' };
      }
      if (!/[A-Z]/.test(value)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
      }
      if (!/[a-z]/.test(value)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
      }
      if (!/[0-9]/.test(value)) {
        return { isValid: false, message: 'Password must contain at least one number' };
      }
      return { isValid: true, message: 'Password is strong' };
    }
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50
  }
};
