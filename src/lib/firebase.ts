import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics, logEvent, EventParams } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App singleton safely (prevents HMR re-initialization)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

/**
 * Safely initializes and retrieves the Firebase Analytics instance on the client side.
 */
export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
        return analyticsInstance;
      }
      return null;
    });
  }

  return analyticsPromise;
};

/**
 * Safely logs custom analytics events across client-side components.
 * 
 * @param eventName Name of the custom event (e.g. 'video_download', 'page_view')
 * @param eventParams Additional parameters associated with the event
 */
export const trackEvent = async (
  eventName: string,
  eventParams?: EventParams
): Promise<void> => {
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (error) {
    console.error(`[Firebase Analytics] Failed to log event "${eventName}":`, error);
  }
};

export { app };