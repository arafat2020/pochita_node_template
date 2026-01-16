// src/core/decorators/routes.ts
import { HttpMethod } from '../types/http-method';

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: string;
}

function createMethodDecorator(method: HttpMethod) {
  return function (path: string) {
    return function (
      target: any,
      key: string
    ) {
      const routes: RouteDefinition[] =
        Reflect.getMetadata('routes', target.constructor) || [];

      routes.push({
        method,
        path,
        handler: key,
      });

      Reflect.defineMetadata(
        'routes',
        routes,
        target.constructor
      );
    };
  };
}

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Patch = createMethodDecorator('patch');
export const Delete = createMethodDecorator('delete');
export const Options = createMethodDecorator('options');
export const Head = createMethodDecorator('head');