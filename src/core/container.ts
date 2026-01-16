// src/core/container.ts

import { RequestContext } from './context/request-context';

/**
 * @class Container
 * @description
 * A simple Dependency Injection (DI) container for the mini-NestJS framework.
 * This container supports:
 *   - Singleton providers
 *   - Request-scoped providers via RequestContext
 *   - Constructor-based injection using metadata from TypeScript decorators
 *
 * The container resolves dependencies recursively and ensures each request
 * can have its own scoped instances if needed.
 */
export class Container {
  /**
   * @private
   * @property providers
   * @description
   * Stores globally registered providers (singletons) keyed by token.
   */
  private static providers = new Map<any, any>();

  /**
   * @method register
   * @description
   * Registers a provider in the global container.
   * This can be used for singleton services or classes that should
   * be shared across all requests.
   *
   * @param token - Unique key representing the provider (usually the class itself)
   * @param provider - The instance or class to register
   */
  static register(token: any, provider: any) {
    this.providers.set(token, provider);
  }

  /**
   * @method resolve
   * @description
   * Resolves a class and its dependencies from the container.
   * Supports request-scoped instances if a RequestContext is provided.
   *
   * @template T - Type of the class to resolve
   * @param target - The class constructor to resolve
   * @param context - Optional request-scoped context for request-specific instances
   * @returns An instance of the requested class with all dependencies injected
   */
  static resolve<T>(
    target: new (...args: any[]) => T,
    context?: RequestContext
  ): T {
    // Check if this instance already exists in the request context
    // This enables request-scoped instances to be reused during a single request
    if (context) {
      const existing = context.get<T>(target);
      if (existing) return existing;
    }

    // Retrieve constructor parameter types using Reflect metadata
    // TypeScript decorators store this metadata when "emitDecoratorMetadata" is enabled
    const tokens = Reflect.getMetadata('design:paramtypes', target) || [];

    // Recursively resolve all constructor dependencies
    const injections = tokens.map((token: any) => Container.resolve(token, context));

    // Create a new instance of the target class with all dependencies injected
    const instance = new target(...injections);

    // If a request context is provided, store this instance in it
    // This ensures that all uses of this class during the request share the same instance
    if (context) {
      context.set(target, instance);
    }

    // Return the fully constructed instance
    return instance;
  }
}
