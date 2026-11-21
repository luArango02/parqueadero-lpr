import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { CIFRADOR } from './application/auth/cifrador';
import { EMISOR_TOKEN } from './application/auth/emisor-token';
import { IniciarSesionUseCase } from './application/auth/iniciar-sesion.use-case';
import { GestionUsuariosService } from './application/usuarios/gestion-usuarios.service';
import { USUARIO_REPOSITORIO } from './application/usuarios/usuario.repositorio';
import { PrismaUsuarioRepositorio } from './infrastructure/repositories/prisma-usuario.repositorio';
import { BcryptCifrador } from './infrastructure/seguridad/bcrypt-cifrador';
import { JwtEmisorToken } from './infrastructure/seguridad/jwt-emisor-token';
import { AutenticacionGuard } from './presentation/http/auth/autenticacion.guard';
import { AuthController } from './presentation/http/controllers/auth.controller';
import { UsuariosController } from './presentation/http/controllers/usuarios.controller';

// Global para que cualquier módulo pueda usar @Autenticado() sin importar este.
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '8h',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController, UsuariosController],
  providers: [
    IniciarSesionUseCase,
    GestionUsuariosService,
    AutenticacionGuard,
    { provide: USUARIO_REPOSITORIO, useClass: PrismaUsuarioRepositorio },
    { provide: CIFRADOR, useClass: BcryptCifrador },
    { provide: EMISOR_TOKEN, useClass: JwtEmisorToken },
  ],
  exports: [JwtModule, AutenticacionGuard],
})
export class UsuariosModule {}
