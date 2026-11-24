import { Module } from '@nestjs/common';
import { EVENTO_RECIENTE_REPOSITORIO } from './application/eventos/evento-reciente.repositorio';
import { ListarEventosRecientesUseCase } from './application/eventos/listar-eventos-recientes.use-case';
import { PrismaEventoRecienteRepositorio } from './infrastructure/repositories/prisma-evento-reciente.repositorio';
import { EventosController } from './presentation/http/controllers/eventos.controller';

@Module({
  controllers: [EventosController],
  providers: [
    ListarEventosRecientesUseCase,
    {
      provide: EVENTO_RECIENTE_REPOSITORIO,
      useClass: PrismaEventoRecienteRepositorio,
    },
  ],
})
export class EventosModule {}
