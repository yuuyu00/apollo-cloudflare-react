# Task Completion Checklist

## After Writing Code - MANDATORY Steps

### 1. Code Generation (if applicable)
If you modified any of these files, run code generation:
- GraphQL schema files (`*.gql`)
- Prisma schema (`schema.prisma`)

```bash
# Run from project root
pnpm generate
```

### 2. Type Checking
Always verify TypeScript types are correct:
```bash
pnpm type-check
```

### 3. Linting
Check for code style issues:
```bash
pnpm lint
```

### 4. Build Verification
Ensure the project builds successfully:
```bash
pnpm build
```

### 5. Database Migrations (if schema changed)
If you modified the Prisma schema:
```bash
cd packages/backend

# Create migration file
pnpm d1:migrations:create <descriptive_name>

# Apply to local database
pnpm d1:migrations:apply

# Apply to remote (if deploying)
pnpm d1:migrations:apply:remote
```

### 6. Test Locally
Start development servers and verify functionality:
```bash
# Start all services
pnpm dev

# Test the implemented feature manually
```

### 7. Review Changes
Before considering task complete:
- Check `git status` for unexpected changes
- Review `git diff` to ensure changes are correct
- Verify no sensitive information is exposed
- Ensure following project conventions

## Common Issues to Check

### TypeScript Errors
- No `any` types (except catch blocks with type guards)
- All imports resolve correctly
- Types match between frontend and backend

### GraphQL Issues
- Schema changes reflected in generated types
- Resolvers match schema definitions
- Frontend queries match backend schema

### Database Issues
- Migrations applied successfully
- Prisma client regenerated after schema changes
- No breaking changes to existing data

### Security Concerns
- No hardcoded secrets or API keys
- Input validation in place
- Permission checks implemented
- Error messages don't leak sensitive info

## When Task is BLOCKED

If you encounter blockers:
1. Document the specific error or issue
2. Check if it's a known limitation (Workers limits, D1 constraints)
3. Ask user for clarification if requirements unclear
4. Suggest alternative approaches if original plan not feasible

## Final Verification

Before marking task as complete, confirm:
- [ ] All requested functionality implemented
- [ ] Code follows project conventions
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual testing confirms feature works
- [ ] No regression in existing features
- [ ] Changes are ready for review

## Important Reminders

1. **NEVER commit unless explicitly asked** - User prefers to review first
2. **Always run lint and type-check** - These catch most issues
3. **Test the actual feature** - Don't assume it works
4. **Follow 2-layer architecture** - Repository → Service → Resolver
5. **Use proper error handling** - Never throw GraphQLError directly

If any step fails, fix the issue before considering task complete.