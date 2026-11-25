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

const ID = '11111111-1111-4111-8111-111111111111';
const CUERPO = {
  estado: 'RESUELTA',
  resolucion: 'Es una moto con placa de carro',
  tipoConfirmado: 'MOTO',
};

describe('Alertas (e2e)', () => {
  let app: INestApplication<App>;
  // PrismaService se reemplaza por un doble: la protección no necesita base de datos.
  const prismaFalso = {
    estaDisponible: jest.fn(() => Promise.resolve(true)),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    alerta: {
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    permanencia: {
      findMany: jest.fn().mockResolvedValue([]),
    },
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

  it('GET /api/alertas sin token responde 401', async () => {
    await request(app.getHttpServer()).get('/api/alertas').expect(401);
  });

  it('PATCH /api/alertas/:id/estado sin token responde 401', async () => {
    await request(app.getHttpServer())
      .patch(`/api/alertas/${ID}/estado`)
      .send(CUERPO)
      .expect(401);
  });

  it('un administrador puede consultar las alertas', async () => {
    const token = await tokenDe('ADMINISTRADOR');
    await request(app.getHttpServer())
      .get('/api/alertas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('un administrador no puede resolver alertas: 403', async () => {
    const token = await tokenDe('ADMINISTRADOR');
    await request(app.getHttpServer())
      .patch(`/api/alertas/${ID}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send(CUERPO)
      .expect(403);
  });

  it('un operador pasa la protección y llega a la alerta: 404 si no existe', async () => {
    const token = await tokenDe('OPERADOR');
    await request(app.getHttpServer())
      .patch(`/api/alertas/${ID}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send(CUERPO)
      .expect(404);
  });
});
