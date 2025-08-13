
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isVerifying: boolean;
  setVerifying: (verifying: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  isLoading: true, 
  isVerifying: false,
  setVerifying: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
      // Reset verifying state when auth state changes
      setIsVerifying(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isLoading,
    isVerifying,
    setVerifying: setIsVerifying
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
