import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../log/logger.js';

// Singleton DB
let dbInstance = null;

async function initializeDb(dbPath) {
  logger.info(`[Database] Inicializando banco de dados em: ${dbPath == ':memory:' ? ':memory:' : 'drive'}`);
  //Garante unica instancia
  if (dbInstance) {
    logger.info('[Database] Usando instância existente do banco de dados.');
    return dbInstance;
  }

  try {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    logger.info('[Database] Instância do banco de dados criada.');

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        idUsuario TEXT PRIMARY KEY,
        limite INTEGER NOT NULL,
        streamsAgora INTEGER DEFAULT 0
      )
    `);
    logger.info('[Database] Tabela "users" criada/verificada com sucesso.');

    return dbInstance;
  } catch (error) {
    logger.error(`[Database] Erro ao inicializar o banco de dados: ${error.message}`);
    throw error;
  }
}

export default initializeDb;
