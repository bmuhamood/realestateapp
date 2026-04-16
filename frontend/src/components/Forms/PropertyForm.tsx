import React, { useState } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  Tab,
  Tabs,
  alpha,
  styled,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Home,
  LocationOn,
  Videocam,
  Apartment,
  School,
  DirectionsCar,
  Stars,
  Security,
  Chair,
  Description,
  CheckCircle,
  Add,
} from '@mui/icons-material';
import { UploadImage, PropertyImage as ExistingImage } from '../../types';

// ============================================
// STYLED COMPONENTS
// ============================================

const PRIMARY_COLOR = '#c45a2c';
const PRIMARY_LIGHT = '#e07347';
const PRIMARY_DARK = '#9a4522';

const StyledTabs = styled(Tabs)({
  minHeight: 56,
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTabs-flexContainer': {
    gap: 8,
  },
});

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 44,
  borderRadius: 24,
  padding: '8px 20px',
  textTransform: 'none',
  fontWeight: 500,
  fontSize: 13,
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.grey[500], 0.08),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
  },
  '&.Mui-selected': {
    backgroundColor: PRIMARY_COLOR,
    color: '#fff',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: PRIMARY_DARK,
    },
  },
}));

const SectionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
  marginBottom: theme.spacing(3),
}));

const UploadZone = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: 16,
  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
  backgroundColor: alpha(theme.palette.grey[100], 0.5),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  '&:hover': {
    borderColor: PRIMARY_COLOR,
    backgroundColor: alpha(PRIMARY_COLOR, 0.04),
    '& .upload-icon': {
      transform: 'scale(1.1)',
      color: PRIMARY_COLOR,
    },
  },
}));

const ImageThumbnail = styled(Paper)<{ selected?: boolean }>(({ selected }) => ({
  position: 'relative',
  borderRadius: 12,
  overflow: 'hidden',
  aspectRatio: '1',
  cursor: 'pointer',
  border: selected ? `3px solid ${PRIMARY_COLOR}` : '3px solid transparent',
  transition: 'all 0.2s ease',
  boxShadow: selected ? `0 0 0 2px ${alpha(PRIMARY_COLOR, 0.2)}` : 'none',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(theme.palette.grey[50], 0.8),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(PRIMARY_COLOR, 0.04),
    borderColor: alpha(PRIMARY_COLOR, 0.2),
  },
}));

const SectionTitle = styled(Typography)({
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid #eee',
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: PRIMARY_COLOR,
        borderWidth: 2,
      },
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: PRIMARY_COLOR,
  },
});

const StyledSelect = styled(FormControl)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: '#fafafa',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: PRIMARY_COLOR,
        borderWidth: 2,
      },
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: PRIMARY_COLOR,
  },
});

const PrimaryButton = styled(Button)({
  backgroundColor: PRIMARY_COLOR,
  borderRadius: 10,
  padding: '12px 32px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.4)}`,
  '&:hover': {
    backgroundColor: PRIMARY_DARK,
    boxShadow: `0 6px 20px ${alpha(PRIMARY_COLOR, 0.5)}`,
  },
});

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  padding: '12px 32px',
  fontWeight: 600,
  textTransform: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: alpha(theme.palette.grey[500], 0.08),
  },
}));

// ============================================
// TYPES
// ============================================

interface PropertyFormData {
  title: string;
  description: string;
  property_type: string;
  transaction_type: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  square_meters: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  district: string;
  video_url: string;
  virtual_tour_url: string;
  neighborhood_name: string;
  neighborhood_description: string;
  distance_to_city_center: string;
  distance_to_airport: string;
  distance_to_highway: string;
  nearby_schools: string;
  distance_to_nearest_school: string;
  school_rating: string;
  nearby_roads: string;
  nearest_road: string;
  public_transport: boolean;
  nearest_bus_stop: string;
  nearest_taxi_stage: string;
  amenities: string[];
  nearest_mall: string;
  distance_to_mall: string;
  nearest_supermarket: string;
  nearest_market: string;
  nearest_pharmacy: string;
  nearest_hospital: string;
  distance_to_hospital: string;
  nearest_restaurant: string;
  nearest_cafe: string;
  nearest_gym: string;
  nearest_park: string;
  year_built: string;
  furnishing_status: string;
  parking_type: string;
  parking_spaces: string;
  has_security: boolean;
  has_cctv: boolean;
  has_electric_fence: boolean;
  has_security_lights: boolean;
  has_security_guards: boolean;
  has_gated_community: boolean;
  has_solar: boolean;
  has_backup_generator: boolean;
  has_water_tank: boolean;
  has_borehole: boolean;
  has_internet: boolean;
  has_cable_tv: boolean;
  has_garden: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_swimming_pool: boolean;
  has_playground: boolean;
  has_bbq_area: boolean;
  has_air_conditioning: boolean;
  has_heating: boolean;
  has_fireplace: boolean;
  has_modern_kitchen: boolean;
  has_walk_in_closet: boolean;
  has_study_room: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  has_title_deed: boolean;
  title_deed_number: string;
  land_registration_number: string;
  agent_phone: string;
  agent_email: string;
  viewing_instructions: string;
}

interface PropertyFormProps {
  formData: PropertyFormData;
  onChange: (field: keyof PropertyFormData, value: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  images?: UploadImage[];
  onImagesChange?: (images: UploadImage[]) => void;
  existingImages?: ExistingImage[];
  onExistingImagesChange?: (images: ExistingImage[]) => void;
  onImageRemove?: (imageId: number) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

const PropertyForm: React.FC<PropertyFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Submit',
  images = [],
  onImagesChange,
  existingImages = [],
  onExistingImagesChange,
  onImageRemove,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [amenitiesInput, setAmenitiesInput] = useState('');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadError(null);

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size must be less than 5MB');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      is_main: images.length === 0 && existingImages.length === 0 && index === 0,
    }));

    if (onImagesChange) {
      onImagesChange([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const handleSetMainImage = (index: number, isExisting: boolean = false) => {
    if (isExisting && onExistingImagesChange) {
      const newExistingImages = existingImages.map((img, i) => ({
        ...img,
        is_main: i === index,
      }));
      onExistingImagesChange(newExistingImages);
    } else if (onImagesChange) {
      const newImages = images.map((img, i) => ({
        ...img,
        is_main: i === index,
      }));
      onImagesChange(newImages);
    }
  };

  const handleAmenitiesAdd = () => {
    if (amenitiesInput.trim() && !formData.amenities.includes(amenitiesInput.trim())) {
      onChange('amenities', [...formData.amenities, amenitiesInput.trim()]);
      setAmenitiesInput('');
    }
  };

  const handleAmenitiesRemove = (amenity: string) => {
    onChange('amenities', formData.amenities.filter((a: string) => a !== amenity));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 && existingImages.length === 0) {
      setUploadError('Please upload at least one image');
      return;
    }
    onSubmit();
  };

  const tabs = [
    { label: 'Basic Info', icon: <Home fontSize="small" /> },
    { label: 'Location', icon: <LocationOn fontSize="small" /> },
    { label: 'Media', icon: <Videocam fontSize="small" /> },
    { label: 'Neighborhood', icon: <Apartment fontSize="small" /> },
    { label: 'Schools', icon: <School fontSize="small" /> },
    { label: 'Transport', icon: <DirectionsCar fontSize="small" /> },
    { label: 'Amenities', icon: <Stars fontSize="small" /> },
    { label: 'Security', icon: <Security fontSize="small" /> },
    { label: 'Features', icon: <Chair fontSize="small" /> },
    { label: 'Legal & Contact', icon: <Description fontSize="small" /> },
  ];

  const FeatureToggle = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (v: boolean) => void }) => (
    <FeatureCard elevation={0}>
      <Typography variant="body2" fontWeight={500}>{label}</Typography>
      <Switch
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: PRIMARY_COLOR,
            '&:hover': { backgroundColor: alpha(PRIMARY_COLOR, 0.08) },
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: PRIMARY_COLOR,
          },
        }}
      />
    </FeatureCard>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
      {/* Header with Tabs */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          mb: 4,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <StyledTabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, idx) => (
            <StyledTab
              key={idx}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab > idx && <CheckCircle sx={{ fontSize: 14, color: '#4caf50', ml: 0.5 }} />}
                </Box>
              }
            />
          ))}
        </StyledTabs>
      </Paper>

      {/* Content */}
      <Box sx={{ minHeight: '50vh' }}>
        {/* TAB 0: Basic Info */}
        {activeTab === 0 && (
          <>
            <SectionCard elevation={0}>
              <SectionTitle>Property Images</SectionTitle>
              <UploadZone
                elevation={0}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <CloudUpload
                  className="upload-icon"
                  sx={{ fontSize: 56, color: '#bbb', mb: 2, transition: 'all 0.25s ease' }}
                />
                <Typography variant="h6" fontWeight={500} color="text.primary" gutterBottom>
                  Drop images here or click to upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JPEG, PNG up to 5MB each - First image will be the main photo
                </Typography>
              </UploadZone>

              {uploadError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{uploadError}</Alert>
              )}

              {existingImages.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
                    Existing Images
                  </Typography>
                  <Grid container spacing={2}>
                    {existingImages.map((img, idx) => (
                      <Grid size={{ xs: 4, sm: 3, md: 2 }} key={img.id}>
                        <ImageThumbnail
                          selected={img.is_main}
                          elevation={0}
                          onClick={() => handleSetMainImage(idx, true)}
                        >
                          <img
                            src={img.image}
                            alt="Property"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {img.is_main && (
                            <Chip
                              label="Main"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: PRIMARY_COLOR,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 10,
                              }}
                            />
                          )}
                          {onImageRemove && (
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '.MuiPaper-root:hover &': { opacity: 1 },
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                              }}
                              onClick={(e) => { e.stopPropagation(); onImageRemove(img.id); }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </ImageThumbnail>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {images.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
                    New Images
                  </Typography>
                  <Grid container spacing={2}>
                    {images.map((img, index) => (
                      <Grid size={{ xs: 4, sm: 3, md: 2 }} key={index}>
                        <ImageThumbnail
                          selected={img.is_main}
                          elevation={0}
                          onClick={() => handleSetMainImage(index, false)}
                        >
                          <img
                            src={img.preview}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {img.is_main && (
                            <Chip
                              label="Main"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: PRIMARY_COLOR,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 10,
                              }}
                            />
                          )}
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '.MuiPaper-root:hover &': { opacity: 1 },
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                            }}
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </ImageThumbnail>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </SectionCard>

            <SectionCard elevation={0}>
              <SectionTitle>Basic Information</SectionTitle>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <StyledTextField
                    fullWidth
                    label="Property Title"
                    value={formData.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    required
                    placeholder="e.g., Modern 3-Bedroom Villa in Kololo"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <StyledTextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    required
                    placeholder="Describe your property in detail..."
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledSelect fullWidth required>
                    <InputLabel>Property Type</InputLabel>
                    <Select
                      value={formData.property_type}
                      onChange={(e) => onChange('property_type', e.target.value)}
                      label="Property Type"
                    >
                      <MenuItem value="house">House</MenuItem>
                      <MenuItem value="apartment">Apartment</MenuItem>
                      <MenuItem value="land">Land</MenuItem>
                      <MenuItem value="commercial">Commercial</MenuItem>
                      <MenuItem value="condo">Condo</MenuItem>
                      <MenuItem value="villa">Villa</MenuItem>
                      <MenuItem value="townhouse">Townhouse</MenuItem>
                      <MenuItem value="duplex">Duplex</MenuItem>
                      <MenuItem value="bungalow">Bungalow</MenuItem>
                    </Select>
                  </StyledSelect>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledSelect fullWidth required>
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      value={formData.transaction_type}
                      onChange={(e) => onChange('transaction_type', e.target.value)}
                      label="Transaction Type"
                    >
                      <MenuItem value="sale">For Sale</MenuItem>
                      <MenuItem value="rent">For Rent</MenuItem>
                      <MenuItem value="shortlet">Shortlet</MenuItem>
                    </Select>
                  </StyledSelect>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <StyledTextField
                    fullWidth
                    label="Price (UGX)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => onChange('price', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <StyledTextField
                    fullWidth
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => onChange('bedrooms', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <StyledTextField
                    fullWidth
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => onChange('bathrooms', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <StyledTextField
                    fullWidth
                    label="Square Meters"
                    type="number"
                    value={formData.square_meters}
                    onChange={(e) => onChange('square_meters', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <StyledTextField
                    fullWidth
                    label="Year Built"
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => onChange('year_built', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <StyledSelect fullWidth>
                    <InputLabel>Furnishing Status</InputLabel>
                    <Select
                      value={formData.furnishing_status}
                      onChange={(e) => onChange('furnishing_status', e.target.value)}
                      label="Furnishing Status"
                    >
                      <MenuItem value="unfurnished">Unfurnished</MenuItem>
                      <MenuItem value="semi_furnished">Semi-Furnished</MenuItem>
                      <MenuItem value="fully_furnished">Fully Furnished</MenuItem>
                      <MenuItem value="luxury">Luxury Furnished</MenuItem>
                    </Select>
                  </StyledSelect>
                </Grid>
              </Grid>
            </SectionCard>
          </>
        )}

        {/* TAB 1: Location */}
        {activeTab === 1 && (
          <SectionCard elevation={0}>
            <SectionTitle>Property Location</SectionTitle>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={(e) => onChange('latitude', e.target.value)}
                  required
                  helperText="Example: 0.3136"
                  inputProps={{ step: 'any' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={(e) => onChange('longitude', e.target.value)}
                  required
                  helperText="Example: 32.5811"
                  inputProps={{ step: 'any' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Full Address"
                  value={formData.address}
                  onChange={(e) => onChange('address', e.target.value)}
                  required
                  placeholder="e.g., Plot 12, Acacia Avenue, Kololo"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => onChange('city', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="District"
                  value={formData.district}
                  onChange={(e) => onChange('district', e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 2: Media */}
        {activeTab === 2 && (
          <SectionCard elevation={0}>
            <SectionTitle>Video & Virtual Tours</SectionTitle>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="YouTube/Vimeo Video URL"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => onChange('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  helperText="Add a video walkthrough of your property"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Virtual Tour URL"
                  type="url"
                  value={formData.virtual_tour_url}
                  onChange={(e) => onChange('virtual_tour_url', e.target.value)}
                  placeholder="https://..."
                  helperText="360° virtual tour link (Matterport, etc.)"
                />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 3: Neighborhood */}
        {activeTab === 3 && (
          <SectionCard elevation={0}>
            <SectionTitle>Neighborhood Information</SectionTitle>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Neighborhood Name"
                  value={formData.neighborhood_name}
                  onChange={(e) => onChange('neighborhood_name', e.target.value)}
                  placeholder="e.g., Kololo, Nakasero, Muyenga"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Neighborhood Description"
                  multiline
                  rows={3}
                  value={formData.neighborhood_description}
                  onChange={(e) => onChange('neighborhood_description', e.target.value)}
                  placeholder="Describe the neighborhood and its highlights..."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StyledTextField
                  fullWidth
                  label="Distance to City Center (km)"
                  type="number"
                  value={formData.distance_to_city_center}
                  onChange={(e) => onChange('distance_to_city_center', e.target.value)}
                  inputProps={{ step: '0.1' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StyledTextField
                  fullWidth
                  label="Distance to Airport (km)"
                  type="number"
                  value={formData.distance_to_airport}
                  onChange={(e) => onChange('distance_to_airport', e.target.value)}
                  inputProps={{ step: '0.1' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StyledTextField
                  fullWidth
                  label="Distance to Highway (km)"
                  type="number"
                  value={formData.distance_to_highway}
                  onChange={(e) => onChange('distance_to_highway', e.target.value)}
                  inputProps={{ step: '0.1' }}
                />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 4: Schools */}
        {activeTab === 4 && (
          <SectionCard elevation={0}>
            <SectionTitle>Nearby Schools</SectionTitle>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Nearby Schools"
                  value={formData.nearby_schools}
                  onChange={(e) => onChange('nearby_schools', e.target.value)}
                  placeholder="Aga Khan, Kampala International, Greenhill Academy"
                  helperText="Separate multiple schools with commas"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="Distance to Nearest School (km)"
                  type="number"
                  value={formData.distance_to_nearest_school}
                  onChange={(e) => onChange('distance_to_nearest_school', e.target.value)}
                  inputProps={{ step: '0.1' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="School Rating (1-5)"
                  type="number"
                  value={formData.school_rating}
                  onChange={(e) => onChange('school_rating', e.target.value)}
                  inputProps={{ min: 0, max: 5, step: '0.1' }}
                />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 5: Transportation */}
        {activeTab === 5 && (
          <SectionCard elevation={0}>
            <SectionTitle>Transportation & Access</SectionTitle>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Nearby Roads"
                  value={formData.nearby_roads}
                  onChange={(e) => onChange('nearby_roads', e.target.value)}
                  placeholder="Jinja Road, Entebbe Road, Kampala-Hoima Road"
                  helperText="Separate multiple roads with commas"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <StyledTextField
                  fullWidth
                  label="Nearest Main Road"
                  value={formData.nearest_road}
                  onChange={(e) => onChange('nearest_road', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="Nearest Bus Stop"
                  value={formData.nearest_bus_stop}
                  onChange={(e) => onChange('nearest_bus_stop', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField
                  fullWidth
                  label="Nearest Taxi Stage"
                  value={formData.nearest_taxi_stage}
                  onChange={(e) => onChange('nearest_taxi_stage', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FeatureToggle
                  label="Public transport available nearby"
                  checked={formData.public_transport}
                  onToggle={(v) => onChange('public_transport', v)}
                />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 6: Amenities */}
        {activeTab === 6 && (
          <SectionCard elevation={0}>
            <SectionTitle>Custom Amenities</SectionTitle>
            <Box display="flex" gap={2} mb={3}>
              <StyledTextField
                fullWidth
                size="small"
                placeholder="Type an amenity (e.g., Swimming Pool, Gym, Security)"
                value={amenitiesInput}
                onChange={(e) => setAmenitiesInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAmenitiesAdd();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleAmenitiesAdd}
                startIcon={<Add />}
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  borderRadius: 2,
                  px: 3,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: PRIMARY_DARK },
                }}
              >
                Add
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
              {formData.amenities.map((amenity, idx) => (
                <Chip
                  key={idx}
                  label={amenity}
                  onDelete={() => handleAmenitiesRemove(amenity)}
                  sx={{
                    bgcolor: alpha(PRIMARY_COLOR, 0.1),
                    color: PRIMARY_COLOR,
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': {
                      color: PRIMARY_COLOR,
                      '&:hover': { color: PRIMARY_DARK },
                    },
                  }}
                />
              ))}
            </Box>

            <SectionTitle>Nearby Places</SectionTitle>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Mall" value={formData.nearest_mall} onChange={(e) => onChange('nearest_mall', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Distance to Mall (km)" type="number" value={formData.distance_to_mall} onChange={(e) => onChange('distance_to_mall', e.target.value)} inputProps={{ step: '0.1' }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Supermarket" value={formData.nearest_supermarket} onChange={(e) => onChange('nearest_supermarket', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Market" value={formData.nearest_market} onChange={(e) => onChange('nearest_market', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Pharmacy" value={formData.nearest_pharmacy} onChange={(e) => onChange('nearest_pharmacy', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Hospital" value={formData.nearest_hospital} onChange={(e) => onChange('nearest_hospital', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Distance to Hospital (km)" type="number" value={formData.distance_to_hospital} onChange={(e) => onChange('distance_to_hospital', e.target.value)} inputProps={{ step: '0.1' }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Restaurant" value={formData.nearest_restaurant} onChange={(e) => onChange('nearest_restaurant', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Cafe" value={formData.nearest_cafe} onChange={(e) => onChange('nearest_cafe', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Gym" value={formData.nearest_gym} onChange={(e) => onChange('nearest_gym', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StyledTextField fullWidth label="Nearest Park" value={formData.nearest_park} onChange={(e) => onChange('nearest_park', e.target.value)} />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 7: Security */}
        {activeTab === 7 && (
          <SectionCard elevation={0}>
            <SectionTitle>Security Features</SectionTitle>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureToggle label="24/7 Security" checked={formData.has_security} onToggle={(v) => onChange('has_security', v)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureToggle label="CCTV Cameras" checked={formData.has_cctv} onToggle={(v) => onChange('has_cctv', v)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureToggle label="Electric Fence" checked={formData.has_electric_fence} onToggle={(v) => onChange('has_electric_fence', v)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureToggle label="Security Lights" checked={formData.has_security_lights} onToggle={(v) => onChange('has_security_lights', v)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureToggle label="Security Guards" checked={formData.has_security_guards} onToggle={(v) => onChange('has_security_guards', v)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureToggle label="Gated Community" checked={formData.has_gated_community} onToggle={(v) => onChange('has_gated_community', v)} />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* TAB 8: Features */}
        {activeTab === 8 && (
          <>
            <SectionCard elevation={0}>
              <SectionTitle>Utilities</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Solar Power" checked={formData.has_solar} onToggle={(v) => onChange('has_solar', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Backup Generator" checked={formData.has_backup_generator} onToggle={(v) => onChange('has_backup_generator', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Water Tank" checked={formData.has_water_tank} onToggle={(v) => onChange('has_water_tank', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Borehole" checked={formData.has_borehole} onToggle={(v) => onChange('has_borehole', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="High-speed Internet" checked={formData.has_internet} onToggle={(v) => onChange('has_internet', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Cable TV" checked={formData.has_cable_tv} onToggle={(v) => onChange('has_cable_tv', v)} /></Grid>
              </Grid>
            </SectionCard>

            <SectionCard elevation={0}>
              <SectionTitle>Outdoor Features</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Garden" checked={formData.has_garden} onToggle={(v) => onChange('has_garden', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Balcony" checked={formData.has_balcony} onToggle={(v) => onChange('has_balcony', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Terrace" checked={formData.has_terrace} onToggle={(v) => onChange('has_terrace', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Swimming Pool" checked={formData.has_swimming_pool} onToggle={(v) => onChange('has_swimming_pool', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Playground" checked={formData.has_playground} onToggle={(v) => onChange('has_playground', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="BBQ Area" checked={formData.has_bbq_area} onToggle={(v) => onChange('has_bbq_area', v)} /></Grid>
              </Grid>
            </SectionCard>

            <SectionCard elevation={0}>
              <SectionTitle>Interior Features</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Air Conditioning" checked={formData.has_air_conditioning} onToggle={(v) => onChange('has_air_conditioning', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Heating" checked={formData.has_heating} onToggle={(v) => onChange('has_heating', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Fireplace" checked={formData.has_fireplace} onToggle={(v) => onChange('has_fireplace', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Modern Kitchen" checked={formData.has_modern_kitchen} onToggle={(v) => onChange('has_modern_kitchen', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Walk-in Closet" checked={formData.has_walk_in_closet} onToggle={(v) => onChange('has_walk_in_closet', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Study Room" checked={formData.has_study_room} onToggle={(v) => onChange('has_study_room', v)} /></Grid>
              </Grid>
            </SectionCard>

            <SectionCard elevation={0}>
              <SectionTitle>Restrictions</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Pets Allowed" checked={formData.pets_allowed} onToggle={(v) => onChange('pets_allowed', v)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><FeatureToggle label="Smoking Allowed" checked={formData.smoking_allowed} onToggle={(v) => onChange('smoking_allowed', v)} /></Grid>
              </Grid>
            </SectionCard>

            <SectionCard elevation={0}>
              <SectionTitle>Parking</SectionTitle>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledSelect fullWidth>
                    <InputLabel>Parking Type</InputLabel>
                    <Select value={formData.parking_type} onChange={(e) => onChange('parking_type', e.target.value)} label="Parking Type">
                      <MenuItem value="none">No Parking</MenuItem>
                      <MenuItem value="street">Street Parking</MenuItem>
                      <MenuItem value="open">Open Parking</MenuItem>
                      <MenuItem value="covered">Covered Parking</MenuItem>
                      <MenuItem value="garage">Garage</MenuItem>
                      <MenuItem value="multiple">Multiple Garages</MenuItem>
                    </Select>
                  </StyledSelect>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledTextField fullWidth label="Number of Parking Spaces" type="number" value={formData.parking_spaces} onChange={(e) => onChange('parking_spaces', e.target.value)} />
                </Grid>
              </Grid>
            </SectionCard>
          </>
        )}

        {/* TAB 9: Legal & Contact */}
        {activeTab === 9 && (
          <>
            <SectionCard elevation={0}>
              <SectionTitle>Legal Information</SectionTitle>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FeatureToggle label="Has Title Deed" checked={formData.has_title_deed} onToggle={(v) => onChange('has_title_deed', v)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledTextField fullWidth label="Title Deed Number" value={formData.title_deed_number} onChange={(e) => onChange('title_deed_number', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledTextField fullWidth label="Land Registration Number" value={formData.land_registration_number} onChange={(e) => onChange('land_registration_number', e.target.value)} />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard elevation={0}>
              <SectionTitle>Contact Information</SectionTitle>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledTextField fullWidth label="Agent Phone Number" value={formData.agent_phone} onChange={(e) => onChange('agent_phone', e.target.value)} placeholder="+256 700 000 000" />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <StyledTextField fullWidth label="Agent Email" type="email" value={formData.agent_email} onChange={(e) => onChange('agent_email', e.target.value)} placeholder="agent@company.com" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <StyledTextField
                    fullWidth
                    label="Viewing Instructions"
                    multiline
                    rows={3}
                    value={formData.viewing_instructions}
                    onChange={(e) => onChange('viewing_instructions', e.target.value)}
                    placeholder="Instructions for scheduling property viewings..."
                  />
                </Grid>
              </Grid>
            </SectionCard>
          </>
        )}
      </Box>

      {/* Footer Actions */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          bottom: 0,
          mt: 4,
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box display="flex" gap={1}>
          {activeTab > 0 && (
            <SecondaryButton onClick={() => setActiveTab(activeTab - 1)}>
              Previous
            </SecondaryButton>
          )}
        </Box>
        <Box display="flex" gap={2}>
          {onCancel && (
            <SecondaryButton onClick={onCancel} disabled={loading}>
              Cancel
            </SecondaryButton>
          )}
          {activeTab < tabs.length - 1 ? (
            <PrimaryButton onClick={() => setActiveTab(activeTab + 1)}>
              Next Step
            </PrimaryButton>
          ) : (
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : submitText}
            </PrimaryButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PropertyForm;