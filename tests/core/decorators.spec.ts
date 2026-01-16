import 'reflect-metadata';
import { Controller } from '../../src/core/decorators/controller';
import { Get, Post } from '../../src/core/decorators/routes';

@Controller('/test')
class TestController {
    @Get('/hello')
    index() { }

    @Post('/submit')
    save() { }
}

describe('Route Decorators', () => {
    it('should attach prefix metadata to the class', () => {
        const prefix = Reflect.getMetadata('prefix', TestController);
        expect(prefix).toBe('/test');
    });

    it('should attach route definitions to the class prototype', () => {
        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes).toHaveLength(2);
        expect(routes).toContainEqual({ method: 'get', path: '/hello', handler: 'index' });
        expect(routes).toContainEqual({ method: 'post', path: '/submit', handler: 'save' });
    });
});
