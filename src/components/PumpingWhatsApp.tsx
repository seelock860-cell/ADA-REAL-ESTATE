import { buildWhatsAppUrl } from '../lib/formatters';

interface PumpingWhatsAppProps {
  message?: string;
}

export function PumpingWhatsApp({ message }: PumpingWhatsAppProps) {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3">
      <a
        href={buildWhatsAppUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with ADA REAL ESTATE on WhatsApp"
        className="group relative inline-flex items-center gap-2.5 bg-[#111111] border border-[#D4AF37]/70 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xl hover:border-[#D4AF37] transition-colors focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
      >
        {/* Pumping pulse ring behind button */}
        <span
          aria-hidden="true"
          className="animate-whatsapp-ring absolute inset-0 border border-[#25D366]/60 pointer-events-none"
        />

        {/* Pumping WhatsApp emblem */}
        <span className="animate-whatsapp-pump relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#25D366] text-white shrink-0 shadow-md">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 sm:w-5 sm:h-5"
            aria-hidden="true"
          >
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .1 5.37.1 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a11.9 11.9 0 0 0 5.84 1.49h.01c6.59 0 11.96-5.37 11.96-11.96 0-3.19-1.24-6.19-3.51-8.42ZM12.06 21.84h-.01a9.89 9.89 0 0 1-5.04-1.38l-.36-.21-3.69.97.99-3.6-.24-.37a9.89 9.89 0 0 1-1.52-5.29c0-5.47 4.45-9.92 9.93-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.91 7.01c0 5.47-4.46 9.92-9.98 9.88Zm5.44-7.43c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
          </svg>
        </span>

        <span className="hidden sm:flex flex-col text-left leading-tight pr-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-[#D4AF37] font-semibold">
            WhatsApp Concierge
          </span>
          <span className="text-xs font-medium text-neutral-100 whitespace-nowrap">
            Chat with ADA Now
          </span>
        </span>
      </a>
    </div>
  );
}
