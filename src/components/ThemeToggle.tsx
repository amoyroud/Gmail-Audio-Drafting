import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useThemeContext } from '../theme/ThemeProvider';
import { ThemeMode } from '../theme/theme';

const ThemeToggle: React.FC = () => {
  const { mode, toggleColorMode, setThemeMode } = useThemeContext();
  const theme = useTheme();

  // Get tooltip text based on current mode
  const getTooltipText = () => {
    switch (mode) {
      case 'light': return 'Switch to dark mode';
      case 'dark': return 'Switch to palette theme';
      case 'palette': return 'Switch to light mode';
    }
  };

  // Get icon based on current mode
  const getThemeIcon = () => {
    switch (mode) {
      case 'light': return <Brightness4Icon />;
      case 'dark': return <Brightness7Icon />;
      case 'palette': return <ColorLensIcon />;
    }
  };

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          p: 1,
          color: mode === 'palette' ? '#317039' : 
                mode === 'dark' ? 'primary.light' : 'primary.main',
          '&:hover': {
            backgroundColor: mode === 'palette' ? 'rgba(49, 112, 57, 0.08)' : 
                           mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 
                           'rgba(33, 150, 243, 0.08)'
          }
        }}
      >
        {getThemeIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
