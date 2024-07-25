import { Mutex } from 'async-mutex';

class CSM {
  constructor() {
    this.usuarios = new Map();
    this.mutex = new Mutex();
  }

  registrarUsuario(idUsuario, limite) {
    return this.mutex.runExclusive(() => {
      if (this.usuarios.has(idUsuario)) {
        throw new Error('Usuario ja existe');
      }
      if (limite < 1) {
        throw new Error('O limite deve ser maior que 1');
      }
      this.usuarios.set(idUsuario, { limite, streamsAgora: 0 });
    });
  }

  verificarLimiteUsuario(idUsuario) {
    return this.mutex.runExclusive(() => {
      const user = this.usuarios.get(idUsuario);
      if (!user) {
        throw new Error('Usuario nao existe');
      }
      return user.streamsAgora < user.limite;
    });
  }

  atualizarLimiteUsuario(idUsuario, novoLimite) {
    return this.mutex.runExclusive(() => {
      const user = this.usuarios.get(idUsuario);
      if (!user) {
        throw new Error('Usuario nao existe');
      }
      if (novoLimite < 1) {
        throw new Error('O novo limite deve ser maior que 1');
      }
      user.limite = novoLimite;
    });
  }

  iniciarStream(idUsuario) {
    return this.mutex.runExclusive(() => {
      const user = this.usuarios.get(idUsuario);
      if (!user) {
        throw new Error('Usuario nao existe');
      }
      if (user.streamsAgora >= user.limite) {
        throw new Error('Usuario alconçou o limite');
      }
      this.usuarios.get(idUsuario).streamsAgora++;
    });
  }

  pararStream(idUsuario) {
    return this.mutex.runExclusive(() => {
      const user = this.usuarios.get(idUsuario);
      if (!user) {
        throw new Error('Usuario nao existe');
      }
      if (user.streamsAgora === 0) {
        throw new Error('Usuario com 0 streams ativos');
      }
      user.streamsAgora--;
    });
  }

}

export default CSM;