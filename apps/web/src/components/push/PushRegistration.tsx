'use client';

import { useEffect, useRef } from 'react';

import { isActingAsUser, useAuth } from '@nestlancer/auth';

import { apiServices } from '@/lib/axios';

/**
 * Registers web push when VAPID public key is configured (optional).
 */
export function PushRegistration() {
  const { isAuthenticated } = useAuth();
  const tried = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || tried.current || isActingAsUser()) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const key = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim();
    if (!key) {
      if (process.env.NODE_ENV === 'development') {
        console.info(
          '[PushRegistration] NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is not set — web push disabled.'
        );
      }
      return;
    }

    tried.current = true;

    void (async () => {
      try {
        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
          return outputArray;
        };
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
        await apiServices.push.registerWebPushSubscription({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          expirationTime: json.expirationTime ?? null,
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PushRegistration] Web push registration failed:', err);
        }
      }
    })();
  }, [isAuthenticated]);

  return null;
}
