import { Mutex } from 'async-mutex';
import logger from '../log/logger.js';

//Camada de conexao com banco de dados
class UserRepository {
  constructor(db) {
    if (!db) {
      logger.error('Banco de dados não foi fornecido ao UserRepository.');
      throw new Error('Banco de dados não foi fornecido.');
    }

    this.db = db;
    this.mutex = new Mutex();
    logger.info('[UserRepository] inicializado com sucesso.');
  }

  async createUser(idUsuario, limite) {
    return this.mutex.runExclusive(async () => {
      try {
        await this.db.run('INSERT INTO users (idUsuario, limite, streamsAgora) VALUES (?, ?, 0)', [idUsuario, limite]);
        logger.info(`[UserRepository] Usuário criado: ${idUsuario} com limite ${limite}`);
      } catch (error) {
        logger.error(`[UserRepository] Erro ao criar usuário: ${error.message}`);
        throw error;
      }
    });
  }

  async deleteUser(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        await this.db.run('DELETE FROM users WHERE idUsuario = ?', [idUsuario]);
        logger.info(`[UserRepository] Usuário deletado com sucesso: ${idUsuario}`);
      } catch (error) {
        logger.error(`[UserRepository] Erro ao deletar usuário: ${error.message}`);
        throw error;
      }
    });
  }

  async getUser(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        logger.info(`[UserRepository] Usuario encontrado na busca por: ${idUsuario}`);
        if (!user) {
          logger.error(`[UserRepository] Erro ao buscar usuário: ${idUsuario} não existe`);
          throw new Error('Usuario nao existe');
        }
        return user;
      } catch (error) {
        logger.error(`[UserRepository] Erro ao buscar usuário: ${error.message}`);
        throw error;
      }
    });
  }

  async updateUserLimit(idUsuario, novoLimite) {
    return this.mutex.runExclusive(async () => {
      try {
        await this.db.run('UPDATE users SET limite = ? WHERE idUsuario = ?', [novoLimite, idUsuario]);
        logger.info(`[UserRepository] Limite do usuário atualizado: ${idUsuario} para ${novoLimite}`);
      } catch (error) {
        logger.error(`[UserRepository] Erro ao atualizar limite: ${error.message}`);
        throw error;
      }
    });
  }

  async startStream(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        await this.db.run('UPDATE users SET streamsAgora = streamsAgora + 1 WHERE idUsuario = ?', [idUsuario]);
        logger.info(`[UserRepository] Stream iniciada para usuário: ${idUsuario}`);
      } catch (error) {
        logger.error(`[UserRepository] Erro ao iniciar stream: ${error.message}`);
        throw error;
      }
    });
  }

  async stopStream(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        await this.db.run('UPDATE users SET streamsAgora = streamsAgora - 1 WHERE idUsuario = ?', [idUsuario]);
        logger.info(`[UserRepository] Stream parada para usuário: ${idUsuario}`);
      } catch (error) {
        logger.error(`[UserRepository] Erro ao parar stream: ${error.message}`);
        throw error;
      }
    });
  }
}

export default UserRepository;
