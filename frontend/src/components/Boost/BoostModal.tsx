import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  Star,
  AccessTime,
  Payments,
  Close,
  CheckCircle,
  Bolt,
  Rocket,
  Diamond,
  WhatsApp,
  Phone,
  CreditCard,
} from '@mui/icons-material';
import api from '../../services/api';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_DARK = '#c1121f';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const SLATE = '#475569';
const TEAL = '#25a882';
const AMBER = '#f59e0b';
const GREEN = '#16a34a';

interface BoostPackage {
  id: number;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  priority: number;
}

interface BoostModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle: string;
  onBoostSuccess: () => void;
}

const BoostModal: React.FC<BoostModalProps> = ({
  open,
  onClose,
  propertyId,
  propertyTitle,
  onBoostSuccess,
}) => {
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mtn');

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/properties/boost-packages/');
      
      let packagesData = response.data;
      if (packagesData && packagesData.results) {
        packagesData = packagesData.results;
      }
      
      if (Array.isArray(packagesData)) {
        setPackages(packagesData);
        if (packagesData.length > 0 && !selectedPackage) {
          setSelectedPackage(packagesData[0].id);
        }
      } else {
        setPackages([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load boost packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateBoost = async () => {
    if (!selectedPackage) {
      setError('Please select a boost package');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await api.post(`/properties/${propertyId}/initiate-boost/`, {
        package_id: selectedPackage,
        payment_method: paymentMethod,
      });

      if (response.data.success || response.data.reference) {
        setPaymentRef(response.data.reference);
        setStep('payment');
      } else {
        onBoostSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error initiating boost:', error);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to initiate boost');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await api.post('/properties/verify-boost/', {
        reference: paymentRef,
      });

      if (response.data.success) {
        onBoostSuccess();
        onClose();
      } else {
        setError(response.data.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      setError(error.response?.data?.error || 'Payment verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPackageIcon = (name: string, priority: number) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vip') || priority >= 3) {
      return <Diamond sx={{ color: '#FFD700', fontSize: 28 }} />;
    }
    if (lowerName.includes('premium') || priority >= 2) {
      return <Rocket sx={{ color: RED, fontSize: 28 }} />;
    }
    return <Bolt sx={{ color: TEAL, fontSize: 28 }} />;
  };

  const getPackageColor = (priority: number) => {
    if (priority >= 3) return '#FFD700';
    if (priority >= 2) return RED;
    return TEAL;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4} flexDirection="column">
            <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading boost packages...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: NAVY, p: 3, color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rocket sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" fontFamily="'Sora', sans-serif">
                Boost Your Property
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {propertyTitle}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {packages.length === 0 && !loading ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <Box sx={{ fontSize: 48, mb: 2 }}>📦</Box>
            <Typography variant="body1" color="text.secondary">
              No boost packages available at the moment.
            </Typography>
            <Button onClick={onClose} sx={{ mt: 3, bgcolor: RED, color: 'white', '&:hover': { bgcolor: RED_DARK } }} variant="contained">
              Close
            </Button>
          </Box>
        ) : step === 'select' ? (
          <>
            {/* Info Banner */}
            <Box sx={{ bgcolor: RED_BG, p: 2, m: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrendingUp sx={{ color: RED, fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Why boost?</strong> Boosted properties appear at the top of search results and get up to 3x more views!
              </Typography>
            </Box>

            {/* Package Cards */}
            <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                const packageColor = getPackageColor(pkg.priority);
                
                return (
                  <Box
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    sx={{
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? packageColor : '#eef2f7'}`,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                    }}
                  >
                    {isSelected && (
                      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: `40px solid ${packageColor}`, borderLeft: '40px solid transparent' }}>
                        <CheckCircle sx={{ position: 'absolute', top: -35, right: 4, fontSize: 16, color: 'white' }} />
                      </Box>
                    )}
                    
                    <Box sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {getPackageIcon(pkg.name, pkg.priority)}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" fontFamily="'Sora', sans-serif" color={NAVY}>
                              {pkg.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pkg.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Radio checked={isSelected} sx={{ color: packageColor, '&.Mui-checked': { color: packageColor } }} />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            icon={<AccessTime sx={{ fontSize: 14 }} />}
                            label={`${pkg.duration_days} days`}
                            size="small"
                            sx={{ bgcolor: '#f4f7fb', color: SLATE }}
                          />
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Star sx={{ fontSize: 14, color: AMBER }} />
                            <Typography variant="caption" color="text.secondary">
                              {pkg.priority === 3 ? 'Top Priority' : pkg.priority === 2 ? 'High Priority' : 'Standard'}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color={packageColor} fontFamily="'Sora', sans-serif">
                          {formatPrice(pkg.price)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Payment Method */}
            <Box sx={{ p: 3, mt: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color={NAVY} gutterBottom>
                Payment Method
              </Typography>
              <RadioGroup
                row
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ display: 'flex', gap: 2 }}
              >
                <FormControlLabel 
                  value="mtn" 
                  control={<Radio sx={{ color: RED, '&.Mui-checked': { color: RED } }} />} 
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <img 
                        src="/images/mtn-logo.png" 
                        alt="MTN" 
                        style={{ width: 24, height: 24 }} 
                      />
                      <Typography variant="body2">MTN Mobile Money</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="airtel" 
                  control={<Radio sx={{ color: RED, '&.Mui-checked': { color: RED } }} />} 
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <img 
                        src="/images/airtel-logo.png"
                        alt="Airtel" 
                        style={{ width: 24, height: 24 }} 
                      />
                      <Typography variant="body2">Airtel Money</Typography>
                    </Box>
                  }
/>
                <FormControlLabel 
                  value="card" 
                  control={<Radio sx={{ color: RED, '&.Mui-checked': { color: RED } }} />} 
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CreditCard sx={{ fontSize: 18, color: SLATE }} />
                      <Typography variant="body2">Credit/Debit Card</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 3 }}>
            {/* Payment Step */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Payments sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" color={NAVY}>
                Complete Your Payment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Use the reference below to complete your payment
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Payment Reference:</strong> <span style={{ fontFamily: 'monospace', fontSize: 16 }}>{paymentRef}</span>
              </Typography>
            </Alert>

            <Box sx={{ bgcolor: '#f8faff', p: 2.5, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" color={NAVY} gutterBottom>
                How to pay:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li><Typography variant="caption">Open your mobile money app (MTN or Airtel)</Typography></li>
                <li><Typography variant="caption">Select "Pay Merchant" or "Send Money"</Typography></li>
                <li><Typography variant="caption">Enter the reference above</Typography></li>
                <li><Typography variant="caption">Enter the exact amount shown</Typography></li>
                <li><Typography variant="caption">Complete the payment</Typography></li>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                After completing payment, click "I Have Paid" to verify and activate your boost instantly.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #eef2f7' }}>
        <Button onClick={onClose} sx={{ color: SLATE }}>
          Cancel
        </Button>
        {step === 'select' ? (
          <Button
            variant="contained"
            onClick={handleInitiateBoost}
            disabled={!selectedPackage || processing || packages.length === 0}
            sx={{ bgcolor: RED, '&:hover': { bgcolor: '#c1121f' }, px: 4 }}
          >
            {processing ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Continue to Payment'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleVerifyPayment}
            disabled={processing}
            sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#138a36' }, px: 4 }}
          >
            {processing ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '✓ I Have Paid'}
          </Button>
        )}
      </DialogActions>

      {/* Keyframes */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Dialog>
  );
};

export default BoostModal;