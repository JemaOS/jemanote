// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { useEffect, useRef } from 'react';

/**
 * Widget CAPTCHA à seuil (Cloudflare Turnstile, hCaptcha compatible).
 *
 * Rendu uniquement après que l'edge function `auth-guard` a répondu
 * `CAPTCHA_REQUIRED` (échecs répétés). Sous le seuil : aucune friction.
 */

type CaptchaProvider = 'turnstile' | 'hcaptcha';

interface CaptchaApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: CaptchaApi;
    hcaptcha?: CaptchaApi;
  }
}

const SCRIPTS: Record<CaptchaProvider, { url: string; id: string; globalName: 'turnstile' | 'hcaptcha' }> = {
  turnstile: {
    url: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    id: 'jemanote-captcha-turnstile',
    globalName: 'turnstile',
  },
  hcaptcha: {
    url: 'https://js.hcaptcha.com/1/api.js?render=explicit',
    id: 'jemanote-captcha-hcaptcha',
    globalName: 'hcaptcha',
  },
};

const ENV = import.meta.env as Record<string, string | undefined>;

// Clé de SITE publique (Cloudflare Turnstile) — surchargeable par
// VITE_CAPTCHA_SITE_KEY. Ce n'est PAS un secret (elle est de toute façon
// exposée dans le bundle) ; sa présence en défaut garantit que le widget
// s'affiche même si l'env n'est pas injectée au build.
const DEFAULT_CAPTCHA_SITE_KEY = '0x4AAAAAAFYbIgdy41K_uPQL';
export const CAPTCHA_SITE_KEY = ENV.VITE_CAPTCHA_SITE_KEY || DEFAULT_CAPTCHA_SITE_KEY;
// Activé par défaut ; désactivable explicitement avec VITE_CAPTCHA_ENABLED=false.
export const CAPTCHA_ENABLED = (ENV.VITE_CAPTCHA_ENABLED ?? 'true') !== 'false';
const CAPTCHA_PROVIDER = (ENV.VITE_CAPTCHA_PROVIDER as CaptchaProvider) || 'turnstile';

const loadScript = (url: string, id: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = url;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load captcha script: ${url}`));
    document.head.appendChild(script);
  });

export interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  resetSignal?: number;
  theme?: 'auto' | 'light' | 'dark';
}

export function CaptchaWidget({ onVerify, onExpire, onError, resetSignal = 0, theme = 'auto' }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  const enabled = CAPTCHA_ENABLED && !!CAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!enabled) return;
    const conf = SCRIPTS[CAPTCHA_PROVIDER] || SCRIPTS.turnstile;
    let cancelled = false;

    const removeWidget = () => {
      const api = window[conf.globalName];
      if (api && widgetIdRef.current !== null) {
        try {
          api.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
    };

    loadScript(conf.url, conf.id)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const api = window[conf.globalName];
        if (!api) {
          onErrorRef.current?.();
          return;
        }
        removeWidget();
        containerRef.current.innerHTML = '';
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: CAPTCHA_SITE_KEY,
          theme,
          callback: (token: string) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => onErrorRef.current?.(),
        });
      })
      .catch(() => onErrorRef.current?.());

    return () => {
      cancelled = true;
      removeWidget();
    };
  }, [enabled, theme, resetSignal]);

  if (!enabled) return null;

  return <div ref={containerRef} className="flex w-full justify-center" data-testid="captcha-widget" />;
}

export default CaptchaWidget;
