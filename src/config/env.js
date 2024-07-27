import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  dbPath: process.env.NODE_ENV === 'test' ? ':memory:' : process.env.DB_PATH || './database.db',
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY, 10) || 5
};

export default config;
