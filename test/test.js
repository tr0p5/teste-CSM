import { expect } from 'chai';
import createDIContainer from '../src/config/diContainer.js';
import UserRepository from '../src/repositories/userRepository.js';
import UserService from '../src/services/userService.js';
import UserController from '../src/controllers/userController.js';
import logger from '../src/log/logger.js';

describe('Dependency Injection Container', function () {
  let container;

  before(async () => {
    logger.info('[Test] Inicializando contêiner de DI para testes');
    container = await createDIContainer();
  });

  it('should create and resolve the db dependency', async function () {
    const db = await container.resolve('db');
    expect(db).to.not.be.undefined;

    try {
      const result = await db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="users"');
      expect(result).to.not.be.undefined;
      expect(result.name).to.equal('users');
      logger.info('[Test] Dependência do banco de dados resolvida e verificada com sucesso');
    } catch (error) {
      logger.error(`[Test] Erro ao verificar a dependência do banco de dados: ${error.message}`);
      throw error;
    }
  });

  it('should create and resolve the UserRepository dependency', function () {
    const userRepository = container.resolve('userRepository');
    expect(userRepository).to.be.instanceOf(UserRepository);
  });

  it('should create and resolve the UserService dependency', function () {
    const userService = container.resolve('userService');
    expect(userService).to.be.instanceOf(UserService);
  });

  it('should create and resolve the UserController dependency', function () {
    const userController = container.resolve('userController');
    expect(userController).to.be.instanceOf(UserController);
  });
});


describe('CSM test', function () {
  let db;
  let userController;
  let config;

  before(async () => {
    try {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('NODE_ENV não está definido como "test".');
      }
      
      const container = await createDIContainer();

      // Verifica se o contêiner foi criado com sucesso
      if (!container) {
        throw new Error('Falha ao criar o contêiner de DI.');
      }

      db = await container.resolve('db');
      userController = container.resolve('userController');
      config = container.resolve('config');

      if (typeof db.get !== 'function') {
        throw new Error('db.get não é uma função');
      }

      // Verifica se o db foi resolvido corretamente
      if (!db) {
        throw new Error('Falha ao resolver a dependência "db".');
      }

      // Verifica se o userController foi resolvido corretamente
      if (!userController) {
        throw new Error('Falha ao resolver a dependência "userController".');
      }

      // Verifica se a tabela foi criada corretamente
      const result = await db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="users"');
      if (!result) {
        throw new Error('Tabela "users" não foi criada corretamente.');
      }
      logger.info('Teste iniciando. Banco de dados OK');
    } catch (error) {
      logger.error(`Erro ao inicializar o banco de dados ou criar/verificar tabela: ${error.message}`);
      throw error;
    }
  });

  // Fecha a conexão com o banco de dados após os testes
  after(async () => {
    if (db && typeof db.close === 'function') {
      await db.close();
    }
  });




  // Testa o registro de um usuário
  it('should register a user', async function () {
    const req = { body: { idUsuario: 'user_register', limite: 3 } };
    const res = {
      status: (code) => ({
        send: (response) => {
          logger.info('Response:', code, response);
          expect(code).to.equal(201);
        }
      })
    };
    await userController.registerUser(req, res);
    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_register']);
    expect(user).to.not.be.null;
    expect(user.limite).to.equal(3);
  });



  // Testa o registro de um usuário já existente
  it('should handle already existent users on register', async function () {
    const req = { body: { idUsuario: 'user_registerEqual', limite: 3 } };
    const res = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(req, res);

    const resConflict = { 
      status: (code) => ({ 
        send: (response) => {
          logger.info('Response:', code, response); // Usando logger para depuração
          expect(response.error).to.equal('Usuario ja existe');
        } 
      }) 
    };

    await userController.registerUser(req, resConflict);
  });



  // Testa o início e parada de streams
  it('should start and stop streams', async function () {
    const reqRegister = { body: { idUsuario: 'user_startStopStream', limite: 2 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user_startStopStream' } };
    const resStartStream = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    await userController.startStream(reqStartStream, resStartStream);

    let user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_startStopStream']);
    expect(user.streamsAgora).to.equal(1);


    await userController.startStream(reqStartStream, resStartStream);
    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_startStopStream']);
    expect(user.streamsAgora).to.equal(2);

    const reqStopStream = { params: { idUsuario: 'user_startStopStream' } };
    const resStopStream = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    await userController.stopStream(reqStopStream, resStopStream);
    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_startStopStream']);
    expect(user.streamsAgora).to.equal(1);
  });



  // Testa a atualização dos limites de stream
  it('should update stream limits', async function () {
    const reqRegister = { body: { idUsuario: 'user_updateLimit', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqUpdateLimit = { params: { idUsuario: 'user_updateLimit' }, body: { novoLimite: 2 } };
    const resUpdateLimit = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    await userController.updateUserLimit(reqUpdateLimit, resUpdateLimit);

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_updateLimit']);
    expect(user.limite).to.equal(2);
  });



  // Testa operações com usuários inexistentes
  it('should handle nonexistent users', async function () {
    const req = { params: { idUsuario: 'USUARIO_INEXISTENTE' } };

    const resError = { 
      status: (code) => ({ 
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal('Usuario nao existe');
        } 
      }) 
    };

    await userController.deleteUser(req, resError);
    await userController.startStream(req, resError);
    await userController.stopStream(req, resError);
    await userController.getUserLimit(req, resError);

    req.body = { novoLimite: 1 };
    await userController.updateUserLimit(req, resError);
  });



  // Testa limites de stream inválidos no registro
  it('should handle invalid stream limits on register', async function () {
    const reqInvalidLimit = { body: { idUsuario: 'user_invalidLimitC', limite: 0 } };

    const resError = { 
      status: (code) => ({ 
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal('O limite deve ser um número inteiro maior que 0');
        } 
      }) 
    };
    await userController.registerUser(reqInvalidLimit, resError);
    const reqInvalidLimit2 = { body: { idUsuario: 'user_invalidLimitC', limite: 'NAN' } };
    await userController.registerUser(reqInvalidLimit2, resError);
  });



  // Testa limites de stream inválidos na atualização
  it('should handle invalid stream limits on update', async function () {
    const reqRegister = { body: { idUsuario: 'user_invalidLimitU', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqInvalidUpdate = { params: { idUsuario: 'user_invalidLimitU' }, body: { novoLimite: 0 } };
    const resError = { 
      status: (code) => ({ 
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal('O novo limite deve ser um número inteiro maior que 0');
        } 
      }) 
    };
    await userController.updateUserLimit(reqInvalidUpdate, resError);
    const reqInvalidUpdate2 = { params: { idUsuario: 'user_invalidLimitU' }, body: { novoLimite: 'NAN' } };
    await userController.updateUserLimit(reqInvalidUpdate2, resError);
  });



  // Testa se não permite mais streams do que o limite
  it('should not allow more streams than the limit', async function() {
    const reqRegister = { body: { idUsuario: 'user_overLimit', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };

    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user_overLimit' } };
    const resStartStream = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };

    await userController.startStream(reqStartStream, resStartStream);

    const resError = { 
      status: (code) => ({ 
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal('Usuario alconçou o limite');
        } 
      }) 
    };

    await userController.startStream(reqStartStream, resError);

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_overLimit']);
    expect(user.streamsAgora).to.equal(1);
  });



  // Testa o início e parada concorrente de streams
  it('should handle concurrent stream starts and stops correctly', async function() {
    const reqRegister = { body: { idUsuario: 'user_concurrency', limite: 2 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user_concurrency' } };
    const reqStopStream = { params: { idUsuario: 'user_concurrency' } };
    const resSuccess = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    const simulateOperation = async () => {
      await userController.startStream(reqStartStream, resSuccess);
      await new Promise(resolve => setTimeout(resolve, 100));
      await userController.stopStream(reqStopStream, resSuccess);
    };
    await Promise.all([
      simulateOperation(),
      simulateOperation()
    ]);

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user_concurrency']);
    expect(user.streamsAgora).to.equal(0);
  });



  // Testa um grande número de operações de início e parada de streams
  it('should handle a large number of start and stop stream operations with different users', async function() {
    this.timeout(5000);

    const users = [];
    for (let i = 0; i < 10; i++) {
      const userId = `user_multiple_${i}`;
      const reqRegister = { body: { idUsuario: userId, limite: 10 } };
      const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
      await userController.registerUser(reqRegister, resRegister);
      users.push(userId);
    }

    for (const userId of users) {
      const reqStartStream = { params: { idUsuario: userId } };
      const reqStopStream = { params: { idUsuario: userId } };
      const resSuccess = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };

      for (let i = 0; i < 10; i++) {
        try {
          await userController.startStream(reqStartStream, resSuccess);
        } catch (error) {
          logger.error(`Erro ao iniciar stream para usuário ${userId}: ${error.message}`);
        }
      }

      let user = await db.get('SELECT * FROM users WHERE idUsuario = ?', [userId]);
      expect(user.streamsAgora).to.equal(10);

      for (let i = 0; i < 10; i++) {
        try {
          await userController.stopStream(reqStopStream, resSuccess);
        } catch (error) {
          if (error.message !== 'Usuario com 0 streams ativas') {
            logger.error(`Erro ao parar stream para usuário ${userId}: ${error.message}`);
          }
        }
      }

      user = await db.get('SELECT * FROM users WHERE idUsuario = ?', [userId]);
      expect(user.streamsAgora).to.equal(0);
    }
  });



  //Testa registro de limite acima do maximo
  it('should not allow registration with a limit exceeding maxConcurrency', async function () {
    const req = { body: { idUsuario: 'user_max', limite: config.maxConcurrency + 1 } };
    const res = {
      status: (code) => ({
        send: (response) => {
          logger.info('Response:', code, response);
          expect(code).to.equal(400);
          expect(response.error).to.equal(`O limite de streams não pode ser maior que ${config.maxConcurrency}`);
        }
      })
    };
    await userController.registerUser(req, res);
  });



  //Testa atualizacao de limite acima do  maximo
  it('should not allow updating limit to a value exceeding maxConcurrency', async function () {
    const reqRegister = { body: { idUsuario: 'user_update', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqUpdateLimit = { params: { idUsuario: 'user_update' }, body: { novoLimite: config.maxConcurrency + 1 } };
    const resError = {
      status: (code) => ({
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal(`O limite de streams não pode ser maior que ${config.maxConcurrency}`);
        }
      })
    };
    await userController.updateUserLimit(reqUpdateLimit, resError);
  });

});