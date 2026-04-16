// src/types/index.ts - COMPLETE UPGRADED VERSION

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  cover_photo: string | null;  
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
  is_following?: boolean;
}

export interface PropertyImage {
  id: number;
  image: string;
  is_main: boolean;
  order: number;
}

export interface PropertyVideo {
  id: number;
  video_file?: string;
  video_url?: string;
  thumbnail?: string;
  title: string;
  order: number;
  is_main: boolean;
  created_at: string;
}

export interface PropertyDocument {
  id: number;
  document_type: 'title_deed' | 'survey_plan' | 'valuation_report' | 'tax_clearance' | 'other';
  document_type_display: string;
  file: string;
  title: string;
  description: string;
  uploaded_at: string;
}

export interface PropertyReview {
  id: number;
  user: User;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyInquiry {
  id: number;
  property: number;
  property_title: string;
  user?: number;
  name: string;
  email: string;
  phone: string;
  inquiry_type: 'viewing' | 'price' | 'negotiation' | 'documents' | 'general';
  inquiry_type_display: string;
  message: string;
  preferred_date?: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
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
  property_type: 'house' | 'apartment' | 'land' | 'commercial' | 'condo' | 'villa' | 'townhouse' | 'duplex' | 'bungalow';
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
  is_boosted?: boolean;
  boosted_until?: string | null;
  boost_level?: string;
  boost_price_paid?: number;
  boost_payment_ref?: string;
  
  // Statistics
  views_count: number;
  likes_count: number;
  shares_count: number;
  images: PropertyImage[];
  videos?: PropertyVideo[];
  documents?: PropertyDocument[];
  reviews?: PropertyReview[];
  is_liked?: boolean;
  created_at: string;
  expires_at?: string;
  
  // ========== NEW: Video Features ==========
  video_url?: string | null;
  video_file?: string | null;
  video_thumbnail?: string | null;
  virtual_tour_url?: string | null;
  has_video?: boolean;
  
  // ========== NEW: Neighborhood Information ==========
  neighborhood_name?: string;
  neighborhood_description?: string;
  distance_to_city_center?: number | null;
  distance_to_airport?: number | null;
  distance_to_highway?: number | null;
  
  // ========== NEW: Schools & Education ==========
  nearby_schools?: string;
  nearby_schools_list?: string[];
  distance_to_nearest_school?: number | null;
  school_rating?: number | null;
  
  // ========== NEW: Transportation & Roads ==========
  nearby_roads?: string;
  nearby_roads_list?: string[];
  nearest_road?: string;
  public_transport?: boolean;
  nearest_bus_stop?: string;
  nearest_taxi_stage?: string;
  
  // ========== NEW: Shopping & Amenities ==========
  amenities?: string[];
  amenities_list?: string[];
  nearest_mall?: string;
  distance_to_mall?: number | null;
  nearest_supermarket?: string;
  nearest_market?: string;
  nearest_pharmacy?: string;
  nearest_hospital?: string;
  distance_to_hospital?: number | null;
  
  // ========== NEW: Entertainment & Lifestyle ==========
  nearest_restaurant?: string;
  nearest_cafe?: string;
  nearest_gym?: string;
  nearest_park?: string;
  
  // ========== NEW: Property Features ==========
  year_built?: number | null;
  furnishing_status?: 'unfurnished' | 'semi_furnished' | 'fully_furnished' | 'luxury';
  parking_type?: 'none' | 'street' | 'open' | 'covered' | 'garage' | 'multiple';
  parking_spaces?: number;
  
  // ========== NEW: Security Features ==========
  has_security?: boolean;
  has_cctv?: boolean;
  has_electric_fence?: boolean;
  has_security_lights?: boolean;
  has_security_guards?: boolean;
  has_gated_community?: boolean;
  
  // ========== NEW: Utilities ==========
  has_solar?: boolean;
  has_backup_generator?: boolean;
  has_water_tank?: boolean;
  has_borehole?: boolean;
  has_internet?: boolean;
  has_cable_tv?: boolean;
  
  // ========== NEW: Outdoor Features ==========
  has_garden?: boolean;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_swimming_pool?: boolean;
  has_playground?: boolean;
  has_bbq_area?: boolean;
  
  // ========== NEW: Interior Features ==========
  has_air_conditioning?: boolean;
  has_heating?: boolean;
  has_fireplace?: boolean;
  has_modern_kitchen?: boolean;
  has_walk_in_closet?: boolean;
  has_study_room?: boolean;
  
  // ========== NEW: Restrictions ==========
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  
  // ========== NEW: Energy Efficiency ==========
  energy_rating?: string;
  
  // ========== NEW: Legal & Documents ==========
  has_title_deed?: boolean;
  title_deed_number?: string;
  land_registration_number?: string;
  
  // ========== NEW: Contact & Viewing ==========
  agent_phone?: string;
  agent_email?: string;
  viewing_instructions?: string;
  
  // ========== NEW: Helper Properties ==========
  full_address?: string;
  average_rating?: number;
  reviews_count?: number;
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
  category?: number | { id: number; name: string };
  is_active?: boolean;
  service_type?: string;
  bookings_count?: number;
  gallery_images?: Array<{ id: number; image: string; order: number; is_main: boolean }>;
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
  properties?: Property[];
  isTyping?: boolean;
  quickReplies?: string[];
  agent_used?: string;
  confidence?: number;
  collaboration_note?: string;
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

// Filter interfaces
export interface PropertyFilters {
  search?: string;
  property_type?: string;
  transaction_type?: string;
  bedrooms?: string;
  bathrooms?: string;
  min_price?: number;
  max_price?: number;
  city?: string;
  district?: string;
  location?: string;
  ordering?: string;
  page?: number;
  is_boosted?: string | boolean;
  is_verified?: boolean;
  owner?: number;
  user?: number;
  agent?: number;
  
  // New filters for upgraded features
  min_bedrooms?: number;
  min_bathrooms?: number;
  has_video?: boolean;
  has_pool?: boolean;
  has_security?: boolean;
  has_parking?: boolean;
  furnished?: boolean;
  furnishing_status?: string;
  min_school_rating?: number;
  max_distance_to_city?: number;
  neighborhood?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}