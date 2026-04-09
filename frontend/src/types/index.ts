// types/index.ts

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  is_agent: boolean;
  is_service_provider: boolean;
  is_verified: boolean;
  bio: string;
  location: string;
  district: string;
  city: string;
  followers_count: number;
  following_count: number;
  full_name?: string;
}

export interface PropertyImage {
  id: number;
  image: string;
  is_main: boolean;
  order: number;
}

// Temporary image upload state
export interface UploadImage {
  file: File;
  preview: string;
  is_main: boolean;
}

export interface Property {
  id: number;
  owner: User;
  title: string;
  description: string;
  property_type: 'house' | 'apartment' | 'land' | 'commercial' | 'condo';
  transaction_type: 'sale' | 'rent' | 'shortlet';
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  district: string;
  is_available: boolean;
  is_verified: boolean;
  // Boost related properties
  is_boosted?: boolean;           // Indicates if property is currently boosted
  boosted_until?: string | null;  // When the boost expires (ISO date string)
  boost_level?: string;           // Boost package level (standard, premium, vip)
  boost_price_paid?: number;      // Amount paid for the boost
  boost_payment_ref?: string;     // Payment reference for the boost transaction
  // Statistics
  views_count: number;
  likes_count: number;
  shares_count: number;
  images: PropertyImage[];
  is_liked?: boolean;
  created_at: string;
  expires_at?: string;            // When the property listing expires
}

export interface Booking {
  id: number;
  user: User;
  property: Property;
  visit_date: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_fee: number;
  created_at: string;
}

export interface Review {
  id: number;
  user: User;
  agent: User;
  property: Property | null;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Favorite {
  id: number;
  property: Property;
  created_at: string;
}

export interface Payment {
  id: number;
  reference: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

// Service related interfaces
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
  gallery: string[];
  duration: string;
  provider: string;
  provider_phone: string;
  provider_email: string;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  category_name: string;
  category_icon: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  service_count: number;
}

export interface ServiceBooking {
  id: number;
  service: Service;
  booking_date: string;
  address: string;
  special_instructions: string;
  status: string;
  total_price: number;
  created_at: string;
}

export interface ServiceReview {
  id: number;
  user: User;
  service: Service;
  rating: number;
  comment: string;
  created_at: string;
}

// Chatbot related interfaces
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  property?: Property;
  isTyping?: boolean;
  quickReplies?: string[];
}

// Boost Package interface
export interface BoostPackage {
  id: number;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  priority: number;
  is_active: boolean;
}

// Notification interface
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'promotion';
  read: boolean;
  created_at: string;
  data?: any;
  url?: string;
}