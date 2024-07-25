import express from 'express';
import initializeDb from './db/db.js';
import routes from './routes/routes.js';
import logger from './log/logger.js';
import swaggerRouter from './swagger.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

initializeDb().then(() => {
  // Use defined routes
  app.use('/api', routes);
  app.use('/api', swaggerRouter);

  app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port}`);
  });
}).catch(err => {
  logger.error('Erro ao inicializar o banco de dados', err);
});