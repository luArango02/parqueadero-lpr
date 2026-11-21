import { Injectable } from '@nestjs/common';
import { Prisma, Usuario as UsuarioPrisma } from '@prisma/client';
import {
  CambiosUsuario,
  DatosNuevoUsuario,
  Usuario,
  UsuarioConClave,
  UsuarioRepositorio,
} from '../../application/usuarios/usuario.repositorio';
import { PrismaService } from '../database/prisma.service';

function sinClave(usuario: UsuarioPrisma): Usuario {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    creadoEn: usuario.creadoEn,
  };
}

// En la auditoría se anota que la clave cambió, nunca el hash.
function paraAuditoria({
  passwordHash,
  ...resto
}: Partial<Usuario> & { passwordHash?: string }): Prisma.InputJsonObject {
  const datos = passwordHash ? { ...resto, clave: 'cambiada' } : resto;
  // stringify quita los campos undefined y convierte las fechas a texto.
  return JSON.parse(JSON.stringify(datos)) as Prisma.InputJsonObject;
}

@Injectable()
export class PrismaUsuarioRepositorio implements UsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<UsuarioConClave | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    return usuario ? sinClave(usuario) : null;
  }

  async listar(): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { creadoEn: 'asc' },
    });
    return usuarios.map(sinClave);
  }

  crear(datos: DatosNuevoUsuario, actorId: string): Promise<Usuario> {
    return this.prisma.$transaction(async (tx) => {
      const usuario = sinClave(await tx.usuario.create({ data: datos }));
      await tx.auditoria.create({
        data: {
          usuarioId: actorId,
          accion: 'CREAR_USUARIO',
          entidad: 'Usuario',
          entidadId: usuario.id,
          datosNuevos: paraAuditoria(usuario),
        },
      });
      return usuario;
    });
  }

  actualizar(
    id: string,
    cambios: CambiosUsuario,
    actorId: string,
  ): Promise<Usuario> {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.usuario.findUniqueOrThrow({ where: { id } });
      const usuario = sinClave(
        await tx.usuario.update({ where: { id }, data: cambios }),
      );
      await tx.auditoria.create({
        data: {
          usuarioId: actorId,
          accion: 'MODIFICAR_USUARIO',
          entidad: 'Usuario',
          entidadId: id,
          datosAnteriores: paraAuditoria(sinClave(anterior)),
          datosNuevos: paraAuditoria(cambios),
        },
      });
      return usuario;
    });
  }
}
