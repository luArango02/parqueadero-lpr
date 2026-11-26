import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function crearDocumentoOpenApi(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Parqueadero LPR - API')
    .setDescription(
      'API del MVP de parqueadero con reconocimiento de placas (Ingeniería de Software II).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function configurarSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, crearDocumentoOpenApi(app));
}
