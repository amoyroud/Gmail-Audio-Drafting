import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Divider,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import ReplyIcon from '@mui/icons-material/Reply';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ForwardIcon from '@mui/icons-material/Forward';
import EmailIcon from '@mui/icons-material/Email';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import EventIcon from '@mui/icons-material/Event';
import SubjectIcon from '@mui/icons-material/Subject';
import MicIcon from '@mui/icons-material/Mic';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import { Email, EmailActionType, EmailTemplate } from '../types/types';
import ActionSelector from './ActionSelector';
import TemplateSelector from './TemplateSelector';
import { fixEncodingIssues } from '../utils/textFormatter';

// Helper components for different email parts
const EmailHeaderItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.75, gap: 1 }}>
      {icon}
      <Typography
        variant="body2"
        component="span"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.secondary,
          minWidth: '50px'
        }}
      >
        {label}:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.primary,
          wordBreak: 'break-word'
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const QuotedText = ({ text, indented = false }: { text: string, indented?: boolean }) => {
  const theme = useTheme();
  
  return (
    <Typography
      variant="body2"
      component="div"
      sx={{
        pl: 2,
        borderLeft: `2px solid ${alpha(theme.palette.divider, 0.8)}`,
        color: theme.palette.text.secondary,
        my: 0.5,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.9rem',
        whiteSpace: 'pre-wrap',
        ml: indented ? 2 : 0,
        fontStyle: 'italic'
      }}
    >
      {text.replace(/^>\s*/, '')}
    </Typography>
  );
};

const ForwardedMessageHeader = ({ text }: { text: string }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{
        mt: 3,
        mb: 1.5,
        mx: -2, // Negative margin to extend across the container
        px: 2,
        py: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        borderRadius: '4px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ForwardIcon fontSize="small" color="primary" sx={{ opacity: 0.7 }} />
        <Typography 
          variant="subtitle2"
          sx={{ 
            fontWeight: 500,
            color: theme.palette.text.primary
          }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

interface EmailContentProps {
  email: Email;
  onAction: (action: EmailActionType, email: Email) => void;
  goBack: () => void;
}

const EmailContent: React.FC<EmailContentProps> = ({ email, onAction, goBack }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedAction, setSelectedAction] = useState<EmailActionType>('speech-to-text');
  const [expandedView, setExpandedView] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const handleActionSelect = (action: EmailActionType) => {
    setSelectedAction(action);
  };

  const handleActionExecute = (action: EmailActionType) => {
    if (action === 'quick-decline') {
      setIsTemplateDialogOpen(true);
    } else {
      onAction(action, email);
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    // Pass the selected template to the parent component
    // For now, we're just closing the dialog and executing the action
    onAction('quick-decline', email);
  };

  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
  };

  // Check if text is likely a header of forwarded/replied email
  const isEmailHeader = (text: string): boolean => {
    const headerPatterns = [
      /From:/i,
      /To:/i,
      /Sent:/i,
      /Date:/i,
      /Subject:/i,
      /Cc:/i
    ];
    return headerPatterns.some(pattern => pattern.test(text));
  };

  // Format email body with proper spacing and handling forwarded content
  const formattedEmailBody = useMemo(() => {
    if (!email.body) return null;
    
    // Apply comprehensive encoding fixes from our utility
    const processedBody = fixEncodingIssues(email.body);
    
    // Track if we're inside a forwarded section
    let inForwardedSection = false;
    
    // Split by lines and format each line
    return processedBody.split('\n').map((line, i, lines) => {
      // Check for the start of a forwarded message section
      if (
        line.includes('---------- Forwarded message ---------') || 
        line.includes('-------- Original Message --------')
      ) {
        inForwardedSection = true;
        return (
          <ForwardedMessageHeader key={i} text={line} />
        );
      }

      // Handle email headers (From, To, Date, etc.) with enhanced styling
      if (isEmailHeader(line)) {
        // Extract the header type and value
        const [headerType, ...headerValueParts] = line.split(':');
        const headerValue = headerValueParts.join(':').trim();
        
        let icon = null;
        
        // Choose the appropriate icon based on header type
        if (headerType.toLowerCase().includes('from')) {
          icon = <EmailIcon fontSize="small" sx={{ color: theme.palette.primary.main, opacity: 0.7 }} />;
        } else if (headerType.toLowerCase().includes('to') || headerType.toLowerCase().includes('cc')) {
          icon = <AlternateEmailIcon fontSize="small" sx={{ color: theme.palette.info.main, opacity: 0.7 }} />;
        } else if (headerType.toLowerCase().includes('date') || headerType.toLowerCase().includes('sent')) {
          icon = <EventIcon fontSize="small" sx={{ color: theme.palette.success.main, opacity: 0.7 }} />;
        } else if (headerType.toLowerCase().includes('subject')) {
          icon = <SubjectIcon fontSize="small" sx={{ color: theme.palette.warning.main, opacity: 0.7 }} />;
        }
        
        return (
          <Box 
            key={i}
            sx={{
              display: 'flex',
              mb: 0.5,
              ml: inForwardedSection ? 2 : 0,
              alignItems: 'flex-start',
              px: inForwardedSection ? 1 : 0,
              py: 0.5,
              ...(inForwardedSection && {
                bgcolor: alpha(theme.palette.background.default, 0.4),
                borderRadius: '4px'
              })
            }}
          >
            {icon && (
              <Box sx={{ mr: 1, mt: 0.25 }}>
                {icon}
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                component="span"
                sx={{
                  fontWeight: 600,
                  minWidth: '60px',
                  color: theme.palette.text.secondary
                }}
              >
                {headerType}:
              </Typography>
              <Typography 
                variant="body2"
                sx={{
                  color: theme.palette.text.primary,
                  ml: 1,
                  wordBreak: 'break-word'
                }}
              >
                {headerValue}
              </Typography>
            </Box>
          </Box>
        );
      }
      
      // Handle quoted text (lines starting with '>')
      if (line.trim().startsWith('>')) {
        return (
          <QuotedText 
            key={i}
            text={line}
            indented={inForwardedSection}
          />
        );
      }
      
      // Handle email signatures (lines with -- or __)
      if (line.trim() === '--' || line.trim() === '__') {
        return (
          <Box key={i}>
            <Divider sx={{ my: 1.5, width: '40%' }} />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
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
            whiteSpace: 'pre-wrap',
            color: theme.palette.text.primary,
            ml: inForwardedSection ? 2 : 0,
            fontSize: inForwardedSection ? '0.9rem' : '1rem',
          }}
        >
          {line}
        </Typography>;
    });
  }, [email.body, theme]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
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
          p: { xs: 1.5, sm: 2.5, md: 3 }, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: '12px',
          boxShadow: theme.shadows[1],
          height: 'auto', // Allow natural height
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Email Header Section */}
        <Box 
          sx={{ 
            mb: 2,
            pb: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 500,
              wordBreak: 'break-word',
              color: theme.palette.text.primary
            }}
          >
            {email.subject}
          </Typography>
          
          <Box sx={{ 
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 0.5, sm: 2 }
          }}>
            {/* From section */}
            <EmailHeaderItem 
              icon={<EmailIcon fontSize="small" sx={{ color: theme.palette.primary.main, opacity: 0.7 }} />}
              label="From"
              value={typeof email.from === 'string' ? email.from : `${email.from.name || ''} <${email.from.email}>`}
            />
            
            {/* Date section */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                ml: { xs: 0, sm: 'auto' }
              }}
            >
              <EventIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
              {new Date(email.date).toLocaleString()}
            </Box>
          </Box>
        </Box>
        
        {/* Email Body Section - Make sure it's scrollable with controlled height */}
        <Box 
          sx={{ 
            mb: 3,
            px: { xs: 0.5, sm: 1 },
            py: 1,
            maxHeight: expandedView ? '100%' : { xs: '50vh', sm: '55vh', md: '60vh' },
            overflow: 'auto',
            flex: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(theme.palette.divider, 0.1),
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.primary.main, 0.2),
              borderRadius: '4px',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.3)
              }
            }
          }}
        >
          {formattedEmailBody}
          
          {/* Show "See more" button if content is likely to be truncated */}
          {email.body && email.body.length > 1000 && (
            <Button 
              variant="text" 
              onClick={toggleExpandedView} 
              sx={{ mt: 2, display: 'block', mx: 'auto' }}
            >
              {expandedView ? 'Show less' : 'Show more'}
            </Button>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Actions Section */}
        <Box sx={{ my: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 1, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}
          >
            Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {[
              { key: 'speech-to-text', label: 'Speech', icon: <MicIcon /> },
              { key: 'quick-decline', label: 'Decline', icon: <CancelScheduleSendIcon /> },
              { key: 'archive', label: 'Archive', icon: <ArchiveIcon /> },
              { key: 'move-to-read', label: 'Read Later', icon: <AccessTimeIcon /> },
            ].map(action => (
              <Button
                key={action.key}
                variant={selectedAction === action.key ? 'outlined' : 'text'}
                color="primary"
                startIcon={action.icon}
                onClick={() => {
                  setSelectedAction(action.key as EmailActionType);
                  handleActionExecute(action.key as EmailActionType);
                }}
                sx={{
                  minWidth: 140,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: selectedAction === action.key ? theme.palette.action.selected : 'transparent',
                  borderColor: selectedAction === action.key ? theme.palette.primary.main : undefined,
                  color: selectedAction === action.key ? theme.palette.primary.main : theme.palette.text.primary,
                  boxShadow: selectedAction === action.key ? 2 : 'none',
                  transition: 'all 0.15s',
                }}
                aria-label={action.label + (selectedAction === action.key ? ' (Selected)' : '')}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Template Selector Dialog */}
      <TemplateSelector
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        templateType="decline"
      />
    </Box>
  );
};

export default EmailContent; 