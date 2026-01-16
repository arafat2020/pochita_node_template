// src/core/decorators/controller.ts
export function Controller(prefix = '') {
  return function (target: any) {
    Reflect.defineMetadata('prefix', prefix, target);
    Reflect.defineMetadata('routes', [], target);
  };
}
