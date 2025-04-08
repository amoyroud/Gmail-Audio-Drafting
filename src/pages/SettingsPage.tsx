import React, { useState } from 'react';
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
  Stack
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
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto',
      height: 'calc(100vh - 64px)', // Account for AppBar height
      overflow: 'auto', // Enable scrolling
      position: 'relative', // For absolute positioning of back button if needed
      pt: 0 // No top padding to ensure back button is at the very top
    }}>
      {/* Back Button - Fixed at top */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: theme.palette.background.default,
        py: 1.5,
        px: { xs: 2, sm: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        mb: 3
      }}>
        <IconButton 
          onClick={() => navigate('/home')} 
          aria-label="back to home" 
          sx={{ 
            mr: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
      </Box>

      {/* Theme Settings */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h2">
            Appearance Settings
          </Typography>
          <Tooltip title="Select your preferred theme appearance for the application">
            <IconButton size="small">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <ThemeSelector />
      </Paper>

      {/* Email Settings */}
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
