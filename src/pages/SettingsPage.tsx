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
  IconButton
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useSettings } from '../services/settingsService';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  const [showSaved, setShowSaved] = useState(false);

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

      {showSaved && (
        <Alert severity="success" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: theme.zIndex.snackbar }}>
          Settings saved successfully
        </Alert>
      )}
    </Box>
  );
};

export default SettingsPage;
