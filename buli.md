## Folder Structure Explanation

### `/src/auth`
Authentication-related code: JWT strategies, guards, decorators. Currently empty, ready for implementation.

### `/src/users`
User management: CRUD operations, schemas, DTOs. Empty scaffolding.

### `/src/permissions`
Permission management for EMPLOYEE role. Empty scaffolding.

### `/src/common`
**Shared cross-cutting concerns:**
- **guards/**: Authorization guards (JWT, roles, permissions)
- **decorators/**: Custom decorators (@CurrentUser, @Roles, @Permissions)
- **filters/**: Exception filters for consistent error responses
- **interceptors/**: Logging, response transformation
- **pipes/**: Global validation pipe configuration
- **interfaces/**: TypeScript interfaces (ISoftDelete, etc.)
- **dto/**: Base DTOs (pagination, queries)
- **constants/**: Enums, constant values

### `/src/database`
MongoDB connection, base schemas, repository pattern.

### `/src/config`
Environment-based configuration using @nestjs/config.

### `/src/shared`
**Business logic utilities:**
- Utility functions (date formatting, hashing)
- Common types and interfaces used across modules

