import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import { GestionUsuariosService } from '../../../application/usuarios/gestion-usuarios.service';
import { Usuario } from '../../../application/usuarios/usuario.repositorio';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { ActualizarUsuarioDto } from '../dto/usuarios/actualizar-usuario.dto';
import { CrearUsuarioDto } from '../dto/usuarios/crear-usuario.dto';

@ApiTags('Usuarios')
@Controller('usuarios')
@Autenticado('ADMINISTRADOR')
export class UsuariosController {
  constructor(private readonly usuarios: GestionUsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo administrador)' })
  listar(): Promise<Usuario[]> {
    return this.usuarios.listar();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un usuario (solo administrador)' })
  crear(
    @Body() dto: CrearUsuarioDto,
    @UsuarioActual() sesion: SesionUsuario,
  ): Promise<Usuario> {
    return this.usuarios.crear(dto, sesion.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modificar nombre, rol, estado o clave (solo administrador)',
  })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() sesion: SesionUsuario,
  ): Promise<Usuario> {
    return this.usuarios.actualizar(id, dto, sesion.sub);
  }
}
