import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface BookingFormProps {
  propertyId: number;
  bookingFee: number;
  onSubmit: (data: { visitDate: Date; visitTime: string; message: string }) => void;
  loading?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({
  propertyId,
  bookingFee,
  onSubmit,
  loading = false,
}) => {
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [visitTime, setVisitTime] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitDate && visitTime) {
      onSubmit({ visitDate, visitTime, message });
    }
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={handleSubmit}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Booking Fee: UGX {bookingFee.toLocaleString()} (Payable at viewing)
        </Alert>
        
        <DatePicker
          label="Select Date"
          value={visitDate}
          onChange={(date) => setVisitDate(date)}
          minDate={new Date()}
          sx={{ width: '100%', mb: 2 }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Time</InputLabel>
          <Select
            value={visitTime}
            onChange={(e) => setVisitTime(e.target.value)}
            label="Select Time"
            required
          >
            {timeSlots.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Message (Optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any specific questions or requirements?"
          sx={{ mb: 2 }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !visitDate || !visitTime}
          sx={{ bgcolor: '#F97316' }}
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </form>
    </LocalizationProvider>
  );
};

export default BookingForm;