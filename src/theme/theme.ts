import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Create a theme instance for each mode (light/dark)
const getTheme = (mode: PaletteMode) => {
  const primaryMain = mode === 'light' ? '#2196F3' : '#90CAF9';
  const secondaryMain = mode === 'light' ? '#FF5722' : '#FFAB91';

  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: mode === 'light' ? '#64B5F6' : '#BBDEFB',
        dark: mode === 'light' ? '#1976D2' : '#42A5F5',
        contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      secondary: {
        main: secondaryMain,
        light: mode === 'light' ? '#FF8A65' : '#FFCCBC',
        dark: mode === 'light' ? '#E64A19' : '#FF7043',
        contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      background: {
        default: mode === 'light' ? '#F5F7FA' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
      text: {
        primary: mode === 'light' ? '#2A2A2A' : '#FFFFFF',
        secondary: mode === 'light' ? '#6B778C' : '#B0B0B0',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      error: {
        main: '#F44336',
      },
      success: {
        main: '#4CAF50',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
      },
      subtitle2: {
        fontWeight: 500,
      },
      body1: {
        fontWeight: 400,
      },
      body2: {
        fontWeight: 400,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: mode === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
          },
          containedPrimary: {
            '&:hover': {
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 12,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 2px 12px rgba(0, 0, 0, 0.05)' 
              : '0 2px 12px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

  // Make typography responsive
  theme = responsiveFontSizes(theme);

  return theme;
};

export default getTheme;
