import { Module } from '@nestjs/common';
import { INGRESO_REPOSITORIO } from './application/accesos/ingreso.repositorio';
import { RegistrarIngresoUseCase } from './application/accesos/registrar-ingreso.use-case';
import { RegistrarSalidaUseCase } from './application/accesos/registrar-salida.use-case';
import { SALIDA_REPOSITORIO } from './application/accesos/salida.repositorio';
import { ConsultarPaseVigenteUseCase } from './application/pases/consultar-pase-vigente.use-case';
import { VerificarCambioDiaService } from './application/accesos/verificar-cambio-dia.service';
import { RELOJ } from './domain/tiempo/reloj';
import { PrismaIngresoRepositorio } from './infrastructure/repositories/prisma-ingreso.repositorio';
import { PrismaSalidaRepositorio } from './infrastructure/repositories/prisma-salida.repositorio';
import { RelojSistema } from './infrastructure/tiempo/reloj-sistema';
import { AccesosController } from './presentation/http/controllers/accesos.controller';
import { PasesController } from './presentation/http/controllers/pases.controller';

@Module({
  controllers: [AccesosController, PasesController],
  providers: [
    RegistrarIngresoUseCase,
    RegistrarSalidaUseCase,
    ConsultarPaseVigenteUseCase,
    VerificarCambioDiaService,
    { provide: INGRESO_REPOSITORIO, useClass: PrismaIngresoRepositorio },
    { provide: SALIDA_REPOSITORIO, useClass: PrismaSalidaRepositorio },
    { provide: RELOJ, useClass: RelojSistema },
  ],
})
export class AccesosModule {}