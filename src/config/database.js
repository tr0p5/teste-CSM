import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from './env.js';

// Singleton DB
let dbInstance = null;

async function initializeDb() {

  //Garante unica instancia
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: config.dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      idUsuario TEXT PRIMARY KEY,
      limite INTEGER NOT NULL,
      streamsAgora INTEGER DEFAULT 0
    )
  `);

  return dbInstance;
}

export default initializeDb;
