import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './presentation/http/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // /health queda fuera de /api porque lo consultan Docker y la nube, no el frontend.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();

  const config = app.get(ConfigService);
  await app.listen(config.get<number>('PORT', 3000));
}

void bootstrap();
