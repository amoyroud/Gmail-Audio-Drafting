import React, { createContext, useContext, useState } from 'react';
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

  return (
    <EmailContext.Provider value={{ selectedEmail, setSelectedEmail, isRecorderOpen, setIsRecorderOpen }}>
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
