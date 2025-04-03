import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../theme/ThemeProvider';

const ThemeToggle: React.FC = () => {
  const { mode, toggleColorMode } = useThemeContext();
  const theme = useTheme();

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        sx={{ 
          ml: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          p: 1,
          color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(144, 202, 249, 0.08)' 
              : 'rgba(33, 150, 243, 0.08)'
          }
        }}
      >
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
