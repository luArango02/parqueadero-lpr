import { Module } from '@nestjs/common';
import { ActualizarEspacioUseCase } from './application/espacios/actualizar-espacio.use-case';
import { ConsultarSedeActualUseCase } from './application/espacios/consultar-sede-actual.use-case';
import { CrearEspacioUseCase } from './application/espacios/crear-espacio.use-case';
import { ESPACIO_REPOSITORIO } from './application/espacios/espacio.repositorio';
import { ListarEspaciosUseCase } from './application/espacios/listar-espacios.use-case';
import { PrismaEspacioRepositorio } from './infrastructure/repositories/prisma-espacio.repositorio';
import { EspaciosController } from './presentation/http/controllers/espacios.controller';
import { SedesController } from './presentation/http/controllers/sedes.controller';

@Module({
  controllers: [SedesController, EspaciosController],
  providers: [
    ConsultarSedeActualUseCase,
    ListarEspaciosUseCase,
    CrearEspacioUseCase,
    ActualizarEspacioUseCase,
    { provide: ESPACIO_REPOSITORIO, useClass: PrismaEspacioRepositorio },
  ],
})
export class EspaciosModule {}
