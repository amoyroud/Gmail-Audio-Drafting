import React, { createContext, useContext, useState, useEffect } from 'react';
import { Email } from '../types/types';

interface EmailContextType {
  selectedEmail: Email | undefined;
  setSelectedEmail: (email: Email | undefined) => void;
  isRecorderOpen: boolean;
  setIsRecorderOpen: (open: boolean) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | undefined>(undefined);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  
  // Create a wrapped version of setSelectedEmail with logging and deduplication
  const setSelectedEmailWithLogging = (email: Email | undefined) => {
    // Skip update if it's the same email (prevent infinite loops)
    if (email?.id === selectedEmail?.id) {
      console.log('EmailContext - Skipping setSelectedEmail, same email ID:', email?.id);
      return;
    }
    
    console.log('EmailContext - setSelectedEmail called with:', email ? `${email.id} (${email.subject})` : 'undefined');
    setSelectedEmail(email);
  };
  
  // Log when selectedEmail changes
  useEffect(() => {
    console.log('EmailContext - selectedEmail changed to:', selectedEmail ? `${selectedEmail.id} (${selectedEmail.subject})` : 'undefined');
  }, [selectedEmail]);

  return (
    <EmailContext.Provider value={{ 
      selectedEmail, 
      setSelectedEmail: setSelectedEmailWithLogging, 
      isRecorderOpen, 
      setIsRecorderOpen 
    }}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};
