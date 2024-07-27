import express from 'express';
import logger from '../log/logger.js';

const router = express.Router();

export default (userController) => {
  router.post('/usuarios', async (req, res) => {
    const { idUsuario, limite } = req.body;
    logger.info(`[Routes] Recebida solicitação para registrar usuário: ${idUsuario}`);
    await userController.registerUser(req, res);
  });

  router.delete('/usuarios/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    logger.info(`[Routes] Recebida solicitação para deletar registro de usuário: ${idUsuario}`);
    await userController.deleteUser(req, res);
  });

  router.get('/usuarios/:idUsuario/limite', async (req, res) => {
    const { idUsuario } = req.params;
    logger.info(`[Routes] Recebida solicitação para verificar limite de usuário: ${idUsuario}`);
    await userController.getUserLimit(req, res);
  });

  router.put('/usuarios/:idUsuario/limite', async (req, res) => {
    const { idUsuario } = req.params;
    const { novoLimite } = req.body;
    logger.info(`[Routes] Recebida solicitação para atualizar limite de usuário: ${idUsuario} para ${novoLimite}`);
    await userController.updateUserLimit(req, res);
  });

  router.post('/usuarios/:idUsuario/streams', async (req, res) => {
    const { idUsuario } = req.params;
    logger.info(`[Routes] Recebida solicitação para iniciar stream para usuário: ${idUsuario}`);
    await userController.startStream(req, res);
  });

  router.delete('/usuarios/:idUsuario/streams', async (req, res) => {
    const { idUsuario } = req.params;
    logger.info(`[Routes] Recebida solicitação de parar stream para usuário: ${idUsuario}`);
    await userController.stopStream(req, res);
  });

  return router;
};
