
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaPagoRepository } from './prisma-pago.repository';
import { PrismaService } from '../database/prisma.service';

describe('PrismaPagoRepository - reintentos de concurrencia', () => {
  it('responde 409 después de tres errores P2034', async () => {
    const errorConcurrencia =
      new Prisma.PrismaClientKnownRequestError(
        'Conflicto de concurrencia simulado',
        {
          code: 'P2034',
          clientVersion: '6.19.3',
        },
      );

    const transaccion = jest
      .fn()
      .mockRejectedValue(errorConcurrencia);

    const prismaFalso = {
      $transaction: transaccion,
    } as unknown as PrismaService;

    const repositorio = new PrismaPagoRepository(prismaFalso);

    await expect(
      repositorio.registrarEfectivo({
        cobroId: '550e8400-e29b-41d4-a716-446655440000',
        referencia: 'EFECTIVO-REINTENTOS-001',
        registradoPorId: '550e8400-e29b-41d4-a716-446655440001',
      }),
    ).rejects.toThrow(ConflictException);

    expect(transaccion).toHaveBeenCalledTimes(3);
  });
});
