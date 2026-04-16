// src/pages/AccountSettings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} aria-labelledby={`settings-tab-${index}`} {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Profile Form
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    city: '',
    district: '',
    profile_picture: null as File | null,
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    booking_updates: true,
    marketing_emails: false,
    property_alerts: true,
  });
  
  // Delete Account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/me/');
      const userData = response.data;
      setProfileForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        location: userData.location || '',
        city: userData.city || '',
        district: userData.district || '',
        profile_picture: null,
      });
      setProfilePicturePreview(userData.profile_picture || null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const showMessage = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', profileForm.first_name);
      formData.append('last_name', profileForm.last_name);
      formData.append('phone', profileForm.phone);
      formData.append('bio', profileForm.bio);
      formData.append('location', profileForm.location);
      formData.append('city', profileForm.city);
      formData.append('district', profileForm.district);
      
      if (profileForm.profile_picture) {
        formData.append('profile_picture', profileForm.profile_picture);
      }
      
      await api.patch('/users/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showMessage('Profile updated successfully!');
      fetchUserData();
    } catch (error: any) {
      showMessage(error.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    showMessage('New passwords do not match', 'error');
    return;
  }
  
  if (passwordForm.new_password.length < 8) {
    showMessage('Password must be at least 8 characters', 'error');
    return;
  }
  
  setLoading(true);
  try {
    // ✅ FIXED: Use correct endpoint
    await api.post('/users/change-password/', {
      old_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
    
    showMessage('Password changed successfully!');
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  } catch (error: any) {
    showMessage(error.response?.data?.error || 'Failed to change password', 'error');
  } finally {
    setLoading(false);
  }
};

  const handleNotificationSettingsUpdate = async () => {
    setLoading(true);
    try {
      await api.patch('/users/me/', { notification_preferences: notificationSettings });
      showMessage('Notification settings updated!');
    } catch (error: any) {
      showMessage('Failed to update notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      showMessage('Please type "DELETE MY ACCOUNT" to confirm', 'error');
      return;
    }
    
    setDeleting(true);
    try {
      await api.delete('/users/me/');
      await logout();
      navigate('/');
      showMessage('Account deleted successfully');
    } catch (error: any) {
      showMessage(error.response?.data?.error || 'Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileForm({ ...profileForm, profile_picture: file });
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const tabs = [
    { label: 'Profile', icon: <PersonIcon /> },
    { label: 'Security', icon: <LockIcon /> },
    { label: 'Notifications', icon: <NotificationsIcon /> },
    { label: 'Danger Zone', icon: <SecurityIcon /> },
  ];

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>Please log in to access settings</Typography>
          <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2, bgcolor: '#e63946' }}>
            Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#0d1b2e', fontWeight: 800, mb: 3 }}>
          Account Settings
        </Typography>
        
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#fff' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            ))}
          </Tabs>
          
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0d1b2e' }}>
                Profile Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal information and how others see you on the platform
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={4}>
                <Box position="relative">
                  <Avatar
                    src={profilePicturePreview || undefined}
                    sx={{ width: 120, height: 120, bgcolor: '#e63946', fontSize: 48 }}
                  >
                    {!profilePicturePreview && (profileForm.first_name?.charAt(0) || user?.username?.charAt(0))}
                  </Avatar>
                  <IconButton
                    component="label"
                    sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: '#e63946', color: '#fff', '&:hover': { bgcolor: '#c1121f' } }}
                  >
                    <EditIcon fontSize="small" />
                    <input type="file" hidden accept="image/*" onChange={handleProfilePictureChange} />
                  </IconButton>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profileForm.email}
                    disabled
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon /></InputAdornment> }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="District"
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  />
                </Grid>
              </Grid>
              
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  sx={{ bgcolor: '#e63946', '&:hover': { bgcolor: '#c1121f' }, px: 4 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Security Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0d1b2e' }}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a strong password to keep your account secure
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Current Password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="New Password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    helperText="Minimum 8 characters"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    error={passwordForm.confirm_password !== '' && passwordForm.new_password !== passwordForm.confirm_password}
                    helperText={passwordForm.confirm_password !== '' && passwordForm.new_password !== passwordForm.confirm_password ? 'Passwords do not match' : ''}
                  />
                </Grid>
              </Grid>
              
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={loading}
                  sx={{ bgcolor: '#e63946', '&:hover': { bgcolor: '#c1121f' }, px: 4 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Notifications Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0d1b2e' }}>
                Notification Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose what notifications you want to receive
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#e63946' } }}
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="caption" color="text.secondary" display="block" ml={4}>
                  Receive important updates via email
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.push_notifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, push_notifications: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#e63946' } }}
                    />
                  }
                  label="Push Notifications"
                />
                <Typography variant="caption" color="text.secondary" display="block" ml={4}>
                  Get real-time notifications in your browser
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.booking_updates}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, booking_updates: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#e63946' } }}
                    />
                  }
                  label="Booking Updates"
                />
                <Typography variant="caption" color="text.secondary" display="block" ml={4}>
                  Get notified about booking confirmations and status changes
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.property_alerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, property_alerts: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#e63946' } }}
                    />
                  }
                  label="Property Alerts"
                />
                <Typography variant="caption" color="text.secondary" display="block" ml={4}>
                  Get notified about new properties matching your interests
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.marketing_emails}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, marketing_emails: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#e63946' } }}
                    />
                  }
                  label="Marketing Emails"
                />
                <Typography variant="caption" color="text.secondary" display="block" ml={4}>
                  Receive promotional offers and updates about new features
                </Typography>
              </Paper>
              
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  onClick={handleNotificationSettingsUpdate}
                  disabled={loading}
                  sx={{ bgcolor: '#e63946', '&:hover': { bgcolor: '#c1121f' }, px: 4 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Preferences'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Danger Zone Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#d32f2f' }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Irreversible actions - proceed with caution
              </Typography>
              
              <Paper sx={{ p: 3, border: '1px solid #ffcdd2', bgcolor: '#fff5f5' }}>
                <Typography variant="subtitle1" fontWeight={700} color="#d32f2f" gutterBottom>
                  Delete Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Once you delete your account, all your data will be permanently removed. This action cannot be undone.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </Paper>
            </Box>
          </TabPanel>
        </Paper>
      </Container>
      
      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f' }}>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This action is permanent and cannot be undone. All your properties, bookings, and personal data will be deleted.
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
            Please type <strong style={{ color: '#d32f2f' }}>DELETE MY ACCOUNT</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            variant="outlined"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AccountSettings;