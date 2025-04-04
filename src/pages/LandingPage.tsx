import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  useMediaQuery, 
  useTheme, 
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import EmailIcon from '@mui/icons-material/Email';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));

  const handleGetStarted = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <MicIcon fontSize="large" color="primary" />,
      title: "Voice-to-Email",
      description: "Record your thoughts and have them instantly transcribed into professional email drafts."
    },
    {
      icon: <AutoAwesomeIcon fontSize="large" color="primary" />,
      title: "AI-Powered Drafts",
      description: "Let our AI generate contextually relevant responses based on your voice recordings."
    },
    {
      icon: <SecurityIcon fontSize="large" color="primary" />,
      title: "Secure Gmail Integration",
      description: "Connect securely to your Gmail account with OAuth authentication."
    },
    {
      icon: <SpeedIcon fontSize="large" color="primary" />,
      title: "Instant Responses",
      description: "Create and send email responses in seconds, not minutes."
    },
    {
      icon: <AccessTimeIcon fontSize="large" color="primary" />,
      title: "Save Time",
      description: "Respond to emails 3x faster than typing, perfect for busy professionals."
    },
    {
      icon: <EmailIcon fontSize="large" color="primary" />,
      title: "Email Management",
      description: "Easily browse, respond to, and manage your Gmail inbox."
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f8fa'
    }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a237e 30%, #283593 90%)' 
            : 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 16 }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Typography 
                  variant={isMobile ? 'h4' : 'h2'} 
                  component="h1" 
                  fontWeight="bold"
                  color="white"
                  gutterBottom
                >
                  Audio Email Assistant
                </Typography>
                <Typography 
                  variant={isMobile ? 'body1' : 'h6'} 
                  color="white" 
                  sx={{ mb: 4, opacity: 0.9 }}
                >
                  Respond to emails with your voice. Our AI-powered assistant transcribes your speech and generates professional email drafts in seconds.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleGetStarted}
                  sx={{ 
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                >
                  Get Started
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                component="img"
                src="/logo.png"
                alt="Audio Email Assistant"
                sx={{ 
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  display: 'block',
                  mx: 'auto',
                  filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.2))'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography 
          variant="h4" 
          component="h2" 
          textAlign="center" 
          fontWeight="bold"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Features
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                elevation={1}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#e8f0fe', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            component="h2" 
            textAlign="center" 
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 6 }}
          >
            How It Works
          </Typography>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    1. Sign in with Gmail
                  </Typography>
                  <Typography variant="body1">
                    Securely connect your Gmail account with OAuth authentication.
                  </Typography>
                </Paper>
                
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    2. Select an email to respond to
                  </Typography>
                  <Typography variant="body1">
                    Browse your inbox and choose the email you want to reply to.
                  </Typography>
                </Paper>
                
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    3. Record your response
                  </Typography>
                  <Typography variant="body1">
                    Use your voice to record your thoughts for the email response.
                  </Typography>
                </Paper>
                
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    4. Review and send
                  </Typography>
                  <Typography variant="body1">
                    Edit the AI-generated draft if needed, then save or send your email.
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box 
                component="img"
                src="/logo.svg"
                alt="How it works"
                sx={{ 
                  width: '100%',
                  maxWidth: 400,
                  height: 'auto'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 3,
            textAlign: 'center',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #283593 30%, #1a237e 90%)' 
              : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          }}
        >
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            component="h2" 
            fontWeight="bold"
            color="white"
            gutterBottom
          >
            Ready to save time on email responses?
          </Typography>
          
          <Typography 
            variant="body1" 
            color="white" 
            sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}
          >
            Join thousands of professionals who use Audio Email Assistant to respond to emails faster and more efficiently.
          </Typography>
          
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleGetStarted}
            sx={{ 
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              }
            }}
          >
            Get Started Now
          </Button>
        </Paper>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5',
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Audio Email Assistant. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
