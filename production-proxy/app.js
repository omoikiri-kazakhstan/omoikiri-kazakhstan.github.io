import { createProxy } from './server.js';

createProxy().listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1');
