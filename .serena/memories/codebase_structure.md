# Codebase Structure

## Project Root Structure

```
apollo-cloudflare-react/
├── packages/               # Monorepo packages
│   ├── backend/           # Apollo GraphQL Server
│   ├── frontend/          # React SPA
│   └── images-worker/     # Image processing worker (new)
├── .claude/               # Claude-specific configs
├── .github/               # GitHub Actions workflows
├── .serena/               # Serena agent memory
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace config
├── package.json          # Root package scripts
├── CLAUDE.md             # Project documentation
└── README.md             # Project overview
```

## Backend Package Structure

```
packages/backend/
├── src/
│   ├── index.ts          # Cloudflare Workers entry point
│   ├── schema.ts         # Generated GraphQL schema
│   ├── gqlTypes.ts       # Generated GraphQL types
│   ├── db.ts            # Prisma client setup
│   ├── auth.ts          # Clerk JWT verification
│   ├── context.ts       # GraphQL context creation
│   ├── types.ts         # Common TypeScript types
│   │
│   ├── repositories/     # Data access layer
│   │   ├── article.ts   # ArticleRepository
│   │   ├── category.ts  # CategoryRepository
│   │   ├── image.ts     # ImageRepository (new)
│   │   └── user.ts      # UserRepository
│   │
│   ├── services/        # Business logic layer
│   │   ├── article.ts   # ArticleService
│   │   ├── category.ts  # CategoryService
│   │   └── user.ts      # UserService
│   │
│   ├── resolvers/       # GraphQL resolvers
│   │   ├── queries/     # Query resolvers
│   │   │   ├── article.ts
│   │   │   ├── category.ts
│   │   │   └── user.ts
│   │   ├── mutations/   # Mutation resolvers
│   │   │   ├── article.ts
│   │   │   └── user.ts
│   │   └── trivials/    # Field resolvers (lazy loading)
│   │       ├── article.ts
│   │       ├── imageArticle.ts
│   │       └── user.ts
│   │
│   └── errors/          # Error definitions
│       └── index.ts     # GraphQL error helpers
│
├── schema/              # GraphQL schema files
│   ├── schema.gql       # Combined schema (generated)
│   ├── Article.gql      # Article type definitions
│   ├── Category.gql     # Category definitions
│   ├── User.gql         # User definitions
│   └── image.gql        # Image definitions (new)
│
├── prisma/
│   └── schema.prisma    # Database schema
│
├── migrations/          # D1 SQL migrations
│   ├── 0001_init.sql
│   ├── 0002_add-category.sql
│   ├── 0003_user-sub.sql
│   ├── 0004_user-profile.sql
│   └── 0005_add-image-article-table.sql
│
├── scripts/             # Build scripts
│   └── generate-schema.js
│
├── wrangler.jsonc        # Cloudflare Workers config
├── .dev.vars           # Local environment variables
├── .env                # Prisma configuration
├── package.json        # Package scripts
├── tsconfig.json       # TypeScript config
└── codegen.yml         # GraphQL codegen config
```

## Frontend Package Structure

```
packages/frontend/
├── src/
│   ├── index.tsx        # React app entry
│   ├── App.tsx          # Main app component
│   ├── apollo.ts        # Apollo Client setup
│   │
│   ├── components/      # React components
│   │   ├── ui/         # Catalyst UI Kit components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (26 components total)
│   │   ├── AuthGuard.tsx
│   │   ├── ImageUpload.tsx (new)
│   │   └── Layout.tsx
│   │
│   ├── screens/         # Page components
│   │   ├── Home.tsx
│   │   ├── Articles.tsx
│   │   ├── CreateArticle.tsx
│   │   ├── Profile.tsx
│   │   └── SignIn.tsx
│   │
│   ├── generated-graphql/ # Generated GraphQL types
│   │   ├── graphql.ts
│   │   └── index.ts
│   │
│   ├── graphql/         # GraphQL queries/mutations
│   │   ├── queries/
│   │   └── mutations/
│   │
│   └── utils/           # Utility functions
│       └── (various utilities)
│
├── public/              # Static assets
├── wrangler.jsonc       # Workers config for static assets
├── vite.config.ts      # Vite build config
├── tailwind.config.js  # Tailwind CSS config
├── codegen.ts          # GraphQL codegen config
├── package.json        # Package scripts
├── tsconfig.json       # TypeScript config
├── .env                # Default environment
├── .env.development    # Development deployment
├── .env.staging        # Staging deployment
└── .env.production     # Production deployment
```

## Key Files to Know

### Configuration Files

- `turbo.json` - Defines build pipeline and task dependencies
- `pnpm-workspace.yaml` - Defines monorepo structure
- `wrangler.jsonc` - Cloudflare Workers deployment config
- `codegen.yml` - GraphQL code generation config

### Entry Points

- `packages/backend/src/index.ts` - Backend server entry
- `packages/frontend/src/index.tsx` - Frontend app entry

### Schema Files

- `packages/backend/prisma/schema.prisma` - Database schema
- `packages/backend/schema/*.gql` - GraphQL type definitions

### Generated Files (DO NOT EDIT)

- `packages/backend/src/schema.ts`
- `packages/backend/src/gqlTypes.ts`
- `packages/backend/schema/schema.gql`
- `packages/frontend/src/generated-graphql/`

## Package Dependencies

### Backend Key Dependencies

- @apollo/server - GraphQL server
- @as-integrations/cloudflare-workers - Apollo-Workers integration
- @prisma/client + @prisma/adapter-d1 - Database ORM
- @clerk/backend - Authentication
- wrangler - Cloudflare Workers CLI

### Frontend Key Dependencies

- react + react-dom - UI framework
- @apollo/client - GraphQL client
- @clerk/clerk-react - Authentication UI
- react-hook-form + zod - Form handling
- @headlessui/react - Accessible UI components
- tailwindcss - Styling

## Important Patterns

### Dependency Injection (Backend)

Services and repositories are instantiated in context.ts and passed through GraphQL context.

### Lazy Loading Relations

Related data is loaded on-demand using trivial resolvers rather than eager loading.

### Environment-Specific Configs

- Local: `.dev.vars` (backend), `.env` (frontend)
- Deployment: `wrangler.jsonc` environments, `.env.*` files

### Code Generation Flow

1. Define GraphQL schema in `.gql` files
2. Run `pnpm generate` to create TypeScript types
3. Types are shared between frontend and backend
