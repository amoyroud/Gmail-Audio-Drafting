import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import MicIcon from '@mui/icons-material/Mic';
import InboxIcon from '@mui/icons-material/Inbox';

type EmptyStateType = 'noEmails' | 'noResults' | 'noSelection';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
  message?: string;
  icon?: 'email' | 'search' | 'mic' | 'inbox';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel, message, icon }) => {
  const theme = useTheme();
  
  const getIconComponent = (iconType?: string) => {
    switch (iconType || 'default') {
      case 'email': return <EmailIcon sx={{ fontSize: 72, color: 'primary.main', opacity: 0.9 }} />;
      case 'search': return <SearchOffIcon sx={{ fontSize: 72, color: 'primary.main', opacity: 0.9 }} />;
      case 'mic': return <MicIcon sx={{ fontSize: 72, color: 'primary.main', opacity: 0.9 }} />;
      case 'inbox': return <InboxIcon sx={{ fontSize: 72, color: 'primary.main', opacity: 0.9 }} />;
      default: return <EmailIcon sx={{ fontSize: 72, color: 'primary.main', opacity: 0.9 }} />;
    }
  };

  const getContent = () => {
    // If custom icon and message are provided, use them
    if (message && icon) {
      return {
        icon: getIconComponent(icon),
        title: 'Select an Email',
        description: message,
        showAction: false
      };
    }
    
    // Otherwise use the default content based on type
    switch (type) {
      case 'noEmails':
        return {
          icon: getIconComponent('email'),
          title: 'No Emails Found',
          description: 'Your inbox is empty or we couldn\'t fetch your emails. Check your connection or try refreshing.',
          showAction: true
        };
      case 'noResults':
        return {
          icon: getIconComponent('search'),
          title: 'No Results Found',
          description: 'We couldn\'t find any emails matching your search criteria. Try adjusting your search terms.',
          showAction: true
        };
      case 'noSelection':
        return {
          icon: getIconComponent('mic'),
          title: 'Select an Email to Reply',
          description: message || 'Choose an email from the list to start recording your audio response.',
          showAction: false
        };
      default:
        return {
          icon: getIconComponent(),
          title: 'Nothing to See Here',
          description: 'There\'s nothing to display at the moment.',
          showAction: false
        };
    }
  };

  const content = getContent();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: { xs: 4, sm: 6 },
        px: 3,
        height: '100%',
        minHeight: 250,
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: '50%',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(144, 202, 249, 0.12)' 
            : 'rgba(33, 150, 243, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 20px rgba(144, 202, 249, 0.05)'
            : '0 0 20px rgba(33, 150, 243, 0.05)',
          transition: 'all 0.3s ease'
        }}
      >
        {content.icon}
      </Box>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{
          fontWeight: 600,
          fontSize: { xs: '1.15rem', sm: '1.25rem' },
          mb: 1
        }}
      >
        {content.title}
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          maxWidth: 350,
          mb: content.showAction ? 3 : 0,
          lineHeight: 1.6,
          fontSize: '0.95rem'
        }}
      >
        {content.description}
      </Typography>
      {content.showAction && onAction && actionLabel && (
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={onAction}
          sx={{ 
            mt: 3,
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontWeight: 500,
            borderWidth: '1.5px'
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
