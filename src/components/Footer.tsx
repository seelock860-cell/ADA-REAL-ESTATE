import { Link } from 'react-router-dom';
import { Phone, Instagram, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { BUSINESS_INFO } from '../constants/business';
import { buildWhatsAppUrl } from '../lib/formatters';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800/80">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="w-7 h-7 border border-[#D4AF37] flex items-center justify-center text-xs font-serif font-bold text-[#D4AF37]">
                A
              </span>
              <span className="font-serif text-xl font-semibold tracking-[0.14em] text-white">
                ADA REAL ESTATE
              </span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              Trusted Nigerian real estate specialists delivering vetted property sales, executive
              rentals, asset management, and bespoke developments across Port Harcourt and Lagos.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37] mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/properties?status=sale" className="hover:text-white transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link to="/properties?status=rent" className="hover:text-white transition-colors">
                  Properties for Rent
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About ADA REAL ESTATE
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact & Inspections
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & Locations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37] mb-4">
              Services & Offices
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>Property Management</li>
              <li>Property Sales & Advisory</li>
              <li>Property Rentals</li>
              <li>Property Development</li>
              <li className="pt-2 flex items-start gap-2 text-neutral-300">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Port Harcourt, Rivers State &amp; Lagos State, Nigeria</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Direct Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37] mb-4">
              Direct Concierge
            </h3>
            <div className="space-y-3 text-sm">
              <a
                href={BUSINESS_INFO.phoneHref}
                className="flex items-center gap-2.5 text-neutral-200 hover:text-[#D4AF37] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-mono tabular-nums">{BUSINESS_INFO.phoneDisplay}</span>
              </a>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-neutral-200 hover:text-[#D4AF37] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>WhatsApp: {BUSINESS_INFO.phoneDisplay}</span>
              </a>
              <a
                href={BUSINESS_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-neutral-200 hover:text-[#D4AF37] transition-colors"
              >
                <Instagram className="w-4 h-4 text-[#D4AF37]" />
                <span>{BUSINESS_INFO.instagramHandle}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {year} ADA REAL ESTATE. All rights reserved.</p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-[#D4AF37] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Portal</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
