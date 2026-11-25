import { Global, Module } from '@nestjs/common';
import { REGISTRO_AUDITORIA } from './application/auditoria/registro-auditoria';
import { AUDITORIA_REPOSITORIO } from './application/auditoria/auditoria.repositorio';
import { ListarAuditoriaUseCase } from './application/auditoria/listar-auditoria.use-case';
import { PrismaRegistroAuditoria } from './infrastructure/repositories/prisma-registro-auditoria';
import { PrismaAuditoriaRepositorio } from './infrastructure/repositories/prisma-auditoria.repositorio';
import { AuditoriaInterceptor } from './presentation/http/auditoria/auditoria.interceptor';
import { AuditoriaController } from './presentation/http/controllers/auditoria.controller';

// Global para que cualquier controlador pueda usar @Auditar().
@Global()
@Module({
  controllers: [AuditoriaController],
  providers: [
    AuditoriaInterceptor,
    ListarAuditoriaUseCase,
    {
      provide: REGISTRO_AUDITORIA,
      useClass: PrismaRegistroAuditoria,
    },
    {
      provide: AUDITORIA_REPOSITORIO,
      useClass: PrismaAuditoriaRepositorio,
    },
  ],
  exports: [AuditoriaInterceptor, REGISTRO_AUDITORIA],
})
export class AuditoriaModule {}
