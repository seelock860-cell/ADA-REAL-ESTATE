import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  ListingType,
  Property,
  PropertyAvailability,
  PropertyCategory,
  PropertyImage,
  PropertyVideo,
  Testimonial,
} from '../types/database';
import { DEFAULT_CATEGORIES } from '../constants/business';
import { slugify } from '../lib/formatters';

function sortPropertyMedia(property: Property): Property {
  const images = [...(property.property_images || [])].sort((a, b) => {
    if (a.is_main !== b.is_main) return a.is_main ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  const videos = [...(property.property_videos || [])];
  return {
    ...property,
    features: Array.isArray(property.features) ? property.features : [],
    property_images: images,
    property_videos: videos,
  };
}

export async function fetchPublishedProperties(client: SupabaseClient): Promise<Property[]> {
  const { data, error } = await client
    .from('properties')
    .select('*, property_images(*), property_videos(*)')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as Property[]).map(sortPropertyMedia);
}

export async function fetchAllPropertiesAdmin(client: SupabaseClient): Promise<Property[]> {
  const { data, error } = await client
    .from('properties')
    .select('*, property_images(*), property_videos(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as Property[]).map(sortPropertyMedia);
}

export async function fetchPropertyById(
  client: SupabaseClient,
  id: string
): Promise<Property | null> {
  const { data, error } = await client
    .from('properties')
    .select('*, property_images(*), property_videos(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return sortPropertyMedia(data as Property);
}

export interface UpsertPropertyInput {
  id?: string;
  title: string;
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
}

export async function upsertProperty(
  client: SupabaseClient,
  input: UpsertPropertyInput,
  userId?: string
): Promise<Property> {
  const baseSlug = slugify(input.title) || 'property';
  const uniqueSuffix = Date.now().toString(36).slice(-5);

  const payload = {
    title: input.title.trim(),
    category: input.category,
    listing_type: input.listing_type,
    description: input.description.trim(),
    location: input.location.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    price: Number(input.price) || 0,
    house_rent: input.house_rent ?? null,
    caution_fee: input.caution_fee ?? null,
    agency_fee: input.agency_fee ?? null,
    legal_fee: input.legal_fee ?? null,
    service_charge: input.service_charge ?? null,
    other_charges: input.other_charges ?? null,
    total_initial_payment: input.total_initial_payment ?? null,
    bedrooms: Number(input.bedrooms) || 0,
    bathrooms: Number(input.bathrooms) || 0,
    toilets: Number(input.toilets) || 0,
    parking_spaces: Number(input.parking_spaces) || 0,
    features: input.features,
    availability: input.availability,
    is_published: input.is_published,
    is_featured: input.is_featured,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await client
      .from('properties')
      .update(payload)
      .eq('id', input.id)
      .select('*, property_images(*), property_videos(*)')
      .single();

    if (error) throw error;
    return sortPropertyMedia(data as Property);
  }

  const { data, error } = await client
    .from('properties')
    .insert({
      ...payload,
      slug: `${baseSlug}-${uniqueSuffix}`,
      created_by: userId ?? null,
    })
    .select('*, property_images(*), property_videos(*)')
    .single();

  if (error) throw error;
  return sortPropertyMedia(data as Property);
}

export async function updatePropertyAvailability(
  client: SupabaseClient,
  propertyId: string,
  availability: PropertyAvailability
): Promise<void> {
  const { error } = await client
    .from('properties')
    .update({ availability, updated_at: new Date().toISOString() })
    .eq('id', propertyId);

  if (error) throw error;
}

export async function deletePropertyWithMedia(
  client: SupabaseClient,
  property: Property
): Promise<void> {
  const imagePaths = (property.property_images || []).map((img) => img.storage_path).filter(Boolean);
  const videoPaths = (property.property_videos || []).map((vid) => vid.storage_path).filter(Boolean);

  if (imagePaths.length > 0) {
    await client.storage.from('property-images').remove(imagePaths);
  }
  if (videoPaths.length > 0) {
    await client.storage.from('property-videos').remove(videoPaths);
  }

  const { error } = await client.from('properties').delete().eq('id', property.id);
  if (error) throw error;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadPropertyImages(
  client: SupabaseClient,
  propertyId: string,
  files: File[],
  existingCount: number,
  hasMainAlready: boolean
): Promise<PropertyImage[]> {
  const uploaded: PropertyImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = `${propertyId}/${Date.now()}-${i}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await client.storage
      .from('property-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = client.storage.from('property-images').getPublicUrl(path);
    const isMain = !hasMainAlready && i === 0;

    const { data: row, error: dbError } = await client
      .from('property_images')
      .insert({
        property_id: propertyId,
        storage_path: path,
        public_url: urlData.publicUrl,
        is_main: isMain,
        sort_order: existingCount + i,
      })
      .select('*')
      .single();

    if (dbError) throw dbError;
    uploaded.push(row as PropertyImage);
  }

  return uploaded;
}

export async function setMainPropertyImage(
  client: SupabaseClient,
  propertyId: string,
  imageId: string
): Promise<void> {
  const { error: resetError } = await client
    .from('property_images')
    .update({ is_main: false })
    .eq('property_id', propertyId);

  if (resetError) throw resetError;

  const { error: setError } = await client
    .from('property_images')
    .update({ is_main: true })
    .eq('id', imageId);

  if (setError) throw setError;
}

export async function replacePropertyImage(
  client: SupabaseClient,
  existingImage: PropertyImage,
  newFile: File
): Promise<PropertyImage> {
  const newPath = `${existingImage.property_id}/${Date.now()}-${sanitizeFileName(newFile.name)}`;

  const { error: uploadError } = await client.storage
    .from('property-images')
    .upload(newPath, newFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = client.storage.from('property-images').getPublicUrl(newPath);

  const { data: updated, error: dbError } = await client
    .from('property_images')
    .update({
      storage_path: newPath,
      public_url: urlData.publicUrl,
    })
    .eq('id', existingImage.id)
    .select('*')
    .single();

  if (dbError) throw dbError;

  if (existingImage.storage_path) {
    await client.storage.from('property-images').remove([existingImage.storage_path]);
  }

  return updated as PropertyImage;
}

export async function deletePropertyImage(
  client: SupabaseClient,
  image: PropertyImage
): Promise<void> {
  if (image.storage_path) {
    await client.storage.from('property-images').remove([image.storage_path]);
  }
  const { error } = await client.from('property_images').delete().eq('id', image.id);
  if (error) throw error;
}

export async function uploadPropertyVideo(
  client: SupabaseClient,
  propertyId: string,
  file: File,
  title?: string
): Promise<PropertyVideo> {
  const path = `${propertyId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await client.storage
    .from('property-videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = client.storage.from('property-videos').getPublicUrl(path);

  const { data: row, error: dbError } = await client
    .from('property_videos')
    .insert({
      property_id: propertyId,
      storage_path: path,
      public_url: urlData.publicUrl,
      title: title || file.name,
    })
    .select('*')
    .single();

  if (dbError) throw dbError;
  return row as PropertyVideo;
}

export async function replacePropertyVideo(
  client: SupabaseClient,
  existingVideo: PropertyVideo,
  newFile: File
): Promise<PropertyVideo> {
  const newPath = `${existingVideo.property_id}/${Date.now()}-${sanitizeFileName(newFile.name)}`;

  const { error: uploadError } = await client.storage
    .from('property-videos')
    .upload(newPath, newFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = client.storage.from('property-videos').getPublicUrl(newPath);

  const { data: updated, error: dbError } = await client
    .from('property_videos')
    .update({
      storage_path: newPath,
      public_url: urlData.publicUrl,
      title: newFile.name,
    })
    .eq('id', existingVideo.id)
    .select('*')
    .single();

  if (dbError) throw dbError;

  if (existingVideo.storage_path) {
    await client.storage.from('property-videos').remove([existingVideo.storage_path]);
  }

  return updated as PropertyVideo;
}

export async function deletePropertyVideo(
  client: SupabaseClient,
  video: PropertyVideo
): Promise<void> {
  if (video.storage_path) {
    await client.storage.from('property-videos').remove([video.storage_path]);
  }
  const { error } = await client.from('property_videos').delete().eq('id', video.id);
  if (error) throw error;
}

export interface SubmitEnquiryInput {
  customer_name: string;
  phone_number: string;
  email?: string;
  property_id?: string | null;
  property_title?: string | null;
  enquiry_type: EnquiryType;
  message: string;
}

export async function submitEnquiry(
  client: SupabaseClient,
  input: SubmitEnquiryInput
): Promise<void> {
  const { error } = await client.from('enquiries').insert({
    customer_name: input.customer_name.trim(),
    phone_number: input.phone_number.trim(),
    email: input.email?.trim() || null,
    property_id: input.property_id || null,
    property_title: input.property_title || null,
    enquiry_type: input.enquiry_type,
    message: input.message.trim(),
    status: 'New',
  });
  if (error) throw error;
}

export async function fetchEnquiries(client: SupabaseClient): Promise<Enquiry[]> {
  const { data, error } = await client
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Enquiry[];
}

export async function updateEnquiryStatus(
  client: SupabaseClient,
  id: string,
  status: EnquiryStatus
): Promise<void> {
  const { error } = await client.from('enquiries').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteEnquiry(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('enquiries').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPublishedTestimonials(client: SupabaseClient): Promise<Testimonial[]> {
  const { data, error } = await client
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Testimonial[];
}

export async function fetchAllTestimonialsAdmin(client: SupabaseClient): Promise<Testimonial[]> {
  const { data, error } = await client
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Testimonial[];
}

export async function saveTestimonial(
  client: SupabaseClient,
  input: {
    id?: string;
    client_name: string;
    client_role: string;
    location: string;
    quote: string;
    is_published: boolean;
  }
): Promise<Testimonial> {
  if (input.id) {
    const { data, error } = await client
      .from('testimonials')
      .update({
        client_name: input.client_name.trim(),
        client_role: input.client_role.trim(),
        location: input.location.trim(),
        quote: input.quote.trim(),
        is_published: input.is_published,
      })
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Testimonial;
  }

  const { data, error } = await client
    .from('testimonials')
    .insert({
      client_name: input.client_name.trim(),
      client_role: input.client_role.trim(),
      location: input.location.trim(),
      quote: input.quote.trim(),
      is_published: input.is_published,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Testimonial;
}

export async function deleteTestimonial(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCategories(client: SupabaseClient | null): Promise<PropertyCategory[]> {
  if (!client) {
    return DEFAULT_CATEGORIES.map((name, idx) => ({
      id: slugify(name),
      name,
      slug: slugify(name),
      sort_order: idx + 1,
      is_active: true,
      created_at: '',
    }));
  }

  const { data, error } = await client
    .from('property_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error || !data || data.length === 0) {
    return DEFAULT_CATEGORIES.map((name, idx) => ({
      id: slugify(name),
      name,
      slug: slugify(name),
      sort_order: idx + 1,
      is_active: true,
      created_at: '',
    }));
  }

  return data as PropertyCategory[];
}

export async function createCategory(
  client: SupabaseClient,
  name: string,
  sortOrder: number
): Promise<PropertyCategory> {
  const { data, error } = await client
    .from('property_categories')
    .insert({
      name: name.trim(),
      slug: slugify(name),
      sort_order: sortOrder,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as PropertyCategory;
}

export async function toggleCategoryActive(
  client: SupabaseClient,
  id: string,
  isActive: boolean
): Promise<void> {
  const { error } = await client
    .from('property_categories')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('property_categories').delete().eq('id', id);
  if (error) throw error;
}
