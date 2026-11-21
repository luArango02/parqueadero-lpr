import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccesosModule } from './accesos.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { CobrosModule } from './cobros.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AccesosModule,
    CobrosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
