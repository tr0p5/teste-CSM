import express from 'express';
import config from './config/env.js';
import initializeDb from './config/database.js';
import routes from './routes/routes.js';
import logger from './log/logger.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger/swaggerDocs.js';

import UserController from './controllers/userController.js';
import UserService from './services/userService.js';
import UserRepository from './repositories/userRepository.js';

const app = express();
const port = config.port;

// Middleware para processar requisições com JSON
app.use(express.json());

initializeDb().then((db) => {
  const userRepository = new UserRepository(db);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  // Define as rotas da aplicação
  app.use('/api', routes(userController));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Inicia o servidor
  app.listen(port, () => {
    logger.info(`[Server] Servidor rodando na porta ${port}`);
  });
}).catch(err => {
  logger.error('[Server] Erro ao inicializar o banco de dados', err);
});