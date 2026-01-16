// src/main.ts
import 'reflect-metadata';
import { bootstrap } from './core/bootstrap';
import { logger } from './core/logger';

const app = bootstrap([]);

const PORT = 3000;

app.listen(PORT, () => {
  logger.success(`Server running at http://localhost:${PORT}`);
});
