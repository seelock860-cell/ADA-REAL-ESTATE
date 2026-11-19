import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  image?: string;
}

export function SeoHead({ title, description, image }: SeoHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes('ADA REAL ESTATE') ? title : `${title} | ADA REAL ESTATE`;
    document.title = fullTitle;

    const updateMeta = (selector: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute('content', content);
    };

    updateMeta('meta[name="description"]', description);
    updateMeta('meta[property="og:title"]', fullTitle);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[name="twitter:title"]', fullTitle);
    updateMeta('meta[name="twitter:description"]', description);

    if (image) {
      let ogImg = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      ogImg.setAttribute('content', image);
    }

    const currentUrl = window.location.origin + window.location.pathname;
    let ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', currentUrl);
  }, [title, description, image]);

  return null;
}
