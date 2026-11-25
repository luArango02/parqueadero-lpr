import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EspaciosModule } from './espacios.module';

import { AccesosModule } from './accesos.module';
import { DeteccionesModule } from './detecciones.module';
import { TarifasModule } from './application/tarifas/tarifas.module';

import { DatabaseModule } from './infrastructure/database/database.module';
import { AuditoriaModule } from './auditoria.module';
import { TiempoRealModule } from './tiempo-real.module';
import { UsuariosModule } from './usuarios.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { VehiculosModule } from './vehiculos.module';
import { CobrosModule } from './cobros.module';
import { PagosModule } from './pagos.module';
import { AlertasModule } from './alertas.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventosModule } from './eventos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsuariosModule,
    TiempoRealModule,
    AuditoriaModule,
    AccesosModule,
    VehiculosModule,
    DeteccionesModule,
    CobrosModule,
    PagosModule,
    TarifasModule,
    EspaciosModule,
    AlertasModule,
    EventosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
