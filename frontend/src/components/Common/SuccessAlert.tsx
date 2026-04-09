import React from 'react';
import { Alert, AlertTitle, Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface SuccessAlertProps {
  message: string | null;
  onClose?: () => void;
  title?: string;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ 
  message, 
  onClose, 
  title = 'Success' 
}) => {
  if (!message) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="success"
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
        {message}
      </Alert>
    </Box>
  );
};

export default SuccessAlert;