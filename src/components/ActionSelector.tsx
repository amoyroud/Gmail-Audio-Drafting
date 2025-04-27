import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';

// Icons
import MicIcon from '@mui/icons-material/Mic';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import ArchiveIcon from '@mui/icons-material/Archive';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import { EmailActionType } from '../types/types';

interface ActionSelectorProps {
  selectedAction: EmailActionType;
  onActionSelect: (action: EmailActionType) => void;
  onActionExecute?: (action: EmailActionType) => void;
  disabled?: boolean;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({
  selectedAction,
  onActionSelect,
  onActionExecute,
  disabled = false
}) => {
  const theme = useTheme();

  const handleActionChange = (
    _event: React.MouseEvent<HTMLElement>,
    newAction: EmailActionType | null
  ) => {
    // Don't allow deselecting an action, always have one selected
    if (newAction !== null) {
      onActionSelect(newAction);
    }
  };
  
  // Handle direct button clicks for immediate execution
  const handleDirectClick = (action: EmailActionType) => {
    // Always select the action
    onActionSelect(action);
    
    // If there's an execute handler, call it
    if (onActionExecute) {
      onActionExecute(action);
    }
  };

  return (
    <Box sx={{ mb: { xs: 1, sm: 2 }, width: '100%' }}>
      <Typography 
        variant="subtitle2" 
        sx={{ mb: { xs: 0.5, sm: 1 }, fontWeight: 500, color: theme.palette.text.secondary }}
      >
        Select Action Mode
      </Typography>
      
      <ToggleButtonGroup
        value={selectedAction}
        exclusive
        onChange={handleActionChange}
        aria-label="email action mode"
        disabled={disabled}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          gap: { xs: 1, sm: 2 },
          '& .MuiToggleButtonGroup-grouped': {
            border: 1,
            borderColor: 'divider',
            m: { xs: 0.25, sm: 0.5 },
            '&.Mui-selected': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.16)' 
                : 'rgba(33, 150, 243, 0.08)',
              borderColor: theme.palette.primary.main,
            }
          }
        }}
      >
        <Tooltip title="Speech to Text (Direct) - Space to record">
          <span>
            <ToggleButton 
            value="speech-to-text" 
            aria-label="speech to text"
            onClick={() => handleDirectClick('speech-to-text')}
            sx={{ 
              minWidth: { xs: '90px', sm: '120px' },
              p: { xs: 1, sm: 2 }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MicIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
              <Typography variant="body2" sx={{ mt: { xs: 0.5, sm: 1 }, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Speech</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>Space</Typography>
            </Box>
          </ToggleButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Decline with Template">
          <span>
            <ToggleButton 
            value="quick-decline" 
            aria-label="quick decline"
            onClick={() => handleDirectClick('quick-decline')}
            sx={{ 
              minWidth: { xs: '90px', sm: '120px' },
              p: { xs: 1, sm: 2 }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CancelScheduleSendIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
              <Typography variant="body2" sx={{ mt: { xs: 0.5, sm: 1 }, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Decline</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>← →</Typography>
            </Box>
          </ToggleButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Move to 'To Read' Folder">
          <span>
            <ToggleButton 
            value="move-to-read" 
            aria-label="move to read"
            onClick={() => handleDirectClick('move-to-read')}
            sx={{ 
              minWidth: { xs: '90px', sm: '120px' },
              p: { xs: 1, sm: 2 }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <TaskAltIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
              <Typography variant="body2" sx={{ mt: { xs: 0.5, sm: 1 }, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>To Read</Typography>
            </Box>
          </ToggleButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Archive Email">
          <span>
            <ToggleButton 
            value="archive" 
            aria-label="archive"
            onClick={() => handleDirectClick('archive')}
            sx={{ 
              minWidth: { xs: '90px', sm: '120px' },
              p: { xs: 1, sm: 2 }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ArchiveIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
              <Typography variant="body2" sx={{ mt: { xs: 0.5, sm: 1 }, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Archive</Typography>
            </Box>
          </ToggleButton>
          </span>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ActionSelector;
