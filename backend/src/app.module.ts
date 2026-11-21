import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AccesosModule } from './accesos.module';
import { TarifasModule } from './application/tarifas/tarifas.module';

import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/http/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AccesosModule,
    TarifasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
