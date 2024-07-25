import { expect } from 'chai';
import CSM from '../src/CSM.js'
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../src/log/logger.js';


describe('CSM test', function () {
  let csm;
  let db;

  before(async () => {
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        idUsuario TEXT PRIMARY KEY,
        limite INTEGER NOT NULL,
        streamsAgora INTEGER DEFAULT 0
      )
    `);

    csm = new CSM(db);
  });

  after(async () => {
    await db.close();
  });


  it('should register a user', async function () {
    await csm.registrarUsuario('user1', 3);
    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user1']);
    expect(user).to.not.be.null;
    expect(user.limite).to.equal(3);
  });

  it('should handle already existent users on register', async function () {
    await csm.registrarUsuario('user1_1', 3);
    try {
      await csm.registrarUsuario('user1_1', 3);
    } catch (e) {
      expect(e.message).to.equal('Usuario ja existe');
    }
  });

  it('should start and stop streams', async function () {
    await csm.registrarUsuario('user2', 2);
    await csm.iniciarStream('user2');

    let user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user2']);
    expect(user.streamsAgora).to.equal(1);

    await new Promise(resolve => setTimeout(resolve, 100));

    await csm.iniciarStream('user2');
    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user2']);
    expect(user.streamsAgora).to.equal(2);

    await new Promise(resolve => setTimeout(resolve, 100));

    await csm.pararStream('user2');
    user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user2']);
    expect(user.streamsAgora).to.equal(1);
  });

  it('should update stream limits', async function () {
    await csm.registrarUsuario('user3', 1);
    await csm.atualizarLimiteUsuario('user3', 2);
    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user3']);
    expect(user.limite).to.equal(2);
  });

  it('should handle nonexistent users', async function () {
    try {
      await csm.deletarUsuario('USUARIO_INEXISTENTE');
    } catch (e) {
      expect(e.message).to.equal('Usuario nao existe');
    }
    try {
      await csm.iniciarStream('USUARIO_INEXISTENTE');
    } catch (e) {
      expect(e.message).to.equal('Usuario nao existe');
    }
    try {
      await csm.pararStream('USUARIO_INEXISTENTE');
    } catch (e) {
      expect(e.message).to.equal('Usuario nao existe');
    }
    try {
      await csm.verificarLimiteUsuario('USUARIO_INEXISTENTE');
    } catch (e) {
      expect(e.message).to.equal('Usuario nao existe');
    }
    try {
      await csm.atualizarLimiteUsuario('USUARIO_INEXISTENTE', 1);
    } catch (e) {
      expect(e.message).to.equal('Usuario nao existe');
    }
  });

  it('should handle invalid stream limits on register', async function () {
    try {
      await csm.registrarUsuario('user4', 0);
    } catch (e) {
      expect(e.message).to.equal('O limite deve ser um número inteiro maior que 0');
    }
    try {
      await csm.registrarUsuario('user4', 'NAN');
    } catch (e) {
      expect(e.message).to.equal('O limite deve ser um número inteiro maior que 0');
    }
  });

  it('should handle invalid stream limits on update', async function () {
    await csm.registrarUsuario('user4_1', 1);
    try {
      await csm.atualizarLimiteUsuario('user4_1', 0);
    } catch (e) {
      expect(e.message).to.equal('O novo limite deve ser um número inteiro maior que 0');
    }
    try {
      await csm.atualizarLimiteUsuario('user4_1', 'NAN');
    } catch (e) {
      expect(e.message).to.equal('O novo limite deve ser um número inteiro maior que 0');
    }
  });

  it('should not allow more streams than the limit', async function() {
    await csm.registrarUsuario('user5', 1);
    await csm.iniciarStream('user5');

    try {
      await csm.iniciarStream('user5');
    } catch (e) {
      expect(e.message).to.equal('Usuario alconçou o limite');
    }

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user5']);
    expect(user.streamsAgora).to.equal(1);
  });

  it('should handle concurrent stream starts and stops correctly', async function() {
    await csm.registrarUsuario('user6', 2);

    const simulaOperacao = async () => {
      await csm.iniciarStream('user6');
      await new Promise(resolve => setTimeout(resolve, 100));
      await csm.pararStream('user6');
    };

    await Promise.all([
      simulaOperacao(),
      simulaOperacao()
    ]);

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user6']);
    expect(user.streamsAgora).to.equal(0);
  });

  it('should handle a large number of start and stop stream operations', async function() {
    this.timeout(5000);
    await csm.registrarUsuario('user7', 100);

    const iniciar = async () => {
      await csm.iniciarStream('user7');
    };

    const parar = async () => {
      await csm.pararStream('user7');
    };

    const promessasIniciar = Array(100).fill(null).map(iniciar);
    const promessasParar = Array(100).fill(null).map(parar);

    await Promise.all(promessasIniciar);
    await Promise.all(promessasParar);

    const user = await db.get('SELECT * FROM users WHERE idUsuario = ?', ['user7']);
    expect(user.streamsAgora).to.equal(0);
  });

});