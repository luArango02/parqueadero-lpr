import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AccesosModule } from './accesos.module';
import { DeteccionesModule } from './detecciones.module';
import { TarifasModule } from './application/tarifas/tarifas.module';

import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { VehiculosModule } from './vehiculos.module';
import { CobrosModule } from './cobros.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AccesosModule,
    VehiculosModule,
    DeteccionesModule,
    CobrosModule,
    TarifasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
