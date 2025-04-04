import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useTheme
} from '@mui/material';
import { EmailTemplate } from '../types/types';
import { getTemplatesByType } from '../services/templateService';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: EmailTemplate) => void;
  templateType?: 'decline' | 'general';
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  templateType = 'decline'
}) => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Load templates when the component mounts or templateType changes
  useEffect(() => {
    const availableTemplates = getTemplatesByType(templateType);
    setTemplates(availableTemplates);
    
    // Auto-select the first template if available
    if (availableTemplates.length > 0 && !selectedId) {
      setSelectedId(availableTemplates[0].id);
      setPreviewTemplate(availableTemplates[0]);
    }
  }, [templateType, isOpen]);

  // Update preview when selection changes
  useEffect(() => {
    if (selectedId) {
      const selected = templates.find(t => t.id === selectedId);
      if (selected) {
        setPreviewTemplate(selected);
      }
    }
  }, [selectedId, templates]);

  const handleSelectTemplate = () => {
    if (previewTemplate) {
      onSelectTemplate(previewTemplate);
      onClose();
    }
  };

  const formatTemplate = (template: EmailTemplate | null) => {
    if (!template) return '';
    
    // Replace placeholders with example values
    return template.body
      .replace(/{sender}/g, 'John')
      .replace(/{subject}/g, 'Meeting Request')
      .replace(/{name}/g, 'Your Name');
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="h2">
          Select Template
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Choose a template to use for your email
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
          <InputLabel id="template-select-label">Template</InputLabel>
          <Select
            labelId="template-select-label"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value as string)}
            label="Template"
          >
            {templates.map(template => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {previewTemplate && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Preview:
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: '1px solid',
                borderColor: 'divider',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '0.875rem'
              }}
            >
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {formatTemplate(previewTemplate)}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: '8px' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelectTemplate}
          variant="contained"
          color="primary"
          disabled={!previewTemplate}
          sx={{ 
            borderRadius: '8px',
            px: 3
          }}
        >
          Use Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelector;
