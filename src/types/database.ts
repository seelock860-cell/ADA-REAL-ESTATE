export type PropertyAvailability = 'Available' | 'Sold' | 'Rented';
export type ListingType = 'sale' | 'rent';
export type EnquiryType = 'General Enquiry' | 'Inspection Request' | 'Agent Contact';
export type EnquiryStatus = 'New' | 'Contacted' | 'Scheduled' | 'Closed';

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  public_url: string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
}

export interface PropertyVideo {
  id: string;
  property_id: string;
  storage_path: string;
  public_url: string;
  title?: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  slug?: string | null;
  category: string;
  listing_type: ListingType;
  description: string;
  location: string;
  city: string;
  address: string;
  price: number;
  house_rent?: number | null;
  caution_fee?: number | null;
  agency_fee?: number | null;
  legal_fee?: number | null;
  service_charge?: number | null;
  other_charges?: number | null;
  total_initial_payment?: number | null;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  parking_spaces: number;
  features: string[];
  availability: PropertyAvailability;
  is_published: boolean;
  is_featured: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  property_images?: PropertyImage[];
  property_videos?: PropertyVideo[];
}

export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Enquiry {
  id: string;
  customer_name: string;
  phone_number: string;
  email?: string | null;
  property_id?: string | null;
  property_title?: string | null;
  enquiry_type: EnquiryType;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_role: string;
  location: string;
  quote: string;
  is_published: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  role: 'admin' | 'viewer';
  created_at: string;
}

export type SupabaseConnectionStatus = 'Connected' | 'Not Connected' | 'Connection Error';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}
