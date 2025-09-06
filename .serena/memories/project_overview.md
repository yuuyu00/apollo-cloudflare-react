# Apollo Cloudflare React Stack - Project Overview

## Project Purpose
This is a full-stack application that demonstrates a production-ready architecture using:
- Backend: Apollo GraphQL Server running on Cloudflare Workers with D1 database
- Frontend: React SPA deployed as Cloudflare Workers Static Assets
- Authentication: Clerk Auth for user authentication and authorization
- Infrastructure: Completely serverless on Cloudflare's edge network

The project implements a content management system with users, articles, and categories.

## Technology Stack

### Backend
- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Apollo Server with GraphQL
- **Database**: Cloudflare D1 (SQLite at the edge)
- **ORM**: Prisma with D1 Adapter
- **Authentication**: Clerk JWT verification with publicMetadata

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with Catalyst UI Kit
- **GraphQL Client**: Apollo Client
- **Routing**: React Router
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Cloudflare Workers Static Assets

### Development Tools
- **Monorepo**: Turborepo v2 + pnpm workspaces
- **Package Manager**: pnpm v8.14.0
- **Node.js**: v22.11.0 (LTS)
- **Wrangler**: v4.20.0 (Cloudflare Workers CLI)
- **Code Generation**: GraphQL Code Generator
- **Type Safety**: End-to-end TypeScript

## Architecture Design

### 2-Layer Backend Architecture
1. **Repository Layer** (`src/repositories/`)
   - Pure database operations using Prisma
   - Returns Prisma models directly
   - Thin wrapper around database client

2. **Service Layer** (`src/services/`)
   - Business logic implementation
   - Permission checks and validation
   - Error handling
   - Coordination between repositories

3. **Resolver Layer** (`src/resolvers/`)
   - GraphQL interface
   - queries/: Query resolvers
   - mutations/: Mutation resolvers  
   - trivials/: Field resolvers for lazy loading relations

### Multi-Agent Development Strategy
The project uses specialized Claude agents for different layers:
- **infra-devops-developer**: Infrastructure, configuration, new packages
- **backend-developer**: API, database, business logic
- **frontend-developer**: UI components, user experience
- **Reviewers**: Code review for each layer
- **e2e-system-validator**: Integration testing

Complex tasks spanning multiple layers must be decomposed and assigned to appropriate agents.