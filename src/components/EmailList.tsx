import React from 'react';
import { 
  List, 
  ListItemButton, 
  ListItemText, 
  Avatar, 
  Typography, 
  Box,
  Divider
} from '@mui/material';
import { Email } from '../types/types';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  selectedIndex?: number;
  onSelectEmail: (email: Email) => void;
}

const EmailList: React.FC<EmailListProps> = ({ 
  emails, 
  selectedEmailId, 
  selectedIndex = -1,
  onSelectEmail 
}) => {
  const getAvatarInitial = (from: string | {name?: string, email: string}) => {
    if (typeof from === 'string') {
      return from.charAt(0).toUpperCase();
    } else if (from.name) {
      return from.name.charAt(0).toUpperCase();
    } else {
      return from.email.charAt(0).toUpperCase();
    }
  };

  const isUnread = (email: Email) => {
    return email.unread;
  };

  const handleEmailClick = (email: Email) => {
    console.log('Email list item clicked:', email.id);
    // Call the parent component's handler
    onSelectEmail(email);
  };

  return (
    <List disablePadding>
      {emails.map((email, index) => (
        <React.Fragment key={email.id}>
          {index > 0 && <Divider />}
          <ListItemButton
            selected={email.id === selectedEmailId || index === selectedIndex}
            onClick={() => handleEmailClick(email)}
            data-email-id={email.id}
            sx={{
              py: 1.5,
              px: { xs: 2, md: 3 },
              '&.Mui-selected': {
                backgroundColor: theme => 
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
              },
              '&:hover': {
                backgroundColor: theme => 
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
              }
            }}
          >
            <Avatar 
              sx={{ 
                mr: 2, 
                bgcolor: isUnread(email) ? 'primary.main' : 'grey.400', 
                width: 40, 
                height: 40,
                fontSize: '1rem'
              }}
            >
              {getAvatarInitial(email.from)}
            </Avatar>
            <ListItemText
              primaryTypographyProps={{ component: 'div' }}
              secondaryTypographyProps={{ component: 'div' }}
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                  <Typography 
                    variant="body1" 
                    component="div"
                    sx={{ 
                      fontWeight: isUnread(email) ? 600 : 400,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      mr: 1
                    }}
                  >
                    {email.from.name || email.from.email}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    component="div"
                    color="text.secondary"
                    sx={{ flexShrink: 0 }}
                  >
                    {new Date(email.date).toLocaleDateString()}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ width: '100%' }}>
                  <Typography 
                    variant="body2" 
                    component="div"
                    sx={{ 
                      fontWeight: isUnread(email) ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}
                  >
                    {email.subject}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="div"
                    color="text.secondary"
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.75rem',
                      mt: 0.5,
                      width: '100%'
                    }}
                  >
                    {email.snippet}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
        </React.Fragment>
      ))}
    </List>
  );
};

export default EmailList; 