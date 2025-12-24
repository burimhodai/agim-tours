🏗️ Project Structure
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── app.controller.ts       # Root controller (health checks)
├── app.service.ts          # Root service
│
├── auth/                   # Authentication module (JWT, strategies)
├── users/                  # User management module
├── permissions/            # Permission management module
│
├── common/                 # Shared cross-cutting concerns
│   ├── guards/            # Authorization guards
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── interceptors/      # Request/response interceptors
│   ├── pipes/             # Validation pipes
│   ├── interfaces/        # TypeScript interfaces
│   ├── dto/               # Base DTOs (pagination, etc.)
│   └── constants/         # Constants and enums
│
├── database/              # Database configuration
│   ├── database.module.ts
│   ├── base-repository.ts # Base repository with soft delete
│   └── schemas/
│       └── base.schema.ts # Base schema with soft delete
│
├── config/                # Configuration files
│   ├── configuration.ts   # Main config
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── validation.schema.ts
│
└── shared/                # Shared utilities
    ├── utils/
    └── types/
🚀 Getting Started
Prerequisites

Node.js (v18 or higher)
MongoDB (v6 or higher)
npm or yarn

Installation

Clone the repository

bashgit clone <repository-url>
cd travel-event-agency

Install dependencies

bashnpm install

Configure environment

bashcp .env.example .env
# Edit .env with your configuration

Start MongoDB

bash# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start your local MongoDB instance

Run the application

bash# Development
npm run start:dev

# Production build
npm run build
npm run start:prod



🎯 API Endpoints
Health Check
GET /api/v1/health
Root
GET /api/v1
🏛️ Architecture Principles
Access Control Model
Two Roles:

SUPER_ADMIN: Full system access
EMPLOYEE: Permission-based access (assigned at account creation)

Soft Delete Pattern
All entities implement soft delete:
typescript{
  isDeleted: boolean;    // Default: false
  deletedAt?: Date;      // Set when deleted
}
All queries automatically exclude soft-deleted records.
Repository Pattern
All repositories extend BaseRepository which provides:

create() - Create new document
findOne() - Find single document
findById() - Find by ID
findAll() - Find all (with filtering)
updateOne() - Update single document
updateById() - Update by ID
softDelete() - Soft delete document
count() - Count documents
exists() - Check existence

📝 Naming Conventions
Files

Controllers: resource.controller.ts (e.g., users.controller.ts)
Services: resource.service.ts (e.g., users.service.ts)
Modules: resource.module.ts (e.g., users.module.ts)
DTOs: action-resource.dto.ts (e.g., create-user.dto.ts)
Schemas: resource.schema.ts (e.g., user.schema.ts)
Guards: purpose.guard.ts (e.g., jwt-auth.guard.ts)
Decorators: decorator-name.decorator.ts (e.g., current-user.decorator.ts)

Code

Classes: PascalCase (e.g., UserService)
Interfaces: PascalCase with I prefix (e.g., IUser)
Constants: UPPER_SNAKE_CASE (e.g., USER_NOT_FOUND)
Enums: PascalCase (e.g., UserRole)
Functions/Methods: camelCase (e.g., createUser)
Variables: camelCase (e.g., userId)