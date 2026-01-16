// src/main.ts
import 'reflect-metadata';
import { bootstrap } from './core/bootstrap';
import { logger } from './core/logger';
import { createServer } from 'http';
import { WSDriver } from './core/ws/driver';

const app = bootstrap([]);

const PORT = 3000;

// Create a native HTTP server from Express
const server = createServer(app);

// Instantiate WSDriver on the same server
const ws = new WSDriver({ 
  server, 
  useSocketIO: false 
});
ws.start();


server.listen(PORT, () => {
  logger.success(`Server running at http://localhost:${PORT}`);
});
