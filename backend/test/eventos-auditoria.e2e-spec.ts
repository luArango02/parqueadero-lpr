import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { ListarAuditoriaUseCase } from '../src/application/auditoria/listar-auditoria.use-case';
import { ListarHistorialEventosUseCase } from '../src/application/eventos/listar-historial-eventos.use-case';

describe('Eventos y auditoria (e2e) - ACT-031', () => {
  let app: INestApplication<App>;
  let tokenAdmin: string;
  let tokenOperador: string;

  const respuestaVacia = {
    datos: [],
    total: 0,
    pagina: 1,
    limite: 20,
    totalPaginas: 0,
  };

  const listarHistorial = jest.fn();
  const listarAuditoria = jest.fn();

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas';

    const prismaFalso = {
      permanencia: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      estaDisponible: jest.fn().mockResolvedValue(true),
    };

    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .overrideProvider(ListarHistorialEventosUseCase)
      .useValue({ ejecutar: listarHistorial })
      .overrideProvider(ListarAuditoriaUseCase)
      .useValue({ ejecutar: listarAuditoria })
      .compile();

    app = modulo.createNestApplication();

    app.setGlobalPrefix('api', { exclude: ['health'] });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    const jwt = app.get(JwtService);

    tokenAdmin = await jwt.signAsync({
      sub: 'admin-prueba',
      email: 'admin@parqueadero.local',
      rol: 'ADMINISTRADOR',
    });

    tokenOperador = await jwt.signAsync({
      sub: 'operador-prueba',
      email: 'operador@parqueadero.local',
      rol: 'OPERADOR',
    });
  });

  beforeEach(() => {
    listarHistorial.mockReset();
    listarAuditoria.mockReset();

    listarHistorial.mockResolvedValue(respuestaVacia);
    listarAuditoria.mockResolvedValue(respuestaVacia);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('rechaza historial sin autenticacion', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial')
      .expect(401);

    expect(listarHistorial).not.toHaveBeenCalled();
  });

  it('rechaza auditoria sin autenticacion', async () => {
    await request(app.getHttpServer()).get('/api/auditoria').expect(401);

    expect(listarAuditoria).not.toHaveBeenCalled();
  });

  it('permite consultar historial al administrador', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200)
      .expect(respuestaVacia);
  });

  it('permite consultar historial al operador', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial')
      .set('Authorization', `Bearer ${tokenOperador}`)
      .expect(200)
      .expect(respuestaVacia);
  });

  it('permite consultar auditoria al administrador', async () => {
    await request(app.getHttpServer())
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200)
      .expect(respuestaVacia);
  });

  it('prohibe consultar auditoria al operador', async () => {
    await request(app.getHttpServer())
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenOperador}`)
      .expect(403);

    expect(listarAuditoria).not.toHaveBeenCalled();
  });

  it('rechaza una pagina invalida en historial', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial?pagina=0')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);

    expect(listarHistorial).not.toHaveBeenCalled();
  });

  it('rechaza una pagina invalida en auditoria', async () => {
    await request(app.getHttpServer())
      .get('/api/auditoria?pagina=0')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);

    expect(listarAuditoria).not.toHaveBeenCalled();
  });

  it('rechaza un tipo de evento desconocido', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial?tipo=DESCONOCIDO')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);
  });

  it('rechaza un estado desconocido', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial?estado=DESCONOCIDO')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);
  });

  it('envia los filtros de historial al caso de uso', async () => {
    await request(app.getHttpServer())
      .get('/api/eventos/historial')
      .query({
        placa: 'ACT024',
        tipo: 'INGRESO',
        estado: 'AUTORIZADO',
        pagina: 2,
        limite: 10,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(listarHistorial).toHaveBeenCalledWith(
      expect.objectContaining({
        placa: 'ACT024',
        tipo: 'INGRESO',
        estado: 'AUTORIZADO',
        pagina: 2,
        limite: 10,
      }),
    );
  });

  it('envia los filtros de auditoria al caso de uso', async () => {
    await request(app.getHttpServer())
      .get('/api/auditoria')
      .query({
        entidad: 'Espacio',
        accion: 'MODIFICAR',
        pagina: 1,
        limite: 10,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(listarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: 'Espacio',
        accion: 'MODIFICAR',
        pagina: 1,
        limite: 10,
      }),
    );
  });
});
