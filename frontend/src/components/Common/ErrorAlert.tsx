import React from 'react';
import { Alert, AlertTitle, Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface ErrorAlertProps {
  error: string | null;
  onClose?: () => void;
  title?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  error, 
  onClose, 
  title = 'Error' 
}) => {
  if (!error) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="error"
        action={
          onClose && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <Close fontSize="inherit" />
            </IconButton>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;