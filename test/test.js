import { expect } from 'chai';
import UserController from '../src/controllers/userController.js';
import UserService from '../src/services/userService.js';
import UserRepository from '../src/repositories/userRepository.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../src/log/logger.js';

describe('CSM test', function () {
  let db;
  let userRepository;
  let userController;

  before(async () => {
    try {

      // Inicializa o banco de dados em memória
      if (!db) {
        db = await open({
          filename: ':memory:', // Utiliza um banco de dados em memória para teste
          driver: sqlite3.Database
        });

        // Cria a tabela de usuários
        await db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            idUsuario TEXT PRIMARY KEY,
            limite INTEGER NOT NULL,
            streamsAgora INTEGER DEFAULT 0
          )
        `);

        // Verifica se a tabela foi criada corretamente
        const result = await db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="users"');
        if (!result) {
          throw new Error('Tabela "users" não foi criada corretamente.');
        }
        logger.info('Banco de dados inicializado e verificado com sucesso.');
      }

      // Cria instâncias dos repositórios, serviços e controladores
      if (!userRepository) {
        userRepository = new UserRepository(db);
        const userService = new UserService(userRepository);
        userController = new UserController(userService);
        logger.info('Dependências inicializadas com sucesso.');
      }
    } catch (error) {
      logger.error(`Erro ao inicializar o banco de dados ou criar/verificar tabela: ${error.message}`);
      throw error;
    }
  });

  // Fecha a conexão com o banco de dados após os testes
  after(async () => {
    await db.close();
  });




  // Testa o registro de um usuário
  it('should register a user', async function () {
    const req = { body: { idUsuario: 'user1', limite: 3 } };
    const res = {
      status: (code) => ({
        send: (response) => {
          logger.info('Response:', code, response);
          expect(code).to.equal(201);
        }
      })
    };
    await userController.registerUser(req, res);
    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user1']);
    expect(user).to.not.be.null;
    expect(user.limite).to.equal(3);
  });



  // Testa o registro de um usuário já existente
  it('should handle already existent users on register', async function () {
    const req = { body: { idUsuario: 'user1_1', limite: 3 } };
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
    const reqRegister = { body: { idUsuario: 'user2', limite: 2 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user2' } };
    const resStartStream = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    await userController.startStream(reqStartStream, resStartStream);

    let user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user2']);
    expect(user.streamsAgora).to.equal(1);


    await userController.startStream(reqStartStream, resStartStream);
    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user2']);
    expect(user.streamsAgora).to.equal(2);

    const reqStopStream = { params: { idUsuario: 'user2' } };
    const resStopStream = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    await userController.stopStream(reqStopStream, resStopStream);
    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user2']);
    expect(user.streamsAgora).to.equal(1);
  });



  // Testa a atualização dos limites de stream
  it('should update stream limits', async function () {
    const reqRegister = { body: { idUsuario: 'user3', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqUpdateLimit = { params: { idUsuario: 'user3' }, body: { novoLimite: 2 } };
    const resUpdateLimit = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };
    await userController.updateUserLimit(reqUpdateLimit, resUpdateLimit);

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user3']);
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
    const reqInvalidLimit = { body: { idUsuario: 'user4', limite: 0 } };

    const resError = { 
      status: (code) => ({ 
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal('O limite deve ser um número inteiro maior que 0');
        } 
      }) 
    };
    await userController.registerUser(reqInvalidLimit, resError);
    const reqInvalidLimit2 = { body: { idUsuario: 'user4', limite: 'NAN' } };
    await userController.registerUser(reqInvalidLimit2, resError);
  });



  // Testa limites de stream inválidos na atualização
  it('should handle invalid stream limits on update', async function () {
    const reqRegister = { body: { idUsuario: 'user4_1', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqInvalidUpdate = { params: { idUsuario: 'user4_1' }, body: { novoLimite: 0 } };
    const resError = { 
      status: (code) => ({ 
        send: (response) => {
          expect(code).to.equal(400);
          expect(response.error).to.equal('O novo limite deve ser um número inteiro maior que 0');
        } 
      }) 
    };
    await userController.updateUserLimit(reqInvalidUpdate, resError);
    const reqInvalidUpdate2 = { params: { idUsuario: 'user4_1' }, body: { novoLimite: 'NAN' } };
    await userController.updateUserLimit(reqInvalidUpdate2, resError);
  });



  // Testa se não permite mais streams do que o limite
  it('should not allow more streams than the limit', async function() {
    const reqRegister = { body: { idUsuario: 'user5', limite: 1 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };

    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user5' } };
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

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user5']);
    expect(user.streamsAgora).to.equal(1);
  });



  // Testa o início e parada concorrente de streams
  it('should handle concurrent stream starts and stops correctly', async function() {
    const reqRegister = { body: { idUsuario: 'user6', limite: 2 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user6' } };
    const reqStopStream = { params: { idUsuario: 'user6' } };
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

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user6']);
    expect(user.streamsAgora).to.equal(0);
  });


  // Testa um grande número de operações de início e parada de streams
  it('should handle a large number of start and stop stream operations', async function() {
    this.timeout(5000);

    const reqRegister = { body: { idUsuario: 'user7', limite: 100 } };
    const resRegister = { status: (code) => ({ send: (response) => expect(code).to.equal(201) }) };
    await userController.registerUser(reqRegister, resRegister);

    const reqStartStream = { params: { idUsuario: 'user7' } };
    const reqStopStream = { params: { idUsuario: 'user7' } };
    const resSuccess = { status: (code) => ({ send: (response) => expect(code).to.equal(200) }) };

    for (let i = 0; i < 100; i++) {
      try {
        await userController.startStream(reqStartStream, resSuccess);
      } catch (error) {
        logger.error(`Erro ao iniciar stream: ${error.message}`);
      }
    }

    let user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user7']);
    expect(user.streamsAgora).to.equal(100);

    for (let i = 0; i < 100; i++) {
      try {
        await userController.stopStream(reqStopStream, resSuccess);
      } catch (error) {
        if (error.message !== 'Usuario com 0 streams ativas') {
          logger.error(`Erro ao parar stream: ${error.message}`);
        }
      }
    }

    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user7']);
    expect(user.streamsAgora).to.equal(0);
  });


});