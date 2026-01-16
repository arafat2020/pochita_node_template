import 'reflect-metadata';
import { UseGuards } from '../../src/core/guards/use-guards';
import { CanActivate, ExecutionContext } from '../../src/core/guards/can-activate';

class MockGuard implements CanActivate {
    async canActivate(context: ExecutionContext) { return true; }
}

class TestController {
    @UseGuards(MockGuard)
    method() { }
}

@UseGuards(MockGuard)
class GuardedController { }

describe('Guards', () => {
    it('should attach guard metadata to methods', () => {
        const guards = Reflect.getMetadata('guards', TestController.prototype.method);
        expect(guards).toContain(MockGuard);
    });

    it('should attach guard metadata to classes', () => {
        const guards = Reflect.getMetadata('guards', GuardedController);
        expect(guards).toContain(MockGuard);
    });
});
