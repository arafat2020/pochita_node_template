// src/core/types/controller.ts
export type ControllerClass<T = any> = new (...args: any[]) => T;
export interface Controller {
  [key: string]: any;
}
export type ControllerInstance<T = any> = Controller & T;

