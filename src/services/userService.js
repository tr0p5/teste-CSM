import logger from '../log/logger.js';

// Processa informações e aplica regras de negócio
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  //Registra usuários
  async registerUser(idUsuario, limite) {
    try {
      logger.info(`[UserService] Tentando registrar usuário ${idUsuario} (${limite})`);
      if (typeof limite !== 'number' || !Number.isInteger(limite) || limite < 1) {
        logger.error(`[UserService] Erro ao validar limite: limite inválido (${limite})`);
        throw new Error('O limite deve ser um número inteiro maior que 0');
      }

      // Verifica se o usuário já existe
      let user;
      try {
        user = await this.userRepository.getUser(idUsuario);
      } catch (error) {
        if (error.message !== 'Usuario nao existe') {
          throw error;
        }
      }

      // Se o usuário existe, lança um erro
      if (user) {
        logger.error(`[UserService] Erro ao registrar usuário: ${idUsuario} já existe`);
        throw new Error('Usuario ja existe');
      }

      await this.userRepository.createUser(idUsuario, limite);
      logger.info(`[UserService] Usuário registrado com sucesso: ${idUsuario}`);
    } catch (error) {
      logger.error(`[UserService] Erro ao registrar usuário: ${error.message}`);
      throw new Error(error.message);
    }
  }

  //Deleta usuários
  async deleteUser(idUsuario) {
    try {
      const user = await this.userRepository.getUser(idUsuario);
      if (!user) {
        logger.error(`[UserService] Erro ao deletar usuário: ${idUsuario} não existe`);
        throw new Error('Usuario nao existe');
      }

      await this.userRepository.deleteUser(idUsuario);
      logger.info(`[UserService] Usuário deletado com sucesso: ${idUsuario}`);
    } catch (error) {
      logger.error(`[UserService] Erro ao deletar usuário: ${error.message}`);
      throw new Error(error.message);
    }
  }

  //Verifica limite de usuário
  async getUserLimit(idUsuario) {
    try {
      const user = await this.userRepository.getUser(idUsuario);
      if (!user) {
        logger.error(`[UserService] Erro ao verificar limite de usuário: ${idUsuario} não existe`);
        throw new Error('Usuario nao existe');
      }

      logger.info(`[UserService] Limite de usuário verificado: ${idUsuario}`);
      return user.streamsAgora < user.limite;
    } catch (error) {
      logger.error(`[UserService] Erro ao verificar limite de usuário: ${error.message}`);
      throw new Error(error.message);
    }
  }

  //Atualiza limite de usuário
  async updateUserLimit(idUsuario, novoLimite) {
    try {
      // Validações de negócio
      if (typeof novoLimite !== 'number' || !Number.isInteger(novoLimite) || novoLimite < 1) {
        logger.error(`[UserService] Erro ao validar novo limite: novo limite inválido (${novoLimite})`);
        throw new Error('O novo limite deve ser um número inteiro maior que 0');
      }

      const user = await this.userRepository.getUser(idUsuario);
      if (!user) {
        logger.error(`[UserService] Erro ao atualizar limite: ${idUsuario} não existe`);
        throw new Error('Usuario nao existe');
      }
      if (novoLimite < user.streamsAgora) {
        logger.error(`[UserService] Erro ao atualizar limite: novo limite (${novoLimite}) é menor que streams ativas (${user.streamsAgora})`);
        throw new Error('Novo limite não pode ser menor que o número atual de streams ativas');
      }

      await this.userRepository.updateUserLimit(idUsuario, novoLimite);
      logger.info(`[UserService] Limite de usuário atualizado: ${idUsuario} para ${novoLimite}`);
    } catch (error) {
      logger.error(`[UserService] Erro ao atualizar limite de usuário: ${error.message}`);
      throw new Error(error.message);
    }
  }

  //Inicia stream de usuário
  async startStream(idUsuario) {
    try {
      const user = await this.userRepository.getUser(idUsuario);
      if (!user) {
        logger.error(`[UserService] Erro ao iniciar stream: ${idUsuario} não existe`);
        throw new Error('Usuario nao existe');
      }
      if (user.streamsAgora + 1 > user.limite) {
        logger.error(`[UserService] Erro ao iniciar stream: ${idUsuario} alcançou o limite`);
        throw new Error('Usuario alconçou o limite');
      }

      await this.userRepository.startStream(idUsuario);
      logger.info(`[UserService] Stream iniciada com sucesso: ${idUsuario}`);
    } catch (error) {
      logger.error(`[UserService] Erro ao iniciar stream: ${error.message}`);
      throw new Error(error.message);
    }
  }

  //Finaliza stream de usuário
  async stopStream(idUsuario) {
    try {
      const user = await this.userRepository.getUser(idUsuario);
      if (!user) {
        logger.error(`[UserService] Erro ao finalizar stream: ${idUsuario} não existe`);
        throw new Error('Usuario nao existe');
      }
      if (user.streamsAgora === 0) {
        logger.error(`[UserService] Erro ao finalizar stream: ${idUsuario} não tem streams ativas`);
        throw new Error('Usuario com 0 streams ativas');
      }

      await this.userRepository.stopStream(idUsuario);
      logger.info(`[UserService] Stream parada com sucesso: ${idUsuario}`);
    } catch (error) {
      logger.error(`[UserService] Erro ao finalizar stream: ${error.message}`);
      throw new Error(error.message);
    }
  }
}

export default UserService;
