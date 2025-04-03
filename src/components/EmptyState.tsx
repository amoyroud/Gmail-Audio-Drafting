import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import MicIcon from '@mui/icons-material/Mic';

type EmptyStateType = 'noEmails' | 'noResults' | 'noSelection';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel }) => {
  const theme = useTheme();
  
  const getContent = () => {
    switch (type) {
      case 'noEmails':
        return {
          icon: <EmailIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />,
          title: 'No Emails Found',
          description: 'Your inbox is empty or we couldn\'t fetch your emails. Check your connection or try refreshing.',
          showAction: true
        };
      case 'noResults':
        return {
          icon: <SearchOffIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />,
          title: 'No Results Found',
          description: 'We couldn\'t find any emails matching your search criteria. Try adjusting your filters or search terms.',
          showAction: true
        };
      case 'noSelection':
        return {
          icon: <MicIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />,
          title: 'Select an Email to Reply',
          description: 'Choose an email from the list to start recording your audio response.',
          showAction: false
        };
      default:
        return {
          icon: <EmailIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />,
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
        py: 6,
        px: 3,
        height: '100%',
        minHeight: 250,
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: '50%',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(144, 202, 249, 0.08)' 
            : 'rgba(33, 150, 243, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {content.icon}
      </Box>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        {content.title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          maxWidth: 300,
          mb: content.showAction ? 3 : 0
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
            mt: 2,
            borderRadius: '20px',
            px: 3
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
