import { useEffect, useState } from 'react';
import { Phone, MessageCircle, Instagram, MapPin } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { fetchPublishedProperties } from '../services/realEstateService';
import type { Property } from '../types/database';
import { BUSINESS_INFO } from '../constants/business';
import { buildWhatsAppUrl } from '../lib/formatters';
import { EnquiryForm } from '../components/EnquiryForm';
import { SeoHead } from '../components/SeoHead';

export function ContactPage() {
  const { supabase } = useSupabase();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (!supabase) return;
    fetchPublishedProperties(supabase)
      .then(setProperties)
      .catch(() => {});
  }, [supabase]);

  return (
    <div className="bg-white min-h-screen">
      <SeoHead
        title="Contact Us | ADA REAL ESTATE"
        description="Contact ADA REAL ESTATE via Phone (09020191763), WhatsApp, Instagram (@ada_real_estate_), or submit an inspection enquiry for Port Harcourt and Lagos properties."
      />

      <section className="bg-neutral-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            Client Advisory Desk
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold">Contact ADA REAL ESTATE</h1>
          <p className="text-neutral-300 max-w-2xl">
            Schedule an inspection, request property valuation, or discuss residential and
            commercial opportunities in Port Harcourt and Lagos.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Channels */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#99711C]">
                Direct Channels
              </p>
              <h2 className="font-serif text-3xl font-semibold text-neutral-950">
                Reach Us Immediately
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Our advisors respond rapidly to calls, WhatsApp messages, and website enquiries
                during business hours and scheduled weekend inspections.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-5 border border-neutral-200 bg-[#FAF9F6] hover:border-[#25D366] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">WhatsApp</p>
                    <p className="font-mono tabular-nums font-semibold text-neutral-950">
                      {BUSINESS_INFO.phoneDisplay}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 group-hover:text-neutral-950">
                  Chat Now
                </span>
              </a>

              <a
                href={BUSINESS_INFO.phoneHref}
                className="w-full flex items-center justify-between p-5 border border-neutral-200 bg-[#FAF9F6] hover:border-[#B5892E] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Phone className="w-5 h-5 text-[#99711C]" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Telephone</p>
                    <p className="font-mono tabular-nums font-semibold text-neutral-950">
                      {BUSINESS_INFO.phoneDisplay}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 group-hover:text-neutral-950">
                  Call Now
                </span>
              </a>

              <a
                href={BUSINESS_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-5 border border-neutral-200 bg-[#FAF9F6] hover:border-[#B5892E] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Instagram className="w-5 h-5 text-[#99711C]" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Instagram</p>
                    <p className="font-semibold text-neutral-950">
                      {BUSINESS_INFO.instagramHandle}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 group-hover:text-neutral-950">
                  Follow
                </span>
              </a>
            </div>

            <div className="border-t border-neutral-200 pt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Office Presence
              </p>
              <div className="space-y-2 text-sm text-neutral-800">
                <p className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#99711C]" />
                  Port Harcourt, Rivers State, Nigeria
                </p>
                <p className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#99711C]" />
                  Lagos State, Nigeria
                </p>
              </div>
            </div>
          </div>

          {/* Enquiry Form */}
          <div className="lg:col-span-7 border border-neutral-200 bg-[#FAF9F6] p-6 sm:p-10">
            <div className="mb-6 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#99711C]">
                Direct Enquiry Form
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-950">
                Send Us a Message
              </h2>
            </div>

            <EnquiryForm propertiesList={properties} />
          </div>
        </div>
      </div>
    </div>
  );
}
