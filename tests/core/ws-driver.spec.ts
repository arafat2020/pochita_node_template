import { createServer, Server as HTTPServer } from 'http';
import { WSDriver } from '../../src/core/ws/driver';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';

// Increase Jest timeout
jest.setTimeout(10000);

// Mock Redis
jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(null),
        publish: jest.fn().mockResolvedValue(null),
        quit: jest.fn().mockResolvedValue(null),
        duplicate: jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(null),
            quit: jest.fn().mockResolvedValue(null),
            on: jest.fn(),
        }),
    }),
}));

// Mock Socket.IO Server
jest.mock('socket.io', () => {
    return {
        Server: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
            close: jest.fn(),
            sockets: {
                sockets: new Map(),
                adapter: { rooms: new Map() }
            }
        }))
    };
});

// Mock WS Server
jest.mock('ws', () => {
    const ActualWS = jest.requireActual('ws');
    return {
        ...ActualWS,
        Server: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            close: jest.fn().mockImplementation((cb) => cb && cb()),
        })),
        WebSocketServer: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            close: jest.fn().mockImplementation((cb) => cb && cb()),
        }))
    };
});

describe('WSDriver', () => {
    let httpServer: HTTPServer;
    let driver: WSDriver;

    beforeEach(() => {
        httpServer = createServer();
    });

    afterEach(async () => {
        if (driver) await driver.stop();
        if (httpServer.listening) httpServer.close();
    });

    it('should initialize Socket.IO when useSocketIO is true', async () => {
        driver = new WSDriver({ server: httpServer, useSocketIO: true });
        await driver.start();
        expect(SocketIOServer).toHaveBeenCalled();
    });

    it('should initialize Native WS when useSocketIO is false', async () => {
        driver = new WSDriver({ server: httpServer, useSocketIO: false });
        await driver.start();
        expect(WebSocketServer).toHaveBeenCalled();
    });

    it('should emit to pubsub on publish', (done) => {
        driver = new WSDriver({ server: httpServer, useSocketIO: false });
        driver.start().then(() => {
            driver.subscribe('test-channel', (data) => {
                expect(data).toEqual({ msg: 'hello' });
                done();
            });
            driver.publish('test-channel', { msg: 'hello' });
        });
    });
});
