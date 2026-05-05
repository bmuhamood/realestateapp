// src/pages/kyc/KYCUploadPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const SLATE = '#475569';
const GREEN = '#16a34a';

const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'National ID', icon: '🆔', description: 'Ugandan National ID' },
  { value: 'passport', label: 'Passport', icon: '📘', description: 'International Passport' },
  { value: 'driving_license', label: 'Driving License', icon: '🚗', description: 'Valid Driving License' },
  { value: 'tin', label: 'Tax Identification Number', icon: '📊', description: 'TIN Certificate' },
  { value: 'business_reg', label: 'Business Registration', icon: '🏢', description: 'For agents/service providers' },
];

const KYCUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedType, setSelectedType] = useState<string>('national_id');
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleFileSelect = (type: 'front' | 'back' | 'selfie', file: File | null) => {
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`${type} image must be less than 5MB`);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG)');
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'front') {
      setFrontImage(file);
      setFrontPreview(previewUrl);
    } else if (type === 'back') {
      setBackImage(file);
      setBackPreview(previewUrl);
    } else if (type === 'selfie') {
      setSelfie(file);
      setSelfiePreview(previewUrl);
    }
  };
  
  const removeFile = (type: 'front' | 'back' | 'selfie') => {
    if (type === 'front') {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      setFrontImage(null);
      setFrontPreview(null);
    } else if (type === 'back') {
      if (backPreview) URL.revokeObjectURL(backPreview);
      setBackImage(null);
      setBackPreview(null);
    } else {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      setSelfie(null);
      setSelfiePreview(null);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select a document type');
      return;
    }
    if (!documentNumber.trim()) {
      setError('Please enter the document number');
      return;
    }
    if (!frontImage) {
      setError('Please upload the front image of your document');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('document_type', selectedType);
      formData.append('document_number', documentNumber);
      formData.append('front_image', frontImage);
      if (backImage) formData.append('back_image', backImage);
      if (selfie) formData.append('selfie', selfie);
      
      await api.post('/kyc/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      console.error('KYC submission failed:', err);
      setError(err.response?.data?.error || 'Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
        <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500, margin: '20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: NAVY, marginBottom: 8 }}>Verification Submitted</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Your documents have been submitted for review. We'll notify you once verified.</p>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>Identity Verification</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>Verify your identity to unlock verified badge and increase trust</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, padding: '16px', marginBottom: 24, color: '#991b1b' }}>
            ⚠️ {error}
          </div>
        )}
        
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          
          {/* Document Type Selection */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 12 }}>Document Type <span style={{ color: RED }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {DOCUMENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  style={{
                    padding: '14px',
                    borderRadius: 12,
                    border: selectedType === type.value ? `2px solid ${RED}` : '1.5px solid #e2e8f0',
                    backgroundColor: selectedType === type.value ? RED_BG : '#fff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{type.icon}</div>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{type.label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{type.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Document Number */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Document Number <span style={{ color: RED }}>*</span></label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter your document number"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {selectedType === 'national_id' && 'Format: CM0000000ABCD (as shown on your ID)'}
              {selectedType === 'passport' && 'Passport number from your passport bio page'}
              {selectedType === 'tin' && 'Tax Identification Number from URA'}
            </div>
          </div>
          
          {/* Front Image Upload */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Front of Document <span style={{ color: RED }}>*</span></label>
            <div
              onClick={() => document.getElementById('front-upload')?.click()}
              style={{
                border: `2px dashed ${frontImage ? TEAL : '#e2e8f0'}`,
                borderRadius: 12,
                padding: frontPreview ? '0' : '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: frontImage ? TEAL_BG : '#f8faff',
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input id="front-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect('front', e.target.files?.[0] || null)} />
              {frontPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={frontPreview} alt="Front preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile('front'); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Click to upload front side of your document</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>JPG, PNG up to 5MB</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Back Image Upload (Optional for some docs) */}
          {(selectedType === 'national_id' || selectedType === 'driving_license') && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Back of Document (Optional)</label>
              <div
                onClick={() => document.getElementById('back-upload')?.click()}
                style={{
                  border: `2px dashed ${backImage ? TEAL : '#e2e8f0'}`,
                  borderRadius: 12,
                  padding: backPreview ? '0' : '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: backImage ? TEAL_BG : '#f8faff',
                  minHeight: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <input id="back-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect('back', e.target.files?.[0] || null)} />
                {backPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={backPreview} alt="Back preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile('back'); }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Click to upload back side (if applicable)</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>JPG, PNG up to 5MB</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Selfie Upload */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Selfie with Document (Optional)</label>
            <div
              onClick={() => document.getElementById('selfie-upload')?.click()}
              style={{
                border: `2px dashed ${selfie ? TEAL : '#e2e8f0'}`,
                borderRadius: 12,
                padding: selfiePreview ? '0' : '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selfie ? TEAL_BG : '#f8faff',
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input id="selfie-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect('selfie', e.target.files?.[0] || null)} />
              {selfiePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={selfiePreview} alt="Selfie preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile('selfie'); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🤳</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Take a selfie holding your document</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Helps speed up verification</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Info Banner */}
          <div style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: '16px', marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔒</span> Why we need this information
            </div>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
              We verify your identity to prevent fraud and build trust in our community. Your documents are securely stored and only visible to our verification team.
            </p>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedType || !documentNumber || !frontImage}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (loading || !selectedType || !documentNumber || !frontImage) ? '#94a3b8' : RED,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: (loading || !selectedType || !documentNumber || !frontImage) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KYCUploadPage;