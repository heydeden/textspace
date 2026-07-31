'use client';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({ onToken, resetKey = 0 }: { onToken: (token: string) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !ref.current) return;

    const render = () => {
      if (!window.turnstile || !ref.current) return;
      if (widgetId.current) {
        window.turnstile.reset(widgetId.current);
        return;
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        size: 'invisible',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/api.js?render=explicit';
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey === 0) return;
    if (window.turnstile && widgetId.current) {
      window.turnstile.reset(widgetId.current);
      onTokenRef.current('');
    }
  }, [resetKey]);

  return <div ref={ref} />;
}
