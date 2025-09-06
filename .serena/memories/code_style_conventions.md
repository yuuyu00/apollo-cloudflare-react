# Code Style and Conventions

## TypeScript Standards

### Type Safety
- **NEVER use `any` type** - Use proper type definitions
  - Exception: Only in catch clauses with proper type guards
- Use `unknown` type and narrow with type guards when type is uncertain
- No explicit type annotations when TypeScript can infer
- All functions must have typed parameters and return types

### Naming Conventions
- **Variables/Functions**: camelCase (e.g., `getUserById`, `articleData`)
- **Classes/Types/Interfaces**: PascalCase (e.g., `ArticleRepository`, `UpdateArticleInput`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ERROR_CODES`, `MAX_RETRIES`)
- **Files**: 
  - Components: PascalCase (e.g., `ArticleList.tsx`)
  - Others: camelCase (e.g., `article.ts`, `auth.ts`)
- Avoid abbreviations - use clear, intentional names (`user` not `usr`)

## Comment Guidelines

### Avoid Obvious Comments
```typescript
// ❌ BAD - States the obvious
const user = await getUser(); // Get user
if (!user) { // If user doesn't exist
  throw new Error(); // Throw error
}
```

### Good Comments Explain Why/Intent
```typescript
// ✅ GOOD - Explains reasoning
// Worker execution time limit is 30 seconds, set timeout to 25s for safety
const TIMEOUT_MS = 25000;

// ✅ GOOD - Explains non-obvious behavior
// Clerk JWT sub claim format is user_xxx
// Need to match against Prisma User.sub field
const dbUser = await getUserBySub(authUser.sub);
```

## Error Handling

### GraphQL Errors
- **NEVER throw GraphQLError directly**
- Always use error functions from `src/errors/index.ts`:
  - `notFoundError()` - Resource not found
  - `validationError()` - Input validation failures
  - `forbiddenError()` - Permission denied
  - `unauthorizedError()` - Authentication required

### Error Messages
- Be specific and actionable
- Include relevant context (IDs, resource names)
- Use consistent error codes from `ERROR_CODES` constants

## Architecture Patterns

### Repository Pattern
```typescript
// Repositories: Pure database operations
export class ArticleRepository {
  constructor(private prisma: PrismaClient) {}
  
  // Simple, direct database access
  async findById(id: number): Promise<Article | null> {
    return this.prisma.article.findUnique({ where: { id } });
  }
}
```

### Service Pattern
```typescript
// Services: Business logic and validation
export class ArticleService {
  async updateArticle(id: number, input: UpdateInput, userId: number) {
    // Permission check
    const article = await this.articleRepo.findById(id);
    if (article.userId !== userId) {
      throw forbiddenError("You don't have permission");
    }
    
    // Business logic here
    return this.articleRepo.update(id, input);
  }
}
```

### Resolver Pattern
```typescript
// Resolvers: Thin GraphQL interface layer
export const updateArticle = async (_parent, { input }, { services, user }) => {
  const authenticatedUser = requireAuth(user);
  // Delegate to service layer
  return services.article.updateArticle(input.id, input, authenticatedUser.userId);
};
```

## React/Frontend Conventions

### Component Structure
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract complex logic to custom hooks
- Use TypeScript interfaces for props

### State Management
- Use React hooks (useState, useEffect, etc.)
- Apollo Client for GraphQL state
- No external state management library currently

### Styling
- Use Tailwind CSS utility classes
- Leverage Catalyst UI Kit components
- Avoid inline styles
- Use `clsx` for conditional classes

## File Organization

### Import Order
1. External dependencies
2. Internal aliases (@/)
3. Relative imports
4. Type imports

```typescript
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { formatDate } from '../utils/date';
import type { Article } from '@/generated-graphql';
```

### File Structure
- One component per file
- Related types in same file or separate `.types.ts`
- Utilities in `utils/` directory
- Shared types in `types/` directory

## Async/Await Best Practices
- Always use async/await over promises
- Proper error handling with try/catch
- Avoid nested async calls when possible
- Use Promise.all() for parallel operations

## Security Guidelines
- Never expose secrets in code
- Never log sensitive information
- Validate all user inputs
- Use prepared statements (Prisma handles this)
- Always check permissions before operations

## Performance Considerations
- Consider Cloudflare Workers limits (execution time, memory)
- Optimize database queries (use select, limit)
- Lazy load relations in GraphQL (trivial resolvers)
- Cache when appropriate

## Testing Approach
- Currently no test framework configured
- When added, follow:
  - Unit tests for services
  - Integration tests for resolvers
  - Component tests for React
  - E2E tests for critical flows