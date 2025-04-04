import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import EmailViewPage from './pages/EmailViewPage';
import TestPage from './pages/TestPage';
import ServiceTester from './components/ServiceTester';
import SettingsPage from './pages/SettingsPage';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import { isSignedIn } from './services/gmailService';
import { EmailProvider } from './context/EmailContext';

// Theme
import ThemeProvider from './theme/ThemeProvider';

// Define a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication on mount and listen for changes
  useEffect(() => {
    console.log('ProtectedRoute: Checking authentication');
    
    // Initial auth check
    const authStatus = isSignedIn();
    console.log('ProtectedRoute: Initial auth status is', authStatus);
    setAuthenticated(authStatus);
    setLoading(false);
    
    // Set up listener for auth changes
    const handleAuthChange = () => {
      console.log('ProtectedRoute: Authentication event received');
      setAuthenticated(true);
    };
    
    const handleSignOut = () => {
      console.log('ProtectedRoute: Sign out event received');
      setAuthenticated(false);
      navigate('/login', { replace: true });
    };
    
    window.addEventListener('gmail_authenticated', handleAuthChange);
    window.addEventListener('gmail_signed_out', handleSignOut);
    
    return () => {
      window.removeEventListener('gmail_authenticated', handleAuthChange);
      window.removeEventListener('gmail_signed_out', handleSignOut);
    };
  }, [navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

function App() {
  console.log('App: Rendering App component');
  
  return (
    <ThemeProvider>
      <EmailProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/email/:emailId" element={
            <ProtectedRoute>
              <Layout>
                <EmailViewPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute>
              <Layout>
                <TestPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/service-test" element={
            <ProtectedRoute>
              <Layout>
                <ServiceTester />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </EmailProvider>
    </ThemeProvider>
  );
}

export default App; 