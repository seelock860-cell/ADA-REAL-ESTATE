import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, Building2, MessageCircle } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { fetchCategories, fetchPublishedProperties } from '../services/realEstateService';
import type { Property, PropertyCategory } from '../types/database';
import { DEFAULT_CATEGORIES } from '../constants/business';
import { buildWhatsAppUrl } from '../lib/formatters';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

export function PropertiesPage() {
  const { supabase } = useSupabase();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters synchronized with URL search params
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [availabilityFilter, setAvailabilityFilter] = useState(
    searchParams.get('availability') || ''
  );
  const [bedroomsFilter, setBedroomsFilter] = useState(searchParams.get('bedrooms') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Keep state synced when top nav links ("For Sale" / "For Rent") change query params
  useEffect(() => {
    setLocationFilter(searchParams.get('location') || '');
    setCategoryFilter(searchParams.get('category') || '');
    setStatusFilter(searchParams.get('status') || '');
    setAvailabilityFilter(searchParams.get('availability') || '');
    setBedroomsFilter(searchParams.get('bedrooms') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function load() {
      const cats = await fetchCategories(supabase);
      if (active) setCategories(cats.filter((c) => c.is_active));

      if (!supabase) {
        setProperties([]);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchPublishedProperties(supabase);
        if (active) setProperties(data);
      } catch (err) {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Unable to load properties from Supabase.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  const categoryNames =
    categories.length > 0 ? categories.map((c) => c.name) : [...DEFAULT_CATEGORIES];

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (categoryFilter && p.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter === 'sale' && p.listing_type !== 'sale') return false;
      if (statusFilter === 'rent' && p.listing_type !== 'rent') return false;
      if (availabilityFilter && p.availability !== availabilityFilter) return false;

      if (locationFilter.trim()) {
        const q = locationFilter.trim().toLowerCase();
        const matchesLoc =
          p.location.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q);
        if (!matchesLoc) return false;
      }

      if (bedroomsFilter) {
        const minBeds = Number(bedroomsFilter);
        if (!Number.isNaN(minBeds) && p.bedrooms < minBeds) return false;
      }

      if (minPrice) {
        const minP = Number(minPrice);
        if (!Number.isNaN(minP) && p.price < minP) return false;
      }

      if (maxPrice) {
        const maxP = Number(maxPrice);
        if (!Number.isNaN(maxP) && p.price > maxP) return false;
      }

      return true;
    });
  }, [
    properties,
    categoryFilter,
    statusFilter,
    availabilityFilter,
    locationFilter,
    bedroomsFilter,
    minPrice,
    maxPrice,
  ]);

  const handleCategoryTab = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat) {
      next.set('category', cat);
    } else {
      next.delete('category');
    }
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  const pageHeading =
    statusFilter === 'sale'
      ? 'Properties for Sale'
      : statusFilter === 'rent'
        ? 'Properties for Rent'
        : categoryFilter || 'All Properties';

  return (
    <div className="bg-white min-h-screen">
      <SeoHead
        title={`${pageHeading} | ADA REAL ESTATE`}
        description="Browse verified houses, apartments, duplexes, terraced houses, commercial properties, and land in Port Harcourt and Lagos."
      />

      {/* Header Band */}
      <section className="bg-neutral-950 text-white py-14 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Port Harcourt &amp; Lagos Portfolio
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight">
              {pageHeading}
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 max-w-2xl">
              Explore live listings published directly by ADA REAL ESTATE across residential,
              commercial, and investment-grade categories.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-neutral-400">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'}{' '}
            Matched
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => handleCategoryTab('')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors ${
              !categoryFilter
                ? 'bg-neutral-950 text-[#D4AF37]'
                : 'bg-[#FAF9F6] text-neutral-700 hover:text-neutral-950 border border-neutral-200'
            }`}
          >
            All Categories
          </button>
          {categoryNames.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryTab(cat)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? 'bg-neutral-950 text-[#D4AF37]'
                  : 'bg-[#FAF9F6] text-neutral-700 hover:text-neutral-950 border border-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Detailed Filter Bar */}
        <div className="bg-[#FAF9F6] border border-neutral-200 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-800">
              <SlidersHorizontal className="w-4 h-4 text-[#99711C]" />
              Filter Listings
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Location / Keyword
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Port Harcourt, Lekki, Ikoyi, GRA..."
                  className="w-full bg-white border border-neutral-300 pl-9 pr-3 py-2 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Listing Purpose
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
              >
                <option value="">Sale &amp; Rent</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Availability
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Rented">Rented</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Bedrooms
              </label>
              <select
                value={bedroomsFilter}
                onChange={(e) => setBedroomsFilter(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
              >
                <option value="">Any Bedrooms</option>
                <option value="1">1+ Bedrooms</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Min (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full bg-white border border-neutral-300 px-2.5 py-2 text-sm font-mono tabular-nums focus:outline-none focus:border-[#B5892E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Max (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full bg-white border border-neutral-300 px-2.5 py-2 text-sm font-mono tabular-nums focus:outline-none focus:border-[#B5892E]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
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
        ) : errorMsg ? (
          <div className="border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="border border-neutral-200 bg-[#FAF9F6] p-12 text-center space-y-4">
            <Building2 className="w-10 h-10 text-[#B5892E] mx-auto" />
            <h2 className="font-serif text-2xl font-semibold text-neutral-950">
              {properties.length === 0
                ? 'No Published Properties Found'
                : 'No Properties Match Your Current Filters'}
            </h2>
            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              {properties.length === 0
                ? 'Once properties are published from the ADA REAL ESTATE Admin Dashboard, they appear here automatically.'
                : 'Try adjusting your price range, location keyword, or category filters.'}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {properties.length > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37]"
                >
                  Clear All Filters
                </button>
              )}
              <a
                href={buildWhatsAppUrl(
                  'Hello ADA REAL ESTATE, I am looking for a specific property in Port Harcourt or Lagos.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border border-neutral-300 text-neutral-900 hover:border-neutral-950"
              >
                <MessageCircle className="w-4 h-4" />
                Request Custom Sourcing
              </a>
              {!supabase && (
                <Link
                  to="/admin/login"
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border border-[#B5892E] text-[#99711C]"
                >
                  Connect Supabase in Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
