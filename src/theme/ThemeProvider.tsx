import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { PaletteMode } from '@mui/material';
import getTheme, { ThemeMode } from './theme';

type ThemeContextType = {
  mode: ThemeMode;
  toggleColorMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  setThemeMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get stored theme preference or use system preference
  const getInitialMode = (): ThemeMode => {
    const storedMode = localStorage.getItem('themeMode') as ThemeMode;
    if (storedMode === 'dark' || storedMode === 'light' || storedMode === 'palette') {
      return storedMode;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => {
          // Cycle through the three modes: light -> dark -> palette -> light
          if (prevMode === 'light') return 'dark';
          if (prevMode === 'dark') return 'palette';
          return 'light';
        });
      },
      setThemeMode: (newMode: ThemeMode) => {
        setMode(newMode);
      },
    }),
    [mode]
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
