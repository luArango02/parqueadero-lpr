import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configurarSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Parqueadero LPR - API')
    .setDescription(
      'API del MVP de parqueadero con reconocimiento de placas (Ingeniería de Software II).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
