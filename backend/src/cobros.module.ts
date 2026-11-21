import { Module } from '@nestjs/common';
import { CalcularCobroService } from './application/cobros/calcular-cobro.service';
import { COBRO_CONSULTAS_REPOSITORY } from './application/cobros/cobro-consultas.repository';
import { PrismaCobroConsultasRepository } from './infrastructure/repositories/prisma-cobro-consultas.repository';
import { CobrosController } from './presentation/http/controllers/cobros.controller';

@Module({
  controllers: [CobrosController],
  providers: [
    CalcularCobroService,
    {
      provide: COBRO_CONSULTAS_REPOSITORY,
      useClass: PrismaCobroConsultasRepository,
    },
  ],
})
export class CobrosModule {}
