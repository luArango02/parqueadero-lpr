import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  CifradorFalso,
  UsuariosEnMemoria,
} from '../../../test/dobles/usuarios-en-memoria';
import { GestionUsuariosService } from './gestion-usuarios.service';

describe('GestionUsuariosService', () => {
  let usuarios: UsuariosEnMemoria;
  let servicio: GestionUsuariosService;
  const ADMIN = 'u-1';

  beforeEach(() => {
    usuarios = new UsuariosEnMemoria();
    servicio = new GestionUsuariosService(usuarios, new CifradorFalso());
    usuarios.agregar({
      email: 'admin@parqueadero.local',
      rol: 'ADMINISTRADOR',
    });
  });

  it('crea un usuario guardando la clave cifrada y deja auditoría', async () => {
    const creado = await servicio.crear(
      {
        nombre: 'Operador Noche',
        email: 'Noche@Parqueadero.local',
        password: 'Clave123*',
        rol: 'OPERADOR',
      },
      ADMIN,
    );

    expect(creado.email).toBe('noche@parqueadero.local');
    expect(usuarios.registros[1].passwordHash).toBe('hash:Clave123*');
    expect(usuarios.auditoria).toEqual([
      { accion: 'CREAR_USUARIO', actorId: ADMIN, entidadId: creado.id },
    ]);
  });

  it('no permite dos usuarios con el mismo correo', async () => {
    await expect(
      servicio.crear(
        {
          nombre: 'Otro',
          email: 'admin@parqueadero.local',
          password: 'Clave123*',
          rol: 'OPERADOR',
        },
        ADMIN,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('modifica rol y estado de otro usuario con auditoría', async () => {
    const operador = usuarios.agregar({ email: 'op@parqueadero.local' });

    const actualizado = await servicio.actualizar(
      operador.id,
      { rol: 'ADMINISTRADOR', activo: false },
      ADMIN,
    );

    expect(actualizado).toMatchObject({ rol: 'ADMINISTRADOR', activo: false });
    expect(usuarios.auditoria[0].accion).toBe('MODIFICAR_USUARIO');
  });

  it('cambiar la clave la guarda cifrada', async () => {
    const operador = usuarios.agregar({ email: 'op@parqueadero.local' });

    await servicio.actualizar(operador.id, { password: 'Nueva123*' }, ADMIN);

    expect(usuarios.registros[1].passwordHash).toBe('hash:Nueva123*');
  });

  it('un administrador no puede desactivarse a sí mismo', async () => {
    await expect(
      servicio.actualizar(ADMIN, { activo: false }, ADMIN),
    ).rejects.toThrow(BadRequestException);
  });

  it('un administrador no puede quitarse el rol a sí mismo', async () => {
    await expect(
      servicio.actualizar(ADMIN, { rol: 'OPERADOR' }, ADMIN),
    ).rejects.toThrow(BadRequestException);
  });

  it('modificar un usuario inexistente responde 404', async () => {
    await expect(
      servicio.actualizar('no-existe', { nombre: 'X' }, ADMIN),
    ).rejects.toThrow(NotFoundException);
  });
});
