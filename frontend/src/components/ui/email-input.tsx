import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { validateEmail } from '@/lib/utils';

interface EmailInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "you@example.com",
  label,
  required = false,
  className = "",
  showValidation = true,
  onValidationChange
}) => {
  const [validation, setValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value.trim() === '') {
      setValidation(null);
      onValidationChange?.(true); // Consider empty as valid initially
      return;
    }

    const validationResult = validateEmail(value);
    setValidation(validationResult);
    onValidationChange?.(validationResult.isValid);
  }, [value, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  const getInputClassName = () => {
    let baseClass = `email-input ${className}`;
    
    if (validation && showValidation) {
      if (validation.isValid) {
        baseClass += ' border-green-500 focus:border-green-500';
      } else {
        baseClass += ' border-red-500 focus:border-red-500';
      }
    }
    
    return baseClass;
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Input
        id={id}
        name={name}
        type="email"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={getInputClassName()}
        required={required}
      />
      
      {showValidation && validation && (
        <p className={`text-xs validation-message ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
          {validation.message}
        </p>
      )}
      
      {/* Additional email format tips */}
      {isFocused && !validation?.isValid && value.includes('@') && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
          <p className="font-medium mb-1">Email format tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Must contain @ symbol</li>
            <li>Must have a valid domain (e.g., gmail.com)</li>
            <li>Cannot start or end with @</li>
            <li>Cannot contain consecutive dots or @ symbols</li>
          </ul>
        </div>
      )}
    </div>
  );
};
