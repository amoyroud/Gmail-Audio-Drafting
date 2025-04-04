import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Tooltip,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { TodoTask } from '../types/types';

interface TodoListProps {
  tasks: TodoTask[];
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({
  tasks,
  onTaskComplete,
  onTaskDelete
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: { xs: 2, sm: 3 },
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Tasks
      </Typography>

      {tasks.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">No tasks yet</Typography>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflowY: 'auto' }}>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              secondaryAction={
                <Tooltip title="Delete task">
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onTaskDelete(task.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              }
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.02)'
                }
              }}
            >
              <Checkbox
                checked={task.completed}
                onChange={() => onTaskComplete(task.id)}
                size="small"
              />
              <ListItemText
                primary={task.subject}
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        ...(task.completed && {
                          textDecoration: 'line-through',
                          color: 'text.disabled'
                        })
                      }}
                    >
                      {task.snippet}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      From: {task.from.name} • {new Date(task.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
                sx={{
                  ml: 1,
                  '.MuiListItemText-primary': {
                    fontWeight: 500,
                    ...(task.completed && {
                      textDecoration: 'line-through',
                      color: 'text.disabled'
                    })
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default TodoList;
