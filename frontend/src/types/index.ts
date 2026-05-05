// src/types/index.ts - COMPLETE WITH UUID SUPPORT

// ========== USER TYPES ==========
export interface User {
  id: number;  // User uses integer ID (default Django)
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  profile_picture_url?: string | null;  // Cloudinary URL
  cover_photo: string | null;
  cover_photo_url?: string | null;  // Cloudinary URL
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
  listings_count?: number;
  created_at?: string;
}

// ========== PROPERTY TYPES ==========
export interface PropertyImage {
  id: string;  // UUID
  image: string;
  image_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  large_url?: string;
  is_main: boolean;
  order: number;
  created_at?: string;
}

export interface PropertyVideo {
  id: string;  // UUID
  video_file?: string;
  video_url?: string;
  video_url_display?: string;
  embed_url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  title: string;
  order: number;
  is_main: boolean;
  created_at: string;
}

export interface PropertyDocument {
  id: string;  // UUID
  document_type: 'title_deed' | 'survey_plan' | 'valuation_report' | 'tax_clearance' | 'other';
  document_type_display: string;
  file: string;
  file_url?: string;
  title: string;
  description: string;
  uploaded_at: string;
}

export interface PropertyReview {
  id: string;  // UUID
  user: User;
  user_name?: string;
  user_username?: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyInquiry {
  id: string;  // UUID
  property: string;  // UUID
  property_title: string;
  property_owner?: {
    id: string;
    username: string;
    email: string;
  };
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

// Property type definitions
export type PropertyType = 
  | 'house' | 'apartment' | 'condo' | 'villa' | 'townhouse' | 'duplex' 
  | 'triplex' | 'bungalow' | 'mansion' | 'studio' | 'penthouse' | 'loft'
  | 'farmhouse' | 'cottage' | 'cabin' | 'row_house'
  | 'office' | 'retail' | 'shop' | 'restaurant' | 'cafe' | 'hotel' | 'lodge'
  | 'warehouse' | 'factory' | 'showroom' | 'mall_space'
  | 'land' | 'agricultural_land' | 'commercial_land' | 'industrial_land'
  | 'residential_land' | 'mixed_use_land' | 'farm_land' | 'ranch' | 'plot'
  | 'school' | 'hospital' | 'church' | 'mosque' | 'temple'
  | 'community_center' | 'sports_facility' | 'parking_lot' | 'event_center'
  | 'industrial' | 'manufacturing' | 'storage' | 'cold_storage' | 'workshop'
  | 'mixed_use' | 'live_work';

export type TransactionType = 'sale' | 'rent' | 'shortlet' | 'lease' | 'auction' | 'foreclosure' | 'pre_construction' | 'exchange' | 'rent_to_own' | 'commercial_lease';

export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'fully_furnished' | 'luxury' | 'bare_shell' | 'white_box' | 'turnkey';

export type ParkingType = 'none' | 'street' | 'open' | 'covered' | 'garage' | 'multiple' | 'underground' | 'valet' | 'carport' | 'parking_lot' | 'parking_permit';

export type OwnershipType = 'freehold' | 'leasehold' | 'shared_ownership' | 'co_op' | 'timeshare' | 'land_lease' | 'government' | 'trust';

export type PropertyCondition = 'new' | 'excellent' | 'good' | 'needs_updating' | 'needs_renovation' | 'fixer_upper' | 'under_construction' | 'shell' | 'as_is' | 'repossessed' | 'heritage';

export type TenureType = 'freehold' | 'leasehold' | 'mailo' | 'customary' | 'kibanja' | 'permanent' | 'temporary';

export type BuildingType = 'detached' | 'semi_detached' | 'attached' | 'corner' | 'end_unit' | 'mid_rise' | 'high_rise' | 'low_rise';

export type FloorLevel = 'ground' | 'upper' | 'top' | 'basement' | 'mezzanine';

export type RentalFrequency = 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'weekly' | 'daily';

// Temporary image upload state
export interface UploadImage {
  file: File;
  preview: string;
  is_main: boolean;
}

export interface Property {
  id: string;  // UUID
  owner: User;
  title: string;
  description: string;
  video_url_display?: string;
  video_stream_url?: string;
  property_type: PropertyType;
  transaction_type: TransactionType;
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
  is_favorited?: boolean;
  created_at: string;
  expires_at?: string;
  
  // ========== Video Features ==========
  video_url?: string | null;
  video_file?: string | null;
  video_thumbnail?: string | null;
  virtual_tour_url?: string | null;
  has_video?: boolean;
  
  // ========== Ownership & Legal ==========
  ownership_type?: OwnershipType;
  property_condition?: PropertyCondition;
  tenure_type?: TenureType;
  building_type?: BuildingType;
  floor_level?: FloorLevel;
  rental_frequency?: RentalFrequency;
  
  // ========== Building Information ==========
  number_of_buildings?: number;
  number_of_floors?: number;
  floor_number?: number | null;
  total_floors?: number | null;
  elevator_available?: boolean;
  year_renovated?: number | null;
  
  // ========== Commercial Features ==========
  is_accessible?: boolean;
  has_reception?: boolean;
  has_meeting_rooms?: boolean;
  number_of_meeting_rooms?: number;
  has_kitchenette?: boolean;
  has_server_room?: boolean;
  has_pantry?: boolean;
  has_emergency_exits?: boolean;
  loading_dock?: boolean;
  signage_allowed?: boolean;
  
  // ========== Zoning Information ==========
  zoning_type?: string;
  permitted_uses?: string;
  
  // ========== Utility Details ==========
  water_source?: string;
  power_source?: string;
  has_gas?: boolean;
  sewage_system?: 'septic' | 'sewer' | 'cesspool' | 'none';
  
  // ========== Nearby Facilities (Expanded) ==========
  nearest_bank?: string;
  nearest_police_station?: string;
  nearest_fire_station?: string;
  nearest_daycare?: string;
  nearest_university?: string;
  
  // ========== Neighborhood Information ==========
  neighborhood_name?: string;
  neighborhood_description?: string;
  distance_to_city_center?: number | null;
  distance_to_airport?: number | null;
  distance_to_highway?: number | null;
  
  // ========== Schools & Education ==========
  nearby_schools?: string;
  nearby_schools_list?: string[];
  distance_to_nearest_school?: number | null;
  school_rating?: number | null;
  
  // ========== Transportation & Roads ==========
  nearby_roads?: string;
  nearby_roads_list?: string[];
  nearest_road?: string;
  public_transport?: boolean;
  nearest_bus_stop?: string;
  nearest_taxi_stage?: string;
  
  // ========== Shopping & Amenities ==========
  amenities?: string[];
  amenities_list?: string[];
  nearest_mall?: string;
  distance_to_mall?: number | null;
  nearest_supermarket?: string;
  nearest_market?: string;
  nearest_pharmacy?: string;
  nearest_hospital?: string;
  distance_to_hospital?: number | null;
  
  // ========== Entertainment & Lifestyle ==========
  nearest_restaurant?: string;
  nearest_cafe?: string;
  nearest_gym?: string;
  nearest_park?: string;
  
  // ========== Property Features ==========
  year_built?: number | null;
  furnishing_status?: FurnishingStatus;
  parking_type?: ParkingType;
  parking_spaces?: number;
  
  // ========== Security Features ==========
  has_security?: boolean;
  has_cctv?: boolean;
  has_electric_fence?: boolean;
  has_security_lights?: boolean;
  has_security_guards?: boolean;
  has_gated_community?: boolean;
  
  // ========== Utilities ==========
  has_solar?: boolean;
  has_backup_generator?: boolean;
  has_water_tank?: boolean;
  has_borehole?: boolean;
  has_internet?: boolean;
  has_cable_tv?: boolean;
  
  // ========== Outdoor Features ==========
  has_garden?: boolean;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_swimming_pool?: boolean;
  has_playground?: boolean;
  has_bbq_area?: boolean;
  
  // ========== Interior Features ==========
  has_air_conditioning?: boolean;
  has_heating?: boolean;
  has_fireplace?: boolean;
  has_modern_kitchen?: boolean;
  has_walk_in_closet?: boolean;
  has_study_room?: boolean;
  
  // ========== Restrictions ==========
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  events_allowed?: boolean;
  
  // ========== Energy Efficiency ==========
  energy_rating?: string;
  
  // ========== Legal & Documents ==========
  has_title_deed?: boolean;
  title_deed_number?: string;
  land_registration_number?: string;
  
  // ========== Contact & Viewing ==========
  agent_phone?: string;
  agent_email?: string;
  viewing_instructions?: string;
  
  // ========== Helper Properties ==========
  full_address?: string;
  average_rating?: number;
  reviews_count?: number;
  property_category?: 'residential' | 'commercial' | 'land' | 'special';
  is_residential?: boolean;
  is_commercial?: boolean;
  is_land?: boolean;
  hashid?: string;  // For URL-friendly IDs
}

// ========== BOOKING TYPES ==========
export interface Booking {
  id: string;  // UUID
  booking_reference?: string;
  user: number;
  property: string;
  property_detail?: Property;
  user_detail?: User;
  visit_date: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  status_display?: string;
  booking_fee: number;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  cancellation_reason?: string;
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_reference?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_upcoming?: boolean;
  is_past?: boolean;
  can_cancel?: boolean;
  days_until_visit?: number;
  visit_date_formatted?: string;
}

// ========== REVIEW TYPES ==========
export interface Review {
  id: string;  // UUID
  user: User;
  agent: User;
  property: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

// ========== FAVORITE TYPES ==========
export interface Favorite {
  id: string;  // UUID
  property: string;
  property_detail?: Property;
  user?: number;
  created_at: string;
}

// ========== PAYMENT TYPES ==========
export interface Payment {
  id: string;  // UUID
  reference: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// ========== SERVICE TYPES ==========
export interface Service {
  id: string;  // UUID
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
  image_url?: string;
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
  category?: string;
  is_active?: boolean;
  service_type?: string;
  bookings_count?: number;
  gallery_images?: Array<{ id: string; image: string; image_url?: string; order: number; is_main: boolean }>;
  provider_user?: number | null;
  avg_rating?: number;
}

export interface ServiceCategory {
  id: string;  // UUID
  name: string;
  icon: string;
  service_count: number;
  description?: string;
  image?: string | null;
  order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface ServiceBooking {
  id: string;  // UUID
  service: string;
  service_detail?: Service;
  user?: number;
  user_detail?: User;
  booking_date: string;
  address: string;
  special_instructions: string;
  status: string;
  status_display?: string;
  total_price: number;
  created_at: string;
  updated_at?: string;
  service_name?: string;
  service_image?: string;
}

export interface ServiceReview {
  id: string;  // UUID
  user: User;
  service: Service;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

// ========== CHATBOT TYPES ==========
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

// ========== BOOST PACKAGE TYPES ==========
export interface BoostPackage {
  id: number;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  price_formatted?: string;
  priority: number;
  is_active: boolean;
}

// ========== NOTIFICATION TYPES ==========
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

// ========== FILTER INTERFACES ==========
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
  owner?: string;  // UUID
  user?: string;   // UUID
  agent?: string;  // UUID
  
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
  ownership_type?: string;
  property_condition?: string;
  tenure_type?: string;
}

// ========== PAGINATION ==========
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ========== AUTH TYPES ==========
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  phone: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  is_agent?: boolean;
  is_service_provider?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// ========== STATUS/STORY TYPES ==========
export interface Status {
  id: string;  // UUID
  user: User;
  media: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  media_type: 'image' | 'video' | 'text';
  text_content: string | null;
  background_color: string;
  created_at: string;
  expires_at: string | null;
  views_count: number;
  has_viewed: boolean;
  is_active: boolean;
}

export interface GroupedStatus {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
    is_agent: boolean;
    is_service_provider: boolean;
  };
  statuses: Status[];
}

export interface Conversation {
  id: string;  // UUID
  other_participant: User;
  property?: Property;
  property_data?: Property;
  last_message: string;
  last_message_preview: string;
  last_message_time: string;
  unread_count: number;
  is_active: boolean;
}

export interface Message {
  id: string;  // UUID
  sender: number;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  attachment?: string;
  is_sender?: boolean;
  attachment_url?: string;
  attachment_type?: string;
  is_read: boolean;
  created_at: string;
  time_ago?: string;
}

export interface CreateConversationRequest {
  other_user_id: number;
  property_id?: string;  // UUID
  initial_message?: string;
}

// ========== COMPLAINT/DISPUTE TYPES ==========
export type ComplaintCategory = 
  | 'fraud' 
  | 'fake_listing' 
  | 'misrepresentation' 
  | 'agent_misconduct' 
  | 'service_issue' 
  | 'payment_dispute' 
  | 'privacy_violation' 
  | 'harassment' 
  | 'other';

export type ComplaintStatus = 
  | 'pending' 
  | 'investigating' 
  | 'resolved' 
  | 'dismissed' 
  | 'escalated';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Complaint {
  id: string;  // UUID
  complaint_number: string;
  category: ComplaintCategory;
  category_display: string;
  title: string;
  description: string;
  evidence: string[];  // Array of Cloudinary URLs
  priority: ComplaintPriority;
  priority_display: string;
  status: ComplaintStatus;
  status_display: string;
  admin_notes: string;
  admin_response: string;
  resolution_details: string;
  resolved_in_favor?: 'complainant' | 'defendant' | 'partial';
  compensation_amount?: number;
  
  // Parties
  complainant: number;
  complainant_data: User;
  defendant?: number;
  defendant_data?: User;
  property_obj?: string;  // UUID
  property_data?: Property;
  service_obj?: string;  // UUID
  service_data?: Service;
  
  // Messages & Documents
  messages?: ComplaintMessage[];
  documents?: ComplaintDocument[];
  resolutions?: ComplaintResolution[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  time_ago?: string;
  
  // Permissions
  can_be_cancelled?: boolean;
}

export interface ComplaintMessage {
  id: string;  // UUID
  sender: number;
  sender_name: string;
  sender_type: 'complainant' | 'defendant' | 'admin' | 'other';
  content: string;
  attachment?: string;
  is_admin_response: boolean;
  is_read: boolean;
  created_at: string;
  time_ago: string;
}

export interface ComplaintDocument {
  id: string;  // UUID
  title: string;
  file: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface ComplaintResolution {
  id: string;  // UUID
  action_taken: string;
  action_type: 'warning' | 'listing_removed' | 'agent_suspended' | 'agent_verified' | 'refund_issued' | 'compensation' | 'account_ban' | 'escalated';
  action_display: string;
  action_by: number;
  action_by_name: string;
  created_at: string;
}

export interface CreateComplaintRequest {
  defendant?: number;
  property_obj?: string;  // UUID
  service_obj?: string;   // UUID
  category: ComplaintCategory;
  title: string;
  description: string;
  evidence?: string[];
  priority?: ComplaintPriority;
}

// ========== DEAL ROOM TYPES ==========
export type DealStatus = 
  | 'negotiation' 
  | 'deposit' 
  | 'contract' 
  | 'inspection' 
  | 'closing' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export type DealMessageType = 'general' | 'offer' | 'document' | 'inspection' | 'closing' | 'urgent';

export type DocumentType = 
  | 'offer_letter' 
  | 'counter_offer' 
  | 'purchase_agreement' 
  | 'title_deed' 
  | 'survey_report' 
  | 'valuation_report' 
  | 'inspection_report' 
  | 'deposit_receipt' 
  | 'commission_agreement' 
  | 'closing_document' 
  | 'tax_document' 
  | 'other';

export interface DealRoom {
  id: string;  // UUID
  deal_number: string;
  property_obj: string;  // UUID
  property_data: Property;
  booking?: string;  // UUID
  
  // Participants
  buyer: number;
  buyer_data: User;
  seller: number;
  seller_data: User;
  agent?: number;
  agent_data?: User;
  
  // Financial
  agreed_price?: number;
  agreed_price_formatted?: string;
  original_listing_price?: number;
  price_reduction?: number;
  deposit_amount?: number;
  deposit_amount_formatted?: string;
  deposit_percentage?: number;
  deposit_paid: boolean;
  deposit_paid_at?: string;
  deposit_reference?: string;
  agent_commission?: number;
  commission_percentage: number;
  commission_paid: boolean;
  
  // Status
  status: DealStatus;
  status_display: string;
  status_color: string;
  current_step: number;
  progress_percentage: number;
  
  // Dates
  offer_date: string;
  acceptance_date?: string;
  closing_date?: string;
  possession_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Terms
  special_conditions: string;
  contingencies: string;
  
  // Collections
  messages?: DealMessage[];
  documents?: DealDocument[];
  milestones?: DealMilestone[];
  offers?: DealOffer[];
  activity_logs?: DealActivityLog[];
  
  // Stats
  unread_messages_count: number;
  pending_documents_count: number;
  user_role: 'buyer' | 'seller' | 'agent' | 'admin' | null;
  can_edit?: boolean;
}

export interface DealMessage {
  id: string;  // UUID
  sender: number;
  sender_name: string;
  sender_avatar?: string;
  is_sender: boolean;
  message_type: DealMessageType;
  content: string;
  attachment?: string;
  attachment_url?: string;
  attachment_name?: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
}

export interface DealDocument {
  id: string;  // UUID
  document_type: DocumentType;
  document_type_display: string;
  title: string;
  description: string;
  file: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: number;
  uploaded_by_name: string;
  requires_signature: boolean;
  signed_by_buyer: boolean;
  signed_by_seller: boolean;
  signed_by_agent: boolean;
  all_signed: boolean;
  can_sign: boolean;
  signed_at?: string;
  is_confidential: boolean;
  uploaded_at: string;
}

export interface DealMilestone {
  id: string;  // UUID
  title: string;
  description: string;
  due_date?: string;
  completed_date?: string;
  is_completed: boolean;
  completed_by?: number;
  completed_by_name?: string;
  order: number;
  status_badge: 'pending' | 'completed' | 'overdue';
}

export interface DealOffer {
  id: string;  // UUID
  made_by: number;
  made_by_name: string;
  amount: number;
  amount_formatted: string;
  terms: string;
  expiry_date?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  status_display: string;
  responded_at?: string;
  response_notes: string;
  created_at: string;
  time_ago: string;
}

export interface DealActivityLog {
  id: string;  // UUID
  user: number;
  user_name: string;
  activity_type: string;
  activity_display: string;
  description: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

export interface CreateDealRoomRequest {
  property_obj: string;  // UUID
  booking?: string;  // UUID
  buyer: number;
  seller: number;
  agent?: number;
  special_conditions?: string;
}

export interface UpdateDealRequest {
  agreed_price?: number;
  deposit_amount?: number;
  deposit_percentage?: number;
  deposit_paid?: boolean;
  deposit_reference?: string;
  agent_commission?: number;
  commission_percentage?: number;
  status?: DealStatus;
  closing_date?: string;
  possession_date?: string;
  special_conditions?: string;
  contingencies?: string;
}

export interface CreateOfferRequest {
  amount: number;
  terms?: string;
  expiry_date?: string;
}

export interface RespondToOfferRequest {
  offer_id: string;        // Required - UUID of the offer
  action: 'accept' | 'reject' | 'counter';  // Required
  counter_amount?: number;  // Required for 'counter' action
  counter_terms?: string;   // Optional for 'counter' action
}

// ========== KYC TYPES ==========
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'requires_update';
export type KYCDocumentType = 'national_id' | 'passport' | 'driving_license' | 'tin' | 'business_reg';

export interface KYCSubmission {
  id: string;  // UUID
  user: number;
  user_name: string;
  document_type: KYCDocumentType;
  document_number: string;
  front_image: string;
  front_image_url?: string;
  back_image?: string;
  back_image_url?: string;
  selfie?: string;
  selfie_url?: string;
  status: KYCStatus;
  admin_notes: string;
  rejection_reason: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
}

export interface CreateKYCRequest {
  document_type: KYCDocumentType;
  document_number: string;
  front_image: File;
  back_image?: File;
  selfie?: File;
}

// ========== STATS TYPES ==========
export interface ComplaintStats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  dismissed: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  recent_30_days: number;
}

export interface DealStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  disputed: number;
  total_value: number;
  monthly_breakdown: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}