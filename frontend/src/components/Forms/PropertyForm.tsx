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
} from '@mui/material';
import {
  CloudUpload,
  Delete,
} from '@mui/icons-material';
import { UploadImage, PropertyImage as ExistingImage } from '../../types';

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
}

interface PropertyFormProps {
  formData: PropertyFormData;
  onChange: (field: keyof PropertyFormData, value: string) => void;
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
      // Update existing images main status
      const newExistingImages = existingImages.map((img, i) => ({
        ...img,
        is_main: i === index,
      }));
      onExistingImagesChange(newExistingImages);
    } else if (onImagesChange) {
      // Update new images main status
      const newImages = images.map((img, i) => ({
        ...img,
        is_main: i === index,
      }));
      onImagesChange(newImages);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 && existingImages.length === 0) {
      setUploadError('Please upload at least one image');
      return;
    }
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Image Upload Section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
            Property Images
          </Typography>
          
          {/* Upload Area */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed #ccc',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#F97316',
                bgcolor: '#fff5f0',
              },
            }}
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
            <CloudUpload sx={{ fontSize: 48, color: '#F97316', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Click to upload property images
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG, GIF up to 5MB each
            </Typography>
          </Paper>

          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Existing Images
              </Typography>
              <Grid container spacing={1}>
                {existingImages.map((img, idx) => (
                  <Grid size={{ xs: 4, sm: 3, md: 2 }} key={img.id}>
                    <Paper
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        aspectRatio: '1',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        border: img.is_main ? '3px solid #F97316' : 'none',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={() => handleSetMainImage(idx, true)}
                    >
                      <img
                        src={img.image}
                        alt="Property"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {img.is_main && (
                        <Chip
                          label="Main"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#F97316',
                            color: 'white',
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
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageRemove(img.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* New Images */}
          {images.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                New Images
              </Typography>
              <Grid container spacing={1}>
                {images.map((img, index) => (
                  <Grid size={{ xs: 4, sm: 3, md: 2 }} key={index}>
                    <Paper
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        aspectRatio: '1',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        border: img.is_main ? '3px solid #F97316' : 'none',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={() => handleSetMainImage(index, false)}
                    >
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {img.is_main && (
                        <Chip
                          label="Main"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#F97316',
                            color: 'white',
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Click on an image to set as main image
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Basic Information */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            required
          />
        </Grid>

        {/* Property Details */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
            Property Details
          </Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControl fullWidth required>
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
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControl fullWidth required>
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
          </FormControl>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Price (UGX)"
            type="number"
            value={formData.price}
            onChange={(e) => onChange('price', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={(e) => onChange('bedrooms', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Bathrooms"
            type="number"
            value={formData.bathrooms}
            onChange={(e) => onChange('bathrooms', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Square Meters"
            type="number"
            value={formData.square_meters}
            onChange={(e) => onChange('square_meters', e.target.value)}
          />
        </Grid>

        {/* Location Information */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
            Location Information
          </Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Latitude"
            type="number"
            inputProps={{ step: 'any' }}
            value={formData.latitude}
            onChange={(e) => onChange('latitude', e.target.value)}
            required
            helperText="Example: 0.3136"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Longitude"
            type="number"
            inputProps={{ step: 'any' }}
            value={formData.longitude}
            onChange={(e) => onChange('longitude', e.target.value)}
            required
            helperText="Example: 32.5811"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            label="Address"
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            label="City"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            label="District"
            value={formData.district}
            onChange={(e) => onChange('district', e.target.value)}
            required
          />
        </Grid>

        {/* Form Actions */}
        <Grid size={{ xs: 12 }}>
          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            {onCancel && (
              <Button onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#F97316' }}
            >
              {loading ? <CircularProgress size={24} /> : submitText}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default PropertyForm;