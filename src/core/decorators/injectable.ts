// src/core/decorators/injectable.ts
import { Container } from '../container';

export function Injectable() {
  return function (target: any) {
    Container.register(target, target);
  };
}
