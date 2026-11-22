import { Module } from '@nestjs/common';
import { DETECCION_REPOSITORIO } from './application/detecciones/deteccion.repositorio';
import { LECTOR_PLACAS } from './application/detecciones/lector-placas';
import { RegistrarDeteccionUseCase } from './application/detecciones/registrar-deteccion.use-case';
import { VALIDACION_DETECCION_REPOSITORIO } from './application/detecciones/validacion-deteccion.repositorio';
import { ValidarDeteccionUseCase } from './application/detecciones/validar-deteccion.use-case';
import { RELOJ } from './domain/tiempo/reloj';
import { SimuladorLectorPlacas } from './infrastructure/lectores/simulador-lector-placas';
import { PrismaDeteccionRepositorio } from './infrastructure/repositories/prisma-deteccion.repositorio';
import { PrismaValidacionDeteccionRepositorio } from './infrastructure/repositories/prisma-validacion-deteccion.repositorio';
import { RelojSistema } from './infrastructure/tiempo/reloj-sistema';
import { DeteccionesController } from './presentation/http/controllers/detecciones.controller';

@Module({
  controllers: [DeteccionesController],
  providers: [
    RegistrarDeteccionUseCase,
    ValidarDeteccionUseCase,
    { provide: DETECCION_REPOSITORIO, useClass: PrismaDeteccionRepositorio },
    {
      provide: VALIDACION_DETECCION_REPOSITORIO,
      useClass: PrismaValidacionDeteccionRepositorio,
    },
    // Para usar otro lector (OCR real) solo cambia esta línea.
    { provide: LECTOR_PLACAS, useClass: SimuladorLectorPlacas },
    { provide: RELOJ, useClass: RelojSistema },
  ],
})
export class DeteccionesModule {}
