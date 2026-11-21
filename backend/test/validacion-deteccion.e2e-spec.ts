import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/database/prisma.service';
import { HttpExceptionFilter } from './../src/presentation/http/filters/http-exception.filter';

// En CI no hay .env: el secreto de prueba se define aquí.
process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas';

const RUTA = '/api/detecciones/11111111-1111-4111-8111-111111111111/validacion';
const CUERPO = { placa: 'ABC124', motivo: 'La cámara confundió el 3 con el 4' };

describe('PATCH /api/detecciones/:id/validacion (e2e)', () => {
  let app: INestApplication<App>;
  // PrismaService se reemplaza por un doble: la protección no necesita base de datos.
  const prismaFalso = {
    estaDisponible: jest.fn(() => Promise.resolve(true)),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    deteccion: { findUnique: jest.fn(() => Promise.resolve(null)) },
  };
  const tokenDe = (rol: 'ADMINISTRADOR' | 'OPERADOR') =>
    app
      .get(JwtService)
      .signAsync({ sub: 'u-2', email: 'operador@parqueadero.local', rol });

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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sin token responde 401', async () => {
    await request(app.getHttpServer()).patch(RUTA).send(CUERPO).expect(401);
  });

  it('un token alterado responde 401', async () => {
    const token = await tokenDe('OPERADOR');
    await request(app.getHttpServer())
      .patch(RUTA)
      .set('Authorization', `Bearer ${token}x`)
      .send(CUERPO)
      .expect(401);
  });

  it('un administrador no puede validar lecturas: 403', async () => {
    const token = await tokenDe('ADMINISTRADOR');
    await request(app.getHttpServer())
      .patch(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send(CUERPO)
      .expect(403);
  });

  it('un operador pasa la protección y llega a la detección: 404 si no existe', async () => {
    const token = await tokenDe('OPERADOR');
    await request(app.getHttpServer())
      .patch(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send(CUERPO)
      .expect(404);
  });
});
