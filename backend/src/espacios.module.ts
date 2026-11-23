import { Module } from '@nestjs/common';
import { ActualizarEspacioUseCase } from './application/espacios/actualizar-espacio.use-case';
import { ConsultarCuposUseCase } from './application/espacios/consultar-cupos.use-case';
import { ConsultarDisponibilidadUseCase } from './application/espacios/consultar-disponibilidad.use-case';
import { ConsultarSedeActualUseCase } from './application/espacios/consultar-sede-actual.use-case';
import { CrearEspacioUseCase } from './application/espacios/crear-espacio.use-case';
import { CUPO_REPOSITORIO } from './application/espacios/cupo.repositorio';
import { ESPACIO_REPOSITORIO } from './application/espacios/espacio.repositorio';
import { ListarEspaciosUseCase } from './application/espacios/listar-espacios.use-case';
import { PrismaCupoRepositorio } from './infrastructure/repositories/prisma-cupo.repositorio';
import { PrismaEspacioRepositorio } from './infrastructure/repositories/prisma-espacio.repositorio';
import { CuposController } from './presentation/http/controllers/cupos.controller';
import { EspaciosController } from './presentation/http/controllers/espacios.controller';
import { SedesController } from './presentation/http/controllers/sedes.controller';

@Module({
  controllers: [SedesController, EspaciosController, CuposController],
  providers: [
    ConsultarSedeActualUseCase,
    ListarEspaciosUseCase,
    CrearEspacioUseCase,
    ActualizarEspacioUseCase,
    ConsultarCuposUseCase,
    ConsultarDisponibilidadUseCase,
    { provide: ESPACIO_REPOSITORIO, useClass: PrismaEspacioRepositorio },
    { provide: CUPO_REPOSITORIO, useClass: PrismaCupoRepositorio },
  ],
})
export class EspaciosModule {}
