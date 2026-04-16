import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, Typography, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyDetail from './pages/PropertyDetail';
import Favorites from './pages/Favorites';
import Dashboard from './components/Dashboard/Dashboard';
import UserDashboard from './pages/UserDashboard';
import AllProperties from './pages/AllProperties';
import Services from './pages/Services';
import Chatbot from './components/Chatbot/Chatbot';
import { notificationService } from './services/notificationService';
import ServiceDetail from './pages/ServiceDetail';
import ServiceProviderPortal from './pages/ServiceProviderPortal';
import ServiceProviderDashboard from './pages/ServiceProviderDashboard';
import ProfilePage from './pages/ProfilePage';
import AccountSettings from './pages/AccountSettings';
import AgentsList from './pages/AgentsList';
import ServiceProvidersList from './pages/ServiceProvidersList';
import FollowersList from './pages/FollowersList';
import FollowingList from './pages/FollowingList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E3A8A',
    },
    secondary: {
      main: '#F97316',
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AgentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return user?.is_agent ? <>{children}</> : <Navigate to="/" />;
};

const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const ServiceProviderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppContent() {
  const { user, isAuthenticated } = useAuth();

  // Initialize WebSocket connection for notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('access_token');
      if (token) {
        notificationService.connectWebSocket(token);
        
        // Request notification permission
        notificationService.initPushNotifications();
      }
    }
    
    // Cleanup on unmount
    return () => {
      notificationService.disconnect();
    };
  }, [isAuthenticated, user]);

  // Subscribe to notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      const unsubscribe = notificationService.subscribe((notification) => {
        console.log('New notification:', notification);
        // You can also show a toast/snackbar here
      });
      
      return unsubscribe;
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/properties" element={<AllProperties />} />
        <Route path="/search" element={<AllProperties />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/agents" element={<AgentsList />} />
        <Route path="/service-providers" element={<ServiceProvidersList />} />
        <Route path="/profile/:username/followers" element={<FollowersList />} />
        <Route path="/profile/:username/following" element={<FollowingList />} />
        {/* Protected Routes - Require Authentication */}
        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          }
        />
        
        {/* Profile Routes - Supports both own profile and viewing others */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        {/* Account Settings Route */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <AccountSettings />
            </PrivateRoute>
          }
        />
        
        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            user?.is_agent ? (
              <AgentRoute>
                <Dashboard />
              </AgentRoute>
            ) : (
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            )
          }
        />
        
        {/* Service Provider Routes */}
        <Route
          path="/service-provider"
          element={
            <ServiceProviderRoute>
              <ServiceProviderPortal />
            </ServiceProviderRoute>
          }
        />
        <Route
          path="/service-provider/dashboard"
          element={
            <ServiceProviderRoute>
              <ServiceProviderDashboard />
            </ServiceProviderRoute>
          }
        />
      </Routes>
      <Chatbot />
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;