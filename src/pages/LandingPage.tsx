import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  useMediaQuery, 
  useTheme, 
  Container,
  Grid
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import EmailIcon from '@mui/icons-material/Email';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' ? '#182838' : '#e9f4ee'
    }}>
      {/* Minimal header */}
      <Box sx={{ py: 2, px: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ mr: 1, color: theme.palette.mode === 'dark' ? '#fff' : '#000' }} />
              <Typography variant="h6" component="h1" fontWeight="medium">
                Audio Email Assistant
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/login')}
              size="small"
              sx={{ 
                mr: 2,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000'
              }}
            >
              Login
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleGetStarted}
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? '#fff' : '#000',
                color: theme.palette.mode === 'dark' ? '#000' : '#fff',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                }
              }}
            >
              Get Started
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Main hero section */}
      <Container maxWidth="lg" sx={{ 
        mt: { xs: 6, md: 10 },
        mb: { xs: 10, md: 14 }
      }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ maxWidth: 600 }}>
              <Typography 
                variant={isMobile ? 'h3' : 'h2'} 
                component="h2" 
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 3 }}
              >
                Get started with Audio Email
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  mb: 4, 
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  lineHeight: 1.5 
                }}
              >
                Securely record, transcribe, highlight, and share every email response.
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleGetStarted}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                Get Audio Email - Free
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              position: 'relative',
              height: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}>
              {/* Screenshot/demo image */}
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: { xs: '20px', md: '-30px' },
                  right: { xs: '0px', md: '-50px' },
                  width: { xs: '85%', md: '70%' },
                  height: 'auto',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  transform: 'rotate(2deg)',
                  bgcolor: '#fff',
                  p: 2
                }}
              >
                <Typography variant="body2" fontWeight="bold" gutterBottom>Summary</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  The recorded audio has been transcribed and converted into a professional email draft ready for sending.
                </Typography>
              </Box>
              
              {/* Recording UI element */}
              <Box 
                sx={{ 
                  position: 'relative',
                  width: { xs: '90%', md: '80%' },
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
                  height: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: '#fff',
                  p: 3
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MicIcon color="error" />
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>Recording audio...</Typography>
                </Box>
                <Box sx={{ 
                  flex: 1, 
                  borderRadius: '8px', 
                  border: '1px dashed rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3
                }}>
                  <Typography align="center" variant="body2" color="text.secondary">
                    "Thanks for your email. I've reviewed the proposal and have some thoughts..."
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="error" size="small">
                    Stop Recording
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 4,
          mt: 'auto',
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container maxWidth="lg">
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Audio Email Assistant
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                Secure. Private. Efficient.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
