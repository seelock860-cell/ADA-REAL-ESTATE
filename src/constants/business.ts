export const BUSINESS_INFO = {
  name: 'ADA REAL ESTATE',
  phoneDisplay: '09020191763',
  phoneHref: 'tel:+2349020191763',
  whatsappNumber: '2349020191763',
  instagramHandle: '@ada_real_estate_',
  instagramUrl: 'https://www.instagram.com/ada_real_estate_/',
  locations: ['Port Harcourt, Rivers State', 'Lagos State, Nigeria'],
  cities: ['Port Harcourt', 'Lagos'],
  services: [
    {
      number: '01',
      title: 'Property Management',
      summary:
        'Comprehensive tenant vetting, rent administration, preventive facility maintenance, and transparent financial reporting for residential and commercial landlords.',
    },
    {
      number: '02',
      title: 'Property Sales',
      summary:
        'Verified title due diligence, private client advisory, strategic pricing, and end-to-end transaction execution across prime Port Harcourt and Lagos neighborhoods.',
    },
    {
      number: '03',
      title: 'Property Rentals',
      summary:
        'Curated executive leases, serviced apartments, and corporate housing with clear tenancy documentation and structured initial payment breakdowns.',
    },
    {
      number: '04',
      title: 'Property Development',
      summary:
        'Architectural planning, turnkey residential estates, and investment-grade urban developments built with durable engineering and timeless finishes.',
    },
  ],
} as const;

export const DEFAULT_CATEGORIES = [
  'Houses for Sale',
  'Houses for Rent',
  'Apartments',
  'Land for Sale',
  'Luxury Properties',
  'Commercial Properties',
  'Duplexes',
  'Terraced Houses',
] as const;

export const BRAND_IMAGES = {
  heroVilla: '/src/assets/images/hero_luxury_villa_1795102703672.jpg',
  aboutLounge: '/src/assets/images/about_architecture_lounge_1795102706138.jpg',
  estateDevelopment: '/src/assets/images/service_development_estate_1795102705679.jpg',
  lagosWaterfront: '/src/assets/images/lagos_skyline_waterfront_1795102705125.jpg',
} as const;
