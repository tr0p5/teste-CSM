import logger from '../log/logger.js';

//Processa requisicoes do usuario e delega servicos
class UserController {
  constructor({ userService }) {
    this.userService = userService;
    logger.info('[UserController] inicializado com sucesso.');
  }

  // Método para registrar um novo usuário
  async registerUser(req, res) {
    const { idUsuario, limite } = req.body;
    try {
      logger.info(`[UserController] Tentando criar usuário: ${idUsuario}`);
      await this.userService.registerUser(idUsuario, limite);
      logger.info(`[UserController] Solicitação de registro de usuário: ${idUsuario}`);
      res.status(201).send({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
      logger.error(`[UserController] Erro na solicitação de registro de usuário: ${error.message}`);
      res.status(400).send({ error: error.message });
    }
  }

  // Método para deletar um usuário
  async deleteUser(req, res) {
    const { idUsuario } = req.params;
    try {
      await this.userService.deleteUser(idUsuario);
      logger.info(`[UserController] Solicitação de exclusão de usuário: ${idUsuario}`);
      res.status(200).send({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      logger.error(`[UserController] Erro na solicitação de exclusão de usuário: ${error.message}`);
      res.status(400).send({ error: error.message });
    }
  }

  // Método para obter o limite de streams de um usuário
  async getUserLimit(req, res) {
    const { idUsuario } = req.params;
    try {
      const canStart = await this.userService.getUserLimit(idUsuario);
      logger.info(`[UserController] Solicitação de verificação de limite de usuário: ${idUsuario}`);
      res.status(200).send({ canStart });
    } catch (error) {
      logger.error(`[UserController] Erro na solicitação de verificação de limite de usuário: ${error.message}`);
      res.status(400).send({ error: error.message });
    }
  }

  // Método para atualizar o limite de streams de um usuário
  async updateUserLimit(req, res) {
    const { idUsuario } = req.params;
    const { novoLimite } = req.body;
    try {
      await this.userService.updateUserLimit(idUsuario, novoLimite);
      logger.info(`[UserController] Solicitação de atualização de limite de usuário: ${idUsuario} para ${novoLimite}`);
      res.status(200).send({ message: 'Limite atualizado com sucesso' });
    } catch (error) {
      logger.error(`[UserController] Erro na solicitação de atualização de limite de usuário: ${error.message}`);
      res.status(400).send({ error: error.message });
    }
  }

  // Método para iniciar uma stream para um usuário
  async startStream(req, res) {
    const { idUsuario } = req.params;
    try {
      await this.userService.startStream(idUsuario);
      logger.info(`[UserController] Solicitação de início de stream para usuário: ${idUsuario}`);
      res.status(200).send({ message: 'Stream iniciada com sucesso' });
    } catch (error) {
      logger.error(`[UserController] Erro na solicitação de início de stream: ${error.message}`);
      res.status(400).send({ error: error.message });
    }
  }

  // Método para parar uma stream de um usuário
  async stopStream(req, res) {
    const { idUsuario } = req.params;
    logger.info(`[UserController] Tentando parar de stream para usuário: ${idUsuario}`);
    try {
      await this.userService.stopStream(idUsuario);
      logger.info(`[UserController] Solicitação de parada de stream para usuário: ${idUsuario}`);
      res.status(200).send({ message: 'Stream finalizada com sucesso' });
    } catch (error) {
      logger.error(`[UserController] Erro na solicitação de parada de stream: ${error.message}`);
      res.status(400).send({ error: error.message });
    }
  }
}

export default UserController;
