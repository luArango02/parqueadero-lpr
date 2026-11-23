import { Module } from '@nestjs/common';
import { ALERTA_REPOSITORIO } from './application/alertas/alerta.repositorio';
import { ListarAlertasUseCase } from './application/alertas/listar-alertas.use-case';
import { ResolverAlertaUseCase } from './application/alertas/resolver-alerta.use-case';
import { RELOJ } from './domain/tiempo/reloj';
import { PrismaAlertaRepositorio } from './infrastructure/repositories/prisma-alerta.repositorio';
import { RelojSistema } from './infrastructure/tiempo/reloj-sistema';
import { AlertasController } from './presentation/http/controllers/alertas.controller';

@Module({
  controllers: [AlertasController],
  providers: [
    ListarAlertasUseCase,
    ResolverAlertaUseCase,
    { provide: ALERTA_REPOSITORIO, useClass: PrismaAlertaRepositorio },
    { provide: RELOJ, useClass: RelojSistema },
  ],
})
export class AlertasModule {}
