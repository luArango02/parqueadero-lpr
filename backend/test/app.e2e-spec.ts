import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/database/prisma.service';
import { configurarSwagger } from './../src/presentation/http/docs/swagger';
import { HttpExceptionFilter } from './../src/presentation/http/filters/http-exception.filter';

// En CI no hay .env: el secreto de prueba se define aquí.
process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas';

// PrismaService se reemplaza por un doble para no depender de una base de datos real.
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const prismaFalso = {
    estaDisponible: jest.fn(() => Promise.resolve(true)),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    usuario: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: 'u-2',
          nombre: 'Operador',
          email: 'operador@parqueadero.local',
          passwordHash: 'no-se-expone',
          rol: 'OPERADOR',
          activo: true,
          creadoEn: new Date('2026-11-20T12:00:00Z'),
        }),
      ),
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

  describe('autenticación y roles', () => {
    it('GET /api/usuarios sin token responde 401', async () => {
      await request(app.getHttpServer()).get('/api/usuarios').expect(401);
    });

    it('un token alterado responde 401', async () => {
      const token = await tokenDe('ADMINISTRADOR');
      await request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${token}x`)
        .expect(401);
    });

    it('un operador no puede administrar usuarios: 403', async () => {
      const token = await tokenDe('OPERADOR');
      await request(app.getHttpServer())
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'X',
          email: 'x@parqueadero.local',
          password: 'Clave123*',
          rol: 'ADMINISTRADOR',
        })
        .expect(403);
    });

    it('GET /api/auth/profile con token devuelve el usuario sin el hash', async () => {
      const token = await tokenDe('OPERADOR');
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toMatchObject({ rol: 'OPERADOR' });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('POST /api/auth/login sin correo válido responde 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'no-es-correo', password: 'x' })
        .expect(400);
    });
  });

  describe('configuración solo para administrador', () => {
    const tarifa = {
      sedeId: '550e8400-e29b-41d4-a716-446655440000',
      tipoVehiculo: 'CARRO',
      valorDiurno: 9000,
      valorNocturno: 6000,
    };

    it('POST /api/tarifas sin token responde 401', async () => {
      await request(app.getHttpServer())
        .post('/api/tarifas')
        .send(tarifa)
        .expect(401);
    });

    it('un operador no puede cambiar tarifas ni espacios: 403', async () => {
      const token = await tokenDe('OPERADOR');
      await request(app.getHttpServer())
        .post('/api/tarifas')
        .set('Authorization', `Bearer ${token}`)
        .send(tarifa)
        .expect(403);
      await request(app.getHttpServer())
        .patch('/api/espacios/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'FUERA_DE_SERVICIO' })
        .expect(403);
    });
  });

  it('la lectura manual exige un operador autenticado: 401 sin token', async () => {
    await request(app.getHttpServer())
      .post('/api/accesos/ingreso/manual')
      .send({ placa: 'GHI789' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/accesos/salida/manual')
      .send({ placa: 'GHI789' })
      .expect(401);
  });
});
