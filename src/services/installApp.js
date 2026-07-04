import { Platform } from 'react-native';

let deferredPrompt = null;

if (typeof window !== 'undefined') {
  deferredPrompt = window.__deferredPrompt || null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.__deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__deferredPrompt = null;
  });
}

export function canInstall() {
  if (typeof window === 'undefined') return false;
  if (Platform.OS !== 'web') return false;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    false;
  return !isStandalone;
}

export async function tryInstall() {
  const prompt = deferredPrompt || window.__deferredPrompt || null;
  if (prompt) {
    prompt.prompt();
    const result = await prompt.userChoice;
    deferredPrompt = null;
    window.__deferredPrompt = null;
    return result.outcome === 'accepted';
  }
  return false;
}

export function isRunningStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    false
  );
}

export function hasDeferredPrompt() {
  return !!(deferredPrompt || window.__deferredPrompt);
}

export function getBrowser() {
  if (typeof window === 'undefined') return Platform.OS;
  const ua = window.navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/i.test(ua) && !window.MSStream) return 'ios';
  return 'web';
}
