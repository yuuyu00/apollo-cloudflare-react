# Development Commands Reference

## Essential Development Commands

### Starting Development
```bash
# Start all services (backend + frontend)
pnpm dev

# Start backend only (port 8787)
cd packages/backend && pnpm dev

# Start frontend only (port 5000)
cd packages/frontend && pnpm dev

# Test frontend Worker locally (port 3001)
cd packages/frontend && pnpm dev:worker
```

### Code Generation (IMPORTANT: Run after schema changes)
```bash
# Generate all (GraphQL types + Prisma client)
pnpm generate

# Backend generation sequence
cd packages/backend
pnpm generate  # Runs: prisma generate → GraphQL codegen → schema.ts generation

# Frontend generation (requires backend schema)
cd packages/frontend
pnpm generate
```

### Build & Type Checking
```bash
# Build all packages
pnpm build

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Database Operations (D1)
```bash
cd packages/backend

# Create new migration
pnpm d1:migrations:create <migration_name>

# Check migration status
pnpm d1:migrations:list          # Local unapplied
pnpm d1:migrations:list:remote   # Remote unapplied

# Apply migrations
pnpm d1:migrations:apply         # Apply locally
pnpm d1:migrations:apply:remote  # Apply to production

# Execute SQL queries
pnpm d1:execute --command "SELECT * FROM User;"         # Local
pnpm d1:execute:remote --command "SELECT * FROM User;"  # Remote

# Inspect data with convenience scripts
pnpm d1:show:users      # List users
pnpm d1:show:articles   # List articles
pnpm d1:show:categories # List categories
pnpm d1:show:tables     # List all tables

# Open Prisma Studio (visual DB browser)
pnpm prisma-studio
```

### Deployment
```bash
# Backend deployment
cd packages/backend
pnpm deploy:dev   # Deploy to development
pnpm deploy:prod  # Deploy to production

# Frontend deployment  
cd packages/frontend
pnpm deploy:dev   # Uses .env.development
pnpm deploy:prod  # Uses .env.production

# Set secret environment variables
cd packages/backend
pnpm wrangler secret put CLERK_SECRET_KEY
pnpm wrangler secret put CLERK_PEM_PUBLIC_KEY

# Check deployment logs
pnpm wrangler tail
```

### Testing
```bash
# Run tests (when available)
pnpm test

# No test suites currently configured
```

### Clean & Reset
```bash
# Clean all build artifacts and dependencies
pnpm clean

# Clear Turborepo cache
rm -rf .turbo packages/*/.turbo
```

## System Utilities (Darwin/macOS)

### Git Commands
```bash
git status              # Check current status
git diff               # Show unstaged changes
git add .              # Stage all changes
git commit -m "msg"    # Commit with message
git push               # Push to remote
git pull               # Pull from remote
git log --oneline -10  # Show recent commits
```

### File System Commands
```bash
ls -la                 # List all files with details
find . -name "*.ts"    # Find TypeScript files
grep -r "pattern" .    # Search for pattern
rg "pattern"           # Fast search with ripgrep
tree -L 2              # Show directory tree (2 levels)
```

### Process Management
```bash
lsof -i :8787          # Check what's using port 8787
kill -9 <PID>          # Force kill process
ps aux | grep node     # Find Node.js processes
```

## Important Notes

1. **Always run `pnpm generate` after:**
   - Modifying GraphQL schema files (*.gql)
   - Changing Prisma schema
   - Before building or deploying

2. **D1 Command Targets:**
   - No flag or `--local`: Executes against local DB
   - `--remote` flag: Executes against production DB

3. **Environment Variables:**
   - Backend: `.dev.vars` for local, `wrangler secret` for production
   - Frontend: `.env.*` files (loaded at build time)

4. **Database must be initialized:**
   - Run `pnpm dev` in backend at least once
   - Apply migrations before running application