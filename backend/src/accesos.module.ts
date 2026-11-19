import { Module } from '@nestjs/common';
import { INGRESO_REPOSITORIO } from './application/accesos/ingreso.repositorio';
import { RegistrarIngresoUseCase } from './application/accesos/registrar-ingreso.use-case';
import { RELOJ } from './domain/tiempo/reloj';
import { PrismaIngresoRepositorio } from './infrastructure/repositories/prisma-ingreso.repositorio';
import { RelojSistema } from './infrastructure/tiempo/reloj-sistema';
import { AccesosController } from './presentation/http/controllers/accesos.controller';

@Module({
  controllers: [AccesosController],
  providers: [
    RegistrarIngresoUseCase,
    { provide: INGRESO_REPOSITORIO, useClass: PrismaIngresoRepositorio },
    { provide: RELOJ, useClass: RelojSistema },
  ],
})
export class AccesosModule {}
