import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { archiveEmail, moveToRead, isSignedIn, getEmailById } from './services/gmailService';
import { executeAction } from './services/actionService';
import { EmailTemplate } from './types/types';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import EmailViewPage from './pages/EmailViewPage';
import TestPage from './pages/TestPage';
import ServiceTester from './components/ServiceTester';
import SettingsPage from './pages/SettingsPage';
import TestActionComponentPage from './pages/TestActionComponentPage';
import FileTranscriptionPage from './pages/FileTranscriptionPage';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import { EmailProvider } from './context/EmailContext';

// Theme
import ThemeProvider from './theme/ThemeProvider';

// Define a wrapper component for Layout
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [currentDeclineEmailId, setCurrentDeclineEmailId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const navigate = useNavigate();
  
  // Email action handlers
  const handleArchive = async (emailId: string): Promise<void> => {
    try {
      console.log('App.tsx - handleArchive: Archiving email', emailId);
      const result = await archiveEmail(emailId);
      
      if (result.success) {
        console.log('App.tsx - handleArchive: Successfully archived email, navigating to home');
        // After successful archiving, navigate back to home
        navigate('/home');
      } else {
        console.error('App.tsx - handleArchive: Failed to archive email', result);
        window.alert('Failed to archive the email. Please try again.');
      }
    } catch (error) {
      console.error('App.tsx - handleArchive: Error archiving email:', error);
      window.alert('An error occurred while archiving the email.');
    }
  };
  
  const handleMoveToRead = async (emailId: string): Promise<void> => {
    try {
      console.log('App.tsx - handleMoveToRead: Moving email to read later', emailId);
      const result = await moveToRead(emailId);
      
      if (result.success) {
        console.log('App.tsx - handleMoveToRead: Successfully moved email to read later, navigating to home');
        // After successfully moving to read, navigate back to home
        navigate('/home');
      } else {
        console.error('App.tsx - handleMoveToRead: Failed to move email to read later', result);
        window.alert('Failed to move the email to Read Later. Please try again.');
      }
    } catch (error) {
      console.error('App.tsx - handleMoveToRead: Error moving email to read later:', error);
      window.alert('An error occurred while moving the email to Read Later.');
    }
  };
  
  const handleQuickDecline = async (emailId: string, template?: EmailTemplate): Promise<void> => {
    try {
      console.log('App.tsx - handleQuickDecline: Quick declining email', emailId, 'with template:', template?.name || 'none');
      
      // Use the passed template if provided, otherwise use the state
      const templateToUse = template || selectedTemplate;
      
      // If we have a selected template (either passed or from state)
      if (templateToUse) {
        console.log('App.tsx - handleQuickDecline: Using template', templateToUse.name);
        
        // Ensure we have the selectedTemplate state set if it wasn't passed directly
        // This is for consistency, though templateToUse is the primary source here
        if (!selectedTemplate && templateToUse) {
          setSelectedTemplate(templateToUse);
        }
        
        // Execute the decline action with the template
        const email = await getEmailById(emailId);
        console.log('App.tsx - handleQuickDecline: Fetched email', email.id, email.subject);
        
        const result = await executeAction({
          type: 'quick-decline',
          email,
          template: templateToUse
        });
        
        console.log('App.tsx - handleQuickDecline: Action result', result);
        
        if (result.success) {
          console.log('App.tsx - handleQuickDecline: Successfully processed decline action', result);
          // Reset the selected template state if it was used
          if (selectedTemplate?.id === templateToUse.id) {
             setSelectedTemplate(null);
          }
          // Navigate back to home
          navigate('/home');
        } else {
          console.error('App.tsx - handleQuickDecline: Failed to process decline action', result);
          window.alert('Failed to process the decline action. Please try again.');
        }
      } else {
        // If no template is selected or passed, open the template dialog
        console.log('App.tsx - handleQuickDecline: No template provided, opening dialog');
        setCurrentDeclineEmailId(emailId);
        setShowTemplateDialog(true);
      }
    } catch (error) {
      console.error('App.tsx - handleQuickDecline: Error declining email:', error);
      window.alert('An error occurred while declining the email.');
    }
  };
  
  const handleTemplateSelected = (template: EmailTemplate) => {
    console.log('App.tsx - handleTemplateSelected: Template selected', template.name);
    // We don't necessarily need to set state here anymore, but it doesn't hurt
    setSelectedTemplate(template);
    setShowTemplateDialog(false);
    
    // If we have a current email ID, decline it with the selected template
    if (currentDeclineEmailId) {
      console.log('App.tsx - handleTemplateSelected: Processing email with ID', currentDeclineEmailId);
      // Store the email ID before resetting it
      const emailId = currentDeclineEmailId;
      
      // Reset state
      setCurrentDeclineEmailId(null);
      
      // Handle the decline action, passing the selected template directly
      handleQuickDecline(emailId, template);
    } else {
      console.log('App.tsx - handleTemplateSelected: No current email ID');
    }
  };
  
  return (
    <Layout 
      onArchive={handleArchive}
      onMoveToRead={handleMoveToRead}
      onQuickDecline={handleQuickDecline}
      showTemplateDialog={showTemplateDialog}
      onCloseTemplateDialog={() => setShowTemplateDialog(false)}
      currentDeclineEmailId={currentDeclineEmailId}
      onTemplateSelected={handleTemplateSelected}
    >
      {children}
    </Layout>
  );
};

// Define a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication on mount and listen for changes
  useEffect(() => {
    console.log('ProtectedRoute: Checking authentication on component mount');
    
    // Initial auth check - now async
    const checkAuth = async () => {
      console.log('ProtectedRoute: Performing initial auth check with isSignedIn()');
      try {
        const authStatus = await isSignedIn();
        console.log('ProtectedRoute: Initial auth status is', authStatus);
        
        if (authStatus) {
          console.log('ProtectedRoute: User is authenticated, will render protected content');
        } else {
          console.log('ProtectedRoute: User is not authenticated, will redirect');
        }
        
        setAuthenticated(authStatus);
      } catch (error) {
        console.error('ProtectedRoute: Error checking authentication', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up listener for auth changes
    const handleAuthChange = () => {
      console.log('ProtectedRoute: Authentication event received (gmail_authenticated)');
      setAuthenticated(true);
    };
    
    const handleSignOut = () => {
      console.log('ProtectedRoute: Sign out event received (gmail_signed_out)');
      setAuthenticated(false);
      navigate('/login', { replace: true });
    };
    
    console.log('ProtectedRoute: Adding event listeners for auth changes');
    window.addEventListener('gmail_authenticated', handleAuthChange);
    window.addEventListener('gmail_signed_out', handleSignOut);
    
    return () => {
      console.log('ProtectedRoute: Removing event listeners for auth changes');
      window.removeEventListener('gmail_authenticated', handleAuthChange);
      window.removeEventListener('gmail_signed_out', handleSignOut);
    };
  }, [navigate]);

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loading screen');
    return <LoadingScreen />;
  }

  if (!authenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to landing');
    // Pass state to indicate if this was due to session expiry
    const sessionExpired = window.sessionStorage.getItem('sessionExpired');
    console.log('ProtectedRoute: Session expired flag is present:', !!sessionExpired);
    
    const state = sessionExpired ? { sessionExpired: true } : undefined;
    window.sessionStorage.removeItem('sessionExpired'); // Clear the flag
    return <Navigate to="/" state={state} replace />;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <LayoutWrapper>{children}</LayoutWrapper>;
};

function App() {
  console.log('App: Rendering App component');
  
  return (
    <ThemeProvider>
      <EmailProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/email/:emailId" element={
            <ProtectedRoute>
              <EmailViewPage />
            </ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          } />
          <Route path="/service-test" element={
            <ProtectedRoute>
              <ServiceTester />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/test-action" element={
            <ProtectedRoute>
              <TestActionComponentPage />
            </ProtectedRoute>
          } />
          <Route path="/file-transcription" element={
            <ProtectedRoute>
              <FileTranscriptionPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </EmailProvider>
    </ThemeProvider>
  );
}

export default App; 