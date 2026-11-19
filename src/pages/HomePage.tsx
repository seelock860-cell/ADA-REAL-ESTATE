import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Phone,
  MessageCircle,
  Instagram,
  MapPin,
  Quote,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import {
  fetchCategories,
  fetchPublishedProperties,
  fetchPublishedTestimonials,
} from '../services/realEstateService';
import type { Property, PropertyCategory, Testimonial } from '../types/database';
import { BRAND_IMAGES, BUSINESS_INFO, DEFAULT_CATEGORIES } from '../constants/business';
import { buildWhatsAppUrl } from '../lib/formatters';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

export function HomePage() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Search bar state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      const cats = await fetchCategories(supabase);
      if (active) setCategories(cats.filter((c) => c.is_active));

      if (!supabase) {
        setFeaturedProperties([]);
        setTestimonials([]);
        return;
      }

      setLoadingProperties(true);
      try {
        const [props, reviews] = await Promise.all([
          fetchPublishedProperties(supabase),
          fetchPublishedTestimonials(supabase),
        ]);
        if (!active) return;
        setFeaturedProperties(props.slice(0, 6));
        setTestimonials(reviews);
      } catch {
        // Keep graceful empty state if schema isn't initialized yet
      } finally {
        if (active) setLoadingProperties(false);
      }
    }

    void loadHomeData();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.set('location', searchLocation.trim());
    if (searchType) params.set('category', searchType);
    if (searchStatus === 'sale' || searchStatus === 'rent') {
      params.set('status', searchStatus);
    } else if (searchStatus) {
      params.set('availability', searchStatus);
    }
    if (minPrice.trim()) params.set('minPrice', minPrice.trim());
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim());

    navigate(`/properties?${params.toString()}`);
  };

  const categoryOptions =
    categories.length > 0 ? categories.map((c) => c.name) : [...DEFAULT_CATEGORIES];

  return (
    <div className="bg-white text-neutral-950">
      <SeoHead
        title="ADA REAL ESTATE – Luxury Properties in Port Harcourt & Lagos"
        description="Discover exceptional properties for sale and rent across Port Harcourt and Lagos. Your trusted partner in property management, sales, rentals and development."
        image={BRAND_IMAGES.heroVilla}
      />

      {/* B. Hero Section */}
      <section className="relative bg-neutral-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BRAND_IMAGES.heroVilla}
            alt="Luxury architectural residence by ADA REAL ESTATE"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
              Port Harcourt · Lagos State
            </p>
            <h1
              className="font-serif font-semibold tracking-tight text-white leading-[1.08]"
              style={{ fontSize: 'clamp(2.25rem, 4.3vw, 3.75rem)', textWrap: 'balance' }}
            >
              FIND YOUR PERFECT PROPERTY WITH ADA REAL ESTATE
            </h1>
            <p className="text-base sm:text-lg text-neutral-200 leading-relaxed max-w-2xl">
              Discover exceptional properties for sale and rent across Port Harcourt and Lagos. Your
              trusted partner in property management, sales, rentals and development.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/properties"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] transition-colors whitespace-nowrap shrink-0"
              >
                Explore Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] border border-white/40 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* C. Property Search Section */}
      <section aria-label="Property Search" className="relative z-20 -mt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-white border border-neutral-200 shadow-xl p-5 sm:p-7">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
          >
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Port Harcourt, Lagos..."
                className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-[#B5892E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1.5">
                Property Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1.5">
                Property Status
              </label>
              <select
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
              >
                <option value="">Any Status</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Rented">Rented</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1.5">
                Min Price (₦)
              </label>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 font-mono tabular-nums placeholder-neutral-400 focus:outline-none focus:border-[#B5892E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1.5">
                Max Price (₦)
              </label>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 250000000"
                className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 font-mono tabular-nums placeholder-neutral-400 focus:outline-none focus:border-[#B5892E]"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 h-[42px] text-xs font-semibold uppercase tracking-[0.14em] bg-neutral-950 text-[#D4AF37] hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>
        </div>
      </section>

      {/* D. Featured Properties */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10 border-b border-neutral-200">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
              Curated Portfolio
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-950 tracking-tight">
              Featured Properties
            </h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-950 hover:text-[#99711C] transition-colors whitespace-nowrap shrink-0"
          >
            View All Properties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingProperties ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="border border-neutral-200 bg-white animate-pulse">
                <div className="aspect-[4/3] bg-neutral-200" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-1/3 bg-neutral-200" />
                  <div className="h-6 w-3/4 bg-neutral-200" />
                  <div className="h-4 w-1/2 bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-neutral-200 bg-[#FAF9F6] p-10 sm:p-14 text-center max-w-3xl mx-auto">
            <Building2 className="w-10 h-10 text-[#B5892E] mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-semibold text-neutral-950 mb-2">
              {supabase ? 'No Published Properties Yet' : 'Portfolio Ready for Live Listings'}
            </h3>
            <p className="text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed mb-6">
              {supabase
                ? 'Authorized administrators can upload verified properties, images, and videos from the Admin Dashboard to publish them live here.'
                : 'Connect your Supabase project inside the Administrator Portal to display live verified properties across Port Harcourt and Lagos.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={buildWhatsAppUrl(
                  'Hello ADA REAL ESTATE, please share your latest available listings in Port Harcourt and Lagos.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] bg-neutral-950 text-[#D4AF37] hover:bg-neutral-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Request Listings on WhatsApp
              </a>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] border border-neutral-300 text-neutral-800 hover:border-neutral-950 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Administrator Login
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* E. About ADA REAL ESTATE */}
      <section className="bg-[#FAF9F6] border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 relative overflow-hidden bg-neutral-900 min-h-[320px]">
              <img
                src={BRAND_IMAGES.aboutLounge}
                alt="Luxury double-height interior lounge designed for modern Nigerian living"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
                About ADA REAL ESTATE
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-950 leading-tight">
                A Trusted Standard in Nigerian Real Estate Advisory
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                Operating across <strong>Port Harcourt, Rivers State</strong> and{' '}
                <strong>Lagos State</strong>, ADA REAL ESTATE represents discerning homeowners,
                corporate tenants, institutional landlords, and diaspora investors. Every listing in
                our portfolio undergoes rigorous title verification, transparent pricing review, and
                dedicated inspection coordination.
              </p>
              <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">
                From waterfront luxury residences in Ikoyi and Victoria Island to prime commercial
                assets and gated residential estates in GRA Port Harcourt, our mission is grounded in
                integrity, clarity, and enduring property value.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-neutral-200">
                <div>
                  <span className="block font-serif text-2xl font-semibold text-neutral-950">
                    Port Harcourt
                  </span>
                  <span className="text-xs text-neutral-500">Rivers State Regional Desk</span>
                </div>
                <div className="h-8 w-px bg-neutral-300" aria-hidden="true" />
                <div>
                  <span className="block font-serif text-2xl font-semibold text-neutral-950">
                    Lagos State
                  </span>
                  <span className="text-xs text-neutral-500">Island &amp; Mainland Advisory</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] bg-neutral-950 text-[#D4AF37] hover:bg-neutral-800 transition-colors"
                >
                  Discover Our Company
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* F. Our Services */}
      <section id="our-services" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
                Our Services
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-950 leading-tight">
                Comprehensive Property Solutions Tailored to Your Goals
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Whether acquiring a primary residence, leasing executive space, or entrusting an
                entire residential estate to professional stewardship, our team delivers structured
                execution at every step.
              </p>
            </div>

            <div className="overflow-hidden border border-neutral-200 aspect-[4/3] bg-neutral-900">
              <img
                src={BRAND_IMAGES.estateDevelopment}
                alt="Contemporary luxury terraced residential development"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 divide-y divide-neutral-200 border-y border-neutral-200">
            {BUSINESS_INFO.services.map((service) => (
              <div
                key={service.number}
                className="py-7 sm:py-8 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8"
              >
                <span className="font-mono text-sm font-semibold text-[#99711C] tabular-nums shrink-0 pt-1">
                  {service.number}.
                </span>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-semibold text-neutral-950">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    {service.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* G. Why Choose Us? */}
      <section className="bg-neutral-950 text-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl space-y-3 pb-12 border-b border-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Why Choose Us
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight">
              Built on Professionalism, Market Mastery, and Client Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
            {[
              {
                index: '01',
                title: 'Uncompromising Professionalism',
                body: 'Structured due diligence, documented inspection protocols, and clear fee schedules with zero hidden charges.',
              },
              {
                index: '02',
                title: 'Port Harcourt & Lagos Insight',
                body: 'Deep neighborhood intelligence across Old GRA, New GRA, Lekki, Ikoyi, Victoria Island, and emerging growth corridors.',
              },
              {
                index: '03',
                title: 'Dedicated Client Service',
                body: 'Responsive WhatsApp and private advisory support tailored to local buyers, corporate relocations, and diaspora investors.',
              },
              {
                index: '04',
                title: 'Long-Term Stewardship',
                body: 'From initial viewing through closing, tenancy onboarding, and ongoing facility management, we remain accountable.',
              },
            ].map((item) => (
              <div key={item.index} className="space-y-3 border-t border-neutral-800 pt-6">
                <span className="font-mono text-xs text-[#D4AF37] tabular-nums">{item.index}</span>
                <h3 className="font-serif text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H. Customer Testimonials (Strictly Admin-Managed Genuine Testimonials) */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10 border-b border-neutral-200">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
              Client Perspectives
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-950">
              Verified Customer Testimonials
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            Published directly by ADA REAL ESTATE administrators
          </span>
        </div>

        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {testimonials.map((item) => (
              <blockquote
                key={item.id}
                className="bg-[#FAF9F6] border border-neutral-200 p-7 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <Quote className="w-6 h-6 text-[#B5892E]" />
                  <p className="text-neutral-800 text-sm sm:text-base leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
                <footer className="pt-4 border-t border-neutral-200">
                  <p className="font-semibold text-sm text-neutral-950">{item.client_name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {item.client_role} · {item.location}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-neutral-200 bg-[#FAF9F6] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-semibold text-neutral-950">
                Genuine Client Reviews Coming Soon
              </h3>
              <p className="text-sm text-neutral-600 max-w-2xl">
                ADA REAL ESTATE publishes only authentic, verified client testimonials managed
                through our administrator dashboard.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] border border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Speak With Us
            </Link>
          </div>
        )}
      </section>

      {/* I. Contact Section */}
      <section className="relative bg-neutral-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img
            src={BRAND_IMAGES.lagosWaterfront}
            alt="Lagos waterfront residential skyline"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                Connect With Our Team
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-white leading-tight">
                Ready to Schedule a Private Property Inspection?
              </h2>
              <p className="text-neutral-300 max-w-xl leading-relaxed">
                Reach our Port Harcourt and Lagos advisory desks directly via WhatsApp, phone call,
                or Instagram for verified listings and investment consultation.
              </p>
            </div>

            <div className="lg:col-span-5 bg-neutral-900/95 border border-neutral-800 p-7 sm:p-8 space-y-5">
              <div className="flex items-start gap-3 text-sm text-neutral-300 pb-4 border-b border-neutral-800">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Port Harcourt, Rivers State &amp; Lagos State, Nigeria</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp: {BUSINESS_INFO.phoneDisplay}
                </a>
                <a
                  href={BUSINESS_INFO.phoneHref}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] border border-neutral-700 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call {BUSINESS_INFO.phoneDisplay}
                </a>
                <a
                  href={BUSINESS_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] border border-neutral-700 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram {BUSINESS_INFO.instagramHandle}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
