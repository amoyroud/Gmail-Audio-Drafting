import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteMode, ThemeOptions } from '@mui/material';

// Custom theme type that extends PaletteMode
export type ThemeMode = PaletteMode | 'palette';

// Create a theme instance for each mode (light/dark/palette)
const getTheme = (mode: ThemeMode) => {
  // Color palette from design
  const emeraldGreen = '#317039';
  const maximumYellow = '#F1BE49';
  const antiqueWhite = '#F8EDD9';
  const darkPastelRed = '#CC4B24';
  const papayaWhip = '#FFF1D4';
  const cosmicLatte = '#FFBBEB';

  // Set primary color based on theme mode
  const primaryMain = 
    mode === 'palette' ? emeraldGreen :
    mode === 'light' ? '#2196F3' : '#90CAF9';
  // Set secondary color based on theme mode
  const secondaryMain = 
    mode === 'palette' ? maximumYellow :
    mode === 'light' ? '#FF5722' : '#FFAB91';

  // For TypeScript compatibility, we first create a base theme with just the mode
  // and then extend it with our custom properties
  const baseTheme = createTheme({
    palette: {
      // For MUI's typing, we need to cast our custom mode to PaletteMode when needed
      mode: mode === 'palette' ? 'light' as PaletteMode : mode,
    },
  });
  
  let theme = createTheme(baseTheme, {
    palette: {
      // Ensure we only pass PaletteMode values to Material UI's type system
      mode: mode === 'palette' ? 'light' as PaletteMode : mode,
      primary: {
        main: primaryMain,
        light: mode === 'palette' ? '#468a4e' : mode === 'light' ? '#64B5F6' : '#BBDEFB',
        dark: mode === 'palette' ? '#255828' : mode === 'light' ? '#1976D2' : '#42A5F5',
        contrastText: mode === 'palette' ? '#FFFFFF' : mode === 'light' ? '#FFFFFF' : '#000000',
      },
      secondary: {
        main: secondaryMain,
        light: mode === 'palette' ? '#f5cc6d' : mode === 'light' ? '#FF8A65' : '#FFCCBC',
        dark: mode === 'palette' ? '#d4a733' : mode === 'light' ? '#E64A19' : '#FF7043',
        contrastText: mode === 'palette' ? '#000000' : mode === 'light' ? '#FFFFFF' : '#000000',
      },
      background: {
        default: mode === 'palette' ? papayaWhip : mode === 'light' ? '#F5F7FA' : '#121212',
        paper: mode === 'palette' ? antiqueWhite : mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
      text: {
        primary: mode === 'palette' ? '#2A2A2A' : mode === 'light' ? '#2A2A2A' : '#FFFFFF',
        secondary: mode === 'palette' ? '#5a5a5a' : mode === 'light' ? '#6B778C' : '#B0B0B0',
      },
      divider: mode === 'palette' ? 'rgba(204, 75, 36, 0.2)' : mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      error: {
        main: mode === 'palette' ? darkPastelRed : '#F44336',
      },
      success: {
        main: mode === 'palette' ? emeraldGreen : '#4CAF50',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '2.75rem', // 44px
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2.25rem', // 36px
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.75rem', // 28px
        lineHeight: 1.25,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem', // 24px
        lineHeight: 1.3,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem', // 20px
        lineHeight: 1.35,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.1rem', // 17.6px
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '0.95rem',
        lineHeight: 1.5,
      },
      body1: {
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: 1.7,
      },
      body2: {
        fontWeight: 400,
        fontSize: '0.92rem',
        lineHeight: 1.7,
      },
      button: {
        fontWeight: 600,
        fontSize: '1rem',
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
      caption: {
        fontWeight: 400,
        fontSize: '0.8rem',
        lineHeight: 1.5,
        color: '#888',
      },
      overline: {
        fontWeight: 500,
        fontSize: '0.75rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      // Global component styles
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1.5px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: 16,
            boxShadow: mode === 'light' ? '0 2px 12px rgba(33, 150, 243, 0.04)' : '0 2px 12px rgba(0,0,0,0.18)',
            transition: 'all 0.2s ease-in-out',
            overflow: 'hidden',
          },
        },
      },
      
      // Button styles
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: mode === 'palette' ? '0 4px 12px rgba(49, 112, 57, 0.10)' : mode === 'light' ? '0 4px 12px rgba(33, 150, 243, 0.10)' : '0 4px 12px rgba(144, 202, 249, 0.10)',
            },
          },
          containedPrimary: {
            backgroundColor: primaryMain,
            color: '#fff',
            '&:hover': {
              backgroundColor: mode === 'palette' ? '#255828' : mode === 'light' ? '#1976D2' : '#42A5F5',
              color: '#fff',
            },
          },
          outlinedPrimary: {
            borderWidth: '2px',
            borderColor: primaryMain,
            color: primaryMain,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.08)' : mode === 'light' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(144, 202, 249, 0.08)',
              borderColor: primaryMain,
            },
          },
          textPrimary: {
            color: primaryMain,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.04)' : mode === 'light' ? 'rgba(33, 150, 243, 0.04)' : 'rgba(144, 202, 249, 0.04)',
            },
          },
        },
      },
      
      // Card styles
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light' ? '0 2px 12px rgba(33, 150, 243, 0.04)' : '0 2px 12px rgba(0,0,0,0.18)',
            border: `1.5px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.10)'}`,
            backgroundColor: mode === 'palette' ? antiqueWhite : mode === 'light' ? '#fff' : '#23272f',
          },
        },
      },
      
      // Form elements
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s',
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${mode === 'palette' ? 'rgba(49, 112, 57, 0.2)' : mode === 'light' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(144, 202, 249, 0.2)'}`,
              },
            },
          },
        },
      },
      
      // List items
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'background-color 0.2s ease',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.08)' : mode === 'light' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(144, 202, 249, 0.08)',
              '&:hover': {
                backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.12)' : mode === 'light' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(144, 202, 249, 0.12)',
              },
            },
          },
        },
      },
      
      // Feedback components
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
          },
          standardSuccess: {
            backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.1)' : mode === 'light' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.15)',
            color: mode === 'palette' ? '#317039' : mode === 'light' ? '#2e7d32' : '#81c784',
          },
          standardError: {
            backgroundColor: mode === 'palette' ? 'rgba(204, 75, 36, 0.1)' : mode === 'light' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.15)',
            color: mode === 'palette' ? '#CC4B24' : mode === 'light' ? '#d32f2f' : '#e57373',
          },
          standardInfo: {
            backgroundColor: mode === 'palette' ? 'rgba(241, 190, 73, 0.1)' : mode === 'light' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.15)',
            color: mode === 'palette' ? '#F1BE49' : mode === 'light' ? '#0288d1' : '#64b5f6',
          },
        },
      },
      
      // Dividers
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'palette' ? 'rgba(204, 75, 36, 0.2)' : mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
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
