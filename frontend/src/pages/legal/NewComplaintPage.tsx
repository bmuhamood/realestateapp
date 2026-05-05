// src/pages/legal/NewComplaintPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ComplaintCategory, CreateComplaintRequest } from '../../types';

const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const SLATE = '#475569';
const TEAL = '#25a882';
const AMBER = '#f59e0b';

const CATEGORIES: { value: ComplaintCategory; label: string; icon: string; description: string }[] = [
  { value: 'fraud', label: 'Fraud / Scam', icon: '⚠️', description: 'Report fraudulent listings or scam attempts' },
  { value: 'fake_listing', label: 'Fake Listing', icon: '🏠❌', description: 'Property listing that appears to be fake or misleading' },
  { value: 'misrepresentation', label: 'Property Misrepresentation', icon: '📸', description: 'Property differs significantly from description/photos' },
  { value: 'agent_misconduct', label: 'Agent Misconduct', icon: '🤝', description: 'Unprofessional or unethical agent behavior' },
  { value: 'service_issue', label: 'Service Issue', icon: '🔧', description: 'Problem with a service provider' },
  { value: 'payment_dispute', label: 'Payment Dispute', icon: '💰', description: 'Disagreement about payments or fees' },
  { value: 'privacy_violation', label: 'Privacy Violation', icon: '🔒', description: 'Misuse of personal information' },
  { value: 'harassment', label: 'Harassment', icon: '🚫', description: 'Harassing or threatening behavior' },
  { value: 'other', label: 'Other', icon: '📝', description: 'Other issues not listed above' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#22c55e', description: 'Minor issue, no urgency' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', description: 'Needs attention within a week' },
  { value: 'high', label: 'High', color: '#f97316', description: 'Urgent, needs attention within 48 hours' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444', description: 'Critical, needs immediate attention' },
];

const NewComplaintPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [defendantId, setDefendantId] = useState<number | undefined>();
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'user' | 'property' | 'service'>('user');
  const [searching, setSearching] = useState(false);
  
  useEffect(() => {
    if (searchTerm.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, searchType]);
  
  const performSearch = async () => {
    setSearching(true);
    try {
      let response;
      if (searchType === 'user') {
        response = await api.get(`/users/?search=${searchTerm}`);
        setSearchResults(response.data.results || response.data || []);
      } else if (searchType === 'property') {
        response = await api.get(`/properties/?search=${searchTerm}&limit=10`);
        setSearchResults(response.data.results || response.data || []);
      } else {
        response = await api.get(`/services/?search=${searchTerm}`);
        setSearchResults(response.data.results || response.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
      if (validFiles.length !== files.length) {
        alert('Some files exceed 10MB limit and were not added');
      }
      setEvidenceFiles(prev => [...prev, ...validFiles]);
    }
  };
  
  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (!selectedCategory) {
      setError('Please select a complaint category');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Upload evidence files first if any
      const evidenceUrls: string[] = [];
      for (const file of evidenceFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/complaints/upload/evidence/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        evidenceUrls.push(uploadRes.data.url);
      }
      
      const complaintData: CreateComplaintRequest = {
        category: selectedCategory,
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        evidence: evidenceUrls,
        defendant: defendantId,
        property_obj: propertyId,
        service_obj: serviceId,
      };
      
      await api.post('/complaints/', complaintData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/complaints'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500, margin: '20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: NAVY, marginBottom: 8 }}>Complaint Submitted</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Your complaint has been received. Our team will review it and contact you within 48 hours.</p>
          <button onClick={() => navigate('/dashboard/complaints')} style={{ padding: '12px 24px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
            View My Complaints
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
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>File a Complaint</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>We take all complaints seriously. Please provide detailed information to help us investigate.</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, padding: '16px', marginBottom: 24, color: '#991b1b' }}>
            ⚠️ {error}
          </div>
        )}
        
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          
          {/* Category Selection */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 12 }}>Complaint Category <span style={{ color: RED }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '14px',
                    borderRadius: 12,
                    border: selectedCategory === cat.value ? `2px solid ${RED}` : '1.5px solid #e2e8f0',
                    backgroundColor: selectedCategory === cat.value ? RED_BG : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{cat.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Complaint Title <span style={{ color: RED }}>*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your complaint"
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
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Detailed Description <span style={{ color: RED }}>*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible including dates, names, and specific incidents..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
          
          {/* Priority */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 12 }}>Priority Level</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as any)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: priority === p.value ? `2px solid ${p.color}` : '1px solid #e2e8f0',
                    backgroundColor: priority === p.value ? `${p.color}15` : '#fff',
                    color: priority === p.value ? p.color : '#64748b',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Search for Related Party */}
          <div style={{ marginBottom: 20, borderTop: '1px solid #eef2f7', paddingTop: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 12 }}>Report Against (Optional)</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {['user', 'property', 'service'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSearchType(type as any)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: searchType === type ? `1px solid ${RED}` : '1px solid #e2e8f0',
                    backgroundColor: searchType === type ? RED_BG : '#fff',
                    color: searchType === type ? RED : '#64748b',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {type === 'user' ? '👤 User' : type === 'property' ? '🏠 Property' : '🔧 Service'}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search for ${searchType} by name/title...`}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
                outline: 'none',
              }}
            />
            {searching && <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>Searching...</div>}
            {searchResults.length > 0 && (
              <div style={{ marginTop: 12, border: '1px solid #eef2f7', borderRadius: 10, overflow: 'hidden' }}>
                {searchResults.map(result => (
                  <div
                    key={result.id}
                    onClick={() => {
                      if (searchType === 'user') {
                        setDefendantId(result.id);
                        setPropertyId(undefined);
                        setServiceId(undefined);
                      } else if (searchType === 'property') {
                        setPropertyId(result.id);
                        setDefendantId(result.owner?.id);
                        setServiceId(undefined);
                      } else {
                        setServiceId(result.id);
                        setDefendantId(result.provider_user);
                        setPropertyId(undefined);
                      }
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #eef2f7',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8faff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    <div style={{ fontWeight: 600, color: NAVY }}>
                      {searchType === 'user' ? result.username : result.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {searchType === 'user' && result.email}
                      {searchType === 'property' && `${result.district}, ${result.city}`}
                      {searchType === 'service' && result.category_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Items Display */}
          {(defendantId || propertyId || serviceId) && (
            <div style={{ marginBottom: 20, backgroundColor: '#f8faff', padding: '12px 16px', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TEAL, marginBottom: 8 }}>✓ Reported against:</div>
              {defendantId && <div style={{ fontSize: 13, color: NAVY }}>👤 User ID: {defendantId}</div>}
              {propertyId && <div style={{ fontSize: 13, color: NAVY }}>🏠 Property ID: {propertyId}</div>}
              {serviceId && <div style={{ fontSize: 13, color: NAVY }}>🔧 Service ID: {serviceId}</div>}
              <button
                onClick={() => { setDefendantId(undefined); setPropertyId(undefined); setServiceId(undefined); }}
                style={{ fontSize: 11, color: RED, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}
              >
                Remove
              </button>
            </div>
          )}
          
          {/* Evidence Upload */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>Supporting Evidence</label>
            <div
              onClick={() => document.getElementById('evidence-upload')?.click()}
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: 12,
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = RED)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <input id="evidence-upload" type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Click to upload screenshots, documents, or other evidence</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Maximum 10MB per file (JPG, PNG, PDF, DOC)</div>
            </div>
            {evidenceFiles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {evidenceFiles.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8faff', borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: NAVY }}>📄 {file.name}</span>
                    <button onClick={() => removeFile(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCategory || !title || !description}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (loading || !selectedCategory || !title || !description) ? '#94a3b8' : RED,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: (loading || !selectedCategory || !title || !description) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: 8,
            }}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
        
        <div style={{ marginTop: 24, backgroundColor: '#fef3c7', borderRadius: 12, padding: '16px', borderLeft: `4px solid ${AMBER}` }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}>⚠️ What happens next?</div>
          <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
            Our team will review your complaint within 48 hours. You will receive updates via email and your dashboard. 
            In case of emergency, please contact local authorities immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewComplaintPage;