import React from 'react';
import { Typography } from '@mui/material';

interface PriceFormatterProps {
  price: number;
  period?: 'month' | 'year' | null;
  variant?: 'h6' | 'body1' | 'body2' | 'caption';
  color?: string;
}

const PriceFormatter: React.FC<PriceFormatterProps> = ({
  price,
  period = null,
  variant = 'h6',
  color,
}) => {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Typography variant={variant} color={color} fontWeight="bold">
      {formatPrice(price)}
      {period === 'month' && <Typography component="span" variant="caption">/month</Typography>}
      {period === 'year' && <Typography component="span" variant="caption">/year</Typography>}
    </Typography>
  );
};

export default PriceFormatter;