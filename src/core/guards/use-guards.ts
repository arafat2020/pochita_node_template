import { CanActivate } from '../guards/can-activate';

export function UseGuards(
  ...guards: (new () => CanActivate)[]
) {
  return function (
    target: any,
    propertyKey?: string
  ) {
    if (propertyKey) {
      // Method-level guards
      Reflect.defineMetadata(
        'guards',
        guards,
        target[propertyKey]
      );
    } else {
      // Class-level guards
      Reflect.defineMetadata(
        'guards',
        guards,
        target
      );
    }
  };
}
