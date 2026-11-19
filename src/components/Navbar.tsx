import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleServicesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('our-services');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#our-services');
    }
  };

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Properties', to: '/properties' },
    { label: 'For Sale', to: '/properties?status=sale' },
    { label: 'For Rent', to: '/properties?status=rent' },
    { label: 'Our Services', to: '/#our-services', onClick: handleServicesClick },
    { label: 'Contact Us', to: '/contact' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    if (to.startsWith('/properties?status=sale')) {
      return location.pathname === '/properties' && location.search.includes('status=sale');
    }
    if (to.startsWith('/properties?status=rent')) {
      return location.pathname === '/properties' && location.search.includes('status=rent');
    }
    if (to === '/properties') {
      return location.pathname === '/properties' && !location.search.includes('status=');
    }
    return location.pathname === to;
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <span className="w-7 h-7 border border-[#D4AF37] flex items-center justify-center text-xs font-serif font-bold tracking-wider text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-neutral-950 transition-colors duration-200">
            A
          </span>
          <span className="font-serif text-lg sm:text-xl font-semibold tracking-[0.14em] text-white">
            ADA REAL ESTATE
          </span>
        </Link>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium tracking-wide">
          {navItems.map((item) =>
            item.onClick ? (
              <a
                key={item.label}
                href={item.to}
                onClick={item.onClick}
                className="whitespace-nowrap shrink-0 text-neutral-300 hover:text-[#D4AF37] transition-colors py-1"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b ${
                  isActive(item.to)
                    ? 'text-[#D4AF37] border-[#D4AF37]'
                    : 'text-neutral-300 border-transparent hover:text-white hover:border-neutral-600'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Zone 3: Primary CTA + Mobile Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/properties"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-xs font-semibold tracking-wider uppercase bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276] transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Get Started
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 text-neutral-200 hover:text-[#D4AF37] transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-neutral-950 border-t border-neutral-800 px-4 py-5 space-y-1">
          {navItems.map((item) =>
            item.onClick ? (
              <a
                key={item.label}
                href={item.to}
                onClick={item.onClick}
                className="block px-3 py-3 text-sm font-medium text-neutral-200 hover:text-[#D4AF37] border-b border-neutral-900"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-3 text-sm font-medium border-b border-neutral-900 ${
                  isActive(item.to) ? 'text-[#D4AF37]' : 'text-neutral-200 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="pt-4 flex flex-col gap-2.5">
            <Link
              to="/properties"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center px-5 py-3 text-xs font-semibold tracking-wider uppercase bg-[#D4AF37] text-neutral-950"
            >
              Get Started
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center px-5 py-3 text-xs font-medium tracking-wider uppercase border border-neutral-700 text-neutral-300 hover:text-white"
            >
              Administrator Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
