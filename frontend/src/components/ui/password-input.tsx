import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  showStrength?: boolean;
  onStrengthChange?: (strength: 'weak' | 'medium' | 'strong' | 'very-strong') => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Enter your password",
  label,
  required = false,
  className = "",
  showStrength = true,
  onStrengthChange
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong' | 'very-strong'>('weak');

  const calculateStrength = (password: string): 'weak' | 'medium' | 'strong' | 'very-strong' => {
    if (password.length === 0) return 'weak';
    
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 5) return 'strong';
    return 'very-strong';
  };

  useEffect(() => {
    const newStrength = calculateStrength(value);
    setStrength(newStrength);
    onStrengthChange?.(newStrength);
  }, [value, onStrengthChange]);

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'strong': return 'text-yellow-600';
      case 'very-strong': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
      default: return '';
    }
  };

  const getStrengthBarColor = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'strong': return 'bg-yellow-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthBarWidth = () => {
    switch (strength) {
      case 'weak': return 'w-1/4';
      case 'medium': return 'w-1/2';
      case 'strong': return 'w-3/4';
      case 'very-strong': return 'w-full';
      default: return 'w-0';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={className}
          required={required}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
      
      {showStrength && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Password strength:</span>
            <span className={`text-xs font-medium ${getStrengthColor()}`}>
              {getStrengthText()}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()} ${getStrengthBarWidth()}`}></div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Tips for a strong password:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              {/* <li>Avoid common words or patterns</li> */}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
