import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import EmailViewPage from './pages/EmailViewPage';
import TestPage from './pages/TestPage';
import ServiceTester from './components/ServiceTester';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Create a responsive theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Define a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App; 