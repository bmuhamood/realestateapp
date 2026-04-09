// ServiceDetail.tsx - Completely safe version with debugging
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  IconButton,
  Divider,
  Avatar,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Fade,
  Zoom,
  Stack,
  Skeleton,
} from '@mui/material';
import {
  Phone,
  WhatsApp,
  Email,
  AccessTime,
  Star,
  Close,
  CheckCircle,
  Schedule,
  Person,
  Verified,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const TEAL = '#25a882';
const TEAL_DARK = '#1d8f6e';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const NAVY = '#0d1b2e';
const SLATE = '#475569';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
  gallery_images?: Array<{ id: number; image: string; order: number; is_main: boolean }>;
  duration: string;
  provider: string;
  provider_phone: string;
  provider_email: string;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  category_name: string;
  category_icon: string;
  service_type: string;
}

interface Review {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
  rating: number;
  comment: string;
  created_at: string;
}

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingInstructions, setBookingInstructions] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchService();
    fetchReviews();
  }, [id]);

  const fetchService = async () => {
    try {
      const response = await api.get(`/services/${id}/`);
      console.log('Full service response:', response.data);
      console.log('Gallery images:', response.data.gallery_images);
      setService(response.data);
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/services/reviews/?service=${id}`);
      setReviews(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBookService = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!bookingDate || !bookingTime || !bookingAddress) {
      alert('Please fill in all required fields');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
      await api.post('/services/bookings/', {
        service: service?.id,
        booking_date: bookingDateTime.toISOString(),
        address: bookingAddress,
        special_instructions: bookingInstructions,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingDialog(false);
        setBookingSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error booking service:', error);
      alert('Failed to book service. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setReviewLoading(true);
    try {
      await api.post('/services/reviews/', {
        service: service?.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      await fetchReviews();
      await fetchService();
      setReviewDialogOpen(false);
      setReviewRating(5);
      setReviewComment('');
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewLoading(false);
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

  // Safe function to get images array - always returns an array
  const getImages = (): string[] => {
    const images: string[] = [];
    
    if (!service) {
      return ['https://via.placeholder.com/800x500?text=No+Image+Available'];
    }
    
    // Add main image if exists
    if (service.image && typeof service.image === 'string') {
      images.push(service.image);
    }
    
    // Safely add gallery images
    if (service.gallery_images && Array.isArray(service.gallery_images) && service.gallery_images.length > 0) {
      for (let i = 0; i < service.gallery_images.length; i++) {
        const img = service.gallery_images[i];
        if (img && img.image && typeof img.image === 'string') {
          images.push(img.image);
        }
      }
    }
    
    // If no images, add placeholder
    if (images.length === 0) {
      images.push('https://via.placeholder.com/800x500?text=No+Image+Available');
    }
    
    console.log('Generated images array:', images);
    return images;
  };

  // Safe function to get current image
  const getCurrentImage = (): string => {
    const images = getImages();
    if (activeImageIndex >= 0 && activeImageIndex < images.length) {
      return images[activeImageIndex];
    }
    return 'https://via.placeholder.com/800x500?text=No+Image+Available';
  };

  // Safe function to get thumbnail images
  const getThumbnails = (): string[] => {
    return getImages();
  };

  if (loading) {
    return (
      <Box sx={{ mt: 10, mb: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" height={60} sx={{ mt: 2 }} />
              <Skeleton variant="text" height={100} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!service) {
    return (
      <Box sx={{ mt: 10, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, borderRadius: 4 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Service Not Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The service you're looking for doesn't exist or has been removed.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/services')} sx={{ bgcolor: TEAL }}>
              Browse Services
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const images = getImages();
  const currentImage = getCurrentImage();
  const thumbnails = getThumbnails();

  return (
    <Box sx={{ mt: 10, mb: 6, bgcolor: '#f4f7fb', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Fade in timeout={500}>
          <Box>
            {/* Back Button */}
            <Button
              onClick={() => navigate('/services')}
              sx={{ mb: 3, color: '#666' }}
            >
              ← Back to Services
            </Button>

            <Grid container spacing={3}>
              {/* Left Column - Images */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Zoom in timeout={500}>
                  <Paper sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={currentImage}
                      alt={service.name}
                      style={{
                        width: '100%',
                        height: 400,
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', currentImage);
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x500?text=Image+Not+Found';
                      }}
                    />
                    {service.is_featured && (
                      <Chip
                        label="⭐ Featured"
                        color="warning"
                        size="small"
                        sx={{ position: 'absolute', top: 16, left: 16 }}
                      />
                    )}
                    
                    {/* Thumbnails */}
                    {thumbnails.length > 1 && (
                      <Box sx={{ display: 'flex', gap: 1, p: 1, bgcolor: '#fff', overflowX: 'auto' }}>
                        {thumbnails.map((img, idx) => (
                          <Box
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: activeImageIndex === idx ? `2px solid ${TEAL}` : '1px solid #e0e0e0',
                              flexShrink: 0,
                            }}
                          >
                            <img 
                              src={img} 
                              alt={`Thumbnail ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x60?text=No+Image';
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Zoom>

                {/* Description Section - Under Images */}
                <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
                  <Typography variant="h5" fontWeight="bold" color={NAVY} gutterBottom>
                    About This Service
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {service.description}
                  </Typography>
                </Paper>

                {/* Reviews Section */}
                <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight="bold" color={NAVY}>
                      Reviews ({service.reviews_count})
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Star />}
                      onClick={() => setReviewDialogOpen(true)}
                      sx={{ borderColor: TEAL, color: TEAL }}
                    >
                      Write a Review
                    </Button>
                  </Box>

                  {reviews.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body1" color="text.secondary">
                        No reviews yet. Be the first to review this service!
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {reviews.map((review, index) => (
                        <Fade in timeout={index * 100} key={review.id}>
                          <Paper sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                              <Avatar sx={{ bgcolor: TEAL }}>
                                {review.user.first_name?.[0] || review.user.username?.[0] || 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {review.user.first_name || review.user.username}
                                </Typography>
                                <Rating value={review.rating} readOnly size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                {format(new Date(review.created_at), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {review.comment}
                            </Typography>
                          </Paper>
                        </Fade>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              {/* Right Column - Service Info & Booking */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 80 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      icon={<span>{service.category_icon || '🔧'}</span>}
                      label={service.category_name}
                      size="small"
                      sx={{ bgcolor: TEAL_BG, color: TEAL }}
                    />
                    {service.is_featured && (
                      <Chip label="Featured" size="small" color="warning" variant="outlined" />
                    )}
                  </Box>

                  <Typography variant="h4" fontWeight="bold" color={NAVY} gutterBottom>
                    {service.name}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Rating value={service.rating || 0} readOnly precision={0.5} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {service.rating?.toFixed(1) || '0.0'} ({service.reviews_count || 0} reviews)
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" alignItems="baseline" gap={1} mb={2}>
                    <Typography variant="h3" fontWeight="bold" color={TEAL}>
                      {formatPrice(service.price || 0)}
                    </Typography>
                    {service.price_unit && (
                      <Typography variant="body2" color="text.secondary">
                        / {service.price_unit}
                      </Typography>
                    )}
                  </Box>

                  {service.duration && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AccessTime sx={{ fontSize: 20, color: SLATE }} />
                      <Typography variant="body2" color="text.secondary">
                        Duration: {service.duration}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Service Provider
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Avatar sx={{ bgcolor: TEAL, width: 40, height: 40 }}>
                      {service.provider?.[0]?.toUpperCase() || 'P'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        {service.provider || 'Professional Service Provider'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Verified Provider ✓
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Schedule />}
                      onClick={() => setBookingDialog(true)}
                      sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK } }}
                    >
                      Book This Service
                    </Button>
                    {service.provider_phone && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Phone />}
                        href={`tel:${service.provider_phone}`}
                        sx={{ borderColor: TEAL, color: TEAL }}
                      >
                        Call Provider
                      </Button>
                    )}
                    {service.provider_phone && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<WhatsApp />}
                        href={`https://wa.me/${service.provider_phone}?text=Hi,%20I'm%20interested%20in%20${encodeURIComponent(service.name)}`}
                        target="_blank"
                        sx={{ borderColor: '#25D366', color: '#25D366' }}
                      >
                        WhatsApp
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: TEAL, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Schedule />
            <Typography variant="h6">Book Service</Typography>
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {service.name}
          </Typography>
        </DialogTitle>

        <DialogContent>
          {bookingSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Booking request sent successfully! The provider will contact you shortly.
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                You will pay <strong>{formatPrice(service.price)}</strong> to the provider upon service completion.
              </Alert>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Select Date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Time</InputLabel>
                    <Select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} label="Select Time">
                      <MenuItem value="08:00">8:00 AM</MenuItem>
                      <MenuItem value="09:00">9:00 AM</MenuItem>
                      <MenuItem value="10:00">10:00 AM</MenuItem>
                      <MenuItem value="11:00">11:00 AM</MenuItem>
                      <MenuItem value="12:00">12:00 PM</MenuItem>
                      <MenuItem value="13:00">1:00 PM</MenuItem>
                      <MenuItem value="14:00">2:00 PM</MenuItem>
                      <MenuItem value="15:00">3:00 PM</MenuItem>
                      <MenuItem value="16:00">4:00 PM</MenuItem>
                      <MenuItem value="17:00">5:00 PM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Service Address *"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    placeholder="Enter your full address where service is needed"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Special Instructions (Optional)"
                    value={bookingInstructions}
                    onChange={(e) => setBookingInstructions(e.target.value)}
                    placeholder="Any specific requirements or notes for the provider"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBookingDialog(false)}>Cancel</Button>
          {!bookingSuccess && (
            <Button
              onClick={handleBookService}
              variant="contained"
              disabled={bookingLoading}
              sx={{ bgcolor: TEAL }}
            >
              {bookingLoading ? <CircularProgress size={24} /> : 'Confirm Booking'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              How would you rate this service?
            </Typography>
            <Rating
              value={reviewRating}
              onChange={(_, value) => setReviewRating(value || 5)}
              size="large"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Review"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this service..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={reviewLoading}
            sx={{ bgcolor: TEAL }}
          >
            {reviewLoading ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceDetail;