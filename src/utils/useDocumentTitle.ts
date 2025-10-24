import { useEffect } from 'react';

/**
 * Hook to manage document title dynamically
 */
export function useDocumentTitle(title: string, subtitle?: string) {
  useEffect(() => {
    const fullTitle = subtitle ? `${title} - ${subtitle}` : title;
    document.title = fullTitle;
    
    // Update meta description if needed
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && subtitle) {
      metaDescription.setAttribute('content', subtitle);
    }
  }, [title, subtitle]);
}
