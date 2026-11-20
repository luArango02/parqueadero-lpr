import { Module } from '@nestjs/common';
import { BuscarVehiculoUseCase } from './application/vehiculos/buscar-vehiculo.use-case';
import { ListarVehiculosUseCase } from './application/vehiculos/listar-vehiculos.use-case';
import { RegistrarVehiculoUseCase } from './application/vehiculos/registrar-vehiculo.use-case';
import { VEHICULO_REPOSITORIO } from './application/vehiculos/vehiculo.repositorio';
import { PrismaVehiculoRepositorio } from './infrastructure/repositories/prisma-vehiculo.repositorio';
import { VehiculosController } from './presentation/http/controllers/vehiculos.controller';

@Module({
  controllers: [VehiculosController],
  providers: [
    RegistrarVehiculoUseCase,
    BuscarVehiculoUseCase,
    ListarVehiculosUseCase,
    { provide: VEHICULO_REPOSITORIO, useClass: PrismaVehiculoRepositorio },
  ],
})
export class VehiculosModule {}
