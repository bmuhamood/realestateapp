  import axios from 'axios';
  import {
    // Chat Types
    Conversation,
    Message,
    CreateConversationRequest,
    // Complaint Types
    Complaint,
    ComplaintMessage,
    ComplaintStats,
    CreateComplaintRequest,
    // Deal Room Types
    DealRoom,
    DealMessage,
    DealDocument,
    DealOffer,
    DealMilestone,
    DealActivityLog,
    DealStats,
    CreateDealRoomRequest,
    UpdateDealRequest,
    CreateOfferRequest,
    RespondToOfferRequest,
    // KYC Types
    KYCSubmission,
    KYCStatus,
    // Common Types
    PaginatedResponse,
  } from '../types';

  // ─── Base URL ─────────────────────────────────────────────────────────────────
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || 'https://realestateapp-sc4i.onrender.com/api';

  // ─── Axios Instance ───────────────────────────────────────────────────────────
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // ─── Request Interceptor — attach JWT ────────────────────────────────────────
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ─── Response Interceptor — auto-refresh on 401 ───────────────────────────────
  let isRefreshing = false;
  let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((p) => {
      if (error) {
        p.reject(error);
      } else {
        p.resolve(token);
      }
    });
    failedQueue = [];
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          isRefreshing = false;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const newAccessToken = data.access;
          localStorage.setItem('access_token', newAccessToken);

          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }

          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // API SERVICES
  // ──────────────────────────────────────────────────────────────────────────────

  // ========== CHAT API ==========
  export const chatAPI = {
    getConversations: () =>
      api.get<PaginatedResponse<Conversation>>('/chat/conversations/'),

    createConversation: (data: CreateConversationRequest) =>
      api.post<Conversation>('/chat/conversations/create/', data),

    getMessages: (conversationId: string) =>
      api.get<Message[] | PaginatedResponse<Message>>(`/chat/conversations/${conversationId}/messages/`),

    // ✅ FIXED: Use JSON for text messages, FormData only for attachments
    sendMessage: (conversationId: string, content: string, attachment?: File) => {
      // For text-only messages, use JSON (not FormData)
      if (!attachment) {
        return api.post<Message>(`/chat/conversations/${conversationId}/messages/`, {
          content: content
        });
      }
      // For messages with attachment, use FormData
      const formData = new FormData();
      formData.append('content', content);
      if (attachment) formData.append('attachment', attachment);
      return api.post<Message>(
        `/chat/conversations/${conversationId}/messages/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
    },

    markMessagesRead: (conversationId: string) =>
      api.post(`/chat/conversations/${conversationId}/mark-read/`),

    getUnreadCount: () =>
      api.get<{ unread_count: number }>('/chat/unread-count/'),
  };

  // ========== COMPLAINT API ==========
  export const complaintAPI = {
    getComplaints: (params?: { status?: string; category?: string }) =>
      api.get<PaginatedResponse<Complaint>>('/complaints/', { params }),

    getMyComplaints: () =>
      api.get<Complaint[]>('/complaints/my-complaints/'),

    getComplaintsAgainstMe: () =>
      api.get<Complaint[]>('/complaints/against-me/'),

    createComplaint: (data: CreateComplaintRequest) =>
      api.post<Complaint>('/complaints/', data),

    getComplaint: (id: string) =>
      api.get<Complaint>(`/complaints/${id}/`),

    addMessage: (complaintId: string, content: string, attachment?: File) => {
      const formData = new FormData();
      formData.append('content', content);
      if (attachment) formData.append('attachment', attachment);
      return api.post<ComplaintMessage>(
        `/complaints/${complaintId}/messages/`,
        formData
      );
    },

    getStats: () =>
      api.get<ComplaintStats>('/complaints/stats/'),
  };

  // ========== DEAL ROOM API ==========
  export const dealAPI = {
    getDeals: (params?: { status?: string }) =>
      api.get<PaginatedResponse<DealRoom>>('/dealroom/', { params }),

    getDeal: (id: string) =>
      api.get<DealRoom>(`/dealroom/${id}/`),

    createDeal: (data: CreateDealRoomRequest) =>
      api.post<DealRoom>('/dealroom/', data),

    updateDeal: (id: string, data: UpdateDealRequest) =>
      api.patch<DealRoom>(`/dealroom/${id}/`, data),

    // Messages
    getMessages: (dealId: string) =>
      api.get<DealMessage[]>(`/dealroom/${dealId}/messages/`),

    sendMessage: (
      dealId: string,
      content: string,
      messageType?: string,
      attachment?: File
    ) => {
      const formData = new FormData();
      formData.append('content', content);
      if (messageType) formData.append('message_type', messageType);
      if (attachment) formData.append('attachment', attachment);
      return api.post<DealMessage>(`/dealroom/${dealId}/messages/`, formData);
    },

    markMessagesRead: (dealId: string) =>
      api.post(`/dealroom/${dealId}/messages/read/`),

    // Documents
    getDocuments: (dealId: string) =>
      api.get<DealDocument[]>(`/dealroom/${dealId}/documents/`),

    uploadDocument: (dealId: string, data: FormData) =>
      api.post<DealDocument>(`/dealroom/${dealId}/documents/`, data),

    signDocument: (dealId: string, documentId: string) =>
      api.post<DealDocument>(
        `/dealroom/${dealId}/documents/${documentId}/sign/`
      ),

    // Offers
    getOffers: (dealId: string) =>
      api.get<DealOffer[]>(`/dealroom/${dealId}/offers/`),

    makeOffer: (dealId: string, data: CreateOfferRequest) =>
      api.post<DealOffer>(`/dealroom/${dealId}/offers/`, data),

    respondToOffer: (dealId: string, data: RespondToOfferRequest) =>
      api.post(`/dealroom/${dealId}/offers/respond/`, data),

    // Milestones
    getMilestones: (dealId: string) =>
      api.get<DealMilestone[]>(`/dealroom/${dealId}/milestones/`),

    completeMilestone: (dealId: string, milestoneId: string) =>
      api.post(`/dealroom/${dealId}/milestones/${milestoneId}/complete/`),

    // Activity
    getActivityLog: (dealId: string) =>
      api.get<DealActivityLog[]>(`/dealroom/${dealId}/activity/`),

    // Stats
    getStats: () =>
      api.get<DealStats>('/dealroom/stats/'),
  };

  // ========== KYC API ==========
  export const kycAPI = {
    getSubmissions: () =>
      api.get<KYCSubmission[]>('/kyc/'),

    submitKYC: (data: FormData) =>
      api.post<KYCSubmission>('/kyc/', data),

    getStatus: () =>
      api.get<{ status: KYCStatus; rejection_reason?: string; admin_notes?: string }>('/kyc/status/'),
  };

  export default api;