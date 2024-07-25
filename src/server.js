import express from 'express';
import bodyParser from 'body-parser';
import csmRoutes from './routes/routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', csmRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});