import React, { useState } from 'react';
import { Box, IconButton, Modal, Paper, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, Close } from '@mui/icons-material';

interface ImageGalleryProps {
  images: { id: number; image: string }[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (!images.length) return null;

  return (
    <>
      <Box display="flex" gap={1} flexWrap="wrap">
        {images.slice(0, 4).map((image, index) => (
          <Box
            key={image.id}
            component="img"
            src={image.image}
            alt={`Property image ${index + 1}`}
            onClick={() => handleOpen(index)}
            sx={{
              width: index === 0 ? '100%' : 'calc(33.333% - 8px)',
              height: 200,
              objectFit: 'cover',
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { opacity: 0.9 },
            }}
          />
        ))}
        {images.length > 4 && (
          <Box
            sx={{
              position: 'relative',
              width: 'calc(33.333% - 8px)',
              height: 200,
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
            }}
            onClick={() => handleOpen(4)}
          >
            <img
              src={images[4].image}
              alt="More images"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.5rem',
              }}
            >
              +{images.length - 4}
            </Box>
          </Box>
        )}
      </Box>

      <Modal open={selectedIndex !== null} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 900,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, bgcolor: 'white' }}
          >
            <Close />
          </IconButton>
          {selectedIndex !== null && (
            <>
              <img
                src={images[selectedIndex].image}
                alt="Selected"
                style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
              />
              <Box display="flex" justifyContent="space-between" mt={2}>
                <IconButton onClick={handlePrev} disabled={selectedIndex === 0}>
                  <ChevronLeft />
                </IconButton>
                <Typography>
                  {selectedIndex + 1} / {images.length}
                </Typography>
                <IconButton onClick={handleNext} disabled={selectedIndex === images.length - 1}>
                  <ChevronRight />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default ImageGallery;