import config from './config.json';
/** Public build-time URL only. No bucket credentials belong in the application. */
export const MEDIA_BASE_URL=(process.env.NEXT_PUBLIC_MEDIA_BASE_URL||config.baseUrl).replace(/\/+$/,'');
