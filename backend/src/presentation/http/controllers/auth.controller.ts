import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
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
import { ErrorHttpDto } from '../docs/respuestas/error-http.dto';
import {
  SesionRespuestaDto,
  UsuarioRespuestaDto,
} from '../docs/respuestas/usuario-respuesta.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly usuarios: GestionUsuariosService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión y obtener el token JWT',
    description:
      'Autentica a un usuario activo mediante correo electrónico y contraseña. Devuelve un token JWT y los datos públicos del usuario.',
  })
  @ApiOkResponse({
    description: 'Autenticación exitosa',
    type: SesionRespuestaDto,
  })
  @ApiBadRequestResponse({
    description: 'Correo electrónico o contraseña con formato inválido',
    type: ErrorHttpDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario inactivo',
    type: ErrorHttpDto,
  })
  login(@Body() dto: LoginDto): Promise<ResultadoSesion> {
    return this.iniciarSesion.ejecutar(dto.email, dto.password);
  }

  @Get('profile')
  @Autenticado()
  @ApiOperation({
    summary: 'Consultar el perfil del usuario autenticado',
    description:
      'Devuelve los datos públicos del usuario identificado por el token JWT.',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario obtenido correctamente',
    type: UsuarioRespuestaDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario asociado al token no existe',
    type: ErrorHttpDto,
  })
  perfil(@UsuarioActual() sesion: SesionUsuario): Promise<Usuario> {
    return this.usuarios.consultar(sesion.sub);
  }
}
