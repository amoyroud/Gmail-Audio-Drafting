import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// Define keyframes animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const move = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
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

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
      backgroundImage: theme.palette.mode === 'dark' 
        ? 'radial-gradient(at 100% 0%, rgba(25, 118, 210, 0.12) 0px, transparent 50%), radial-gradient(at 0% 90%, rgba(66, 66, 255, 0.1) 0px, transparent 50%)'
        : 'radial-gradient(at 100% 0%, rgba(224, 242, 254, 0.8) 0px, transparent 50%), radial-gradient(at 0% 90%, rgba(219, 234, 254, 0.8) 0px, transparent 50%)',
      backgroundAttachment: 'fixed',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Modern header with glass effect */}
      <Paper 
        elevation={0} 
        sx={{ 
          py: 2, 
          px: 4, 
          position: 'sticky', 
          top: 0, 
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
              variant="outlined" 
              onClick={() => navigate('/login')}
              size="medium"
              sx={{ 
                mr: 2,
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.1)',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                borderRadius: '8px',
                px: 2,
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.5)' 
                    : 'rgba(0,0,0,0.3)',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Login
            </Button>
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

      {/* Decorative elements */}
      <Box sx={{
        position: 'absolute',
        top: '15%',
        left: '5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(25, 118, 210, 0.05) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(25, 118, 210, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        display: { xs: 'none', md: 'block' }
      }} />
      
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(66, 66, 255, 0.05) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(66, 66, 255, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        display: { xs: 'none', md: 'block' }
      }} />

      {/* Main hero section */}
      <Container maxWidth="lg" sx={{ 
        mt: { xs: 8, md: 12 },
        mb: { xs: 10, md: 14 },
        position: 'relative',
        zIndex: 1
      }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1000}>
              <Box sx={{ maxWidth: 600 }}>
                <Typography 
                  variant={isMobile ? 'h3' : 'h1'} 
                  component="h2" 
                  fontWeight="800"
                  sx={{ 
                    mb: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                      : 'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.8) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1
                  }}
                >
                  Voice to Email in Seconds
                </Typography>
                <Typography 
                  variant="h5" 
                  color="primary"
                  fontWeight="500"
                  sx={{ mb: 2 }}
                >
                  Faster. Clearer. More Personal.
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    mb: 5, 
                    fontSize: isMobile ? '1rem' : '1.25rem',
                    lineHeight: 1.6,
                    maxWidth: '90%'
                  }}
                >
                  Transform your voice into perfectly crafted email responses. Our AI assistant helps you communicate more efficiently while maintaining your personal touch.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleGetStarted}
                  startIcon={<KeyboardVoiceIcon />}
                  sx={{ 
                    px: 4,
                    py: 1.8,
                    fontSize: '1.1rem',
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '10px',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px 0 rgba(0,118,255,0.5)'
                      : '0 4px 20px 0 rgba(0,118,255,0.35)',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px 0 rgba(0,118,255,0.6)'
                        : '0 6px 25px 0 rgba(0,118,255,0.45)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  Try Audio Email - Free
                </Button>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 2, 
                    opacity: 0.7,
                    fontStyle: 'italic' 
                  }}
                >
                  No credit card required • Cancel anytime
                </Typography>
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Box sx={{ 
                position: 'relative',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                perspective: '1500px'
              }}>
                {/* Email output card */}
                <Card 
                  sx={{ 
                    position: 'absolute',
                    top: { xs: '10px', md: '-40px' },
                    right: { xs: '-10px', md: '-70px' },
                    width: { xs: '80%', md: '70%' },
                    height: 'auto',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0px 10px 30px rgba(0, 0, 0, 0.4)'
                      : '0px 10px 30px rgba(0, 0, 0, 0.1)',
                    transform: 'rotate(3deg) translateZ(20px)',
                    bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    p: 3,
                    zIndex: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ ml: 1, color: 'success.main' }}>Email Generated</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>To: Sarah Johnson</Typography>
                  <Typography variant="subtitle2" gutterBottom>Subject: Re: Product Proposal Review</Typography>
                  <Box sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    p: 2,
                    borderRadius: '8px',
                    mt: 1
                  }}>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                      Hi Sarah,<br/><br/>
                      Thanks for sending over the proposal. I've reviewed it and think it's a strong foundation. I especially liked the market analysis section.<br/><br/>
                      Could we discuss the pricing strategy before the next meeting? I have some thoughts on making it more competitive.<br/><br/>
                      Best,<br/>
                      Antoine
                    </Typography>
                  </Box>
                </Card>
                
                {/* Recording UI element - main feature showcase */}
                <Card 
                  sx={{ 
                    position: 'relative',
                    width: { xs: '95%', md: '85%' },
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0px 20px 50px rgba(0, 0, 0, 0.5)'
                      : '0px 20px 50px rgba(0, 0, 0, 0.15)',
                    height: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    p: 3,
                    zIndex: 3,
                    transform: 'translateZ(40px)'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'error.main',
                          width: 36, 
                          height: 36,
                          animation: `${pulse} 1.5s infinite`
                        }}
                      >
                        <MicIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="subtitle1" fontWeight="500">Recording in progress</Typography>
                        <Typography variant="caption" color="text.secondary">Speak your email reply...</Typography>
                      </Box>
                    </Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      sx={{ 
                        color: 'error.main', 
                        animation: `${blink} 1s infinite`
                      }}
                    >
                      00:32
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1, 
                    borderRadius: '16px', 
                    border: '1px dashed',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '40px',
                      background: 'linear-gradient(to right, #3498db, #2ecc71, #f1c40f)',
                      opacity: 0.7,
                      animation: `${move} 3s infinite`
                    }} />
                    <Typography 
                      align="center" 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '1.1rem',
                        fontStyle: 'italic',
                        lineHeight: 1.7,
                        maxWidth: '90%',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      "Thanks for your proposal. I think it looks great overall. Let's discuss the pricing strategy before our next meeting. I'd like to make it more competitive."
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button 
                      startIcon={<SpeedIcon />}
                      size="small"
                      sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
                      }}
                      variant="text"
                    >
                      {isMobile ? 'AI' : 'AI Processing'}
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      size="medium"
                      sx={{ 
                        px: 3,
                        borderRadius: '12px',
                        boxShadow: '0 4px 14px 0 rgba(255,59,48,0.3)'
                      }}
                    >
                      Stop Recording
                    </Button>
                  </Box>
                </Card>
                
                {/* Animation styles are added via sx prop and keyframes in MUI */}
              </Box>
            </Zoom>
          </Grid>
        </Grid>
      </Container>

      {/* Features section */}
      <Container maxWidth="lg" sx={{ mb: { xs: 10, md: 16 }, mt: { xs: 10, md: 16 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant={isMobile ? 'h4' : 'h3'} 
            component="h2" 
            fontWeight="700"
            sx={{ mb: 2 }}
          >
            How Audio Email Works
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              maxWidth: '700px',
              mx: 'auto',
              fontSize: isMobile ? '1rem' : '1.1rem', 
            }}
          >
            Transform your voice into perfectly crafted emails in three simple steps
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '100ms' }}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  borderRadius: '20px',
                  p: 4,
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 10px 30px rgba(0,0,0,0.5)' 
                      : '0 10px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.15)' : 'rgba(25,118,210,0.08)',
                    mx: 'auto'
                  }}
                >
                  <RecordVoiceOverIcon 
                    color="primary"
                    fontSize="large"
                    sx={{ animation: `${float} 3s ease-in-out infinite` }}
                  />
                </Box>
                <Typography variant="h5" fontWeight="600" align="center" gutterBottom>
                  1. Record
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Speak naturally about how you want to respond to an email. No need to worry about
                  perfect phrasing - just talk as if you're explaining to a colleague.
                </Typography>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '300ms' }}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  borderRadius: '20px',
                  p: 4,
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 10px 30px rgba(0,0,0,0.5)' 
                      : '0 10px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(46,204,113,0.15)' : 'rgba(46,204,113,0.08)',
                    mx: 'auto'
                  }}
                >
                  <SmartToyIcon 
                    sx={{ 
                      color: '#2ecc71',
                      fontSize: '32px',
                      animation: `${float} 3s ease-in-out infinite`,
                      animationDelay: '0.5s'
                    }}
                  />
                </Box>
                <Typography variant="h5" fontWeight="600" align="center" gutterBottom>
                  2. Transform
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Our AI instantly analyzes your recording, understanding context and tone. It then
                  crafts a professional email response that captures your intent perfectly.
                </Typography>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '500ms' }}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  borderRadius: '20px',
                  p: 4,
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 10px 30px rgba(0,0,0,0.5)' 
                      : '0 10px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(241,196,15,0.15)' : 'rgba(241,196,15,0.08)',
                    mx: 'auto'
                  }}
                >
                  <EmailIcon 
                    sx={{ 
                      color: '#f1c40f', 
                      fontSize: '32px',
                      animation: `${float} 3s ease-in-out infinite`,
                      animationDelay: '1s'
                    }}
                  />
                </Box>
                <Typography variant="h5" fontWeight="600" align="center" gutterBottom>
                  3. Send
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Review the email, make any final edits if needed, and send with confidence. Your
                  communication is professional, clear, and perfectly represents your thoughts.
                </Typography>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Why use us section */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 12 },
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(15, 23, 42, 0.7)' 
            : 'rgba(241, 245, 249, 0.7)',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', mb: { xs: 3, md: 0 } }}>
                <Box 
                  sx={{ 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.03)',
                    color: 'primary.main',
                    mt: 0.5
                  }}
                >
                  <SpeedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    10x Faster
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Turn a 30-second voice note into a perfectly formatted email in seconds. No more
                    typing lengthy responses or struggling with wording.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', mb: { xs: 3, md: 0 } }}>
                <Box 
                  sx={{ 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.03)',
                    color: 'primary.main',
                    mt: 0.5
                  }}
                >
                  <SecurityIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    100% Secure
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your data never leaves your device until you approve it. End-to-end encryption
                    ensures your communications remain private and secure.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex' }}>
                <Box 
                  sx={{ 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.03)',
                    color: 'primary.main',
                    mt: 0.5
                  }}
                >
                  <AutoAwesomeIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Professional Quality
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our AI crafts responses that maintain your personal style while ensuring
                    professionalism. Every email perfectly represents your voice and intent.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleGetStarted}
              sx={{ 
                px: 6,
                py: 1.8,
                borderRadius: '12px',
                fontSize: '1rem',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 14px 0 rgba(0,118,255,0.39)'
                  : '0 4px 14px 0 rgba(0,118,255,0.25)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,118,255,0.4)'
                },
                transition: 'all 0.2s'
              }}
            >
              Try Audio Email for Free
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.7 }}>
              No credit card required • Works with any email provider
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer with gradient */}
      <Box 
        component="footer" 
        sx={{ 
          py: 6, 
          px: 4,
          mt: 'auto',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.9))'
            : 'linear-gradient(to bottom, rgba(248, 250, 252, 0), rgba(248, 250, 252, 0.9))'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                <Typography variant="h6" fontWeight="600">
                  Audio Email Assistant
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Transform your voice into perfectly crafted emails. Save time and communicate better.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Audio Email Assistant. All rights reserved.
              </Typography>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Product
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Features
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Pricing
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                FAQ
              </Typography>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Company
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Blog
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Careers
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Legal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Terms
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Security
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7 }}>
              Secure. Private. Efficient.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
