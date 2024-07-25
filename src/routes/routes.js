import express from 'express';
import CSM from '../CSM.js';

const router = express.Router();
const csm = new CSM();

router.post('/usuarios', async (req, res) => {
  const { idUsuario, limite } = req.body;
  try {
    await csm.registrarUsuario(idUsuario, limite);
    res.status(201).send({ message: 'Usuario registrado com sucesso' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.delete('/usuarios/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    await csm.deletarUsuario(idUsuario);
    res.status(200).send({ message: 'Usuario deletado com sucesso' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get('/usuarios/:idUsuario/limite', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const canStart = await csm.verificarLimiteUsuario(idUsuario);
    res.status(200).send({ canStart });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.put('/usuarios/:idUsuario/limite', async (req, res) => {
  const { idUsuario } = req.params;
  const { novoLimite } = req.body;
  try {
    await csm.atualizarLimiteUsuario(idUsuario, novoLimite);
    res.status(200).send({ message: 'Limite atualizado com sucesso' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.post('/usuarios/:idUsuario/streams', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    await csm.iniciarStream(idUsuario);
    res.status(200).send({ message: 'Stream iniciada com sucesso' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.delete('/usuarios/:idUsuario/streams', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    await csm.pararStream(idUsuario);
    res.status(200).send({ message: 'Stream parada com sucesso' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export default router;