import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  List,
  ListItem,
  Typography,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  ListItemButton,
  ListItemText,
  Avatar,
  Tooltip,
  Modal
} from '@mui/material';
// Icons
// import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import StopIcon from '@mui/icons-material/Stop';
import EmailIcon from '@mui/icons-material/Email';
import MicIcon from '@mui/icons-material/Mic';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';

// Services
import { archiveEmail, fetchEmails, getEmailById, getTotalEmailCount, moveToRead, signOut, type EmailsResponse } from '../services/gmailService';
import { Email, EmailActionType, TodoTask, EmailTemplate } from '../types/types';
import AudioRecorder from '../components/AudioRecorder';
import ActionSelector from '../components/ActionSelector';
import TodoList from '../components/TodoList';
import GmailAuth from '../components/GmailAuth';
import EmptyState from '../components/EmptyState';
import { useEmail } from '../context/EmailContext';
import { fixEncodingIssues } from '../utils/textFormatter';
import Header from '../components/Header';
import EmailList from '../components/EmailList';
import EmailContent from '../components/EmailContent';
import { executeAction } from '../services/actionService';

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Constants
  const sidebarWidth = '350px';
  const spacing = { xs: 2, sm: 3, md: 4 };
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);
  // Search removed
  // const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<EmailActionType>('archive');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingAction, setRecordingAction] = useState<EmailActionType | null>(null);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [previousEmailId, setPreviousEmailId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const { setIsRecorderOpen } = useEmail();
  const [showEmailList, setShowEmailList] = useState(true);
  const [refreshingEmails, setRefreshingEmails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sidebarWidthState, setSidebarWidthState] = useState(350);
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref for sidebar width
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);

  const fetchEmailsList = useCallback(async (pageToken?: string) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response: EmailsResponse = await fetchEmails(pageToken);
      if (pageToken) {
        setEmails(prev => [...prev, ...response.emails]);
      } else {
        setEmails(response.emails as Email[]);
      }
      setNextPageToken(response.nextPageToken || null);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchEmailsList();
  }, [isAuthenticated, fetchEmailsList]);

  const handleAuthStateChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEmails = emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to get initial avatar text
  const getAvatarInitial = (from: string | {name?: string, email: string}) => {
    if (typeof from === 'string') {
      return from.charAt(0).toUpperCase();
    } 
    
    if (from && typeof from === 'object') {
      if (from.name && from.name.length > 0) {
        return from.name.charAt(0).toUpperCase();
      }
      if (from.email && from.email.length > 0) {
        return from.email.charAt(0).toUpperCase();
      }
    }
    
    return '?';
  };

  // Format email body with proper spacing and handling encoding issues
  const formatEmailBody = (body: string) => {
    if (!body) return null;
    
    // Apply comprehensive encoding fixes from our utility
    const processedBody = fixEncodingIssues(body);
    
    // Split by lines and format each line
    return processedBody.split('\n').map((line, i) => {
      // Handle quoted text (lines starting with '>')
      if (line.trim().startsWith('>')) {
        return (
          <Typography 
            key={i} 
            variant="body2" 
            component="div"
            sx={{ 
              pl: 2, 
              borderLeft: '2px solid', 
              borderColor: 'divider',
              color: 'text.secondary',
              my: 0.5,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {line.replace(/^>\s*/, '')}
          </Typography>
        );
      }
      
      // Handle email signatures (lines with -- or __)
      if (line.trim() === '--' || line.trim() === '__') {
        return (
          <Box key={i}>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              {/* Signature section */}
            </Typography>
          </Box>
        );
      }
      
      // Regular text
      return line.trim() === '' ? 
        <Box key={i} sx={{ height: '0.75em' }} /> : 
        <Typography 
          key={i} 
          variant="body2" 
          sx={{ 
            mb: 1,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}
        >
          {line}
        </Typography>;
    });
  };

  // Check if email is unread
  const isUnread = (email: Email) => {
    // The Email interface has 'unread' property but the actual emails
    // might have either 'unread' or 'labelIds' for determining read status
    // @ts-ignore - ignore TypeScript error since we know the email object shape
    return email.unread || (email.labelIds && email.labelIds.includes('UNREAD')) || false;
  };

  // Use useCallback to prevent recreating this function on every render
  const handleEmailDetails = useCallback(async () => {
    if (!selectedEmail) return;
    try {
      // For now we have all the email details
      const fullEmail = await getEmailById(selectedEmail.id) as Email;
      if (fullEmail) {
        setSelectedEmail(fullEmail);
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
      setError('Failed to load email details');
    }
  }, [selectedEmail]);

  // Use useCallback to prevent recreating this function on every render
  const handleEmailClick = useCallback(async (email: Email) => {
    console.log('Email clicked, loading full details:', email.id);
    
    // Find the index of the clicked email and update selectedEmailIndex
    const index = filteredEmails.findIndex(e => e.id === email.id);
    if (index !== -1) {
      setSelectedEmailIndex(index);
    }
    
    try {
      // Fetch the full email details
      const fullEmail = await getEmailById(email.id);
      if (fullEmail) {
        setSelectedEmail(fullEmail);
        
        // Navigate to email view page in mobile mode
        if (isMobile) {
          console.log('Navigating to email view page:', fullEmail.id);
          navigate(`/email/${fullEmail.id}`);
          return; // Stop execution after navigation
        }
      } else {
        // If fetching fails, still set the selected email to what we have
        setSelectedEmail(email);
      }
    } catch (error) {
      console.error('Error fetching full email details:', error);
      // If fetching fails, still set the selected email to what we have
      setSelectedEmail(email);
    }
    
    if (isMobile) {
      setPreviousEmailId(email.id);
      setSidebarVisible(false); // Hide sidebar when email is selected on mobile
      
      // Mobile navigation to email detail view
      navigate(`/email/${email.id}`);
    }
  }, [filteredEmails, isMobile, setPreviousEmailId, getEmailById, navigate]);

  const handleArchive = async (emailId: string) => {
    setArchiving(emailId);
    try {
      await archiveEmail(emailId);
      // Remove the email from the list
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      // Reset selected email if it was archived
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
        setSelectedAction('archive');
      }
      setActionSuccess('Email archived successfully');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error archiving email:', err);
      setError('Failed to archive email. Please try again.');
    } finally {
      setArchiving(null);
    }
  };

  const handleMoveToRead = async (emailId: string) => {
    try {
      setIsActionInProgress(true);
      
      // Use the moveToRead service which will find or create the To Read label
      const result = await moveToRead(emailId);
      
      if (!result.success) {
        throw new Error('Failed to move email to To Read');
      }
      
      // Update local state
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      setActionSuccess('Email moved to "To Read" label');
      setTimeout(() => setActionSuccess(null), 3000);
      setSelectedAction('archive');
    } catch (error) {
      console.error('Error moving email to To Read:', error);
      setError('Failed to move email to To Read. Please try again.');
    } finally {
      setIsActionInProgress(false);
    }
  }
  
  // Handle action selector click
  const handleTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // This function will now specifically handle opening the recorder modal
  const handleOpenRecorder = (action: EmailActionType, email: Email) => {
    console.log(`HomePage: Opening recorder for action: ${action} on email: ${email.id}`);
    setSelectedAction(action); // Set the action type for the recorder
    setSelectedEmail(email);    // Ensure the correct email is selected

    if (isMobile) {
      setIsRecorderOpen(true); // Use context for mobile bottom bar
    } else {
      setShowModal(true);      // Use local state for desktop modal
    }
  };

  const handleEmailAction = async (action: EmailActionType, email: Email) => {
    // This function should ONLY handle non-modal actions now
    if (action !== 'archive' && action !== 'move-to-read') {
      console.warn(`handleEmailAction called with unexpected action: ${action}. This should be handled elsewhere.`);
      return;
    }

    console.log(`Handling direct action: ${action} for email: ${email.id}`);
    setIsActionInProgress(true);
    setActionSuccess(null);
    setError(null);
    setPreviousEmailId(email.id);

    try {
      let result: { success: boolean; message?: string; data?: any };
      switch (action) {
        case 'archive':
          const archiveResult = await archiveEmail(email.id);
          result = { ...archiveResult, message: archiveResult.success ? 'Email archived' : 'Failed to archive' };
          break;
        case 'move-to-read':
          const moveResult = await moveToRead(email.id);
          result = { ...moveResult, message: moveResult.success ? 'Email moved to To Read' : 'Failed to move' };
          break;
        default:
          // Should not happen based on the check above
          result = { success: false, message: 'Unknown direct action' };
      }

      if (result.success) {
        console.log('Direct action successful:', result.message);
        setActionSuccess(result.message || 'Action successful!');
        setEmails(prev => prev.filter(e => e.id !== email.id));
        setSelectedEmail(null);
      } else {
        console.error('Direct action failed:', result.message);
        setError(result.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing direct email action:', error);
      setError('An error occurred during the action.');
    } finally {
      setIsActionInProgress(false);
      setTimeout(() => {
        setActionSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  const handleTemplateSelected = async (template: EmailTemplate, email: Email) => {
    console.log('HomePage: Template selected:', template.name, 'for email:', email.id);
    setIsActionInProgress(true);
    setActionSuccess(null);
    setError(null);
    
    try {
      const result = await executeAction({
        type: 'quick-decline',
        email: email,
        template: template
      });

      if (result.success) {
        console.log('HomePage: Quick decline successful:', result.message);
        setActionSuccess(result.message || 'Action successful!');
        // Remove the email from the list after successful action
        setEmails(prev => prev.filter(e => e.id !== email.id));
        setSelectedEmail(null); // Deselect email
      } else {
        console.error('HomePage: Quick decline failed:', result.message);
        setError(result.message || 'Quick decline action failed');
      }
    } catch (error) {
      console.error('HomePage: Error during quick decline action:', error);
      setError('An error occurred during the action.');
    } finally {
      setIsActionInProgress(false);
      // Optionally reset success/error messages after a delay
      setTimeout(() => {
        setActionSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  const handleBackButtonClick = () => {
    console.log('Back button clicked, clearing selected email');
    setSelectedEmail(null);
    // Also stop any active recording if user is navigating back
    if (isRecording) {
      setIsRecording(false);
      setRecordingAction(null);
    }
    // Show email list when going back
    setShowEmailList(true);
    // Show sidebar when going back
    setSidebarVisible(true);
  };

  const handleSelectEmail = useCallback(async (email: Email) => {
    console.log('Email selected via click:', email.id);
    
    // Find the index of the clicked email and update selectedEmailIndex
    const index = filteredEmails.findIndex(e => e.id === email.id);
    if (index !== -1) {
      setSelectedEmailIndex(index);
    }
    
    // Set loading state while fetching full email details
    setLoading(true);
    
    try {
      // Fetch the full email details to ensure we have the complete body
      const fullEmail = await getEmailById(email.id);
      if (fullEmail) {
        // Update both the selectedEmail and the email in the list
        setSelectedEmail(fullEmail);
        setEmails(prevEmails => 
          prevEmails.map(e => e.id === fullEmail.id ? fullEmail : e)
        );
      } else {
        // If fetching fails, still set the selected email to what we have
        setSelectedEmail(email);
      }
    } catch (error) {
      console.error('Error fetching full email details:', error);
      // If fetching fails, still set the selected email to what we have
      setSelectedEmail(email);
      setError('Could not load complete email details');
    } finally {
      setLoading(false);
    }
    
    if (isMobile) {
      setPreviousEmailId(email.id);
      setSidebarVisible(false); // Hide sidebar when email is selected on mobile
    }
  }, [filteredEmails, isMobile, setPreviousEmailId, getEmailById]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleActionComplete = () => {
    setShowModal(false);
  };

  const handleRefreshEmails = async () => {
    setRefreshingEmails(true);
    try {
      await fetchEmailsList();
    } catch (err) {
      console.error('Error refreshing emails:', err);
      setError('Failed to refresh emails. Please try again.');
    } finally {
      setRefreshingEmails(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!filteredEmails || filteredEmails.length === 0) return;

      // If in email view (selectedEmail is set and being viewed)
      if (selectedEmail) {
        switch (event.key) {
          case 'ArrowLeft':
            // Return to email list
            setSelectedEmail(null);
            break;
          case 'ArrowRight':
          case 'Enter':
          case ' ':
            // Open action modal with first action mode
            setSelectedAction('speech-to-text');
            setShowModal(true);
            event.preventDefault();
            break;
          // Add navigation within email view mode
          case 'ArrowUp':
            // Navigation within email view - go to previous email
            event.preventDefault();
            const prevIndex = Math.max(0, selectedEmailIndex - 1);
            if (prevIndex !== selectedEmailIndex) {
              setSelectedEmailIndex(prevIndex);
              setSelectedEmail(filteredEmails[prevIndex]);
            }
            break;
          case 'ArrowDown':
            // Navigation within email view - go to next email
            event.preventDefault();
            const nextIndex = Math.min(filteredEmails.length - 1, selectedEmailIndex + 1);
            if (nextIndex !== selectedEmailIndex) {
              setSelectedEmailIndex(nextIndex);
              setSelectedEmail(filteredEmails[nextIndex]);
            }
            break;
        }
        return;
      }

      // If in email list view (no specific email is being viewed)
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault(); // Prevent default scrolling
          const newUpIndex = Math.max(0, selectedEmailIndex - 1);
          setSelectedEmailIndex(newUpIndex);
          
          // Just update the selectedEmailIndex, don't open the email
          // This is what will allow navigation without opening emails
          if (filteredEmails[newUpIndex]) {
            // Do NOT set selectedEmail here, that opens the email view
            // Instead, we'll highlight in the list using selectedEmailIndex
            
            // Scroll the selected item into view if needed
            setTimeout(() => {
              const element = document.querySelector(`[data-email-id="${filteredEmails[newUpIndex].id}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 0);
          }
          break;
        case 'ArrowDown':
          event.preventDefault(); // Prevent default scrolling
          const newDownIndex = Math.min(filteredEmails.length - 1, selectedEmailIndex + 1);
          setSelectedEmailIndex(newDownIndex);
          
          // Just update the selectedEmailIndex, don't open the email
          if (filteredEmails[newDownIndex]) {
            // Do NOT set selectedEmail here, that opens the email view
            // Instead, we'll highlight in the list using selectedEmailIndex
            
            // Scroll the selected item into view if needed
            setTimeout(() => {
              const element = document.querySelector(`[data-email-id="${filteredEmails[newDownIndex].id}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 0);
          }
          break;
        case 'ArrowRight':
          // Only open the email when right arrow is pressed
          event.preventDefault(); // Prevent default behavior
          if (selectedEmailIndex >= 0 && filteredEmails[selectedEmailIndex]) {
            const email = filteredEmails[selectedEmailIndex];
            await handleEmailClick(email);
          }
          break;
        case 'Enter':
          // Only open the email when enter is pressed
          event.preventDefault(); // Prevent default behavior
          if (selectedEmailIndex >= 0 && filteredEmails[selectedEmailIndex]) {
            const email = filteredEmails[selectedEmailIndex];
            await handleEmailClick(email);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEmails, selectedEmailIndex, selectedEmail, getEmailById, handleEmailClick]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(prevState => !prevState);
  };

  // Handle drag to resize sidebar width
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidthState;
    setIsDragging(true);
  };

  // Define the drag and end functions with useRef to avoid dependency cycles
  const handleDragRef = React.useRef((e: MouseEvent) => {
    if (!isDragging) return;
    const newWidth = startWidthRef.current + (e.clientX - startXRef.current);
    // Increase max width to 800px to allow more space for the email preview list
    const limitedWidth = Math.max(250, Math.min(800, newWidth));
    setSidebarWidthState(limitedWidth);
  });

  const handleDragEndRef = React.useRef(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDragRef.current);
    document.removeEventListener('mouseup', handleDragEndRef.current);
  });

  // Update the refs when relevant dependencies change
  useEffect(() => {
    handleDragRef.current = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = startWidthRef.current + (e.clientX - startXRef.current);
      // Increase max width to 800px to allow more space for the email preview list
      const limitedWidth = Math.max(250, Math.min(800, newWidth));
      setSidebarWidthState(limitedWidth);
    };
    
    handleDragEndRef.current = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragRef.current);
      document.removeEventListener('mouseup', handleDragEndRef.current);
    };
  }, [isDragging]);

  // Setup and cleanup event listeners when dragging starts
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragRef.current);
      document.addEventListener('mouseup', handleDragEndRef.current);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDragRef.current);
      document.removeEventListener('mouseup', handleDragEndRef.current);
    };
  }, [isDragging]);

  // Set cursor style for entire document while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Mobile optimized functions for swipe interactions
  const handleSwipe = useCallback(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      // Minimum distance for a swipe
      const minDist = 75;
      
      // Calculate horizontal distance
      const distX = touchEndX - touchStartX;
      const distY = touchEndY - touchStartY;
      
      // Check if horizontal swipe
      if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > minDist) {
        // Right swipe (open sidebar)
        if (distX > 0 && !sidebarVisible && isMobile) {
          setSidebarVisible(true);
        }
        // Left swipe (close sidebar)
        else if (distX < 0 && sidebarVisible && isMobile) {
          setSidebarVisible(false);
        }
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, sidebarVisible]);

  // Set up swipe gesture handlers
  useEffect(() => {
    const cleanup = handleSwipe();
    return cleanup;
  }, [handleSwipe]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, p: { xs: 2, sm: 4 } }}>
          <GmailAuth onAuthStateChange={handleAuthStateChange} />
        </Box>
      </Box>
    );
  }

  // Simplified view for mobile devices
  if (isMobile) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Email List / Detail View */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            overflow: 'hidden',
            flexDirection: 'column'
          }}
        >
          {/* Show either email list or email detail based on selection */}
          {!selectedEmail ? (
            <Box className="swipe-hint" sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* Loading/Error State */}
              {loading && !refreshingEmails && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
              )}
              
              {/* Email List Header */}
              <Box sx={{ 
                p: 1, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: 'background.paper',
                zIndex: 10,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Inbox
                </Typography>
                <IconButton onClick={handleRefreshEmails} disabled={refreshingEmails}>
                  {refreshingEmails ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Box>
              
              {/* Email List */}
              <List sx={{ 
                width: '100%', 
                p: 0,
                '& .MuiListItemButton-root': {
                  px: 2
                }
              }}>
                {filteredEmails.length === 0 && !loading ? (
                  <EmptyState message="No emails found" icon="email" type="noEmails" />
                ) : (
                  filteredEmails.map((email, index) => (
                    <ListItemButton
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      selected={selectedEmailIndex === index}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        py: 1.5,
                        backgroundColor: isUnread(email) ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                        position: 'relative',
                        '&::after': isUnread(email) ? {
                          content: '""',
                          position: 'absolute',
                          left: '0',
                          top: '15px',
                          bottom: '15px',
                          width: '4px',
                          backgroundColor: 'primary.main',
                          borderRadius: '0 4px 4px 0'
                        } : {}
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%' }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            mr: 2,
                            bgcolor: isUnread(email) ? 'primary.main' : 'grey.400',
                          }}
                        >
                          {getAvatarInitial(email.from)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 0.5
                          }}>
                            <Typography 
                              variant="subtitle1"
                              sx={{ 
                                fontWeight: isUnread(email) ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '75%'
                              }}
                            >
                              {email.from.name || email.from.email || 'Unknown Sender'}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                            >
                              {formatDate(email.date)}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontWeight: isUnread(email) ? 500 : 400,
                              color: isUnread(email) ? 'text.primary' : 'text.secondary',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {email.subject || '(No subject)'}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemButton>
                  ))
                )}
                {nextPageToken && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchEmailsList(nextPageToken)}
                      disabled={loading}
                      size="small"
                    >
                      {loading ? <CircularProgress size={20} /> : 'Load More'}
                    </Button>
                  </Box>
                )}
              </List>
            </Box>
          ) : (
            // Email Detail View
            <Box 
              sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Email Detail Header */}
              <Box sx={{ 
                p: 1.5, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper'
              }}>
                <IconButton 
                  onClick={handleBackButtonClick}
                  className="tap-target"
                >
                  <ArrowBackIcon />
                </IconButton>
              </Box>
              
              {/* Email Content */}
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  overflow: 'auto',
                  p: 2,
                  WebkitOverflowScrolling: 'touch'
                }}
                className="scrollable-container"
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {selectedEmail.subject || '(No subject)'}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  mb: 2,
                  alignItems: 'center'
                }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 2
                    }}
                  >
                    {getAvatarInitial(selectedEmail.from)}
                  </Avatar>
                  
                  <Box>
                    <Typography variant="subtitle2">
                      {selectedEmail.from.name || selectedEmail.from.email || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(selectedEmail.date)}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 3 }}>
                  {formatEmailBody(selectedEmail.body)}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}
    >
      <Header
        showBackButton={false}
        onBack={handleBackButtonClick}
        signOut={signOut}
        loading={loading}
      />

      <Box
        id="main-content-container"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          bgcolor: 'background.default',
          borderRadius: 4,
          boxShadow: { xs: 'none', md: 2 },
          mt: { xs: 0, md: 2 },
          mx: { xs: 0, md: 2 },
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', md: `${sidebarWidthState}px` },
            display: { xs: showEmailList || !selectedEmail ? 'flex' : 'none', md: 'flex' },
            borderRight: { xs: 'none', md: '1.5px solid' },
            borderColor: 'divider',
            height: { xs: 'auto', md: 'calc(100vh - 56px)' },
            overflow: 'hidden',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: { xs: 0, md: '16px 0 0 16px' },
            boxShadow: { xs: 'none', md: 1 },
          }}
        >
          {/* Sidebar content */}
          <Box
            sx={{
              p: { xs: '8px 16px', md: '16px 24px' },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1.5px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              borderTopLeftRadius: { xs: 0, md: 16 },
              borderTopRightRadius: { xs: 0, md: 0 },
            }}
          >
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
              Inbox
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={handleRefreshEmails}
                  disabled={refreshingEmails}
                  size="small"
                  aria-label="Refresh Email List"
                >
                  {refreshingEmails ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Email list section - keep it scrollable */}
          <Box 
            sx={{ 
              overflowY: 'auto',
              flexGrow: 1,
              height: { xs: 'calc(100vh - 180px)', md: 'calc(100vh - 128px)' }
            }}
          >
            {loading ? (
              <Box sx={{ p: spacing.md, textAlign: 'center' }}>
                <CircularProgress size={40} />
              </Box>
            ) : emails.length > 0 ? (
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmail?.id}
                selectedIndex={selectedEmailIndex}
                onSelectEmail={handleSelectEmail}
              />
            ) : (
              <Box sx={{ p: spacing.md, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {error || "No emails found"}
                </Typography>
                {error && (
                  <Button
                    variant="outlined"
                    onClick={handleRefreshEmails}
                    sx={{ mt: 2 }}
                  >
                    Try Again
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Draggable divider */}
        <Box
          sx={{
            width: '10px', // Increased width for easier grabbing
            cursor: 'col-resize',
            backgroundColor: theme => 
              isDragging 
                ? theme.palette.primary.main 
                : theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.08)' 
                  : 'rgba(0,0,0,0.05)',
            height: 'calc(100vh - 40px)',
            display: { xs: 'none', md: 'block' },
            transition: isDragging ? 'none' : 'background-color 0.2s',
            '&:hover': {
              backgroundColor: theme => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.15)' 
                  : 'rgba(0,0,0,0.1)',
              '&::before': {
                opacity: 0.8,
              }
            },
            '&:active': {
              backgroundColor: theme => theme.palette.primary.main,
            },
            userSelect: 'none',
            zIndex: 100, // Ensure it's above other content
            position: 'relative',
            // Add a visual indicator in the center of the divider
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 'calc(50% - 40px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '80px',
              backgroundColor: theme => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'rgba(0,0,0,0.2)',
              borderRadius: '2px',
              opacity: 0.5,
              transition: 'opacity 0.2s',
            },
            '&::after': isDragging ? {
              content: '""',
              position: 'absolute',
              top: 'calc(50% - 15px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '30px',
              backgroundColor: theme => theme.palette.primary.main,
              borderRadius: '3px',
              opacity: 0.9,
            } : {},
          }}
          onMouseDown={handleDragStart}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={sidebarWidthState}
          tabIndex={0}
        />

        {/* Email content section - make sure it's scrollable */}
        <Box
          sx={{ 
            flexGrow: 1,
            display: { xs: !showEmailList && selectedEmail ? 'block' : 'none', md: 'block' },
            height: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 56px)' },
            overflow: 'auto',
            pb: { xs: 6, sm: 2 },
            width: { md: `calc(100% - ${sidebarWidthState}px - 5px)` },
            position: 'relative',
            bgcolor: 'background.paper',
            borderRadius: { xs: 0, md: '0 16px 16px 0' },
            boxShadow: { xs: 'none', md: 1 },
          }}
        >
          {selectedEmail ? (
            <>
              {/* Email loading indicator */}
              {loading && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}>
                  <CircularProgress size={40} />
                </Box>
              )}
              <EmailContent
                email={selectedEmail}
                onAction={handleEmailAction}
                onTemplateSelected={handleTemplateSelected}
                onOpenRecorder={handleOpenRecorder}
                goBack={handleBackButtonClick}
              />
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: spacing.md,
              }}
            >
              <Typography color="text.secondary" align="center">
                Select an email to view its content
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Audio recording modal (Desktop) */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
            sx={{
            width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
            maxWidth: '800px',
            maxHeight: '90vh',
            p: { xs: spacing.xs, sm: spacing.sm, md: spacing.md },
            borderRadius: '12px',
            overflow: 'auto', // Make modal content scrollable
            outline: 'none',
          }}
        >
          {selectedAction && selectedEmail && (
            <AudioRecorder
              selectedEmail={selectedEmail}
              initialAction={selectedAction}
              onDraftSaved={handleCloseModal}
              onActionComplete={handleActionComplete}
            />
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default HomePage;