import 'reflect-metadata';
import request from 'supertest';
import { bootstrap } from '../../src/core/bootstrap';
import { Controller, Get } from '../../src/core/decorators';
import { CanActivate, ExecutionContext } from '../../src/core/guards/can-activate';
import { UseGuards } from '../../src/core/guards/use-guards';

@Controller('/api')
class ApiController {
    @Get('/ping')
    ping() {
        return { message: 'pong' };
    }
}

class DenyGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
        return false;
    }
}

@Controller('/secure')
@UseGuards(DenyGuard)
class SecureController {
    @Get('/data')
    data() {
        return { sensitive: 'data' };
    }
}

describe('Bootstrap Integration', () => {
    let app: any;

    beforeAll(() => {
        app = bootstrap([ApiController, SecureController]);
    });

    it('should map routes correctly', async () => {
        const response = await request(app).get('/api/ping');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'pong' });
    });

    it('should block requests with guards', async () => {
        const response = await request(app).get('/secure/data');
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ message: 'Forbidden' });
    });

    it('should return 404 for unknown routes', async () => {
        const response = await request(app).get('/unknown');
        expect(response.status).toBe(404);
    });
});
