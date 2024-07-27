import dotenv from 'dotenv';

dotenv.config();

export default {
  maxConcurrency: process.env.MAX_CONCURRENCY || 10,
  db: {
    filename: process.env.DB_FILENAME || './csm.db',
  }
};
