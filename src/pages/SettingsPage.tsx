import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  useTheme,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSettings, EmailTemplate } from '../services/settingsService';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  const [showSaved, setShowSaved] = useState(false);
  
  // Template management state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({ emailPromptTemplate: event.target.value });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleSignatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ signature: event.target.value });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const resetToDefault = () => {
    updateSettings({
      emailPromptTemplate: undefined,
      signature: undefined
    });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h1">
            Email Response Settings
          </Typography>
          <Tooltip title="These settings customize how your email responses are generated. Available variables: {emailSubject}, {senderName}, {emailBody}, {transcribedText}, {signature}">
            <IconButton size="small">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Email Response Template
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            variant="outlined"
            value={settings.emailPromptTemplate}
            onChange={handlePromptChange}
            placeholder="Enter your custom email response template..."
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }
            }}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Email Signature
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={settings.signature}
            onChange={handleSignatureChange}
            placeholder="Enter your email signature..."
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={resetToDefault}
            color="secondary"
          >
            Reset to Default
          </Button>
        </Box>
      </Paper>
      
      {/* Template Management */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2">
            Email Templates
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({
                id: `template-${Date.now()}`,
                name: '',
                content: '',
                type: 'decline'
              });
              setTemplateDialogOpen(true);
            }}
          >
            Add Template
          </Button>
        </Box>
        
        <List>
          {settings.templates.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No templates found. Add your first template to get started.
            </Typography>
          ) : (
            settings.templates.map((template, index) => (
              <React.Fragment key={template.id}>
                {index > 0 && <Divider />}
                <ListItem 
                  sx={{ 
                    py: 2,
                    '&:hover .template-actions': { opacity: 1 }
                  }}
                  secondaryAction={
                    <Box className="template-actions" sx={{ opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.2s' }}>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => {
                          setEditingTemplate(template);
                          setTemplateForm(template);
                          setTemplateDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => {
                          setEditingTemplate(template);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={template.name}
                    secondary={`Type: ${template.type}`}
                  />
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Template edit dialog */}
      <Dialog 
        open={templateDialogOpen} 
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateForm.name || ''}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Template Type</InputLabel>
                <Select
                  value={templateForm.type || 'decline'}
                  label="Template Type"
                  onChange={(e) => setTemplateForm({...templateForm, type: e.target.value as 'decline' | 'general'})}
                >
                  <MenuItem value="decline">Decline</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Template Content"
                placeholder="Use {signature} to include your signature"
                value={templateForm.content || ''}
                onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              const updatedTemplates = [...settings.templates];
              
              if (editingTemplate) {
                // Update existing template
                const index = updatedTemplates.findIndex(t => t.id === editingTemplate.id);
                if (index !== -1) {
                  updatedTemplates[index] = templateForm as EmailTemplate;
                }
              } else {
                // Add new template
                updatedTemplates.push(templateForm as EmailTemplate);
              }
              
              updateSettings({ templates: updatedTemplates });
              setTemplateDialogOpen(false);
              setShowSaved(true);
              setTimeout(() => setShowSaved(false), 3000);
            }}
            disabled={!templateForm.name || !templateForm.content}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the template "{editingTemplate?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (editingTemplate) {
                const updatedTemplates = settings.templates.filter(t => t.id !== editingTemplate.id);
                updateSettings({ templates: updatedTemplates });
                setDeleteConfirmOpen(false);
                setShowSaved(true);
                setTimeout(() => setShowSaved(false), 3000);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {showSaved && (
        <Alert severity="success" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: theme.zIndex.snackbar }}>
          Settings saved successfully
        </Alert>
      )}
    </Box>
  );
};

export default SettingsPage;
