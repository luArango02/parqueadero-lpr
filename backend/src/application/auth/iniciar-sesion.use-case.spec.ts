import { UnauthorizedException } from '@nestjs/common';
import {
  CifradorFalso,
  UsuariosEnMemoria,
} from '../../../test/dobles/usuarios-en-memoria';
import { EmisorToken, SesionUsuario } from './emisor-token';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';

class EmisorFalso implements EmisorToken {
  emitidos: SesionUsuario[] = [];
  emitir(sesion: SesionUsuario): Promise<string> {
    this.emitidos.push(sesion);
    return Promise.resolve(`token-${sesion.sub}`);
  }
}

describe('IniciarSesionUseCase', () => {
  let usuarios: UsuariosEnMemoria;
  let emisor: EmisorFalso;
  let casoDeUso: IniciarSesionUseCase;

  beforeEach(() => {
    usuarios = new UsuariosEnMemoria();
    emisor = new EmisorFalso();
    casoDeUso = new IniciarSesionUseCase(usuarios, new CifradorFalso(), emisor);
    usuarios.agregar({
      email: 'admin@parqueadero.local',
      rol: 'ADMINISTRADOR',
    });
  });

  it('con credenciales válidas entrega un token con el rol', async () => {
    const resultado = await casoDeUso.ejecutar(
      ' Admin@Parqueadero.local ',
      'Clave123*',
    );

    expect(resultado.accessToken).toBe('token-u-1');
    expect(emisor.emitidos[0]).toEqual({
      sub: 'u-1',
      email: 'admin@parqueadero.local',
      rol: 'ADMINISTRADOR',
    });
  });

  it('la respuesta nunca incluye el hash de la clave', async () => {
    const resultado = await casoDeUso.ejecutar(
      'admin@parqueadero.local',
      'Clave123*',
    );

    expect(resultado.usuario).not.toHaveProperty('passwordHash');
  });

  it('rechaza una clave incorrecta con 401', async () => {
    await expect(
      casoDeUso.ejecutar('admin@parqueadero.local', 'otra'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un correo que no existe con el mismo mensaje', async () => {
    await expect(
      casoDeUso.ejecutar('nadie@parqueadero.local', 'Clave123*'),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('un usuario desactivado no puede iniciar sesión', async () => {
    usuarios.agregar({ email: 'viejo@parqueadero.local', activo: false });

    await expect(
      casoDeUso.ejecutar('viejo@parqueadero.local', 'Clave123*'),
    ).rejects.toThrow(UnauthorizedException);
    expect(emisor.emitidos).toHaveLength(0);
  });
});
