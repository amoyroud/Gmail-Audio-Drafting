import React from 'react';
import { Box, IconButton, Typography, useTheme, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface HeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  signOut: () => void;
  loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, loading }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: '64px',
      }}
    >
      {showBackButton && (
        <IconButton 
          onClick={onBack} 
          sx={{ mr: 2 }}
          aria-label="go back"
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      
      <Typography variant="h6" component="h1">
        Inbox
      </Typography>
      
      {loading && (
        <CircularProgress 
          size={20} 
          sx={{ ml: 2 }} 
        />
      )}
    </Box>
  );
};

export default Header; 