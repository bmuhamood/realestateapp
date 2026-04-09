// notificationService.ts

import api from './api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'promotion';
  read: boolean;
  created_at: string;
  data?: any;
}

class NotificationService {
  private ws: WebSocket | null = null;
  private listeners: ((notification: Notification) => void)[] = [];
  private permissionGranted = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;
  private currentToken: string | null = null;
  private connectionStatusListeners: ((isConnected: boolean) => void)[] = [];

  constructor() {
    this.initPushNotifications();
  }

  // Push Notification Setup
  async initPushNotifications() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (this.permissionGranted) {
        console.log('Notification permission granted');
        await this.registerServiceWorker();
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return;
    }

    try {
      // Check if service worker is already registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      let swRegistered = false;
      
      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes('sw.js')) {
          swRegistered = true;
          console.log('Service Worker already registered');
          break;
        }
      }

      if (!swRegistered) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('New Service Worker activated');
                window.location.reload();
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private getWebSocketUrl(token: string): string {
    // Use environment variable for WebSocket URL
    const wsBaseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    return `${wsBaseUrl}/ws/notifications/?token=${token}`;
  }

  refreshToken(token: string) {
    this.currentToken = token;
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connectWebSocket(token);
  }

  async sendTestNotification(title: string, body: string) {
    if (this.permissionGranted) {
      try {
        const options: NotificationOptions = {
          body: body,
          icon: '/logo192.png',
          badge: '/favicon.ico',
          silent: false,
        };
        
        // Add vibrate only if supported
        if ('vibrate' in navigator) {
          (options as any).vibrate = [200, 100, 200];
        }
        
        const notification = new Notification(title, options);
        
        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error sending test notification:', error);
      }
    } else {
      console.warn('Notification permission not granted');
      // Request permission again
      await this.initPushNotifications();
    }
  }

  // WebSocket Connection for real-time notifications
  connectWebSocket(token: string) {
    if (!token) {
      console.warn('No token provided for WebSocket connection');
      this.notifyConnectionStatus(false);
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      this.notifyConnectionStatus(true);
      return;
    }

    this.currentToken = token;
    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl(token);
    
    console.log('Connecting to WebSocket...');
    
    try {
      this.ws = new WebSocket(wsUrl);

      // Set timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout');
          this.ws.close();
          this.isConnecting = false;
          this.attemptReconnect();
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connected for notifications');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.notifyConnectionStatus(true);
        
        // Send initial handshake
        this.sendMessage({ type: 'handshake' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          // Handle different message types
          if (data.type === 'notification' || data.notification) {
            const notification = data.notification || data;
            this.listeners.forEach(listener => listener(notification));
            
            // Show push notification
            this.showPushNotification(notification);
          } else if (data.type === 'pong') {
            // Heartbeat response
            console.log('💓 Heartbeat received');
          } else if (data.type === 'connection_established') {
            console.log('✅ WebSocket connection confirmed by server');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`);
        this.ws = null;
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
        
        // Don't reconnect if closed intentionally or if no token
        if (event.code !== 1000 && event.code !== 1001 && this.currentToken) {
          this.attemptReconnect();
        }
      };

      // Send heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: 'ping' });
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Store interval ID to clear on close
      (this.ws as any).heartbeatInterval = heartbeatInterval;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      this.attemptReconnect();
    }
  }

  private sendMessage(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Giving up.');
      this.notifyConnectionStatus(false);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.currentToken && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
        this.connectWebSocket(this.currentToken);
      }
    }, delay);
  }

  private async showPushNotification(notification: any) {
    if (!this.permissionGranted) {
      return;
    }

    const title = notification.title || 'New Notification';
    const options: NotificationOptions = {
      body: notification.message || notification.body || '',
      icon: notification.icon || '/logo192.png',
      badge: '/favicon.ico',
      silent: false,
      tag: `notification-${notification.id || Date.now()}`,
    };
    
    // Add vibrate if supported
    if ('vibrate' in navigator) {
      (options as any).vibrate = [200, 100, 200];
    }

    try {
      // Try to use service worker first
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          notification: { title, options, url: notification.url || '/' }
        });
      } else {
        // Fallback to regular notification
        const newNotification = new Notification(title, options);
        
        // Auto-close after 8 seconds
        setTimeout(() => newNotification.close(), 8000);
        
        // Handle notification click
        newNotification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          newNotification.close();
          
          // Navigate to notification URL if provided
          if (notification.url) {
            window.location.href = notification.url;
          }
        };
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Subscribe to notifications
  subscribe(callback: (notification: Notification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Subscribe to connection status changes
  onConnectionStatus(callback: (isConnected: boolean) => void): () => void {
    this.connectionStatusListeners.push(callback);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(cb => cb !== callback);
    };
  }

  private notifyConnectionStatus(isConnected: boolean): void {
    this.connectionStatusListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection status callback:', error);
      }
    });
  }

  // Fetch notifications from API
  async getNotifications(params?: { page?: number; limit?: number; unread_only?: boolean }): Promise<Notification[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.unread_only) queryParams.append('unread_only', 'true');
      
      const url = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count/');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/`, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/mark-all-read/');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}/`);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await api.post('/notifications/clear-all/');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      // Clear heartbeat interval
      if ((this.ws as any).heartbeatInterval) {
        clearInterval((this.ws as any).heartbeatInterval);
      }
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.currentToken = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.notifyConnectionStatus(false);
  }

  reconnect() {
    if (this.currentToken) {
      this.disconnect();
      this.reconnectAttempts = 0;
      setTimeout(() => {
        this.connectWebSocket(this.currentToken!);
      }, 1000);
    } else {
      console.warn('Cannot reconnect: No token available');
    }
  }
}

export const notificationService = new NotificationService();