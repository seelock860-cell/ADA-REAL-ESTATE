import { Link } from 'react-router-dom';
import { BedDouble, Bath, MapPin, Building2, ArrowUpRight } from 'lucide-react';
import type { Property } from '../types/database';
import { formatNaira } from '../lib/formatters';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const mainImage =
    property.property_images?.find((img) => img.is_main) || property.property_images?.[0];

  const statusColor =
    property.availability === 'Available'
      ? 'text-emerald-700'
      : property.availability === 'Sold'
        ? 'text-neutral-600'
        : 'text-amber-700';

  return (
    <article className="group bg-white border border-neutral-200 flex flex-col transition-colors duration-200 hover:border-[#C59B38]">
      {/* Media Slot (4:3) */}
      <Link
        to={`/properties/${property.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900 block"
      >
        {mainImage?.public_url ? (
          <img
            src={mainImage.public_url}
            alt={property.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 flex flex-col items-center justify-center p-6 text-center">
            <Building2 className="w-10 h-10 text-[#D4AF37]/70 mb-2" />
            <span className="text-xs uppercase tracking-[0.15em] text-neutral-400">
              {property.category}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
          <span className="font-mono tabular-nums text-base sm:text-lg font-semibold tracking-tight">
            {formatNaira(property.price)}
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#D4AF37] font-medium">
            {property.listing_type === 'rent' ? 'Per Annum' : 'Asking Price'}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          {/* Unboxed clean metadata line (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-neutral-500">
            <span>{property.category}</span>
            <span aria-hidden="true">·</span>
            <span className={statusColor}>{property.availability}</span>
          </div>

          <Link to={`/properties/${property.id}`} className="block">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-neutral-950 leading-snug group-hover:text-[#99711C] transition-colors line-clamp-2">
              {property.title}
            </h3>
          </Link>

          <p className="flex items-start gap-1.5 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 text-[#B5892E] shrink-0 mt-0.5" />
            <span className="line-clamp-1">{property.location}</span>
          </p>
        </div>

        {/* Specs & Action */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600 tabular-nums">
            {property.bedrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-neutral-400" />
                {property.bedrooms} Beds
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-neutral-400" />
                {property.bathrooms} Baths
              </span>
            )}
            {property.bedrooms === 0 && property.bathrooms === 0 && (
              <span className="text-neutral-500">{property.city}</span>
            )}
          </div>

          <Link
            to={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-950 hover:text-[#99711C] transition-colors whitespace-nowrap shrink-0"
          >
            View Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
