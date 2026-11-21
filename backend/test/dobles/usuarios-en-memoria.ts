import { Cifrador } from '../../src/application/auth/cifrador';
import {
  CambiosUsuario,
  DatosNuevoUsuario,
  Usuario,
  UsuarioConClave,
  UsuarioRepositorio,
} from '../../src/application/usuarios/usuario.repositorio';

// Dobles de prueba compartidos por las pruebas de autenticación y de usuarios.

export class CifradorFalso implements Cifrador {
  cifrar(texto: string): Promise<string> {
    return Promise.resolve(`hash:${texto}`);
  }
  comparar(texto: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash:${texto}`);
  }
}

export class UsuariosEnMemoria implements UsuarioRepositorio {
  registros: UsuarioConClave[] = [];
  auditoria: { accion: string; actorId: string; entidadId: string }[] = [];

  agregar(datos: Partial<UsuarioConClave> & { email: string }) {
    const usuario: UsuarioConClave = {
      id: `u-${this.registros.length + 1}`,
      nombre: 'Prueba',
      rol: 'OPERADOR',
      activo: true,
      creadoEn: new Date('2026-11-20T12:00:00Z'),
      passwordHash: 'hash:Clave123*',
      ...datos,
    };
    this.registros.push(usuario);
    return usuario;
  }

  buscarPorEmail(email: string): Promise<UsuarioConClave | null> {
    return Promise.resolve(
      this.registros.find((u) => u.email === email) ?? null,
    );
  }
  buscarPorId(id: string): Promise<Usuario | null> {
    const usuario = this.registros.find((u) => u.id === id);
    return Promise.resolve(usuario ? sinClave(usuario) : null);
  }
  listar(): Promise<Usuario[]> {
    return Promise.resolve(this.registros.map(sinClave));
  }
  crear(datos: DatosNuevoUsuario, actorId: string): Promise<Usuario> {
    const usuario = this.agregar(datos);
    this.auditoria.push({
      accion: 'CREAR_USUARIO',
      actorId,
      entidadId: usuario.id,
    });
    return Promise.resolve(sinClave(usuario));
  }
  actualizar(
    id: string,
    cambios: CambiosUsuario,
    actorId: string,
  ): Promise<Usuario> {
    const usuario = this.registros.find((u) => u.id === id)!;
    Object.assign(
      usuario,
      Object.fromEntries(
        Object.entries(cambios).filter(([, v]) => v !== undefined),
      ),
    );
    this.auditoria.push({
      accion: 'MODIFICAR_USUARIO',
      actorId,
      entidadId: id,
    });
    return Promise.resolve(sinClave(usuario));
  }
}

function sinClave(usuario: UsuarioConClave): Usuario {
  const copia: Partial<UsuarioConClave> = { ...usuario };
  delete copia.passwordHash;
  return copia as Usuario;
}
