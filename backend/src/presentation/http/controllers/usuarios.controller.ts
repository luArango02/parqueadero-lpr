import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import { GestionUsuariosService } from '../../../application/usuarios/gestion-usuarios.service';
import { Usuario } from '../../../application/usuarios/usuario.repositorio';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { ActualizarUsuarioDto } from '../dto/usuarios/actualizar-usuario.dto';
import { CrearUsuarioDto } from '../dto/usuarios/crear-usuario.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import { UsuarioRespuestaDto } from '../docs/respuestas/usuario-respuesta.dto';

@ApiTags('Usuarios')
@Controller('usuarios')
@Autenticado('ADMINISTRADOR')
export class UsuariosController {
  constructor(private readonly usuarios: GestionUsuariosService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar los usuarios del sistema',
    description:
      'Devuelve los usuarios registrados, ordenados por fecha de creación. No incluye contraseñas ni hashes.',
  })
  @ApiOkResponse({
    description: 'Listado de usuarios obtenido correctamente',
    type: UsuarioRespuestaDto,
    isArray: true,
  })
  listar(): Promise<Usuario[]> {
    return this.usuarios.listar();
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description:
      'Crea un usuario con el rol indicado, almacena su contraseña cifrada mediante hash y registra la operación en auditoría.',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado correctamente',
    type: UsuarioRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Los datos proporcionados no cumplen las validaciones',
    type: ErrorHttpDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe un usuario con ese correo electrónico',
    type: ErrorHttpDto,
  })
  crear(
    @Body() dto: CrearUsuarioDto,
    @UsuarioActual() sesion: SesionUsuario,
  ): Promise<Usuario> {
    return this.usuarios.crear(dto, sesion.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un usuario registrado',
    description:
      'Permite modificar el nombre, rol, estado activo o contraseña. Un administrador no puede desactivarse ni quitarse su propio rol. La operación queda registrada en auditoría.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del usuario',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
  })
  @ApiOkResponse({
    description: 'Usuario actualizado correctamente',
    type: UsuarioRespuestaDto,
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos o intento de un administrador de desactivar su propia cuenta o quitarse su rol',
    type: ErrorHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
    type: ErrorHttpDto,
  })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() sesion: SesionUsuario,
  ): Promise<Usuario> {
    return this.usuarios.actualizar(id, dto, sesion.sub);
  }
}
