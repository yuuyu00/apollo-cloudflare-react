# Images Worker

This Cloudflare Worker handles image upload and retrieval for the Apollo Cloudflare React application.

## Features

### Image Upload (POST /upload)
- **Authentication Required**: Uses Clerk JWT for authentication
- **Supported Formats**: JPEG, JPG, PNG
- **Max File Size**: 1MB
- **Storage**: R2 bucket with path: `images/articles/{userId}/{uuid}.{ext}`

### Image Retrieval (GET /images/articles/{userId}/{filename})
- **No Authentication Required**: Public access for reading
- **URL Pattern**: `/images/articles/{userId}/{filename}.{ext}`
- **Query Parameters**:
  - `type`: Transformation type (`content` or `thumb`), defaults to `content`

#### Transformation Types

1. **Content** (for blog articles):
   - Width: 800px
   - Quality: 85
   - Format: auto (AVIF/WebP/JPEG based on browser support)
   - Fit: scale-down

2. **Thumb** (for thumbnails and OGP):
   - Width: 300px
   - Height: 200px
   - Quality: 80
   - Format: auto
   - Fit: cover

## Implementation Details

### Current Limitations

The current implementation serves images from R2 with optimization headers but doesn't perform actual image transformations. For full transformation capabilities:

1. Enable Cloudflare Polish on your zone for automatic optimization
2. Or add the Images binding for programmatic transformations (requires Images Paid subscription)

### Adding Images Binding (Optional)

To enable full image transformation capabilities, add this to your `wrangler.jsonc`:

```jsonc
{
  "images": {
    "binding": "IMAGES"
  }
}
```

Then update the `Env` interface in `src/types.ts`:

```typescript
export interface Env {
  IMAGES_BUCKET: R2Bucket;
  IMAGES?: ImagesBinding; // Add this line
  // ... other properties
}
```

### CDN Caching

All images are served with strong caching headers:
- `Cache-Control: public, max-age=31536000, immutable`
- `CDN-Cache-Control: max-age=31536000`

This ensures images are cached at the CDN edge for 1 year, reducing repeated transformations and improving performance.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Deploy to development environment
pnpm deploy:dev

# Deploy to production
pnpm deploy:prod
```

## Environment Variables

Required environment variables (set in `.dev.vars` for local development):

```env
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_PEM_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
CORS_ORIGIN=http://localhost:5000
```

For production, use `wrangler secret put` to set sensitive variables.

## Testing

### Upload an image (requires authentication):
```bash
curl -X POST https://your-worker.workers.dev/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@image.jpg"
```

### Retrieve an image:
```bash
# Get content-sized image
curl https://your-worker.workers.dev/images/articles/123/abc-def.jpg

# Get thumbnail
curl https://your-worker.workers.dev/images/articles/123/abc-def.jpg?type=thumb
```

## Security

- Upload requires JWT authentication via Clerk
- Images are publicly accessible once uploaded (no auth for GET)
- CORS is configured based on environment
- Security headers are applied to all responses