
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { PagosController } from '../src/presentation/http/controllers/pagos.controller';
import { AutenticacionGuard } from '../src/presentation/http/auth/autenticacion.guard';
import { RegistrarPagoEfectivoUseCase } from '../src/application/pagos/registrar-pago-efectivo.use-case';

describe('PagosController (E2E - seguridad)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const registrarPago = jest.fn();

  const cobroId = '550e8400-e29b-41d4-a716-446655440000';
  const usuarioId = '550e8400-e29b-41d4-a716-446655440001';

  const solicitud = {
    cobroId,
    referencia: 'EFECTIVO-PRUEBA-001',
  };

  const respuestaPago = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    cobroId,
    referencia: solicitud.referencia,
    medio: 'EFECTIVO',
    valor: '10000.00',
    estadoCobro: 'PAGADO',
    pagadoEn: new Date('2026-11-23T12:00:00.000Z'),
    registradoPorId: usuarioId,
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'clave-exclusiva-para-pruebas-e2e',
        }),
      ],
      controllers: [PagosController],
      providers: [
        Reflector,
        AutenticacionGuard,
        {
          provide: RegistrarPagoEfectivoUseCase,
          useValue: {
            ejecutar: registrarPago,
          },
        },
      ],
    }).compile();

    app = modulo.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    jwt = modulo.get(JwtService);
  });

  beforeEach(() => {
    registrarPago.mockReset();
    registrarPago.mockResolvedValue(respuestaPago);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  function generarToken(rol: string): string {
    return jwt.sign({
      sub: usuarioId,
      email: 'operador@pruebas.test',
      rol,
    });
  }

  it('rechaza una solicitud sin token con 401', async () => {
    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .send(solicitud)
      .expect(401);

    expect(registrarPago).not.toHaveBeenCalled();
  });

  it('rechaza un token inválido con 401', async () => {
    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', 'Bearer token-invalido')
      .send(solicitud)
      .expect(401);

    expect(registrarPago).not.toHaveBeenCalled();
  });

  it('permite registrar pagos al ADMINISTRADOR', async () => {
    const token = generarToken('ADMINISTRADOR');

    const respuesta = await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', `Bearer ${token}`)
      .send(solicitud)
      .expect(200);

    expect(respuesta.body.estadoCobro).toBe('PAGADO');

    expect(registrarPago).toHaveBeenCalledWith({
      cobroId,
      referencia: solicitud.referencia,
      registradoPorId: usuarioId,
    });
  });

  it('permite registrar pagos al OPERADOR', async () => {
    const token = generarToken('OPERADOR');

    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', `Bearer ${token}`)
      .send(solicitud)
      .expect(200);

    expect(registrarPago).toHaveBeenCalledWith({
      cobroId,
      referencia: solicitud.referencia,
      registradoPorId: usuarioId,
    });
  });

  it('rechaza con 403 un rol no autorizado', async () => {
    // Rol ficticio usado únicamente para probar el guard.
    const token = generarToken('ROL_NO_AUTORIZADO');

    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', `Bearer ${token}`)
      .send(solicitud)
      .expect(403);

    expect(registrarPago).not.toHaveBeenCalled();
  });

  it('rechaza un cobroId inválido con 400', async () => {
    const token = generarToken('OPERADOR');

    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cobroId: 'no-es-un-uuid',
        referencia: 'EFECTIVO-001',
      })
      .expect(400);

    expect(registrarPago).not.toHaveBeenCalled();
  });

  it('rechaza una referencia vacía con 400', async () => {
    const token = generarToken('OPERADOR');

    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cobroId,
        referencia: '',
      })
      .expect(400);

    expect(registrarPago).not.toHaveBeenCalled();
  });

  it('rechaza una referencia de más de 100 caracteres', async () => {
    const token = generarToken('OPERADOR');

    await request(app.getHttpServer())
      .post('/api/pagos/efectivo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cobroId,
        referencia: 'A'.repeat(101),
      })
      .expect(400);

    expect(registrarPago).not.toHaveBeenCalled();
  });
});
