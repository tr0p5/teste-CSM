import express from 'express';
import CSM from '../CSM.js';
import logger from '../log/logger.js';

const router = express.Router();
const csm = new CSM();

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - idUsuario
 *         - limite
 *       properties:
 *         idUsuario:
 *           type: string
 *           description: ID único do usuário
 *         limite:
 *           type: integer
 *           description: Limite de streams simultâneos
 *         streamsAgora:
 *           type: integer
 *           description: Número de streams simultâneos ligados
 *       example:
 *         idUsuario: "user1"
 *         limite: 3
 *     NovoLimite:
 *       type: object
 *       required:
 *         - novoLimite
 *       properties:
 *         novoLimite:
 *           type: integer
 *           description: Novo limite de streams simultâneos para usuário
 *       example:
 *         novoLimite: 5
 *   responses:
 *     UsuarioNaoExiste:
 *       description: O usuário não existe
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Usuario nao existe"
 */

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gerenciamento de usuários e seus limites de streams
 */

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado com sucesso"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "O limite deve ser maior que 1"
 */

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

/**
 * @swagger
 * /usuarios/{idUsuario}:
 *   delete:
 *     summary: Deleta um usuário
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario deletado com sucesso"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UsuarioNaoExiste'
 */
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

/**
 * @swagger
 * /usuarios/{idUsuario}/limite:
 *   get:
 *     summary: Verifica o limite de streams de um usuário
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Limite verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canStart:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UsuarioNaoExiste'
 */
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

/**
 * @swagger
 * /usuarios/{idUsuario}/limite:
 *   put:
 *     summary: Atualiza o limite de streams de um usuário
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovoLimite'
 *     responses:
 *       200:
 *         description: Limite atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Limite atualizado com sucesso"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Novo limite não pode ser menor que o número atual de streams ativas"
 */
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

/**
 * @swagger
 * /usuarios/{idUsuario}/streams:
 *   post:
 *     summary: Inicia uma stream para um usuário
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Stream iniciada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stream iniciada com sucesso"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuario alconçou o limite"
 */
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

/**
 * @swagger
 * /usuarios/{idUsuario}/streams:
 *   delete:
 *     summary: Para uma stream de um usuário
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Stream parada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stream parada com sucesso"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuario não existe"
 */
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