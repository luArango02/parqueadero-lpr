import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccesosModule } from './accesos.module';
import { DeteccionesModule } from './detecciones.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { VehiculosModule } from './vehiculos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AccesosModule,
    VehiculosModule,
    DeteccionesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
