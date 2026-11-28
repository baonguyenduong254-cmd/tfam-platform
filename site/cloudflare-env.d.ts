declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    TFAM_ADMIN_USERNAME?: string;
    TFAM_ADMIN_PASSWORD_HASH?: string;
    BUCKET?: R2Bucket;
    GOOGLE_OAUTH_CLIENT_ID?: string;
    GOOGLE_OAUTH_CLIENT_SECRET?: string;
    PATREON_OAUTH_CLIENT_ID?: string;
    PATREON_OAUTH_CLIENT_SECRET?: string;
    PATREON_CAMPAIGN_ID?: string;
    PATREON_IMPERIAL_TIER_ID?: string;
    PATREON_WEBHOOK_SECRET?: string;
    PATREON_JOIN_URL?: string;
    WISE_PAYMENT_URL?: string;
    WISE_ACCOUNT_NOTE?: string;
    PAYMENTS_ENABLED?: string;
    TFAM_PUBLIC_ORIGIN?: string;
  }
}
