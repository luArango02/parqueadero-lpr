import { Module } from '@nestjs/common';
import { EVENTO_RECIENTE_REPOSITORIO } from './application/eventos/evento-reciente.repositorio';
import { HISTORIAL_EVENTOS_REPOSITORIO } from './application/eventos/historial-eventos.repositorio';
import { ListarEventosRecientesUseCase } from './application/eventos/listar-eventos-recientes.use-case';
import { ListarHistorialEventosUseCase } from './application/eventos/listar-historial-eventos.use-case';
import { PrismaEventoRecienteRepositorio } from './infrastructure/repositories/prisma-evento-reciente.repositorio';
import { PrismaHistorialEventosRepositorio } from './infrastructure/repositories/prisma-historial-eventos.repositorio';
import { EventosController } from './presentation/http/controllers/eventos.controller';

@Module({
  controllers: [EventosController],
  providers: [
    ListarEventosRecientesUseCase,
    ListarHistorialEventosUseCase,
    {
      provide: EVENTO_RECIENTE_REPOSITORIO,
      useClass: PrismaEventoRecienteRepositorio,
    },
    {
      provide: HISTORIAL_EVENTOS_REPOSITORIO,
      useClass: PrismaHistorialEventosRepositorio,
    },
  ],
})
export class EventosModule {}
