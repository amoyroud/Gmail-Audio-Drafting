import React from 'react';
import { Box, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface HeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  signOut: () => void;
  loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, loading }) => {
  return (
    <Box
      sx={{
        p: showBackButton 
          ? { xs: 2, md: 3 } 
          : { xs: '4px 16px', md: '8px 24px' },
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: '40px',
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
      
      {loading && (
        <CircularProgress 
          size={20} 
          sx={{ ml: showBackButton ? 0 : 0 }} 
        />
      )}
    </Box>
  );
};

export default Header; 