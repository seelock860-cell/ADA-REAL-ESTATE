import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Instagram, ArrowRight } from 'lucide-react';
import { BRAND_IMAGES, BUSINESS_INFO } from '../constants/business';
import { buildWhatsAppUrl } from '../lib/formatters';
import { SeoHead } from '../components/SeoHead';

export function AboutPage() {
  return (
    <div className="bg-white text-neutral-950">
      <SeoHead
        title="About Us | ADA REAL ESTATE"
        description="Learn about ADA REAL ESTATE — our mission, vision, property management, sales, rentals, and development offices in Port Harcourt and Lagos."
        image={BRAND_IMAGES.aboutLounge}
      />

      {/* Hero Band */}
      <section className="bg-neutral-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            Company Profile
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl">
            About ADA REAL ESTATE
          </h1>
          <p className="text-neutral-300 max-w-2xl leading-relaxed">
            Delivering disciplined real estate advisory, asset management, and property development
            across Port Harcourt and Lagos State.
          </p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
              Company Overview
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
              Principled Stewardship for Buyers, Tenants, and Investors
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              ADA REAL ESTATE is a full-service Nigerian real estate firm anchored in Port Harcourt,
              Rivers State and Lagos State. We bridge high-value residential and commercial real
              estate opportunities with transparent documentation, structured financial breakdowns,
              and attentive client representation.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Every property we market or manage reflects a strict commitment to structural quality,
              clear title history, and accurate valuation—protecting capital while elevating the
              client experience.
            </p>
          </div>
          <div className="lg:col-span-6 overflow-hidden border border-neutral-200 bg-neutral-900 min-h-[300px]">
            <img
              src={BRAND_IMAGES.aboutLounge}
              alt="ADA REAL ESTATE architectural interior"
              referrerPolicy="no-referrer"
              className="w-full h-full lg:h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-[#FAF9F6] border-y border-neutral-200 py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white border border-neutral-200 p-8 sm:p-10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
              Our Mission
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-950">
              Clarity, Integrity &amp; Enduring Value
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              To simplify property acquisition, leasing, management, and development across Nigeria
              by upholding transparent pricing, verified documentation, and responsive client
              representation from first enquiry to handover.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-8 sm:p-10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
              Our Vision
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-950">
              Setting the Benchmark Across West Africa
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              To be the most trusted real estate partner in Port Harcourt, Lagos, and beyond—known
              for curating distinguished residential and commercial portfolios that appreciate in
              utility, beauty, and long-term investment return.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="space-y-2 pb-10 border-b border-neutral-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
            Practice Areas
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold">Our Core Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
          {BUSINESS_INFO.services.map((service) => (
            <div key={service.number} className="border border-neutral-200 p-7 space-y-3">
              <span className="font-mono text-xs font-semibold text-[#99711C] tabular-nums">
                {service.number}.
              </span>
              <h3 className="font-serif text-2xl font-semibold text-neutral-950">
                {service.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{service.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Locations & Contact */}
      <section className="bg-neutral-950 text-white py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Our Locations
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
              Serving Port Harcourt &amp; Lagos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="border border-neutral-800 p-5 space-y-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-xl font-semibold">Port Harcourt</h3>
                <p className="text-xs text-neutral-400">Rivers State, Nigeria</p>
              </div>
              <div className="border border-neutral-800 p-5 space-y-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-xl font-semibold">Lagos State</h3>
                <p className="text-xs text-neutral-400">Lagos, Nigeria</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 border border-neutral-800 bg-neutral-900 p-8 space-y-5">
            <h3 className="font-serif text-2xl font-semibold">Direct Contact Information</h3>
            <div className="space-y-3 text-sm text-neutral-300">
              <a
                href={BUSINESS_INFO.phoneHref}
                className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-mono tabular-nums">{BUSINESS_INFO.phoneDisplay}</span>
              </a>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>WhatsApp: {BUSINESS_INFO.phoneDisplay}</span>
              </a>
              <a
                href={BUSINESS_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors"
              >
                <Instagram className="w-4 h-4 text-[#D4AF37]" />
                <span>{BUSINESS_INFO.instagramHandle}</span>
              </a>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-[#D4AF37] text-neutral-950"
              >
                Explore Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider border border-neutral-700 text-white hover:border-[#D4AF37]"
              >
                Contact Form
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
