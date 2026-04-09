export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'condo', label: 'Condo' },
] as const;

export const TRANSACTION_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'shortlet', label: 'Shortlet' },
] as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_METHODS = [
  { value: 'mtn', label: 'MTN Mobile Money' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
] as const;

export const BOOKING_FEE = 10000;

export const PRICE_RANGES = [
  { min: 0, max: 500000, label: 'Under UGX 500k' },
  { min: 500000, max: 1000000, label: 'UGX 500k - 1M' },
  { min: 1000000, max: 2000000, label: 'UGX 1M - 2M' },
  { min: 2000000, max: 5000000, label: 'UGX 2M - 5M' },
  { min: 5000000, max: 10000000, label: 'UGX 5M - 10M' },
  { min: 10000000, max: Infinity, label: 'Above UGX 10M' },
];