import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/database/prisma.service';
import { configurarSwagger } from './../src/presentation/http/docs/swagger';
import { HttpExceptionFilter } from './../src/presentation/http/filters/http-exception.filter';

// PrismaService se reemplaza por un doble para no depender de una base de datos real.
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const prismaFalso = {
    estaDisponible: jest.fn(() => Promise.resolve(true)),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalFilters(new HttpExceptionFilter());
    configurarSwagger(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health responde 200 con estado ok', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('GET /health responde 503 si la base de datos no responde', async () => {
    prismaFalso.estaDisponible.mockResolvedValueOnce(false);
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(503);
    expect(response.body).toMatchObject({ statusCode: 503 });
  });

  it('una ruta inexistente responde 404 con el formato de error común', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/no-existe')
      .expect(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/api/no-existe',
    });
  });

  it('GET /docs-json publica la documentación con el endpoint de salud', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    expect(response.body).toHaveProperty(['paths', '/health']);
  });
});
