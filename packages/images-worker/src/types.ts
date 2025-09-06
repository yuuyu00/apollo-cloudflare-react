export interface Env {
  IMAGES_BUCKET: R2Bucket;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_PEM_PUBLIC_KEY: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
}
