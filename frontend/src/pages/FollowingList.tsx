// src/pages/FollowingList.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  PersonAdd as FollowIcon,
  PersonRemove as UnfollowIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  is_agent: boolean;
  is_service_provider: boolean;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  full_name: string;
  is_following?: boolean;
}

const FollowingList: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingId, setFollowingId] = useState<number | null>(null);

  useEffect(() => {
    fetchFollowing();
  }, [username]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${username}/following/`);
      let followingData = response.data.results || response.data;
      
      // Check follow status for each user
      if (currentUser) {
        const usersWithFollowStatus = await Promise.all(
          followingData.map(async (user: User) => {
            try {
              const followStatus = await api.get(`/users/${user.username}/follow/status/`);
              return { ...user, is_following: followStatus.data.is_following };
            } catch {
              return { ...user, is_following: false };
            }
          })
        );
        followingData = usersWithFollowStatus;
      }
      
      setUsers(followingData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching following:', err);
      setError(err.response?.data?.detail || 'Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser: User) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFollowingId(targetUser.id);
    try {
      if (targetUser.is_following) {
        await api.delete(`/users/${targetUser.username}/follow/`);
        setUsers(prev => prev.map(u =>
          u.id === targetUser.id
            ? { ...u, is_following: false, followers_count: Math.max(0, (u.followers_count || 0) - 1) }
            : u
        ));
      } else {
        await api.post(`/users/${targetUser.username}/follow/`);
        setUsers(prev => prev.map(u =>
          u.id === targetUser.id
            ? { ...u, is_following: true, followers_count: (u.followers_count || 0) + 1 }
            : u
        ));
      }
    } catch (err: any) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowingId(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress sx={{ color: '#F97316' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: '#F97316' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#0d1b2e' }}>
          Following
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({users.length} {users.length === 1 ? 'person' : 'people'})
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {users.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Not following anyone yet
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid size={{ xs: 12 }} key={user.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      flex={1}
                      onClick={() => navigate(`/profile/${user.username}`)}
                    >
                      <Avatar
                        src={user.profile_picture || undefined}
                        sx={{ width: 56, height: 56, bgcolor: '#e63946' }}
                      >
                        {user.first_name?.[0] || user.username?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0d1b2e' }}>
                          {user.full_name || user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{user.username}
                        </Typography>
                        {user.is_agent && (
                          <Typography variant="caption" color="#F97316">
                            Real Estate Agent
                          </Typography>
                        )}
                        {user.is_service_provider && (
                          <Typography variant="caption" color="#25a882">
                            Service Provider
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {currentUser && currentUser.id !== user.id && (
                      <Button
                        variant={user.is_following ? 'outlined' : 'contained'}
                        size="small"
                        startIcon={user.is_following ? <UnfollowIcon /> : <FollowIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(user);
                        }}
                        disabled={followingId === user.id}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          minWidth: 100,
                          bgcolor: user.is_following ? 'transparent' : '#F97316',
                          borderColor: '#F97316',
                          color: user.is_following ? '#F97316' : '#fff',
                          '&:hover': {
                            bgcolor: user.is_following ? 'rgba(249,115,22,0.1)' : '#ea580c',
                          },
                        }}
                      >
                        {followingId === user.id ? (
                          <CircularProgress size={20} />
                        ) : user.is_following ? (
                          'Unfollow'
                        ) : (
                          'Follow'
                        )}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FollowingList;