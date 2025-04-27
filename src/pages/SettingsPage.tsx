import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Grid,
  Card,
  CardContent,
  Stack,
  CircularProgress
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSettings, EmailTemplate } from '../services/settingsService';
import { useThemeContext } from '../theme/ThemeProvider';
import { ThemeMode } from '../theme/theme';

// Theme Selector Component
const ThemeSelector: React.FC = () => {
  const { mode, setThemeMode } = useThemeContext();
  const theme = useTheme();

  // Theme options with display info
  const themeOptions: Array<{value: ThemeMode, name: string, icon: React.ReactNode, description: string, colors: Array<{color: string, label: string}>}> = [
    {
      value: 'light',
      name: 'Light Theme',
      icon: <Brightness7Icon />,
      description: 'Clean, bright interface with blue accents',
      colors: [
        { color: '#FFFFFF', label: 'Background' },
        { color: '#2196F3', label: 'Primary' },
        { color: '#FF5722', label: 'Secondary' },
        { color: '#2A2A2A', label: 'Text' }
      ]
    },
    {
      value: 'dark',
      name: 'Dark Theme',
      icon: <Brightness4Icon />,
      description: 'Reduced eye strain with dark background',
      colors: [
        { color: '#121212', label: 'Background' },
        { color: '#90CAF9', label: 'Primary' },
        { color: '#FFAB91', label: 'Secondary' },
        { color: '#FFFFFF', label: 'Text' }
      ]
    },
    {
      value: 'palette',
      name: 'Palette Theme',
      icon: <ColorLensIcon />,
      description: 'Custom color palette with warm natural tones',
      colors: [
        { color: '#FFF1D4', label: 'Background' },
        { color: '#317039', label: 'Primary' },
        { color: '#F1BE49', label: 'Secondary' },
        { color: '#CC4B24', label: 'Accent' }
      ]
    }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select Theme
      </Typography>
      <Grid container spacing={2}>
        {themeOptions.map((themeOption) => (
          <Grid item xs={12} sm={4} key={themeOption.value}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.2s',
                transform: mode === themeOption.value ? 'scale(1.02)' : 'scale(1)',
                border: mode === themeOption.value ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                borderColor: 'divider',
                boxShadow: mode === themeOption.value ? `0 0 8px ${theme.palette.primary.main}20` : 'none',
                bgcolor: themeOption.value === 'light' ? '#FFFFFF' : 
                        themeOption.value === 'dark' ? '#1E1E1E' : 
                        '#F8EDD9', // Antique White for palette theme
                color: themeOption.value === 'dark' ? '#FFFFFF' : '#2A2A2A'
              }}
              onClick={() => setThemeMode(themeOption.value)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    mr: 1.5, 
                    color: mode === themeOption.value ? 'primary.main' : 'text.secondary'
                  }}>
                    {themeOption.icon}
                  </Box>
                  <Typography variant="h6" component="h3">
                    {themeOption.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2, color: themeOption.value === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                  {themeOption.description}
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  {themeOption.colors.map((color, index) => (
                    <Tooltip key={index} title={color.label}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '4px',
                        bgcolor: color.color,
                        border: color.color === '#FFFFFF' ? '1px solid #E0E0E0' : 'none',
                      }} />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  const [showSaved, setShowSaved] = useState(false);
  const [eaNameLocal, setEaNameLocal] = useState(settings.eaName || '');
  const [eaEmailLocal, setEaEmailLocal] = useState(settings.eaEmail || '');
  const [isSavingEa, setIsSavingEa] = useState(false);
  const [eaSaveError, setEaSaveError] = useState<string | null>(null);
  
  // Template management state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setEaNameLocal(settings.eaName || '');
    setEaEmailLocal(settings.eaEmail || '');
  }, [settings.eaName, settings.eaEmail]);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({ emailPromptTemplate: event.target.value })
      .then(() => {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 3000);
      })
      .catch(error => {
          console.error("Error saving prompt:", error);
      });
  };

  const handleSignatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ signature: event.target.value })
      .then(() => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      })
      .catch(error => {
        console.error("Error saving signature:", error);
      });
  };

  const resetToDefault = () => {
    updateSettings({
      emailPromptTemplate: undefined,
      signature: undefined
    })
      .then(() => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      })
      .catch(error => {
        console.error("Error resetting prompt/signature:", error);
      });
  };

  const debouncedSaveEaSettings = useCallback(
    debounce(async (name: string, email: string) => {
      console.log(`Debounced save triggered for EA: ${name}, ${email}`);
      setIsSavingEa(true);
      setEaSaveError(null);
      try {
        await updateSettings({ eaName: name, eaEmail: email });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
        console.log('EA settings saved successfully via debounced call');
      } catch (error) {
        console.error('Error saving EA settings:', error);
        setEaSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsSavingEa(false);
      }
    }, 1000),
    [updateSettings]
  );

  const handleEaNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setEaNameLocal(newName);
    debouncedSaveEaSettings(newName, eaEmailLocal);
  };

  const handleEaEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = event.target.value;
    setEaEmailLocal(newEmail);
    debouncedSaveEaSettings(eaNameLocal, newEmail);
  };

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto',
      minHeight: 'calc(100vh - 64px)',
      overflow: 'auto',
      position: 'relative',
      pt: 0
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: theme.palette.background.default,
        py: 1.5,
        px: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        mb: 3
      }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Settings</Typography>
        {showSaved && (
          <Alert severity="success" sx={{ ml: 'auto', py: 0, px: 1 }}>
            Saved!
          </Alert>
        )}
      </Box>

      <Paper elevation={0} sx={{ p: 3, mt: 2 }}>
        <ThemeSelector />
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Executive Assistant (EA) CC Automation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Automatically CC your EA when you mention their name in your audio recording.
            Name variations will be generated automatically to improve detection.
          </Typography>
          
          {eaSaveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {eaSaveError}
            </Alert>
          )}
          
          <Grid container spacing={2} alignItems="center"> 
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="EA Trigger Name/Phrase"
                value={eaNameLocal}
                onChange={handleEaNameChange}
                variant="outlined"
                InputProps={{
                  endAdornment: isSavingEa ? <CircularProgress size={20} /> : null,
                }}
                helperText="The name you say to trigger the CC."
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="EA Email Address"
                value={eaEmailLocal}
                onChange={handleEaEmailChange}
                variant="outlined"
                type="email"
                helperText="The email address to add to CC."
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

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
                  const index = updatedTemplates.findIndex(t => t.id === editingTemplate.id);
                  if (index !== -1) {
                    updatedTemplates[index] = templateForm as EmailTemplate;
                  }
                } else {
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
      </Paper>
    </Box>
  );
};

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), waitFor);
  };
}

export default SettingsPage;
