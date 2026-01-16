// src/core/context/request-context.ts
export class RequestContext {
  private instances = new Map<any, any>();

  get<T>(token: any): T | undefined {
    return this.instances.get(token);
  }

  set(token: any, instance: any) {
    this.instances.set(token, instance);
  }
}
