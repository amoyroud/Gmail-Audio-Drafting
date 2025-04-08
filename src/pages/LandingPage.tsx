import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  useMediaQuery, 
  useTheme, 
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  Divider,
  Fade,
  Zoom,
  Avatar,
  Alert,
  Stack,
  keyframes
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import EmailIcon from '@mui/icons-material/Email';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArchiveIcon from '@mui/icons-material/Archive';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

// Define keyframes animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const sessionExpired = location.state?.sessionExpired;

  const handleGetStarted = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <RecordVoiceOverIcon sx={{ fontSize: 40 }} />,
      title: "Voice-to-Email",
      description: "Transform your spoken words into professional emails instantly with natural voice commands"
    },
    {
      icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
      title: "AI-Powered Drafts",
      description: "Advanced AI structures your emails and provides smart suggestions for professional communication"
    },
    {
      icon: <EmailIcon sx={{ fontSize: 40 }} />,
      title: "Email Templates",
      description: "Create and use custom templates for recurring email types to save even more time"
    },
    {
      icon: <FormatListBulletedIcon sx={{ fontSize: 40 }} />,
      title: "Task Management",
      description: "Convert emails into tasks, set reminders, and track your to-dos effortlessly"
    },
    {
      icon: <ArchiveIcon sx={{ fontSize: 40 }} />,
      title: "Smart Actions",
      description: "Archive, mark as read, flag for follow-up, or save emails for later reading"
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: "Quick Commands",
      description: "Use voice commands to navigate, search, and manage your email inbox efficiently"
    },
    {
      icon: <TaskAltIcon sx={{ fontSize: 40 }} />,
      title: "Follow-up Tracking",
      description: "Never miss important emails with smart follow-up reminders and tracking"
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Secure & Private",
      description: "Enterprise-grade security with end-to-end encryption for your sensitive communications"
    },
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      title: "Smart Organization",
      description: "Automatically categorize and organize emails based on content and context"
    }
  ];

  return (
    <div style={{ 
      height: 'auto',
      width: '100%',
      position: 'relative',
      overflow: 'visible'
    }}>
      {sessionExpired && (
        <Alert 
          severity="info" 
          sx={{ 
            position: 'fixed', 
            top: 16, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1000,
            boxShadow: 3,
            minWidth: 300
          }}
        >
          Your session has expired. Please sign in again.
        </Alert>
      )}

      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          py: 2, 
          px: 4, 
          position: 'relative',
          zIndex: 10,
          borderRadius: 0,
          backdropFilter: 'blur(8px)',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(15, 23, 42, 0.7)' 
            : 'rgba(255, 255, 255, 0.7)',
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)'
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.primary.main,
                  width: 34, 
                  height: 34 
                }}
              >
                <EmailIcon fontSize="small" />
              </Avatar>
              <Typography 
                variant="h6" 
                component="h1" 
                fontWeight="600"
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                    : 'linear-gradient(90deg, #000 30%, rgba(0,0,0,0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                Audio Email Assistant
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              size="medium" 
              onClick={handleGetStarted}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                borderRadius: '8px',
                px: 2,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 14px 0 rgba(0,118,255,0.39)'
                  : '0 4px 14px 0 rgba(0,118,255,0.25)',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                }
              }}
            >
              Get Started
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{
        bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
        backgroundImage: theme.palette.mode === 'dark' 
          ? 'radial-gradient(at 100% 0%, rgba(25, 118, 210, 0.12) 0px, transparent 50%), radial-gradient(at 0% 90%, rgba(66, 66, 255, 0.1) 0px, transparent 50%)'
          : 'radial-gradient(at 100% 0%, rgba(224, 242, 254, 0.8) 0px, transparent 50%), radial-gradient(at 0% 90%, rgba(219, 234, 254, 0.8) 0px, transparent 50%)',
        backgroundAttachment: 'fixed',
      }}>
        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 15 }}>
          <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Box>
                <Typography 
                    variant="h2"
                  component="h2" 
                  sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      letterSpacing: '-0.02em',
                      mb: 2,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                        : 'linear-gradient(90deg, #000 30%, rgba(0,0,0,0.8) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                    Transform Voice to Email with AI
                </Typography>
                <Typography 
                  variant="h5" 
                  color="text.secondary"
                    sx={{ mb: 4, maxWidth: '600px' }}
                  >
                    Streamline your email workflow with voice commands. Create, manage, and organize emails effortlessly.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleGetStarted}
                    startIcon={<MicIcon />}
                  sx={{ 
                      py: 1.5,
                    px: 4,
                      borderRadius: '12px',
                    fontSize: '1.1rem',
                      boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                      animation: `${pulse} 2s infinite`
                    }}
                  >
                    Start Recording
                </Button>
              </Box>
            </Fade>
          </Grid>
          <Grid item xs={12} md={6}>
              <Zoom in timeout={1000}>
                <Box
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                    borderRadius: '16px',
                    p: 4,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                  }}
                >
                    <Typography 
                    variant="h4"
                    align="center"
                      sx={{ 
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      mb: 2
                      }}
                    >
                    Experience the Future of Email
                    </Typography>
                    <Typography 
                    variant="body1"
                      align="center" 
                      color="text.secondary"
                  >
                    Our AI-driven platform transforms your voice into professional emails, making communication faster and more efficient.
                    </Typography>
              </Box>
            </Zoom>
          </Grid>
        </Grid>
      </Container>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ pb: 15 }}>
          <Typography 
            variant="h3"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                : 'linear-gradient(90deg, #000 30%, rgba(0,0,0,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Powerful Features
          </Typography>
          <Typography 
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: '800px', mx: 'auto' }}
          >
            Everything you need to manage your emails efficiently with the power of voice and AI
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Zoom in timeout={500 + index * 200}>
              <Card 
                sx={{ 
                  height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      p: 3,
                      borderRadius: '16px',
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(20px)',
                      transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                        transform: 'translateY(-8px)',
                    boxShadow: theme.palette.mode === 'dark' 
                          ? '0 8px 25px rgba(0,0,0,0.8)'
                          : '0 8px 25px rgba(0,0,0,0.1)',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                        mb: 2,
                        color: theme.palette.primary.main,
                        transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      align="center"
                      gutterBottom
                  sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' 
                          ? theme.palette.primary.light 
                          : theme.palette.primary.dark
                      }}
                    >
                      {feature.title}
                </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                sx={{ 
                        flexGrow: 1,
                        fontSize: '0.95rem',
                        lineHeight: 1.5
                      }}
                    >
                      {feature.description}
                </Typography>
              </Card>
                </Zoom>
              </Grid>
            ))}
        </Grid>
      </Container>

        {/* How it Works Section */}
        <Container maxWidth="lg" sx={{ pb: 15 }}>
          <Typography
            variant="h3"
            align="center"
        sx={{ 
              fontWeight: 700,
              mb: 8,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                : 'linear-gradient(90deg, #000 30%, rgba(0,0,0,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            How It Works
          </Typography>
          <Stack spacing={4}>
            <Paper
                  sx={{ 
                p: 4,
                borderRadius: '16px',
                    bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    1. Record Your Voice
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Simply click the microphone button and start speaking. Our system will capture your voice with high accuracy.
                  </Typography>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    2. AI Processing
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Our advanced AI converts your speech to text and structures it into a professional email format.
                  </Typography>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    3. Review & Send
                  </Typography>
                  <Typography variant="body1">
                    Review the generated email, make any adjustments if needed, and send it with confidence.
                  </Typography>
            </Grid>
                <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    display: 'flex',
                      flexDirection: 'column',
                    justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.05)',
                      borderRadius: '16px',
                      p: 4,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography
                      variant="h4"
                      align="center"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        mb: 2
                      }}
                    >
                      Seamless Workflow
                  </Typography>
                    <Typography
                      variant="body1"
                      align="center"
                      color="text.secondary"
                    >
                      Experience a smooth transition from voice to email with our intuitive process.
                  </Typography>
              </Box>
            </Grid>
          </Grid>
            </Paper>
          </Stack>
        </Container>

        {/* Call to Action */}
        <Container maxWidth="md" sx={{ pb: 10 }}>
          <Paper
            sx={{
              p: 6,
              borderRadius: '24px',
              textAlign: 'center',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 66, 255, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(224, 242, 254, 0.8) 0%, rgba(219, 234, 254, 0.8) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Ready to Transform Your Email Workflow?
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Join thousands of professionals who are saving time with voice-powered email management.
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleGetStarted}
              startIcon={<AutoAwesomeIcon />}
              sx={{ 
                py: 1.5,
                px: 4,
                borderRadius: '12px',
                fontSize: '1.1rem',
                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                animation: `${pulse} 2s infinite`
              }}
            >
              Get Started Now
            </Button>
          </Paper>
        </Container>
      </Box>
    </div>
  );
};

export default LandingPage;
