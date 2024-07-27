import express from 'express';
import swaggerUi from 'swagger-ui-express';

import config from './config/env.js';
import { swaggerDocument } from './swagger/swaggerDocs.js';

import userRoutes from './routes/userRoutes.js';
import logger from './log/logger.js';

import createDIContainer from './config/diContainer.js';

const app = express();
const port = config.port;

// Middleware para processar requisições com JSON
app.use(express.json());

(async () => {
  try {
    // Cria o contêiner de DI
    const container = await createDIContainer();

    // Resolve o userController do contêiner
    const userController = container.resolve('userController');

    // Define as rotas da aplicação
    app.use('/api', userRoutes(userController));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Inicia o servidor
    app.listen(port, () => {
      logger.info(`[Server] Servidor rodando na porta ${port}`);
    });
  } catch (err) {
    logger.error('[Server] Erro ao inicializar o servidor', err);
  }
})();