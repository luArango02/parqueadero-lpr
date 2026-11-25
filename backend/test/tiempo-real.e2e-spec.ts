import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AddressInfo, Server } from 'net';
import { Socket, io } from 'socket.io-client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/database/prisma.service';

process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas';

// Conexión real por Socket.IO contra la app levantada en un puerto libre.
describe('Tiempo real (e2e)', () => {
  let app: INestApplication;
  let cliente: Socket;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        espacio: {
          groupBy: jest.fn(() =>
            Promise.resolve([
              {
                tipoCompatible: 'CARRO',
                estado: 'DISPONIBLE',
                _count: { _all: 9 },
              },
              {
                tipoCompatible: 'CARRO',
                estado: 'OCUPADO',
                _count: { _all: 1 },
              },
              {
                tipoCompatible: 'MOTO',
                estado: 'DISPONIBLE',
                _count: { _all: 5 },
              },
            ]),
          ),
        },
        permanencia: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      })
      .compile();
    app = modulo.createNestApplication();
    await app.listen(0);
  });

  afterAll(async () => {
    cliente?.disconnect();
    await app.close();
  });

  it('al conectarse el cliente recibe la ocupación actual', async () => {
    const servidor = app.getHttpServer() as Server;
    const { port } = servidor.address() as AddressInfo;
    cliente = io(`http://localhost:${port}`, { transports: ['websocket'] });

    const ocupacion = await new Promise<Record<string, unknown>>((resolve) =>
      cliente.once('ocupacion:actualizada', resolve),
    );

    expect(ocupacion).toMatchObject({
      total: 15,
      disponibles: 14,
      ocupados: 1,
      porTipo: {
        CARRO: { total: 10, ocupados: 1 },
        MOTO: { total: 5, disponibles: 5 },
      },
    });
  });
});
