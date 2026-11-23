
import { Module } from '@nestjs/common';
import { RegistrarPagoEfectivoUseCase } from './application/pagos/registrar-pago-efectivo.use-case';
import { PAGO_REPOSITORY } from './application/pagos/pago.repository';
import { PrismaPagoRepository } from './infrastructure/repositories/prisma-pago.repository';
import { PagosController } from './presentation/http/controllers/pagos.controller';

@Module({
  controllers: [PagosController],
  providers: [
    RegistrarPagoEfectivoUseCase,
    {
      provide: PAGO_REPOSITORY,
      useClass: PrismaPagoRepository,
    },
  ],
})
export class PagosModule {}
