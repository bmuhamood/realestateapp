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

  // Check if user is authenticated AND is a service provider (you can add a is_service_provider field to User model)
  // For now, we'll allow any authenticated user to access the service provider portal
  // You can modify this to check for specific user role
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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          }
        />
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
        <Route path="/properties" element={<AllProperties />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route
          path="/service-provider"
          element={
            <ServiceProviderRoute>
              <ServiceProviderPortal />
            </ServiceProviderRoute>
          }
        />
        <Route path="/service-provider/dashboard" element={
          <ServiceProviderRoute>
            <ServiceProviderDashboard />
          </ServiceProviderRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Box sx={{ mt: 10, p: 4 }}>
              <Typography variant="h4">Profile Page - Coming Soon</Typography>
            </Box>
          </PrivateRoute>
        } />
        <Route path="/search" element={<AllProperties />} />
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