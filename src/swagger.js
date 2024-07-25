import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';

const router = express.Router();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CSM API',
    version: '0.0.1',
    description: 'API para o Concurrent Streaming Manager',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desenvolvimento',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
