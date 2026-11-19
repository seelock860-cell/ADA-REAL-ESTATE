import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Car,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  Calendar,
  Building2,
  PlayCircle,
  X,
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { fetchPropertyById } from '../services/realEstateService';
import type { EnquiryType, Property } from '../types/database';
import { BUSINESS_INFO } from '../constants/business';
import { buildPropertyWhatsAppUrl, formatNaira } from '../lib/formatters';
import { SeoHead } from '../components/SeoHead';
import { EnquiryForm } from '../components/EnquiryForm';

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useSupabase();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [modalEnquiryType, setModalEnquiryType] = useState<EnquiryType | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id || !supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchPropertyById(supabase, id);
        if (active) {
          setProperty(data);
          setActiveImageIndex(0);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load property details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 animate-pulse space-y-8">
        <div className="h-5 w-40 bg-neutral-200" />
        <div className="aspect-[16/9] max-h-[520px] w-full bg-neutral-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-9 w-2/3 bg-neutral-200" />
            <div className="h-4 w-1/2 bg-neutral-200" />
            <div className="h-32 w-full bg-neutral-200" />
          </div>
          <div className="h-72 bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <SeoHead
          title="Property Not Found | ADA REAL ESTATE"
          description="View luxury residential and commercial properties in Port Harcourt and Lagos."
        />
        <Building2 className="w-12 h-12 text-[#B5892E] mx-auto" />
        <h1 className="font-serif text-3xl font-semibold text-neutral-950">
          {errorMsg ? 'Unable to Load Property' : 'Property Not Found'}
        </h1>
        <p className="text-sm text-neutral-600">
          {errorMsg ||
            'This property may have been removed or is not currently available in the database.'}
        </p>
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Properties
        </Link>
      </div>
    );
  }

  const images = property.property_images || [];
  const videos = property.property_videos || [];
  const activeImage = images[activeImageIndex] || images[0];

  // Financial fees calculation
  const feeItems = [
    { label: 'House Rent', value: property.house_rent },
    { label: 'Caution Fee', value: property.caution_fee },
    { label: 'Agency Fee', value: property.agency_fee },
    { label: 'Legal Fee', value: property.legal_fee },
    { label: 'Service Charge', value: property.service_charge },
    { label: 'Other Charges', value: property.other_charges },
  ].filter((item) => item.value !== null && item.value !== undefined && Number(item.value) > 0);

  const computedInitialTotal = feeItems.reduce((acc, item) => acc + Number(item.value || 0), 0);
  const totalInitialPayment =
    property.total_initial_payment !== null &&
    property.total_initial_payment !== undefined &&
    Number(property.total_initial_payment) > 0
      ? Number(property.total_initial_payment)
      : computedInitialTotal;

  const whatsappHref = buildPropertyWhatsAppUrl({
    title: property.title,
    location: property.location,
    price: property.price,
  });

  return (
    <div className="bg-white min-h-screen pb-20">
      <SeoHead
        title={`${property.title} – ${property.location} | ADA REAL ESTATE`}
        description={`${property.category} in ${property.location} listed at ${formatNaira(property.price)}. ${property.description.slice(0, 110)}`}
        image={activeImage?.public_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 hover:text-neutral-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span>{property.category}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                property.availability === 'Available'
                  ? 'text-emerald-700 font-semibold'
                  : property.availability === 'Sold'
                    ? 'text-neutral-800 font-semibold'
                    : 'text-amber-700 font-semibold'
              }
            >
              {property.availability}
            </span>
          </div>
        </div>

        {/* Media Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[16/9] max-h-[560px] w-full bg-neutral-950 overflow-hidden border border-neutral-200">
            {activeImage?.public_url ? (
              <img
                src={activeImage.public_url}
                alt={`${property.title} view ${activeImageIndex + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                <Building2 className="w-14 h-14 text-[#D4AF37]/60 mb-3" />
                <p className="text-xs uppercase tracking-[0.16em]">
                  No Photos Uploaded for This Property Yet
                </p>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[4/3] overflow-hidden border transition-all ${
                    idx === activeImageIndex
                      ? 'border-[#B5892E] ring-2 ring-[#D4AF37]/40'
                      : 'border-neutral-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.public_url}
                    alt={`${property.title} thumbnail ${idx + 1}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
          {/* Left Details Column */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-4 pb-8 border-b border-neutral-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#99711C] mb-1.5">
                    {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'} · {property.city}
                  </p>
                  <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-950 leading-tight">
                    {property.title}
                  </h1>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    {property.listing_type === 'rent' ? 'Annual Price' : 'Property Price'}
                  </p>
                  <p className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-neutral-950">
                    {formatNaira(property.price)}
                  </p>
                </div>
              </div>

              <p className="flex items-start gap-2 text-sm text-neutral-600">
                <MapPin className="w-4 h-4 text-[#B5892E] shrink-0 mt-0.5" />
                <span>
                  {property.address ? `${property.address}, ` : ''}
                  {property.location}
                </span>
              </p>

              {/* Key Specifications Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <div className="border border-neutral-200 bg-[#FAF9F6] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500 block">
                    Bedrooms
                  </span>
                  <span className="mt-1 inline-flex items-center gap-2 font-mono tabular-nums text-lg font-semibold text-neutral-950">
                    <BedDouble className="w-4 h-4 text-[#99711C]" />
                    {property.bedrooms}
                  </span>
                </div>
                <div className="border border-neutral-200 bg-[#FAF9F6] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500 block">
                    Bathrooms
                  </span>
                  <span className="mt-1 inline-flex items-center gap-2 font-mono tabular-nums text-lg font-semibold text-neutral-950">
                    <Bath className="w-4 h-4 text-[#99711C]" />
                    {property.bathrooms}
                  </span>
                </div>
                <div className="border border-neutral-200 bg-[#FAF9F6] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500 block">
                    Toilets
                  </span>
                  <span className="mt-1 block font-mono tabular-nums text-lg font-semibold text-neutral-950">
                    {property.toilets}
                  </span>
                </div>
                <div className="border border-neutral-200 bg-[#FAF9F6] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500 block">
                    Parking Spaces
                  </span>
                  <span className="mt-1 inline-flex items-center gap-2 font-mono tabular-nums text-lg font-semibold text-neutral-950">
                    <Car className="w-4 h-4 text-[#99711C]" />
                    {property.parking_spaces}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-semibold text-neutral-950">
                Property Description
              </h2>
              <div className="text-neutral-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {property.description}
              </div>
            </div>

            {/* Property Features */}
            {property.features && property.features.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-neutral-200">
                <h2 className="font-serif text-2xl font-semibold text-neutral-950">
                  Property Features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {property.features.map((feat, i) => (
                    <div
                      key={`${feat}-${i}`}
                      className="flex items-center gap-2.5 text-sm text-neutral-800 py-1.5"
                    >
                      <Check className="w-4 h-4 text-[#99711C] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Video Section */}
            {videos.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#99711C]" />
                  <h2 className="font-serif text-2xl font-semibold text-neutral-950">
                    Property Video Tour
                  </h2>
                </div>
                <div className="space-y-4">
                  {videos.map((vid) => (
                    <div key={vid.id} className="border border-neutral-200 bg-neutral-950 overflow-hidden">
                      <video
                        controls
                        preload="metadata"
                        src={vid.public_url}
                        className="w-full max-h-[480px]"
                      >
                        Your browser does not support embedded property videos.
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Details Breakdown */}
            {(feeItems.length > 0 || totalInitialPayment > 0) && (
              <div className="space-y-4 pt-6 border-t border-neutral-200">
                <h2 className="font-serif text-2xl font-semibold text-neutral-950">
                  Financial Breakdown
                </h2>
                <div className="border border-neutral-200 bg-[#FAF9F6] divide-y divide-neutral-200">
                  {feeItems.map((item) => (
                    <div
                      key={item.label}
                      className="px-5 py-3.5 flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-700">{item.label}</span>
                      <span className="font-mono tabular-nums font-medium text-neutral-950">
                        {formatNaira(item.value)}
                      </span>
                    </div>
                  ))}
                  {totalInitialPayment > 0 && (
                    <div className="px-5 py-4 bg-neutral-950 text-white flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
                        Total Initial Payment
                      </span>
                      <span className="font-mono tabular-nums text-lg font-semibold text-white">
                        {formatNaira(totalInitialPayment)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sticky Concierge Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 border border-neutral-200 bg-neutral-950 text-white p-6 sm:p-7 space-y-5">
              <div className="space-y-1 pb-4 border-b border-neutral-800">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                  ADA REAL ESTATE Advisory
                </p>
                <h3 className="font-serif text-2xl font-semibold">Interested in This Property?</h3>
                <p className="text-xs text-neutral-400">
                  Speak directly with an authorized property specialist or schedule a private
                  inspection.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] bg-[#25D366] text-neutral-950 hover:bg-[#22c55e] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Enquiry
                </a>

                <button
                  type="button"
                  onClick={() => setModalEnquiryType('Inspection Request')}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Request Inspection
                </button>

                <button
                  type="button"
                  onClick={() => setModalEnquiryType('Agent Contact')}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] border border-neutral-700 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Contact Agent
                </button>
              </div>

              <div className="pt-4 border-t border-neutral-800 space-y-2 text-xs text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Direct Telephone</span>
                  <a
                    href={BUSINESS_INFO.phoneHref}
                    className="font-mono tabular-nums text-neutral-200 hover:text-[#D4AF37]"
                  >
                    {BUSINESS_INFO.phoneDisplay}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-neutral-200 font-medium">{property.availability}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Inspection / Agent Contact Modal */}
      {modalEnquiryType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-neutral-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setModalEnquiryType(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-950"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pr-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#99711C]">
                {modalEnquiryType}
              </p>
              <h3 className="font-serif text-2xl font-semibold text-neutral-950 mt-1">
                {property.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">{property.location}</p>
            </div>

            <EnquiryForm
              defaultProperty={property}
              defaultEnquiryType={modalEnquiryType}
              onSuccess={() => {
                setTimeout(() => setModalEnquiryType(null), 1800);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
