import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Upload,
  Trash2,
  Star,
  RefreshCw,
  Loader2,
  ImagePlus,
  Film,
  Plus,
} from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';
import type {
  ListingType,
  Property,
  PropertyAvailability,
  PropertyCategory,
  PropertyImage,
  PropertyVideo,
} from '../../types/database';
import {
  deletePropertyImage,
  deletePropertyVideo,
  replacePropertyImage,
  replacePropertyVideo,
  setMainPropertyImage,
  uploadPropertyImages,
  uploadPropertyVideo,
  upsertProperty,
} from '../../services/realEstateService';
import { DEFAULT_CATEGORIES } from '../../constants/business';
import { formatNaira } from '../../lib/formatters';

interface PropertyFormModalProps {
  property: Property | null;
  categories: PropertyCategory[];
  onClose: () => void;
  onSaved: () => void;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  isMain: boolean;
}

export function PropertyFormModal({
  property,
  categories,
  onClose,
  onSaved,
}: PropertyFormModalProps) {
  const { supabase, user, showToast } = useSupabase();

  const categoryOptions =
    categories.length > 0 ? categories.map((c) => c.name) : [...DEFAULT_CATEGORIES];

  // Core Form State (All 19 required fields)
  const [title, setTitle] = useState(property?.title || '');
  const [category, setCategory] = useState(property?.category || categoryOptions[0]);
  const [listingType, setListingType] = useState<ListingType>(property?.listing_type || 'sale');
  const [description, setDescription] = useState(property?.description || '');
  const [location, setLocation] = useState(property?.location || '');
  const [city, setCity] = useState(property?.city || 'Port Harcourt');
  const [address, setAddress] = useState(property?.address || '');
  const [price, setPrice] = useState(property?.price ? String(property.price) : '');

  // Financial Details
  const [houseRent, setHouseRent] = useState(
    property?.house_rent !== null && property?.house_rent !== undefined
      ? String(property.house_rent)
      : ''
  );
  const [cautionFee, setCautionFee] = useState(
    property?.caution_fee !== null && property?.caution_fee !== undefined
      ? String(property.caution_fee)
      : ''
  );
  const [agencyFee, setAgencyFee] = useState(
    property?.agency_fee !== null && property?.agency_fee !== undefined
      ? String(property.agency_fee)
      : ''
  );
  const [legalFee, setLegalFee] = useState(
    property?.legal_fee !== null && property?.legal_fee !== undefined
      ? String(property.legal_fee)
      : ''
  );
  const [serviceCharge, setServiceCharge] = useState(
    property?.service_charge !== null && property?.service_charge !== undefined
      ? String(property.service_charge)
      : ''
  );
  const [otherCharges, setOtherCharges] = useState(
    property?.other_charges !== null && property?.other_charges !== undefined
      ? String(property.other_charges)
      : ''
  );

  // Specifications
  const [bedrooms, setBedrooms] = useState(String(property?.bedrooms ?? 0));
  const [bathrooms, setBathrooms] = useState(String(property?.bathrooms ?? 0));
  const [toilets, setToilets] = useState(String(property?.toilets ?? 0));
  const [parkingSpaces, setParkingSpaces] = useState(String(property?.parking_spaces ?? 0));
  const [availability, setAvailability] = useState<PropertyAvailability>(
    property?.availability || 'Available'
  );
  const [isPublished, setIsPublished] = useState(property?.is_published ?? true);
  const [isFeatured, setIsFeatured] = useState(property?.is_featured ?? false);

  // Features tag builder
  const [features, setFeatures] = useState<string[]>(property?.features || []);
  const [newFeature, setNewFeature] = useState('');

  // Existing & Pending Media
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(
    property?.property_images || []
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [existingVideos, setExistingVideos] = useState<PropertyVideo[]>(
    property?.property_videos || []
  );
  const [pendingVideo, setPendingVideo] = useState<{ file: File; previewUrl: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [mediaActionLoading, setMediaActionLoading] = useState<string | null>(null);

  const replaceImageInputRef = useRef<HTMLInputElement | null>(null);
  const imageTargetForReplaceRef = useRef<PropertyImage | null>(null);
  const replaceVideoInputRef = useRef<HTMLInputElement | null>(null);
  const videoTargetForReplaceRef = useRef<PropertyVideo | null>(null);

  // Auto-calculate Total Initial Payment
  const calculatedTotalInitialPayment = useMemo(() => {
    const nums = [houseRent, cautionFee, agencyFee, legalFee, serviceCharge, otherCharges];
    return nums.reduce((sum, val) => {
      const parsed = Number(val);
      return sum + (val.trim() !== '' && !Number.isNaN(parsed) ? parsed : 0);
    }, 0);
  }, [houseRent, cautionFee, agencyFee, legalFee, serviceCharge, otherCharges]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl);
    };
  }, []);

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    if (!features.includes(trimmed)) {
      setFeatures((prev) => [...prev, trimmed]);
    }
    setNewFeature('');
  };

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const hasAnyMain =
      existingImages.some((img) => img.is_main) || pendingImages.some((img) => img.isMain);

    const added: PendingImage[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isMain: !hasAnyMain && index === 0,
    }));

    setPendingImages((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleSetPendingMain = (pendingId: string) => {
    setExistingImages((prev) => prev.map((img) => ({ ...img, is_main: false })));
    setPendingImages((prev) =>
      prev.map((img) => ({ ...img, isMain: img.id === pendingId }))
    );
  };

  const handleRemovePendingImage = (pendingId: string) => {
    setPendingImages((prev) => {
      const target = prev.find((i) => i.id === pendingId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const filtered = prev.filter((i) => i.id !== pendingId);
      if (target?.isMain && filtered.length > 0 && !existingImages.some((i) => i.is_main)) {
        filtered[0] = { ...filtered[0], isMain: true };
      }
      return filtered;
    });
  };

  const handleSetExistingMain = async (img: PropertyImage) => {
    if (!supabase || !property) return;
    setMediaActionLoading(img.id);
    try {
      await setMainPropertyImage(supabase, property.id, img.id);
      setExistingImages((prev) => prev.map((item) => ({ ...item, is_main: item.id === img.id })));
      setPendingImages((prev) => prev.map((item) => ({ ...item, isMain: false })));
      showToast('success', 'Main Image Updated', 'Primary property photograph has been updated.');
    } catch (err) {
      showToast('error', 'Update Failed', err instanceof Error ? err.message : 'Error updating image.');
    } finally {
      setMediaActionLoading(null);
    }
  };

  const handleDeleteExistingImage = async (img: PropertyImage) => {
    if (!supabase) return;
    setMediaActionLoading(img.id);
    try {
      await deletePropertyImage(supabase, img);
      setExistingImages((prev) => prev.filter((item) => item.id !== img.id));
      showToast('success', 'Image Deleted', 'Photograph removed from Supabase Storage.');
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete image.');
    } finally {
      setMediaActionLoading(null);
    }
  };

  const handleReplaceExistingImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = imageTargetForReplaceRef.current;
    e.target.value = '';
    if (!file || !target || !supabase) return;

    setMediaActionLoading(target.id);
    try {
      const updated = await replacePropertyImage(supabase, target, file);
      setExistingImages((prev) => prev.map((img) => (img.id === target.id ? updated : img)));
      showToast('success', 'Image Replaced', 'Photograph updated in Supabase Storage.');
    } catch (err) {
      showToast('error', 'Replace Failed', err instanceof Error ? err.message : 'Could not replace image.');
    } finally {
      setMediaActionLoading(null);
      imageTargetForReplaceRef.current = null;
    }
  };

  const handleSelectVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl);
    setPendingVideo({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleReplaceExistingVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = videoTargetForReplaceRef.current;
    e.target.value = '';
    if (!file || !target || !supabase) return;

    setMediaActionLoading(target.id);
    try {
      const updated = await replacePropertyVideo(supabase, target, file);
      setExistingVideos((prev) => prev.map((v) => (v.id === target.id ? updated : v)));
      showToast('success', 'Video Replaced', 'Property video updated in Supabase Storage.');
    } catch (err) {
      showToast('error', 'Video Replace Failed', err instanceof Error ? err.message : 'Could not replace video.');
    } finally {
      setMediaActionLoading(null);
      videoTargetForReplaceRef.current = null;
    }
  };

  const handleDeleteExistingVideo = async (vid: PropertyVideo) => {
    if (!supabase) return;
    setMediaActionLoading(vid.id);
    try {
      await deletePropertyVideo(supabase, vid);
      setExistingVideos((prev) => prev.filter((v) => v.id !== vid.id));
      showToast('success', 'Video Deleted', 'Property video removed from Supabase Storage.');
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete video.');
    } finally {
      setMediaActionLoading(null);
    }
  };

  const toNullableNumber = (val: string): number | null => {
    if (val.trim() === '') return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      showToast('error', 'Not Connected', 'Please connect Supabase before publishing.');
      return;
    }

    setSaving(true);
    try {
      const savedProp = await upsertProperty(
        supabase,
        {
          id: property?.id,
          title,
          category,
          listing_type: listingType,
          description,
          location,
          city,
          address,
          price: Number(price) || 0,
          house_rent: toNullableNumber(houseRent),
          caution_fee: toNullableNumber(cautionFee),
          agency_fee: toNullableNumber(agencyFee),
          legal_fee: toNullableNumber(legalFee),
          service_charge: toNullableNumber(serviceCharge),
          other_charges: toNullableNumber(otherCharges),
          total_initial_payment:
            calculatedTotalInitialPayment > 0 ? calculatedTotalInitialPayment : null,
          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 0,
          toilets: Number(toilets) || 0,
          parking_spaces: Number(parkingSpaces) || 0,
          features,
          availability,
          is_published: isPublished,
          is_featured: isFeatured,
        },
        user?.id
      );

      // Upload newly selected images
      if (pendingImages.length > 0) {
        const hasMainExisting = existingImages.some((i) => i.is_main);
        const uploaded = await uploadPropertyImages(
          supabase,
          savedProp.id,
          pendingImages.map((p) => p.file),
          existingImages.length,
          hasMainExisting
        );
        // Respect if admin picked a specific pending image as main
        const chosenPendingIdx = pendingImages.findIndex((p) => p.isMain);
        if (chosenPendingIdx >= 0 && uploaded[chosenPendingIdx]) {
          await setMainPropertyImage(supabase, savedProp.id, uploaded[chosenPendingIdx].id);
        }
      }

      // Upload newly selected video
      if (pendingVideo) {
        await uploadPropertyVideo(supabase, savedProp.id, pendingVideo.file, title);
      }

      showToast(
        'success',
        property ? 'Property Updated' : 'Property Published',
        `${title} has been saved to Supabase and ${isPublished ? 'published to the live website' : 'saved as draft'}.`
      );
      onSaved();
    } catch (err) {
      showToast(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save property.'
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]';
  const labelClass =
    'block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-700 mb-1';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border border-neutral-200 w-full max-w-5xl my-4 shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF37]">
              Property Management
            </p>
            <h2 className="font-serif text-2xl font-semibold">
              {property ? `Edit Property: ${property.title}` : 'Add New Property'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close property editor"
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Core Property Details */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-semibold text-neutral-950 pb-2 border-b border-neutral-200">
              1. Core Property Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Property Name *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 5-Bedroom Contemporary Waterfront Duplex"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Property Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Listing Purpose *</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value as ListingType)}
                    className={inputClass}
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Property Availability *</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as PropertyAvailability)}
                    className={inputClass}
                  >
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>City / Region *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                >
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Lagos">Lagos</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Property Location (Neighborhood, State) *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Old GRA, Port Harcourt, Rivers State"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Property Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street number, Estate name, District"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Property Price (₦) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 180000000"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>

              <div className="flex items-end gap-6 pb-2">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 accent-[#99711C]"
                  />
                  Published on Website
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#99711C]"
                  />
                  Featured on Homepage
                </label>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Property Description *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of architectural finishes, title documents, neighborhood infrastructure, and access..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Details (Optional & Auto-Calculated) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
              <h3 className="font-serif text-xl font-semibold text-neutral-950">
                2. Financial Details &amp; Applicable Charges (Optional)
              </h3>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#99711C]">
                Auto-Calculated Total Initial Payment: {formatNaira(calculatedTotalInitialPayment)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>House Rent (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={houseRent}
                  onChange={(e) => setHouseRent(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Caution Fee (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={cautionFee}
                  onChange={(e) => setCautionFee(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Agency Fee (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={agencyFee}
                  onChange={(e) => setAgencyFee(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Legal Fee (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={legalFee}
                  onChange={(e) => setLegalFee(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Service Charge (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Other Charges (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Specifications & Features */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-semibold text-neutral-950 pb-2 border-b border-neutral-200">
              3. Specifications &amp; Features
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Toilets</label>
                <input
                  type="number"
                  min="0"
                  value={toilets}
                  onChange={(e) => setToilets(e.target.value)}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Parking Spaces</label>
                <input
                  type="number"
                  min="0"
                  value={parkingSpaces}
                  onChange={(e) => setParkingSpaces(e.target.value)}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Property Features</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="e.g. 24/7 Power, Swimming Pool, Fitted Kitchen, C of O"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37] whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {features.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAF9F6] border border-neutral-300 text-xs text-neutral-800"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => setFeatures((prev) => prev.filter((f) => f !== feat))}
                        aria-label={`Remove ${feat}`}
                        className="text-neutral-500 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Property Images Upload & Management */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
              <h3 className="font-serif text-xl font-semibold text-neutral-950">
                4. Property Images (Supabase Storage: property-images)
              </h3>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37] cursor-pointer hover:bg-neutral-800">
                <ImagePlus className="w-4 h-4" />
                Upload Multiple Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSelectImages}
                  className="hidden"
                />
              </label>
            </div>

            <input
              ref={replaceImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceExistingImage}
              className="hidden"
            />

            {(existingImages.length > 0 || pendingImages.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className={`border p-2.5 bg-[#FAF9F6] space-y-2.5 ${
                      img.is_main ? 'border-[#B5892E]' : 'border-neutral-200'
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                      <img
                        src={img.public_url}
                        alt="Uploaded property"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {mediaActionLoading === img.id && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        disabled={img.is_main || mediaActionLoading === img.id}
                        onClick={() => handleSetExistingMain(img)}
                        className={`inline-flex items-center gap-1 font-medium ${
                          img.is_main
                            ? 'text-[#99711C]'
                            : 'text-neutral-600 hover:text-neutral-950'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${img.is_main ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                        {img.is_main ? 'Main Image' : 'Set as Main'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={mediaActionLoading === img.id}
                          onClick={() => {
                            imageTargetForReplaceRef.current = img;
                            replaceImageInputRef.current?.click();
                          }}
                          title="Replace Image"
                          className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Replace
                        </button>
                        <button
                          type="button"
                          disabled={mediaActionLoading === img.id}
                          onClick={() => handleDeleteExistingImage(img)}
                          title="Delete Image"
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingImages.map((img) => (
                  <div
                    key={img.id}
                    className={`border p-2.5 bg-white space-y-2.5 ${
                      img.isMain ? 'border-[#B5892E]' : 'border-neutral-300'
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                      <img
                        src={img.previewUrl}
                        alt="Pending upload preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSetPendingMain(img.id)}
                        className={`inline-flex items-center gap-1 font-medium ${
                          img.isMain ? 'text-[#99711C]' : 'text-neutral-600 hover:text-neutral-950'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${img.isMain ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                        {img.isMain ? 'Main Image (Queued)' : 'Set as Main'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemovePendingImage(img.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-neutral-300 bg-[#FAF9F6] p-8 text-center text-xs text-neutral-500">
                No property photographs selected yet. Click &ldquo;Upload Multiple Images&rdquo; to
                add photos and choose your main listing image.
              </div>
            )}
          </div>

          {/* Section 5: Property Video Upload & Management */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
              <h3 className="font-serif text-xl font-semibold text-neutral-950">
                5. Property Video Tour (Supabase Storage: property-videos)
              </h3>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-950 text-neutral-950 cursor-pointer hover:bg-neutral-950 hover:text-[#D4AF37] transition-colors">
                <Film className="w-4 h-4" />
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleSelectVideo}
                  className="hidden"
                />
              </label>
            </div>

            <input
              ref={replaceVideoInputRef}
              type="file"
              accept="video/*"
              onChange={handleReplaceExistingVideo}
              className="hidden"
            />

            {existingVideos.map((vid) => (
              <div key={vid.id} className="border border-neutral-200 bg-[#FAF9F6] p-4 space-y-3">
                <video
                  controls
                  preload="metadata"
                  src={vid.public_url}
                  className="w-full max-h-72 bg-black"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-neutral-700 truncate max-w-md">
                    {vid.title || 'Uploaded Property Video'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={mediaActionLoading === vid.id}
                      onClick={() => {
                        videoTargetForReplaceRef.current = vid;
                        replaceVideoInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 text-neutral-800 hover:text-neutral-950 font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace Video
                    </button>
                    <button
                      type="button"
                      disabled={mediaActionLoading === vid.id}
                      onClick={() => handleDeleteExistingVideo(vid)}
                      className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Video
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pendingVideo && (
              <div className="border border-[#B5892E] bg-white p-4 space-y-3">
                <video controls src={pendingVideo.previewUrl} className="w-full max-h-72 bg-black" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700">
                    Queued Video: {pendingVideo.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(pendingVideo.previewUrl);
                      setPendingVideo(null);
                    }}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Video
                  </button>
                </div>
              </div>
            )}

            {existingVideos.length === 0 && !pendingVideo && (
              <div className="border border-dashed border-neutral-300 bg-[#FAF9F6] p-6 text-center text-xs text-neutral-500">
                Optional: Upload an MP4/MOV walkthrough video for prospective buyers or tenants.
              </div>
            )}
          </div>

          {/* Form Submit Actions */}
          <div className="pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 text-xs font-semibold uppercase tracking-wider border border-neutral-300 text-neutral-700 hover:border-neutral-950"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3 text-xs font-semibold uppercase tracking-[0.14em] bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {saving
                ? 'Saving & Uploading Media...'
                : property
                  ? 'Save Property Changes'
                  : 'Publish Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
