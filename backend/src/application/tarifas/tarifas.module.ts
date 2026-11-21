import { Module } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { TARIFA_REPOSITORY } from '../../domain/tarifas/tarifa.repository';
import { PrismaTarifaRepository } from '../../infrastructure/repositories/prisma-tarifa.repository';
import { TarifasController } from '../../presentation/http/controllers/tarifas.controller';

@Module({
  controllers: [TarifasController],
  providers: [
    TarifasService,
    {
      provide: TARIFA_REPOSITORY,
      useClass: PrismaTarifaRepository,
    },
  ],
  exports: [TarifasService],
})
export class TarifasModule {}
