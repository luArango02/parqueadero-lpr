import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './presentation/http/controllers/health.controller';

@Module({
  imports: [
    // Lee las variables del archivo .env y las deja disponibles en toda la app.
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
