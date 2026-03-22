import { useEffect, useState } from 'react';

/**
 * Simple hook to detect mobile screens using a max-width media query (sm breakpoint)
 */
export default function useIsMobile(breakpoint = 640) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handler);
    } else {
      // Safari fallback
      // @ts-ignore
      mq.addListener(handler);
    }
    setIsMobile(mq.matches);
    return () => {
      if ('removeEventListener' in mq) {
        mq.removeEventListener('change', handler);
      } else {
        // @ts-ignore
        mq.removeListener(handler);
      }
    };
  }, [query]);

  return isMobile;
}
