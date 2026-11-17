import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/presentation/http/filters/http-exception.filter';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health responde 200 con estado ok', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.body).toMatchObject({ status: 'ok' });
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
});
