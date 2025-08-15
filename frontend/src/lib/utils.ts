import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Email validation utilities
export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  // Check for common invalid patterns
  if (email.startsWith('@') || email.endsWith('@')) {
    return { isValid: false, message: 'Email cannot start or end with @' };
  }

  if (email.includes('..') || email.includes('@@')) {
    return { isValid: false, message: 'Email contains invalid characters' };
  }

  // Check length
  if (email.length > 254) {
    return { isValid: false, message: 'Email is too long' };
  }

  // Check for valid domain
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'Invalid email format' };
  }

  const domain = parts[1];
  if (domain.length < 2 || !domain.includes('.')) {
    return { isValid: false, message: 'Invalid domain format' };
  }

  // Check for valid TLD
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return { isValid: false, message: 'Invalid domain format' };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'yopmail.com', 'getnada.com', 'sharklasers.com', 'guerrillamailblock.com'
  ];
  
  if (disposableDomains.some(disposable => domain.toLowerCase().includes(disposable))) {
    return { isValid: false, message: 'Disposable email addresses are not allowed' };
  }

  // Check for common typos in popular domains
  const commonTypos: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com'
  };

  const domainLower = domain.toLowerCase();
  if (commonTypos[domainLower]) {
    return { isValid: false, message: `Did you mean ${commonTypos[domainLower]}?` };
  }

  return { isValid: true, message: 'Email format is valid' };
};

export const isEmailAvailable = async (email: string): Promise<{ available: boolean; message: string }> => {
  try {
    // This would typically call your API to check if email exists
    // For now, we'll just return a mock response
    // You can implement the actual API call here
    return { available: true, message: 'Email is available' };
  } catch (error) {
    return { available: false, message: 'Error checking email availability' };
  }
};
