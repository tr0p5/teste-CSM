import { Mutex } from 'async-mutex';
import initializeDb from './db/db.js';
import logger from './log/logger.js';

class CSM {
  constructor(db = null) {
    this.mutex = new Mutex();

    this.db = db;
    this.init();
  }

  async init() {
    if (!this.db) {
      this.db = await initializeDb();
    }
  }

  async registrarUsuario(idUsuario, limite) {
    return this.mutex.runExclusive(async () => {
      try {
        logger.info(`Tentativa de registrar usuário: ${idUsuario}`);
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        if (user) {
          logger.error(`Erro ao registrar usuário: ${idUsuario} já existe`);
          throw new Error('Usuario ja existe');
        }
        if (typeof limite !== 'number' || !Number.isInteger(limite) || limite < 1) {
          logger.error(`Erro ao validar limite: limite inválido (${limite})`);
          throw new Error('O limite deve ser um número inteiro maior que 0');
        }
        await this.db.run('INSERT INTO users (idUsuario, limite) VALUES (?, ?)', [idUsuario, limite]);
        logger.info(`Usuário registrado com sucesso: ${idUsuario}`);
      } catch (error) {
        logger.error(`Erro ao registrar usuário: ${error.message}`);
        throw error;
      }
    });
  }

  async deletarUsuario(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        logger.info(`Tentativa de deletar usuário: ${idUsuario}`);
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        if (!user) {
          logger.error(`Erro ao deletar usuário: ${idUsuario} não existe`);
          throw new Error('Usuario nao existe');
        }
        await this.db.run('DELETE FROM users WHERE idUsuario = ?', [idUsuario]);
        logger.info(`Usuário deletado com sucesso: ${idUsuario}`);
      } catch (error) {
        logger.error(`Erro ao deletar usuário: ${error.message}`);
        throw error;
      }
    });
  }

  async verificarLimiteUsuario(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        logger.info(`Verificação de limite para usuário: ${idUsuario}`);
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        if (!user) {
          logger.error(`Erro ao verificar limite: ${idUsuario} não existe`);
          throw new Error('Usuario nao existe');
        }
        return user.streamsAgora < user.limite;
      } catch (error) {
        logger.error(`Erro ao verificar limite: ${error.message}`);
        throw error;
      }
    });
  }

  async atualizarLimiteUsuario(idUsuario, novoLimite) {
    return this.mutex.runExclusive(async () => {
      try {
        logger.info(`Tentativa de atualizar limite para usuário: ${idUsuario} para ${novoLimite}`);
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        if (!user) {
          logger.error(`Erro ao atualizar limite: ${idUsuario} não existe`);
          throw new Error('Usuario nao existe');
        }
        if (typeof novoLimite !== 'number' || !Number.isInteger(novoLimite) || novoLimite < 1) {
          logger.error(`Erro ao atualizar limite: novo limite inválido (${novoLimite})`);
          throw new Error('O novo limite deve ser um número inteiro maior que 0');
        }
        if (novoLimite < user.streamsAgora) {
          logger.error(`Erro ao atualizar limite: novo limite (${novoLimite}) é menor que streams ativas (${user.streamsAgora})`);
          throw new Error('Novo limite não pode ser menor que o número atual de streams ativas');
        }
        await this.db.run('UPDATE users SET limite = ? WHERE idUsuario = ?', [novoLimite, idUsuario]);
        logger.info(`Limite atualizado com sucesso para usuário: ${idUsuario}`);
      } catch (error) {
        logger.error(`Erro ao atualizar limite: ${error.message}`);
        throw error;
      }
    });
  }

  async iniciarStream(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        logger.info(`Tentativa de iniciar stream para usuário: ${idUsuario}`);
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        if (!user) {
          logger.error(`Erro ao iniciar stream: ${idUsuario} não existe`);
          throw new Error('Usuario nao existe');
        }

        if (user.streamsAgora+1 > user.limite) {
          logger.error(`Erro ao iniciar stream: ${idUsuario} alcançou o limite`);
          throw new Error('Usuario alconçou o limite');
        }
        await this.db.run('UPDATE users SET streamsAgora = streamsAgora + 1 WHERE idUsuario = ?', [idUsuario]);
        logger.info(`Stream iniciada com sucesso para usuário: ${idUsuario}`);
      } catch (error) {
        logger.error(`Erro ao iniciar stream: ${error.message}`);
        throw error;
      }
    });
  }

  async pararStream(idUsuario) {
    return this.mutex.runExclusive(async () => {
      try {
        logger.info(`Tentativa de parar stream para usuário: ${idUsuario}`);
        const user = await this.db.get('SELECT * FROM users WHERE idUsuario = ?', [idUsuario]);
        if (!user) {
          logger.error(`Erro ao parar stream: ${idUsuario} não existe`);
          throw new Error('Usuario nao existe');
        }
        if (user.streamsAgora === 0) {
          logger.error(`Erro ao parar stream: ${idUsuario} não tem streams ativas`);
          throw new Error('Usuario com 0 streams ativas');
        }
        await this.db.run('UPDATE users SET streamsAgora = streamsAgora - 1 WHERE idUsuario = ?', [idUsuario]);
        logger.info(`Stream parada com sucesso para usuário: ${idUsuario}`);
      } catch (error) {
        logger.error(`Erro ao parar stream: ${error.message}`);
        throw error;
      }
    });
  }
}

export default CSM;