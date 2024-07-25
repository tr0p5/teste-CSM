import { expect } from 'chai';
import CSM from '../src/CSM.js'


describe('CSM test', function () {
  let csm;

  beforeEach(() => {
    csm = new CSM();
  });

  it('should register a user', async function () {
    await csm.registrarUsuario('user1', 3);
    expect(await csm.verificarLimiteUsuario('user1')).to.be.true;
  });

  it('should start and stop streams', async function () {
    await csm.registrarUsuario('user2', 2);
    await csm.iniciarStream('user2');
    expect(await csm.verificarLimiteUsuario('user2')).to.be.true;
    await new Promise(resolve => setTimeout(resolve, 100));
    await csm.iniciarStream('user2');
    expect(await csm.verificarLimiteUsuario('user2')).to.be.false;
    await new Promise(resolve => setTimeout(resolve, 100));
    await csm.pararStream('user2');
    expect(await csm.verificarLimiteUsuario('user2')).to.be.true;
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should update stream limits', async function () {
    await csm.registrarUsuario('user3', 1);
    expect(await csm.verificarLimiteUsuario('user3')).to.be.true;
    await csm.iniciarStream('user3');
    expect(await csm.verificarLimiteUsuario('user3')).to.be.false;
    await csm.atualizarLimiteUsuario('user3', 2);
    expect(await csm.verificarLimiteUsuario('user3')).to.be.true;
    await csm.atualizarLimiteUsuario('user3', 3);
    const user = csm.usuarios.get('user3');
    expect(user.limite).to.equal(3);
  });

  it('should handle nonexistent users', async function () {
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

  it('should handle invalid stream limits', async function () {
    try {
      await csm.registrarUsuario('user4', 0);
    } catch (e) {
      expect(e.message).to.equal('O limite deve ser maior que 1');
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

    const user = csm.usuarios.get('user5');
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

    const user = csm.usuarios.get('user6');
    expect(user.streamsAgora).to.equal(0);
  });

  it('should handle a large number of start and stop stream operations', async function() {
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

    const user = csm.usuarios.get('user7');
    expect(user.streamsAgora).to.equal(0);
  });

});