import { Global, Module } from '@nestjs/common';
import { REGISTRO_AUDITORIA } from './application/auditoria/registro-auditoria';
import { PrismaRegistroAuditoria } from './infrastructure/repositories/prisma-registro-auditoria';
import { AuditoriaInterceptor } from './presentation/http/auditoria/auditoria.interceptor';

// Global para que cualquier controlador pueda usar @Auditar().
@Global()
@Module({
  providers: [
    AuditoriaInterceptor,
    { provide: REGISTRO_AUDITORIA, useClass: PrismaRegistroAuditoria },
  ],
  exports: [AuditoriaInterceptor, REGISTRO_AUDITORIA],
})
export class AuditoriaModule {}
