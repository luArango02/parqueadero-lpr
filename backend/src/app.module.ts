import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EspaciosModule } from './espacios.module';

import { AccesosModule } from './accesos.module';
import { TarifasModule } from './application/tarifas/tarifas.module';

import { DatabaseModule } from './infrastructure/database/database.module';
import { UsuariosModule } from './usuarios.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { VehiculosModule } from './vehiculos.module';
import { CobrosModule } from './cobros.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsuariosModule,
    AccesosModule,
    VehiculosModule,
    CobrosModule,
    TarifasModule,
    EspaciosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
