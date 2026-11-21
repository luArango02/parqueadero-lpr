import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { SesionUsuario } from '../../../application/auth/emisor-token';
import {
  IniciarSesionUseCase,
  ResultadoSesion,
} from '../../../application/auth/iniciar-sesion.use-case';
import { GestionUsuariosService } from '../../../application/usuarios/gestion-usuarios.service';
import { Usuario } from '../../../application/usuarios/usuario.repositorio';
import { Autenticado } from '../auth/autenticado.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { LoginDto } from '../dto/usuarios/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly usuarios: GestionUsuariosService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener el token JWT' })
  @ApiOkResponse({ description: 'Token de acceso y datos del usuario' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto): Promise<ResultadoSesion> {
    return this.iniciarSesion.ejecutar(dto.email, dto.password);
  }

  @Get('profile')
  @Autenticado()
  @ApiOperation({ summary: 'Datos del usuario dueño del token' })
  perfil(@UsuarioActual() sesion: SesionUsuario): Promise<Usuario> {
    return this.usuarios.consultar(sesion.sub);
  }
}
