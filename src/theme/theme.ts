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
    // Add custom breakpoints with more specific mobile breakpoints
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
  });
  
  // Define custom spacing for mobile and desktop
  const baseSpacing = {
    mobile: {
      xs: 8,    // 8px
      sm: 12,   // 12px
      md: 16,   // 16px
      lg: 24,   // 24px
    },
    desktop: {
      xs: 12,   // 12px
      sm: 16,   // 16px
      md: 24,   // 24px
      lg: 32,   // 32px
    }
  };
  
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
      // Responsive typography that scales better on mobile
      h1: {
        fontWeight: 800,
        fontSize: '2.25rem', // Slightly smaller on mobile
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        '@media (min-width:600px)': {
          fontSize: '2.75rem', // 44px on desktop
        },
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem', // Adjusted for mobile
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        '@media (min-width:600px)': {
          fontSize: '2.25rem', // 36px on desktop
        },
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.5rem', // Adjusted for mobile
        lineHeight: 1.25,
        '@media (min-width:600px)': {
          fontSize: '1.75rem', // 28px on desktop
        },
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.3rem', // Adjusted for mobile
        lineHeight: 1.3,
        '@media (min-width:600px)': {
          fontSize: '1.5rem', // 24px on desktop
        },
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.1rem', // Adjusted for mobile
        lineHeight: 1.35,
        '@media (min-width:600px)': {
          fontSize: '1.25rem', // 20px on desktop
        },
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem', // Adjusted for mobile
        lineHeight: 1.4,
        '@media (min-width:600px)': {
          fontSize: '1.1rem', // 17.6px on desktop
        },
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '0.95rem', // Adjusted for mobile
        lineHeight: 1.5,
        '@media (min-width:600px)': {
          fontSize: '1rem', // Desktop size
        },
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '0.9rem', // Adjusted for mobile
        lineHeight: 1.5,
        '@media (min-width:600px)': {
          fontSize: '0.95rem', // Desktop size
        },
      },
      body1: {
        fontWeight: 400,
        fontSize: '0.95rem', // Adjusted for mobile
        lineHeight: 1.7,
        '@media (min-width:600px)': {
          fontSize: '1rem', // Desktop size
        },
      },
      body2: {
        fontWeight: 400,
        fontSize: '0.875rem', // Adjusted for mobile
        lineHeight: 1.7,
        '@media (min-width:600px)': {
          fontSize: '0.92rem', // Desktop size
        },
      },
      button: {
        fontWeight: 600,
        fontSize: '0.95rem', // Adjusted for mobile
        textTransform: 'none',
        letterSpacing: '0.01em',
        '@media (min-width:600px)': {
          fontSize: '1rem', // Desktop size
        },
      },
      caption: {
        fontWeight: 400,
        fontSize: '0.75rem', // Adjusted for mobile
        lineHeight: 1.5,
        color: '#888',
        '@media (min-width:600px)': {
          fontSize: '0.8rem', // Desktop size
        },
      },
      overline: {
        fontWeight: 500,
        fontSize: '0.7rem', // Adjusted for mobile
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        '@media (min-width:600px)': {
          fontSize: '0.75rem', // Desktop size
        },
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
      
      // Button styles with improved touch targets
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px', // Increased for touch targets
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
            minHeight: '48px', // Minimum touch target size
            '@media (max-width:600px)': {
              padding: '12px 20px', // Even more padding on mobile
            },
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
      
      // Icon Button with larger touch targets for mobile
      MuiIconButton: {
        styleOverrides: {
          root: {
            padding: '12px', // Larger touch target
            '@media (max-width:600px)': {
              padding: '14px', // Even larger on mobile
            },
          },
          sizeSmall: {
            padding: '8px',
            '@media (max-width:600px)': {
              padding: '10px',
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
      
      // Form elements with improved touch targeting
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s',
              minHeight: '48px', // Minimum touch target height
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${mode === 'palette' ? 'rgba(49, 112, 57, 0.2)' : mode === 'light' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(144, 202, 249, 0.2)'}`,
              },
              '& .MuiOutlinedInput-input': {
                padding: '14px 16px', // Increased padding for touch
                '@media (max-width:600px)': {
                  padding: '16px 16px', // Even more padding on mobile
                },
              },
            },
          },
        },
      },
      
      // List items with improved touch targets
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'background-color 0.2s ease',
            padding: '12px 16px', // Increased padding for touch
            '@media (max-width:600px)': {
              padding: '16px 16px', // Even more padding on mobile
            },
          },
        },
      },
      
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '12px 16px', // Increased padding for touch
            '@media (max-width:600px)': {
              padding: '16px 16px', // Even more padding on mobile
            },
            minHeight: '50px', // Ensure good touch target height
            '&.Mui-selected': {
              backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.08)' : mode === 'light' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(144, 202, 249, 0.08)',
              '&:hover': {
                backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.12)' : mode === 'light' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(144, 202, 249, 0.12)',
              },
            },
          },
        },
      },
      
      // Mobile optimized inputs for better UX
      MuiInput: {
        styleOverrides: {
          root: {
            fontSize: '16px', // Prevents iOS zoom on focus
          },
        },
      },
      
      // Bottom navigation for mobile
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: '64px', // Taller for easier touch
            backgroundColor: mode === 'light' ? '#fff' : '#1E1E1E',
            borderTop: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
          },
        },
      },
      
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            padding: '8px 0',
            minWidth: '64px',
            '@media (max-width:360px)': {
              minWidth: '56px', // Even smaller on very small screens
              padding: '6px 0',
            },
            '&.Mui-selected': {
              paddingTop: '8px',
            },
          },
        },
      },
      
      // Dialogs and modals optimized for mobile
      MuiDialog: {
        styleOverrides: {
          paper: {
            margin: '16px',
            width: 'calc(100% - 32px)',
            maxWidth: '600px',
            '@media (max-width:600px)': {
              margin: '16px',
              borderRadius: '12px',
            },
          },
        },
      },
      
      // Touch-friendly chip components
      MuiChip: {
        styleOverrides: {
          root: {
            height: '32px',
            '@media (max-width:600px)': {
              height: '36px', // Taller on mobile for touch
            },
          },
        },
      },
      
      // Toolbar optimized for mobile headers
      MuiToolbar: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              paddingLeft: '12px',
              paddingRight: '12px',
            },
          },
        },
      },
    },
  });

  // Apply responsive font sizes after adding all the custom styles
  theme = responsiveFontSizes(theme);
  
  return theme;
};

export default getTheme;
