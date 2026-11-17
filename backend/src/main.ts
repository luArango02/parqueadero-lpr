import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './presentation/http/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas de la API quedan bajo /api, excepto /health.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Respuestas de error con el mismo formato en toda la API.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Permite que el frontend (Vue) llame a la API desde otro puerto.
  app.enableCors();

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

void bootstrap();
