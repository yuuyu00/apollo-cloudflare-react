# Apollo Cloudflare React Stack - Project Information

This document consolidates the project configuration, development procedures, and frequently used commands.

## CRITICAL: Multi-Agent Task Decomposition Strategy

### MANDATORY: When to Use Multiple Agents

You MUST automatically decompose tasks and use multiple specialized agents when:
- Task spans multiple layers (infrastructure, backend, frontend)
- Creating new packages or workers
- Implementing features requiring database, API, and UI changes
- Task involves both configuration and implementation

### Agent Responsibility Matrix

#### infra-devops-developer
**MUST USE FOR:**
- Creating new Worker packages or any new packages under `packages/`
- Configuring `wrangler.toml`, `package.json`, `tsconfig.json`
- Setting up environment variables, build scripts, deployment configs
- Turborepo/pnpm workspace configuration
- R2 bucket, D1 database, or other Cloudflare service setup

#### backend-developer  
**MUST USE FOR:**
- Prisma schema modifications
- D1 migrations creation and application
- GraphQL schema definitions (`.gql` files)
- Repository pattern implementations
- Service layer business logic
- Resolver implementations
- Authentication/authorization logic

#### frontend-developer
**MUST USE FOR:**
- React component creation
- UI implementation with Catalyst UI Kit
- GraphQL client integration (Apollo Client)
- Form implementation (React Hook Form + Zod)
- State management
- Frontend routing
- Frontend environment variables

#### Reviewers & Validators
**MUST USE AFTER IMPLEMENTATION:**
- backend-reviewer: After backend changes
- frontend-reviewer: After frontend changes
- e2e-system-validator: After cross-package features

### Task Decomposition Template

When receiving a complex task, IMMEDIATELY decompose it as follows:

```yaml
# Example: "Add image upload feature"
parallel_phase_1:
  - agent: infra-devops-developer
    tasks: [create_worker_package, configure_r2]
  - agent: backend-developer
    tasks: [update_database_schema, create_migrations]
  - agent: frontend-developer
    tasks: [create_ui_components]

sequential_phase_2:
  - agent: backend-developer
    tasks: [implement_graphql_api]
    depends_on: [phase_1]
  - agent: frontend-developer
    tasks: [integrate_with_api]
    depends_on: [phase_1]

validation_phase_3:
  - agent: e2e-system-validator
    tasks: [verify_integration]
    depends_on: [phase_2]
```

### Execution Rules

1. **PARALLEL EXECUTION**: Always run independent tasks in parallel
2. **TASK GRANULARITY**: Each agent task should complete in <30 minutes
3. **EXPLICIT DEPENDENCIES**: Clearly define task dependencies
4. **ARTIFACT SHARING**: Agents communicate through created files/configs
5. **NO SINGLE-AGENT COMPLEX TASKS**: Never assign multi-layer tasks to one agent

### Common Patterns to ALWAYS Decompose

1. **New Feature Implementation**
   - infra: Package/config setup
   - backend: API implementation  
   - frontend: UI implementation
   - validator: Integration testing

2. **New Worker Creation**
   - infra: Package creation, wrangler config
   - backend: Business logic (if needed)
   - frontend: Environment variable updates

3. **Database Changes**
   - backend: Schema updates, migrations
   - backend: Repository/Service updates
   - frontend: GraphQL query updates

### Anti-Patterns to AVOID

❌ Assigning entire feature to backend-developer
❌ Sequential execution of independent tasks
❌ Vague task descriptions like "implement everything"
❌ Skipping validation agents after implementation

### AUTOMATIC DECOMPOSITION TRIGGER

When user request contains ANY of these keywords, MUST decompose:
- "feature", "implement", "add", "create worker"
- "upload", "authentication", "CRUD"
- Tasks mentioning both "backend" and "frontend"
- Tasks requiring new packages or services

### SPECIAL KEYWORD: "use-agents" - Orchestrated Multi-Agent Execution

When user includes "use-agents" in their request, follow this MANDATORY workflow:

1. **PLANNING PHASE** (You do this first):
   - Analyze the complete requirements
   - Create detailed implementation plan
   - Identify all necessary components
   - Map tasks to appropriate agents
   - Define dependencies and execution order
   - Present the plan to user in structured format

2. **TASK DECOMPOSITION** (After plan approval):
   ```yaml
   execution_plan:
     phase_1_parallel:
       - agent: infra-devops-developer
         tasks: [specific_task_1, specific_task_2]
         deliverables: [file_1, config_1]
       - agent: backend-developer
         tasks: [specific_task_3, specific_task_4]
         deliverables: [schema_1, migration_1]
     
     phase_2_sequential:
       - agent: frontend-developer
         tasks: [specific_task_5]
         depends_on: [phase_1.deliverables]
         deliverables: [component_1, integration_1]
     
     phase_3_validation:
       - agent: e2e-system-validator
         tasks: [integration_test, requirements_verification]
         depends_on: [all_previous_phases]
   ```

3. **EXECUTION** (Launch agents with specific instructions):
   - Each agent receives ONLY their specific tasks
   - Include context from previous phases
   - Specify expected deliverables
   - Set clear success criteria

4. **ORCHESTRATION BENEFITS**:
   - User visibility into execution plan
   - Optimal parallelization
   - Clear accountability per agent
   - Traceable deliverables
   - Coordinated error handling

**Example Usage**: "use-agents to implement user profile picture upload with image optimization"

This triggers:
1. First, present complete plan to user
2. Upon approval, execute via multiple specialized agents
3. Coordinate results and validate integration

---

## Project Overview

- **Technology Stack**:
  - Backend: Apollo Server on Cloudflare Workers + D1
  - Frontend: React SPA on Cloudflare Workers (Static Assets)
  - Auth: Clerk Auth
- **Monorepo Management**: Turborepo + pnpm workspaces
- **Package Manager**: pnpm v8.14.0
- **Node.js Version**: v22.11.0 (LTS)
- **Wrangler Version**: v4.20.0 (IMPORTANT: v4 compatible)

## Directory Structure

```
apollo-cloudflare-react/
├── packages/
│   ├── backend/          # Apollo Server (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts         # Cloudflare Workers entry point
│   │   │   ├── schema.ts        # GraphQL schema (auto-generated)
│   │   │   ├── db.ts           # Prisma D1 configuration
│   │   │   ├── auth.ts         # JWT authentication (Clerk Auth)
│   │   │   ├── context.ts      # GraphQL context
│   │   │   ├── types.ts        # Common type definitions
│   │   │   ├── gqlTypes.ts     # GraphQL type definitions (auto-generated)
│   │   │   ├── repositories/   # Data access layer
│   │   │   │   ├── article.ts  # ArticleRepository
│   │   │   │   ├── category.ts # CategoryRepository
│   │   │   │   └── user.ts     # UserRepository
│   │   │   ├── services/       # Business logic layer
│   │   │   │   ├── article.ts  # ArticleService
│   │   │   │   ├── category.ts # CategoryService
│   │   │   │   └── user.ts     # UserService
│   │   │   ├── errors/         # Common error definitions
│   │   │   │   └── index.ts    # GraphQL Error extensions
│   │   │   └── resolvers/      # GraphQL resolvers
│   │   │       ├── queries/    # Query resolvers
│   │   │       ├── mutations/  # Mutation resolvers
│   │   │       └── trivials/   # Field resolvers (lazy loading relations)
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Prisma schema
│   │   ├── migrations/          # D1 migrations
│   │   │   └── 0001_init.sql
│   │   ├── schema/              # GraphQL schema definitions
│   │   │   └── *.gql
│   │   ├── scripts/             # Build scripts
│   │   │   └── generate-schema.js
│   │   ├── wrangler.toml        # Wrangler v4 configuration
│   │   ├── .dev.vars           # Local development environment variables
│   │   └── .env                # Prisma CLI configuration
│   └── frontend/                # React + Vite (Cloudflare Workers Static Assets)
│       ├── src/
│       ├── wrangler.toml        # Workers configuration
│       ├── .env                # Local development
│       ├── .env.development     # Development deployment
│       └── .env.production      # Production deployment
├── turbo.json                   # Turborepo configuration
├── pnpm-workspace.yaml          # pnpm workspaces configuration
├── .npmrc                       # pnpm configuration
├── CLAUDE.md                    # Project documentation
└── CLOUDFLARE_MIGRATION_TODO.md # Migration plan
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

**Backend (.env)**

```bash
# packages/backend/.env
DATABASE_URL="file:./dev.db"  # Dummy URL for Prisma CLI
```

**Backend (.dev.vars)**

```bash
# packages/backend/.dev.vars
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_PEM_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQE...\n-----END PUBLIC KEY-----
GRAPHQL_INTROSPECTION=true
GRAPHQL_PLAYGROUND=true
CORS_ORIGIN=http://localhost:5000
```

**Note**: CLERK_PEM_PUBLIC_KEY is obtained from Clerk Dashboard > API Keys > Show JWT Public Key > PEM Public Key.

**Frontend Environment Variables**

Vite loads environment variable files in the following priority:
1. `.env.local` - Highest priority in all environments (gitignored)
2. `.env.[mode]` - Mode-specific files (e.g., .env.development)
3. `.env` - Default settings

**Frontend (.env)**

```bash
# packages/frontend/.env
# Default settings (local development)
VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

**Frontend (.env.development)**

```bash
# packages/frontend/.env.development
# For development deployment (pnpm deploy:dev)
VITE_GRAPHQL_ENDPOINT=https://apollo-cloudflare-api.your-subdomain.workers.dev/graphql
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

**Frontend (.env.production)**

```bash
# packages/frontend/.env.production
# For production deployment (pnpm deploy:prod)
VITE_GRAPHQL_ENDPOINT=https://apollo-cloudflare-api-prod.your-subdomain.workers.dev/graphql
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

**Frontend (.env.local)**

```bash
# packages/frontend/.env.local (optional)
# Override default settings in local development
# This file is gitignored, ideal for personal settings
VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
```

### 3. D1 Database Setup

```bash
# Create D1 database (first time only)
cd packages/backend
pnpm wrangler d1 create apollo-cloudflare-db

# Update database_id in wrangler.toml with the ID displayed during creation
# database_id = "c370ca69-c11d-4d00-9fd0-b7339850fd30"

# Check migration status
pnpm d1:migrations:list                     # Unapplied local migrations
pnpm d1:migrations:list:remote              # Unapplied remote (production) migrations

# Apply migrations
pnpm d1:migrations:apply                    # Apply to local
pnpm d1:migrations:apply:remote             # Apply to remote (production)

# Verify tables
pnpm d1:execute --command "SELECT name FROM sqlite_master WHERE type='table';"  # Local
pnpm d1:execute:remote --command "SELECT name FROM sqlite_master WHERE type='table';"  # Remote
```

## Common Commands

### Development

```bash
# Start all development servers
pnpm dev

# Start Backend (Cloudflare Workers) only
cd packages/backend && pnpm dev

# Start Frontend only
cd packages/frontend && pnpm dev

# Test Frontend Worker locally (port 3001)
cd packages/frontend && pnpm dev:worker
```

### Build & Type Check

```bash
# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

### Code Generation

```bash
# Generate GraphQL types and Prisma client (from root)
pnpm generate

# Backend generation process
cd packages/backend
pnpm generate  # Runs the following:
# 1. pnpm generate:prisma    - Generate Prisma client
# 2. pnpm generate:codegen   - Generate GraphQL types
# 3. pnpm generate:schema    - Generate schema.ts (for Workers)

# Frontend generation process
cd packages/frontend
pnpm generate  # Generate GraphQL client code
```

**Note**: Frontend codegen directly references Backend's `schema/schema.gql`, so you must run `pnpm generate` in Backend first.

### Database Operations

```bash
cd packages/backend

# Generate client from Prisma schema
pnpm prisma generate

# D1 migration commands (using package.json scripts)
pnpm d1:migrations:create <migration_name>  # Create new migration
pnpm d1:migrations:list                     # List unapplied local migrations
pnpm d1:migrations:list:remote              # List unapplied remote (production) migrations
pnpm d1:migrations:apply                    # Apply to local
pnpm d1:migrations:apply:remote             # Apply to remote (production)

# D1 migration flags explained:
# - No flag or --local (default): Execute against local DB (used by wrangler dev)
# - --remote: Execute against remote production DB

# Execute SQL
pnpm d1:execute --file ./migrations/0001_init.sql           # Execute file locally
pnpm d1:execute --command "SELECT * FROM User;"             # Execute command locally
pnpm d1:execute:remote --file ./migrations/0001_init.sql    # Execute file remotely
pnpm d1:execute:remote --command "SELECT * FROM User;"      # Execute command remotely

# Check database info
pnpm wrangler d1 info apollo-cloudflare-db
```

### Inspecting D1 Local Database

While Prisma Studio doesn't directly support D1, you can inspect data using these methods:

#### 1. Wrangler D1 Commands (Recommended)

```bash
cd packages/backend

# Convenient scripts for data inspection
pnpm d1:show:users      # List users
pnpm d1:show:articles   # List articles with author names
pnpm d1:show:categories # List categories
pnpm d1:show:tables     # List tables

# Execute arbitrary SQL queries
pnpm d1:execute --command "SELECT * FROM User WHERE email LIKE '%@example.com';"
```

#### 2. Direct SQLite Tool Access

D1 local databases are stored as SQLite files:

```bash
# Find database file location
find .wrangler -name "*.sqlite" -type f

# Open with SQLite CLI (example)
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite

# SQLite commands
.tables              # List tables
.schema User         # Show User table schema
SELECT * FROM User;  # View data
.quit               # Exit
```

#### 3. GUI SQLite Tools

Open SQLite files visually with:
- **TablePlus** (macOS/Windows/Linux)
- **DB Browser for SQLite** (Free)
- **VS Code Extension**: SQLite Viewer

#### 4. Prisma Studio (Recommended)

D1 databases can be used with Prisma Studio:

```bash
cd packages/backend

# Start Prisma Studio
pnpm prisma-studio

# Open http://localhost:5555 in browser
```

**Note**: 
- D1 database must be initialized with `pnpm dev` beforehand
- Database file may be locked while Prisma Studio is running

### Deployment

#### Backend (Apollo Server)

```bash
cd packages/backend

# Local development server (http://localhost:8787)
pnpm dev  # or pnpm wrangler dev

# Deploy to development
pnpm deploy:dev  # or pnpm wrangler deploy

# Deploy to production
pnpm deploy:prod  # or pnpm wrangler deploy --env production

# Set secret environment variables
pnpm wrangler secret put CLERK_SECRET_KEY
pnpm wrangler secret put CLERK_PEM_PUBLIC_KEY

# Check logs
pnpm wrangler tail

# Workers configuration checks
pnpm wrangler whoami      # Check login status
pnpm wrangler config list  # List configurations
```

#### Frontend (React SPA)

```bash
cd packages/frontend

# Deploy to development
pnpm deploy:dev   # Uses .env.development for build

# Deploy to production
pnpm deploy:prod  # Uses .env.production for build

# Deployment URLs
# Development: https://apollo-cloudflare-frontend.your-subdomain.workers.dev
# Production: https://apollo-cloudflare-frontend-prod.your-subdomain.workers.dev
```

## Wrangler v4 Compatibility

### Important Changes

1. **node_compat → nodejs_compat**
   - `node_compat = true` is deprecated
   - Use `compatibility_flags = ["nodejs_compat"]`

2. **Removed Settings**
   - `[upload]` section
   - `[build].watch_paths`
   - `[tsconfig]` section (managed in tsconfig.json)

3. **Entry Point**
   - `src/index.ts` is required (Cloudflare Workers format)
   - Express-style `server.ts` cannot be used
   - Must `export default` fetch handler

4. **Apollo Server Integration**
   - Uses `@as-integrations/cloudflare-workers`
   - Database connection via Prisma D1 Adapter

## Turborepo Configuration

This project manages the monorepo using Turborepo v2 + pnpm workspaces.

### Main Tasks (turbo.json)

- **build**: Build all packages including dependencies
- **dev**: Start development servers (cache disabled, persistent)
- **generate**: Generate GraphQL schemas and code
- **type-check**: Type checking (depends on generate task)
- **lint**: Code linting
- **deploy:dev/prod**: Deployment (depends on build)

### pnpm workspaces Integration

- Package locations defined in `pnpm-workspace.yaml`
- Run specific package tasks with `pnpm --filter` command
- Dependencies within workspace are automatically resolved

### Running Turborepo

```bash
# Run tasks for all packages from root
pnpm build              # turbo run build
pnpm dev                # turbo run dev
pnpm generate           # turbo run generate

# Run tasks for specific packages
pnpm --filter @apollo-cloudflare-react/backend build
pnpm --filter @apollo-cloudflare-react/frontend dev

# Clear Turborepo cache
rm -rf .turbo packages/*/.turbo
```

### Turborepo Benefits

- **Fast Task Execution**: Intelligent caching system
- **Parallel Execution**: Optimal execution order based on dependencies
- **Incremental Builds**: Only rebuild changed packages

## Catalyst UI Kit (Tailwind UI Components)

### Overview

Catalyst is a modern UI kit developed by the Tailwind CSS team, providing 26 React components. Located in `packages/frontend/src/components/ui/` for frontend development use.

### Available Components

#### Basic Elements
- **Button**: Primary, secondary, ghost variations
- **Input**: Text input fields
- **Badge**: Status or label display
- **Avatar**: User avatar display
- **Text/Heading**: Typography components

#### Form Controls
- **Checkbox/Radio**: Selection controls
- **Switch**: Toggle switches
- **Textarea**: Multi-line text input
- **Field/FieldGroup/Label**: Form structure components

#### Navigation
- **Sidebar/Navbar**: Application navigation
- **Dropdown**: Dropdown menus
- **Pagination**: Page navigation

#### Layouts
- **SidebarLayout**: Layout with sidebar
- **StackedLayout**: Stacked layout
- **AuthLayout**: Authentication screen layout

#### Overlays
- **Dialog**: Modal dialogs
- **Alert**: Alert displays

#### Data Display
- **Table**: Table component
- **DescriptionList**: Description lists
- **Listbox/Combobox**: Selection lists

### Usage

```jsx
// Import components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, Label } from '@/components/ui/fieldset'

// Usage example
function ExampleForm() {
  return (
    <form>
      <FieldGroup>
        <Field>
          <Label>Name</Label>
          <Input name="name" placeholder="John Doe" />
        </Field>
        <Field>
          <Label>Email</Label>
          <Input type="email" name="email" placeholder="email@example.com" />
        </Field>
        <Button type="submit">Save</Button>
      </FieldGroup>
    </form>
  )
}
```

### Technical Specifications

- **Tailwind CSS**: v4.0+ required
- **Dependencies**: 
  - `@headlessui/react`: Accessibility-ready UI primitives
  - `framer-motion`: Animations
  - `clsx`: Conditional class name joining

### Development Tips

1. **Customizability**: Easy style adjustments with Tailwind utility classes
2. **Accessibility**: Keyboard operation and screen reader support
3. **TypeScript Support**: Type-safe development
4. **Consistency**: Unified UI as a design system

### GraphQL Integration Example

```jsx
import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function ArticleManager() {
  const [isOpen, setIsOpen] = useState(false)
  const { data, loading } = useQuery(GET_ARTICLES)
  const [createArticle] = useMutation(CREATE_ARTICLE)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create New Article</Button>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Title</TableHeader>
            <TableHeader>Created</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.articles.map(article => (
            <TableRow key={article.id}>
              <TableCell>{article.title}</TableCell>
              <TableCell>{article.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Create New Article</DialogTitle>
        <DialogBody>
          Enter article title and content
          {/* Form implementation */}
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
```

### Best Practices

1. **Component Composition**: Build complex UIs by combining small components
2. **Maintain Consistency**: Create custom components based on Catalyst components
3. **Accessibility First**: Leverage provided accessibility features
4. **Performance**: Import only necessary components

### Reference Links

- [Catalyst Documentation](https://catalyst.tailwindui.com/docs)
- [Headless UI](https://headlessui.dev)
- [Framer Motion](https://www.framer.com/docs/)

## Troubleshooting

### pnpm generate Errors

1. Verify Node.js version is 22.11.0
2. Check `packages/backend/.env` has `DATABASE_URL="file:./dev.db"`
3. Run `pnpm prisma generate` first

### D1 Migration Failures

```bash
# Check existing tables
pnpm wrangler d1 execute apollo-cloudflare-db --command "SELECT name FROM sqlite_master WHERE type='table';"

# Drop existing tables and retry
pnpm wrangler d1 execute apollo-cloudflare-db --command "DROP TABLE IF EXISTS User, Article, Category, _ArticleToCategory;"
```

### Specifying D1 Command Target Environment

D1 commands execute against local DB by default:

- **Local**: No flag or `--local` flag (default)
- **Remote (Production)**: Explicitly add `--remote` flag

```bash
# Example: Applying migrations
pnpm d1:migrations:apply         # Local (default)
pnpm d1:migrations:apply:remote  # Remote production (--remote)
```

### Type Errors

```bash
# Clean up generated files
rm -rf packages/backend/src/gqlTypes.ts
rm -rf packages/frontend/src/generated-graphql

# Regenerate
pnpm generate
```

## Simple 2-Layer Architecture Design

The Backend of this project uses a simple 2-layer architecture suitable for the project scale.

### Layer Structure

1. **Repositories Layer** (`src/repositories/`)
   - **Responsibility**: Pure database operations
   - Thin wrapper around Prisma client
   - Returns Prisma models as-is (no type conversion)
   - Can freely add business-specific methods

2. **Services Layer** (`src/services/`)
   - **Responsibility**: Business logic
   - Permission checks
   - Input validation
   - Error handling
   - Multiple repository coordination

3. **Resolvers Layer** (`src/resolvers/`)
   - **queries/**: Query resolvers
   - **mutations/**: Mutation resolvers
   - **trivials/**: Field resolvers (lazy loading relations)

### Implementation Examples

```typescript
// Repository - Data access
export class ArticleRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: number): Promise<Article | null> {
    return this.prisma.article.findUnique({ where: { id } });
  }
  
  // Business-specific methods
  async findPublishedByUserId(userId: number): Promise<Article[]> {
    return this.prisma.article.findMany({
      where: { userId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }
    });
  }
}

// Service - Business logic
export class ArticleService {
  async updateArticle(
    id: number,
    input: UpdateInput,
    userId: number
  ): Promise<Article> {
    const article = await this.articleRepo.findById(id);
    
    // Permission check
    if (article.userId !== userId) {
      throw new GraphQLError("You don't have permission");
    }
    
    return this.articleRepo.update(id, input);
  }
}

// Resolver - GraphQL interface
export const updateArticle = async (_parent, { input }, { services, user }) => {
  const authenticatedUser = requireAuth(user);
  // Get userId from Clerk publicMetadata (no DB access)
  return services.article.updateArticle(input.id, input, authenticatedUser.userId);
};

// Trivial Resolver - Lazy loading relations
export const Article: ArticleResolvers = {
  categories: async (parent, {}, { prisma }) => {
    const categories = await prisma.article
      .findUnique({ where: { id: parent.id } })
      .categories();
    return categories || [];
  }
};
```

### Error Handling

```typescript
// errors/index.ts
import { GraphQLError } from "graphql";

export function notFoundError(resource: string, id: string) {
  return new GraphQLError(`${resource} with ID ${id} not found`, {
    extensions: { code: 'NOT_FOUND' }
  });
}
```

## Coding Rules

### Comment Guidelines

**Avoid Obvious Comments**:
```typescript
// ❌ Bad examples
const user = await getUser(); // Get user
if (!user) { // If user doesn't exist
  throw new Error(); // Throw error
}

// ❌ Bad example
// Authentication required
const authenticatedUser = requireAuth(user);

// ❌ Bad example
// Create DI container
const container = createContainer(prisma);
```

**Good Comments (Explain Why/Intent)**:
```typescript
// ✅ Good examples
// Consider Worker execution time limit (30 seconds)
const TIMEOUT_MS = 25000;

// ✅ Good example
// Clerk JWT sub claim format is user_xxx
// Need to match against Prisma User.sub
const dbUser = await getUserBySub(authUser.sub);

// ✅ Good example
/**
 * Check article update permissions
 * - Only article creator can edit
 * - Admin permissions to be added later
 */
```

### General Coding Rules

1. **TypeScript Usage**
   - **`any` type is prohibited** - Use proper type definitions
     - Exception: Only in catch clauses with type guards
   - No explicit type annotations when inference works
   - Use unknown type and narrow with type guards

2. **Error Handling**
   - **Never throw GraphQLError directly** - Always use error functions from `src/errors/index.ts`
     - `notFoundError()` - Resource not found
     - `validationError()` - Validation errors
     - `forbiddenError()` - No permission
   - Use `ERROR_CODES` constants for error codes
   - Write specific error messages

3. **Function/Variable Names**
   - Use clear, intentional names
   - Avoid abbreviations (e.g., `usr` → `user`)

4. **Async Processing**
   - Use `async/await`
   - Properly catch and handle errors

## Development Flow

1. **Feature Development**
   - Update GraphQL schema (`packages/backend/schema/*.gql`)
   - Generate types with `pnpm generate`
   - Implement services (business logic)
   - Implement repositories (if needed)
   - Implement resolvers (keep thin)
   - Implement frontend

2. **Database Changes**
   - Update Prisma schema (`packages/backend/prisma/schema.prisma`)
   - Create migration files (`packages/backend/migrations/`)
   - Apply to remote with `pnpm d1:migrations:apply:remote`
   - Apply to local with `pnpm d1:migrations:apply`
   - Update client with `pnpm prisma generate`

3. **Deployment**
   - Verify build with `pnpm build`
   - Type check with `pnpm type-check`
   - Backend: `pnpm deploy:dev` (development) or `pnpm deploy:prod` (production)
   - Frontend: `pnpm deploy:dev` (development) or `pnpm deploy:prod` (production)

## Important Notes

- D1 is SQLite-based, so some PostgreSQL/MySQL-specific features are unavailable
- Cloudflare Workers have execution time and memory limits (relaxed with paid plans)
- Environment variable management:
  - Backend: `.dev.vars` (local), `wrangler secret` (production secrets)
  - Frontend: `.env` files (used at build time)
- Never directly edit auto-generated files:
  - `src/gqlTypes.ts` - GraphQL type definitions
  - `src/schema.ts` - Workers schema
  - `schema/schema.gql` - Combined schema
  - `src/generated-graphql/` - Frontend GraphQL types
- Wrangler v4 deprecated `node_compat`, use `nodejs_compat`
- File system APIs are unavailable (Workers environment)
- **Frontend (Static Assets) delivery is free** (no Worker script execution)

## Workers Static Assets Configuration

Important Frontend `wrangler.toml` settings:

```toml
# Cloudflare Workers with Static Assets configuration
name = "apollo-cloudflare-frontend"
compatibility_date = "2024-11-25"

# Static Assets (No Worker script = Free delivery)
assets = { directory = "./dist", not_found_handling = "single-page-application" }

# Production environment
[env.production]
name = "apollo-cloudflare-frontend-prod"
```

- `not_found_handling = "single-page-application"`: SPA routing support
- No `main` Worker script specified: Static assets only for free delivery

## Reference Links

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Prisma D1 Adapter](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Apollo Server Cloudflare](https://www.apollographql.com/docs/apollo-server/deployment/cloudflare-workers)
- [Clerk Auth](https://clerk.com/docs)