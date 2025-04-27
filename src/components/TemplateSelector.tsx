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

  // Reset and load templates whenever the dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset the selected ID when dialog opens
      setSelectedId('');
      setPreviewTemplate(null);
      
      // Get available templates
      const availableTemplates = getTemplatesByType(templateType);
      setTemplates(availableTemplates);
      
      // Auto-select the first template if available
      if (availableTemplates.length > 0) {
        setSelectedId(availableTemplates[0].id);
        setPreviewTemplate(availableTemplates[0]);
      }
    }
  }, [isOpen, templateType]);

  // Update preview when selection changes
  useEffect(() => {
    if (selectedId) {
      const selected = templates.find(t => t.id === selectedId);
      if (selected) {
        setPreviewTemplate(selected);
      } else if (templates.length > 0) {
        // If the selected ID is not found, default to the first template
        setSelectedId(templates[0].id);
        setPreviewTemplate(templates[0]);
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
      disableAutoFocus={false}
      disableEnforceFocus={false}
      disableRestoreFocus={true}
    >
      <DialogTitle sx={{ pb: 0 }}>Select Template</DialogTitle>
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ pl: 3, pr: 3, pb: 1 }}>
        Choose a template to use for your email
      </Typography>
      
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
          <InputLabel id="template-select-label">Template</InputLabel>
          <Select
            labelId="template-select-label"
            value={templates.find(t => t.id === selectedId) ? selectedId : ''}
            onChange={(e) => setSelectedId(e.target.value as string)}
            label="Template"
            autoFocus
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
