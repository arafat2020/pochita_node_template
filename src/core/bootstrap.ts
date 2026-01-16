// src/core/bootstrap.ts

import express, { Request, Response } from 'express';
import 'reflect-metadata'; // Required for decorators & metadata reflection
import { Container } from './container'; // Our dependency injection container
import { CanActivate, ExecutionContext } from './guards/can-activate'; // Guard interfaces
import { RequestContext } from './context/request-context'; // Request-scoped DI context
import { logger } from './logger'; // Zsh-inspired logging utility
import { Controller } from './types/controller'; // Base controller type for TypeScript

/**
 * @function bootstrap
 * @description
 * Entry point to initialize the mini-NestJS framework.
 * This function sets up an Express application, maps all routes
 * from controllers, handles guards, applies request-scoped DI,
 * and adds logging.
 * 
 * @param controllers - Array of controller classes to be registered.
 * @returns Express application instance, ready to listen.
 */
export function bootstrap(controllers: any[]) {
    const app = express(); // Create a new Express app instance

    // Loop through each controller class provided
    controllers.forEach((ControllerClass) => {
        // Retrieve class-level metadata for route prefix
        // Example: @Controller('/users') → prefix = '/users'
        const prefix = Reflect.getMetadata('prefix', ControllerClass) || '';

        // Retrieve all routes defined on the controller
        // Example: @Get('/list') → routes = [{ method: 'get', path: '/list', handler: 'listUsers' }]
        const routes = Reflect.getMetadata('routes', ControllerClass) || [];

        // Loop through each route and attach it to the Express app
        routes.forEach((route: any) => {

            // Express route registration
            // Using async wrapper to allow async controllers & async guards
            (app as any)[route.method](prefix + route.path, async (req: Request, res: Response) => {

                // ----------------------------
                // 1 Create request-scoped DI context
                // ----------------------------
                // Each request gets a unique RequestContext to store
                // instances of services/controllers that are request-scoped.
                const context = new RequestContext();

                // Resolve controller instance via DI container
                // TypeScript now knows it is a Controller
                const controllerInstance = Container.resolve<Controller>(ControllerClass, context);

                // Get the handler method for the current route
                const handler = controllerInstance[route.handler];

                // ----------------------------
                // 2 Resolve and execute guards
                // ----------------------------
                // Guards can be applied at class-level or method-level
                const classGuards: (new () => CanActivate)[] =
                    Reflect.getMetadata('guards', ControllerClass) || [];
                const methodGuards: (new () => CanActivate)[] =
                    Reflect.getMetadata('guards', handler) || [];

                // Combine all guards: method-level guards override/augment class-level guards
                const guards = [...classGuards, ...methodGuards];

                // Execute guards sequentially
                for (const GuardClass of guards) {
                    // Resolve guard instance with DI
                    const guard = Container.resolve<CanActivate>(GuardClass, context);

                    // Prepare execution context for the guard
                    const execContext: ExecutionContext = {
                        req,                   // Express Request
                        res,                   // Express Response
                        context,               // Request-scoped container/context
                        handler,               // Controller method
                        controller: ControllerClass // Controller class reference
                    };

                    // Evaluate guard: if any guard returns false → block the request
                    const allowed = await guard.canActivate(execContext);
                    if (!allowed) {
                        // Log denied access with guard name
                        logger.withContext(GuardClass).warn('Access denied');
                        return res.status(403).json({ message: 'Forbidden' });
                    }
                }

                // ----------------------------
                // 3 Call the controller method
                // ----------------------------
                // Controllers are responsible for handling the request and returning data
                try {
                    // Call the handler with correct `this` context
                    const result = await handler.call(controllerInstance, req, res);

                    // If the controller returns a value, send as JSON response
                    if (result !== undefined) {
                        res.json(result);
                    }
                } catch (err: any) {
                    // Catch runtime errors and log them
                    logger.withContext(ControllerClass).error(`Handler error: ${err.message}`);
                    res.status(500).json({ message: 'Internal Server Error' });
                }
            });

            // ----------------------------
            // 4  Log route mapping
            // ----------------------------
            // This prints all registered routes during server startup
            // Example output: "UserController › Mapped GET /users"
            logger.withContext(ControllerClass).info(
                `Mapped ${route.method.toUpperCase()} ${prefix}${route.path}`
            );
        });
    });

    return app; // Return Express instance to be used by main.ts
}
