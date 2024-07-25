import express from 'express';
import CSM from '../CSM.js';
import logger from '../log/logger.js';

const router = express.Router();
const csm = new CSM();

router.post('/usuarios', async (req, res) => {
  const { idUsuario, limite } = req.body;
  logger.info(`Recebida solicitação para registrar usuário: ${idUsuario}`);
  try {
    await csm.registrarUsuario(idUsuario, limite);
    res.status(201).send({ message: 'Usuario registrado com sucesso' });
  } catch (error) {
    logger.error(`Erro ao registrar usuário: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

router.delete('/usuarios/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  logger.info(`Recebida solicitação para deletar registro de usuário: ${idUsuario}`);
  try {
    await csm.deletarUsuario(idUsuario);
    res.status(200).send({ message: 'Usuario deletado com sucesso' });
  } catch (error) {
    logger.error(`Erro ao deletar usuário: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

router.get('/usuarios/:idUsuario/limite', async (req, res) => {
  const { idUsuario } = req.params;
  logger.info(`Recebida solicitação para verificar limite de usuário: ${idUsuario}`);
  try {
    const canStart = await csm.verificarLimiteUsuario(idUsuario);
    res.status(200).send({ canStart });
  } catch (error) {
    logger.error(`Erro ao verificar limite de usuário: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

router.put('/usuarios/:idUsuario/limite', async (req, res) => {
  const { idUsuario } = req.params;
  const { novoLimite } = req.body;
  logger.info(`Recebida solicitação para atualizar limite de usuário: ${idUsuario} para ${novoLimite}`);
  try {
    await csm.atualizarLimiteUsuario(idUsuario, novoLimite);
    res.status(200).send({ message: 'Limite atualizado com sucesso' });
  } catch (error) {
    logger.error(`Erro ao atualizar limite de usuário: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

router.post('/usuarios/:idUsuario/streams', async (req, res) => {
  const { idUsuario } = req.params;
  logger.info(`Recebida solicitação para iniciar stream para usuário: ${idUsuario}`);
  try {
    await csm.iniciarStream(idUsuario);
    res.status(200).send({ message: 'Stream iniciada com sucesso' });
  } catch (error) {
    logger.error(`Erro ao iniciar stream para usuário: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

router.delete('/usuarios/:idUsuario/streams', async (req, res) => {
  const { idUsuario } = req.params;
  logger.info(`Recebida solicitação de parar stream para usuário: ${idUsuario}`);
  try {
    await csm.pararStream(idUsuario);
    res.status(200).send({ message: 'Stream parada com sucesso' });
  } catch (error) {
    logger.error(`Erro ao parar stream de usuário: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

export default router;