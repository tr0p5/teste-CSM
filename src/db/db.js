import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

//Singleton DB
let dbInstance = null;

async function initializeDb() {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await open({
    filename: './csm.db',
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