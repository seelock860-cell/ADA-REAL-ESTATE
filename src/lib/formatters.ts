import { BUSINESS_INFO } from '../constants/business';

export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '₦0';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function buildWhatsAppUrl(customMessage?: string): string {
  const defaultMsg =
    'Hello ADA REAL ESTATE, I would like to make an enquiry regarding your available properties in Port Harcourt / Lagos.';
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${text}`;
}

export function buildPropertyWhatsAppUrl(property: {
  title: string;
  location: string;
  price?: number;
}): string {
  const priceText = property.price ? ` listed at ${formatNaira(property.price)}` : '';
  const message = `Hello ADA REAL ESTATE, I am interested in "${property.title}" located at ${property.location}${priceText}. Please share further details and inspection availability.`;
  return buildWhatsAppUrl(message);
}

export function formatDateShort(dateString: string): string {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
