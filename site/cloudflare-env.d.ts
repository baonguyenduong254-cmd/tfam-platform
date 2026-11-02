declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    TFAM_ADMIN_USERNAME?: string;
    TFAM_ADMIN_PASSWORD_HASH?: string;
    BUCKET?: R2Bucket;
  }
}
