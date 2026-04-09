import React from 'react';
import { Box, Rating, Typography } from '@mui/material';
import { Star } from '@mui/icons-material';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 'small',
  showValue = true,
}) => {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Rating
        value={rating}
        precision={0.5}
        readOnly
        size={size}
        emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
      />
      {showValue && (
        <Typography variant="body2" color="text.secondary">
          {rating.toFixed(1)}
          {count !== undefined && ` (${count} reviews)`}
        </Typography>
      )}
    </Box>
  );
};

export default RatingStars;