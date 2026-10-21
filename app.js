import { createApp } from './plesk/server.js';
import { createD1Adapter, createMariaDbPool } from './plesk/d1-mariadb.js';
import { startStockPoll } from './plesk/stock-poll.js';
import { startRuPricePoll } from './plesk/ru-price-poll.js';

const pool = createMariaDbPool();
createApp(process.env, pool).listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1');
startStockPoll(createD1Adapter(pool));
startRuPricePoll(createD1Adapter(pool));
