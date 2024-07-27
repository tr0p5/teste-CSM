const validateUserInput = (req, res, next) => {
  const { idUsuario, limite } = req.body;
  if (!idUsuario || typeof idUsuario !== 'string') {
    return res.status(400).send({ error: 'idUsuario é obrigatório e deve ser uma string' });
  }
  if (typeof limite !== 'number' || !Number.isInteger(limite) || limite < 1) {
    return res.status(400).send({ error: 'limite deve ser um número inteiro maior que 0' });
  }
  next();
};

const validateLimitInput = (req, res, next) => {
  const { novoLimite } = req.body;
  if (typeof novoLimite !== 'number' || !Number.isInteger(novoLimite) || novoLimite < 1) {
    return res.status(400).send({ error: 'novoLimite deve ser um número inteiro maior que 0' });
  }
  next();
};

export { validateUserInput, validateLimitInput };
