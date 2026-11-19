import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { submitEnquiry } from '../services/realEstateService';
import type { EnquiryType, Property } from '../types/database';

interface EnquiryFormProps {
  defaultProperty?: Property | null;
  propertiesList?: Property[];
  defaultEnquiryType?: EnquiryType;
  onSuccess?: () => void;
  dark?: boolean;
}

export function EnquiryForm({
  defaultProperty,
  propertiesList = [],
  defaultEnquiryType = 'General Enquiry',
  onSuccess,
  dark = false,
}: EnquiryFormProps) {
  const { supabase, showToast } = useSupabase();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(defaultProperty?.id || '');
  const [customPropertyInterest, setCustomPropertyInterest] = useState(
    defaultProperty?.title || ''
  );
  const [enquiryType, setEnquiryType] = useState<EnquiryType>(defaultEnquiryType);
  const [message, setMessage] = useState(
    defaultProperty
      ? `I would like to schedule an inspection and receive full details for ${defaultProperty.title} (${defaultProperty.location}).`
      : ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !phoneNumber.trim() || !message.trim()) {
      setErrorMsg('Please enter your name, phone number, and message.');
      return;
    }

    if (!supabase) {
      setErrorMsg(
        'Database connection is not configured yet. Please reach us immediately via WhatsApp or Phone (09020191763).'
      );
      return;
    }

    setSubmitting(true);
    try {
      const matchedProp =
        defaultProperty || propertiesList.find((p) => p.id === selectedPropertyId) || null;

      await submitEnquiry(supabase, {
        customer_name: customerName,
        phone_number: phoneNumber,
        email: email || undefined,
        property_id: matchedProp?.id || null,
        property_title: matchedProp?.title || customPropertyInterest.trim() || null,
        enquiry_type: enquiryType,
        message,
      });

      setSubmitted(true);
      showToast(
        'success',
        'Enquiry Submitted',
        'Our advisory team will contact you shortly.'
      );
      setCustomerName('');
      setPhoneNumber('');
      setEmail('');
      if (!defaultProperty) {
        setMessage('');
        setSelectedPropertyId('');
        setCustomPropertyInterest('');
      }
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit enquiry.';
      setErrorMsg(msg);
      showToast('error', 'Submission Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = dark
    ? 'w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors'
    : 'w-full bg-white border border-neutral-300 text-neutral-950 placeholder-neutral-400 px-4 py-3 text-sm focus:outline-none focus:border-[#B5892E] transition-colors';

  const labelClass = dark
    ? 'block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-300 mb-1.5'
    : 'block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 mb-1.5';

  if (submitted) {
    return (
      <div
        className={`p-6 sm:p-8 border ${
          dark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-[#FAF9F6] border-neutral-200 text-neutral-950'
        }`}
      >
        <CheckCircle2 className="w-8 h-8 text-[#D4AF37] mb-3" />
        <h4 className="font-serif text-2xl font-semibold mb-2">Thank You for Your Enquiry</h4>
        <p className={`text-sm mb-5 ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>
          Your request has been logged with ADA REAL ESTATE. A property advisor from our Port
          Harcourt or Lagos desk will respond promptly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] transition-colors"
        >
          Send Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Chinedu Okafor"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone / WhatsApp Number *</label>
          <input
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 0803 000 0000"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email Address (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Enquiry Type</label>
          <select
            value={enquiryType}
            onChange={(e) => setEnquiryType(e.target.value as EnquiryType)}
            className={inputClass}
          >
            <option value="General Enquiry">General Enquiry</option>
            <option value="Inspection Request">Request Inspection</option>
            <option value="Agent Contact">Contact Agent</option>
          </select>
        </div>
      </div>

      {!defaultProperty && (
        <div>
          <label className={labelClass}>Property Interested In</label>
          {propertiesList.length > 0 ? (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className={inputClass}
            >
              <option value="">General Property Advisory / Multiple Listings</option>
              {propertiesList.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.title} — {prop.location}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customPropertyInterest}
              onChange={(e) => setCustomPropertyInterest(e.target.value)}
              placeholder="e.g. 4-Bedroom Duplex in Old GRA Port Harcourt or Lekki Phase 1"
              className={inputClass}
            />
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Message *</label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us your preferred location, budget, or inspection schedule..."
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] disabled:opacity-60 transition-colors"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
      </button>
    </form>
  );
}
