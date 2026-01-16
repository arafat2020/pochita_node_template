import 'reflect-metadata';
import { Container } from '../../src/core/container';
import { Injectable } from '../../src/core/decorators/injectable';
import { RequestContext } from '../../src/core/context/request-context';

@Injectable()
class ServiceA {
    getValue() { return 'A'; }
}

@Injectable()
class ServiceB {
    constructor(public readonly serviceA: ServiceA) { }
    getValues() { return this.serviceA.getValue() + 'B'; }
}

describe('Container', () => {
    it('should resolve a class without dependencies', () => {
        const instance = Container.resolve(ServiceA);
        expect(instance).toBeInstanceOf(ServiceA);
        expect(instance.getValue()).toBe('A');
    });

    it('should resolve a class with dependencies recursively', () => {
        const instance = Container.resolve(ServiceB);
        expect(instance).toBeInstanceOf(ServiceB);
        expect(instance.serviceA).toBeInstanceOf(ServiceA);
        expect(instance.getValues()).toBe('AB');
    });

    it('should reuse instances within the same RequestContext', () => {
        const context = new RequestContext();
        const instance1 = Container.resolve(ServiceA, context);
        const instance2 = Container.resolve(ServiceA, context);

        expect(instance1).toBe(instance2);
    });

    it('should create new instances for different RequestContexts', () => {
        const context1 = new RequestContext();
        const context2 = new RequestContext();

        const instance1 = Container.resolve(ServiceA, context1);
        const instance2 = Container.resolve(ServiceA, context2);

        expect(instance1).not.toBe(instance2);
    });
});
