import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EspaciosModule } from './espacios.module';

import { AccesosModule } from './accesos.module';
import { DeteccionesModule } from './detecciones.module';
import { TarifasModule } from './application/tarifas/tarifas.module';

import { DatabaseModule } from './infrastructure/database/database.module';
import { TiempoRealModule } from './tiempo-real.module';
import { UsuariosModule } from './usuarios.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { VehiculosModule } from './vehiculos.module';
import { CobrosModule } from './cobros.module';
import { AlertasModule } from './alertas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsuariosModule,
    TiempoRealModule,
    AccesosModule,
    VehiculosModule,
    DeteccionesModule,
    CobrosModule,
    TarifasModule,
    EspaciosModule,
    AlertasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
