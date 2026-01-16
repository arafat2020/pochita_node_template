# Mini Nest - Lightweight Node.js Framework Template

Mini Nest is a lightweight, decorator-based Node.js template built on top of Express.js. It brings the power of NestJS-inspired architecture—such as Dependency Injection, Decorators, and Guards—to a minimalist Express environment without the heavy overhead.

## Why use this template?

Standard Express.js often ends up with "spaghetti code" as the project grows. On the other hand, full frameworks like NestJS can be overkill for small to medium projects. 

**Mini Nest** provides:
- **Structure**: Enforces a Controller-Service pattern.
- **Clean Code**: Uses modern TypeScript decorators for routing and DI.
- **Flexibility**: It's still just Express under the hood. You have full control.
- **Portability**: Very few dependencies (`express`, `reflect-metadata`, `chalk`).

---

## Core Features

### 1. Decorator-based Routing
Define your routes directly on class methods using `@Controller`, `@Get`, `@Post`, `@Put`, and `@Delete`.

### 2. Dependency Injection (DI) Container
A built-in lightweight container manages the lifecycle of your services. Use `@Injectable` to register services and let the framework handle instantiation.

### 3. Guard System
Implement authentication and authorization logic using Guards. Apply them globally or to specific routes using `@UseGuards`.

### 4. Context-aware Logger
A stylish, Zsh-inspired logging utility that provides clear, color-coded feedback about server startup, route mapping, and runtime errors.

---

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

---

## Usage Examples

### Creating a Controller

```typescript
import { Controller, Get } from './core/decorators';
import { Request, Response } from 'express';

@Controller('/users')
export class UserController {
  @Get('/')
  getAll(req: Request, res: Response) {
    return [{ id: 1, name: 'John Doe' }];
  }
}
```

### Using Dependency Injection

```typescript
import { Injectable } from './core/decorators';

@Injectable()
export class UserService {
  getUsers() {
    return ['Arafat', 'Node'];
  }
}

// In your controller
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Get('/')
  list() {
    return this.userService.getUsers();
  }
}
```

### Implementing a Guard

```typescript
import { CanActivate, ExecutionContext } from './core/guards/can-activate';

export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.req;
    return !!req.headers['authorization'];
  }
}

// Applying it
@Controller('/admin')
@UseGuards(AuthGuard)
export class AdminController { ... }
```

---

## Project Structure

```text
src/
├── core/             # Framework logic (DI, Bootstrap, Guards, Logger)
│   ├── decorators/   # Routing and DI decorators
│   ├── guards/       # Guard interfaces and logic
│   ├── bootstrap.ts  # Express initialization & Route mapping
│   ├── container.ts  # DI Container logic
│   └── logger.ts     # Custom logging utility
├── main.ts           # Application entry point
└── ...               # Your controllers and services
```

---

## License

ISC
