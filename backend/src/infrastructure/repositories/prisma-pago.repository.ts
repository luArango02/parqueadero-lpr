
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagoRegistrado,
  PagoRepository,
  SolicitudRegistroPago,
} from '../../application/pagos/pago.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaPagoRepository implements PagoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrarEfectivo(
    solicitud: SolicitudRegistroPago,
  ): Promise<PagoRegistrado> {
    // Reintentos limitados ante conflictos de concurrencia.
    for (let intento = 0; intento < 3; intento++) {
      try {
        return await this.registrarEnTransaccion(solicitud);
      } catch (error: unknown) {
        if (this.esErrorPrisma(error, 'P2034')) {
          if (intento < 2) {
            continue;
          }

          throw new ConflictException(
            'No fue posible completar el pago por concurrencia.',
          );
        }

        if (this.esErrorPrisma(error, 'P2002')) {
          return this.resolverConflicto(solicitud);
        }

        throw error;
      }
    }

    throw new ConflictException(
      'No fue posible completar el pago por concurrencia.',
    );
  }

  private async registrarEnTransaccion(
    solicitud: SolicitudRegistroPago,
  ): Promise<PagoRegistrado> {
    return this.prisma.$transaction(
      async (tx) => {
        // La referencia identifica una operación de pago.
        const pagoPorReferencia = await tx.pago.findUnique({
          where: { referencia: solicitud.referencia },
          include: { cobro: true },
        });

        if (pagoPorReferencia) {
          if (
            pagoPorReferencia.cobroId !== solicitud.cobroId ||
            pagoPorReferencia.medio !== 'EFECTIVO'
          ) {
            throw new ConflictException(
              'La referencia ya pertenece a otro pago.',
            );
          }

          return this.aResultado(pagoPorReferencia);
        }

        const cobro = await tx.cobro.findUnique({
          where: { id: solicitud.cobroId },
          include: { pago: true },
        });

        if (!cobro) {
          throw new NotFoundException('El cobro no existe.');
        }

        if (cobro.pago) {
          throw new ConflictException(
            'El cobro ya tiene un pago registrado.',
          );
        }

        if (cobro.estado !== 'PENDIENTE') {
          throw new ConflictException(
            `No se puede pagar un cobro en estado ${cobro.estado}.`,
          );
        }

        // La transición condicional evita pagar un cobro
        // cuyo estado haya cambiado durante la operación.
        const actualizado = await tx.cobro.updateMany({
          where: {
            id: cobro.id,
            estado: 'PENDIENTE',
          },
          data: { estado: 'PAGADO' },
        });

        if (actualizado.count !== 1) {
          throw new ConflictException(
            'El cobro ya no se encuentra pendiente.',
          );
        }

        const pago = await tx.pago.create({
          data: {
            cobroId: cobro.id,
            referencia: solicitud.referencia,
            medio: 'EFECTIVO',
            valor: cobro.valor,
            registradoPorId: solicitud.registradoPorId,
          },
        });

        await tx.auditoria.create({
          data: {
            usuarioId: solicitud.registradoPorId,
            accion: 'REGISTRAR_PAGO_EFECTIVO',
            entidad: 'Pago',
            entidadId: pago.id,
            datosAnteriores: {
              estadoCobro: 'PENDIENTE',
            },
            datosNuevos: {
              cobroId: cobro.id,
              referencia: pago.referencia,
              medio: pago.medio,
              valor: pago.valor.toFixed(2),
              estadoCobro: 'PAGADO',
            },
          },
        });

        return {
          id: pago.id,
          cobroId: pago.cobroId,
          referencia: pago.referencia,
          medio: 'EFECTIVO',
          valor: pago.valor.toFixed(2),
          estadoCobro: 'PAGADO',
          pagadoEn: pago.pagadoEn,
          registradoPorId: pago.registradoPorId,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async resolverConflicto(
    solicitud: SolicitudRegistroPago,
  ): Promise<PagoRegistrado> {
    const pago = await this.prisma.pago.findUnique({
      where: { referencia: solicitud.referencia },
      include: { cobro: true },
    });

    if (
      pago &&
      pago.cobroId === solicitud.cobroId &&
      pago.medio === 'EFECTIVO'
    ) {
      return this.aResultado(pago);
    }

    throw new ConflictException(
      'El cobro ya fue pagado o la referencia está en uso.',
    );
  }

  private aResultado(pago: {
    id: string;
    cobroId: string;
    referencia: string;
    medio: string;
    valor: Prisma.Decimal;
    pagadoEn: Date;
    registradoPorId: string | null;
    cobro: { estado: string };
  }): PagoRegistrado {
    if (pago.cobro.estado !== 'PAGADO') {
      throw new ConflictException(
        'El pago existe, pero el estado del cobro es inconsistente.',
      );
    }

    return {
      id: pago.id,
      cobroId: pago.cobroId,
      referencia: pago.referencia,
      medio: 'EFECTIVO',
      valor: pago.valor.toFixed(2),
      estadoCobro: 'PAGADO',
      pagadoEn: pago.pagadoEn,
      registradoPorId: pago.registradoPorId,
    };
  }

  private esErrorPrisma(error: unknown, codigo: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === codigo
    );
  }
}
