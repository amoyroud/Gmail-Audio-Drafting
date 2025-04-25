import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Divider,
  useTheme,
  Tooltip
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import ReplyIcon from '@mui/icons-material/Reply';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Email, EmailActionType } from '../types/types';
import ActionSelector from './ActionSelector';
import { fixEncodingIssues } from '../utils/textFormatter';

interface EmailContentProps {
  email: Email;
  onAction: (action: EmailActionType, email: Email) => void;
  goBack: () => void;
}

const EmailContent: React.FC<EmailContentProps> = ({ email, onAction, goBack }) => {
  const theme = useTheme();
  const [selectedAction, setSelectedAction] = useState<EmailActionType>('speech-to-text');

  const handleActionSelect = (action: EmailActionType) => {
    setSelectedAction(action);
  };

  const handleActionExecute = (action: EmailActionType) => {
    onAction(action, email);
  };

  // Format email body with proper spacing and handling forwarded content
  const formatEmailBody = (body: string) => {
    if (!body) return null;
    
    // Apply comprehensive encoding fixes from our utility
    const processedBody = fixEncodingIssues(body);
    
    // Split by lines and format each line
    return processedBody.split('\n').map((line, i) => {
      // Handle quoted text (lines starting with '>')
      if (line.trim().startsWith('>')) {
        return (
          <Typography 
            key={i} 
            variant="body2" 
            component="div"
            sx={{ 
              pl: 2, 
              borderLeft: '2px solid', 
              borderColor: 'divider',
              color: 'text.secondary',
              my: 0.5,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {line.replace(/^>\s*/, '')}
          </Typography>
        );
      }
      
      // Handle forwarded message headers
      if (line.includes('---------- Forwarded message ---------') || 
          line.includes('From:') && line.includes('@') ||
          line.includes('Date:') && line.includes(':') ||
          line.includes('Subject:') && i > 0 ||
          line.includes('To:') && line.includes('@')) {
        return (
          <Typography 
            key={i} 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: line.includes('Forwarded message') ? 500 : 400,
              my: 0.5,
              fontSize: '0.85rem'
            }}
          >
            {line}
          </Typography>
        );
      }
      
      // Handle email signatures (lines with -- or __)
      if (line.trim() === '--' || line.trim() === '__') {
        return (
          <Box key={i}>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              {/* Signature section */}
            </Typography>
          </Box>
        );
      }
      
      // Regular text
      return line.trim() === '' ? 
        <Box key={i} sx={{ height: '0.75em' }} /> : 
        <Typography 
          key={i} 
          variant="body2" 
          sx={{ 
            mb: 1,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}
        >
          {line}
        </Typography>;
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box 
        sx={{ 
          display: { xs: 'flex', md: 'none' }, 
          alignItems: 'center', 
          mb: 2 
        }}
      >
        <IconButton 
          onClick={goBack} 
          edge="start"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">
          View Email
        </Typography>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: '8px' 
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 500,
              wordBreak: 'break-word'
            }}
          >
            {email.subject}
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1,
              mb: 1
            }}
          >
            <Typography 
              variant="subtitle1"
              sx={{ fontWeight: 500 }}
            >
              From: {email.from.name || email.from.email}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              {new Date(email.date).toLocaleString()}
            </Typography>
          </Box>
          
          {/* Remove the email.to check since it's not in the Email type */}
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          {formatEmailBody(email.body || '')}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ my: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ mb: 1, fontWeight: 500, color: theme.palette.text.secondary }}
          >
            Actions
          </Typography>
          
          <ActionSelector
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
            onActionExecute={handleActionExecute}
          />
        </Box>
        
        {/* Legacy buttons as fallback */}
        <Box 
          sx={{ 
            display: 'none', /* Hide the old buttons */
            justifyContent: 'flex-start', 
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Button 
            variant="contained" 
            startIcon={<ReplyIcon />}
            onClick={() => onAction('speech-to-text', email)}
            sx={{ borderRadius: '8px' }}
          >
            Reply
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<ArchiveIcon />}
            onClick={() => onAction('archive', email)}
            sx={{ borderRadius: '8px' }}
          >
            Archive
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<AccessTimeIcon />}
            onClick={() => onAction('move-to-read', email)}
            sx={{ borderRadius: '8px' }}
          >
            Read Later
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailContent; 