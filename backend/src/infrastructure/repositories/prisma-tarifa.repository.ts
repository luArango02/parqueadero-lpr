import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type {
  TarifaRegistrada,
  TarifaRepository,
  NuevaVersionTarifa,
  ResultadoVersionTarifa,
} from '../../domain/tarifas/tarifa.repository';

type TarifaPrisma = Prisma.TarifaGetPayload<object>;

@Injectable()
export class PrismaTarifaRepository implements TarifaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private convertir(tarifa: TarifaPrisma): TarifaRegistrada {
    return {
      id: tarifa.id,
      sedeId: tarifa.sedeId,
      tipoVehiculo: tarifa.tipoVehiculo,
      franja: tarifa.franja,
      valor: tarifa.valor.toFixed(2),
      version: tarifa.version,
      vigenteDesde: tarifa.vigenteDesde,
      vigenteHasta: tarifa.vigenteHasta,
    };
  }

  async listar(sedeId: string): Promise<TarifaRegistrada[]> {
    const tarifas = await this.prisma.tarifa.findMany({
      where: { sedeId },
      orderBy: [
        { tipoVehiculo: 'asc' },
        { franja: 'asc' },
        { version: 'desc' },
      ],
    });

    return tarifas.map((tarifa) => this.convertir(tarifa));
  }

  async buscarPorId(id: string): Promise<TarifaRegistrada | null> {
    const tarifa = await this.prisma.tarifa.findUnique({
      where: { id },
    });

    return tarifa ? this.convertir(tarifa) : null;
  }

  async listarVigentes(
    sedeId: string,
    fecha: Date,
  ): Promise<TarifaRegistrada[]> {
    const tarifas = await this.prisma.tarifa.findMany({
      where: {
        sedeId,
        vigenteDesde: { lte: fecha },
        OR: [{ vigenteHasta: null }, { vigenteHasta: { gt: fecha } }],
      },
      orderBy: [{ tipoVehiculo: 'asc' }, { franja: 'asc' }],
    });

    return tarifas.map((tarifa) => this.convertir(tarifa));
  }

  async crearVersion(
    datos: NuevaVersionTarifa,
  ): Promise<ResultadoVersionTarifa> {
    const ahora = new Date();

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Serializa las actualizaciones de tarifas de la misma sede.
          const sedes = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id
            FROM sedes
            WHERE id = ${datos.sedeId}
            FOR UPDATE
          `;

          if (sedes.length === 0) {
            throw new NotFoundException('La sede no existe.');
          }

          const anteriores = await tx.tarifa.findMany({
            where: {
              sedeId: datos.sedeId,
              tipoVehiculo: datos.tipoVehiculo,
            },
            orderBy: { version: 'desc' },
          });

          if (datos.tarifaEsperadaId) {
            const tarifaEsperada = anteriores.find(
              (tarifa) => tarifa.id === datos.tarifaEsperadaId,
            );

            if (
              !tarifaEsperada ||
              tarifaEsperada.vigenteDesde > ahora ||
              tarifaEsperada.vigenteHasta !== null
            ) {
              throw new ConflictException(
                'La tarifa fue modificada por otro proceso. Consulte las tarifas vigentes e intente nuevamente.',
              );
            }

            const diurnaActual = anteriores.find(
              (tarifa) =>
                tarifa.franja === 'DIURNA' &&
                tarifa.vigenteDesde <= ahora &&
                tarifa.vigenteHasta === null,
            );

            const nocturnaActual = anteriores.find(
              (tarifa) =>
                tarifa.franja === 'NOCTURNA' &&
                tarifa.vigenteDesde <= ahora &&
                tarifa.vigenteHasta === null,
            );

            if (!diurnaActual || !nocturnaActual) {
              throw new ConflictException(
                'No existe el par completo de tarifas vigentes.',
              );
            }

            const valorDiurnoActualizado =
              tarifaEsperada.franja === 'DIURNA'
                ? datos.valorDiurno
                : diurnaActual.valor.toFixed(2);

            const valorNocturnoActualizado =
              tarifaEsperada.franja === 'NOCTURNA'
                ? datos.valorNocturno
                : nocturnaActual.valor.toFixed(2);

            if (
              valorDiurnoActualizado !== datos.valorDiurno ||
              valorNocturnoActualizado !== datos.valorNocturno
            ) {
              throw new ConflictException(
                'Los valores de las tarifas cambiaron durante la actualización.',
              );
            }
          }

          const ultimaVersion = anteriores.reduce(
            (maximo, tarifa) => Math.max(maximo, tarifa.version),
            0,
          );

          const vigentes = anteriores.filter(
            (tarifa) =>
              tarifa.vigenteDesde <= ahora &&
              (tarifa.vigenteHasta === null || tarifa.vigenteHasta > ahora),
          );

          if (
            vigentes.filter((tarifa) => tarifa.franja === 'DIURNA').length >
              1 ||
            vigentes.filter((tarifa) => tarifa.franja === 'NOCTURNA').length > 1
          ) {
            throw new ConflictException('Existen tarifas vigentes duplicadas.');
          }

          await tx.tarifa.updateMany({
            where: {
              sedeId: datos.sedeId,
              tipoVehiculo: datos.tipoVehiculo,
              vigenteHasta: null,
            },
            data: {
              vigenteHasta: ahora,
            },
          });

          const version = ultimaVersion + 1;

          const diurna = await tx.tarifa.create({
            data: {
              sedeId: datos.sedeId,
              tipoVehiculo: datos.tipoVehiculo,
              franja: 'DIURNA',
              valor: new Prisma.Decimal(datos.valorDiurno),
              version,
              vigenteDesde: ahora,
            },
          });

          const nocturna = await tx.tarifa.create({
            data: {
              sedeId: datos.sedeId,
              tipoVehiculo: datos.tipoVehiculo,
              franja: 'NOCTURNA',
              valor: new Prisma.Decimal(datos.valorNocturno),
              version,
              vigenteDesde: ahora,
            },
          });

          return {
            diurna: this.convertir(diurna),
            nocturna: this.convertir(nocturna),
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        },
      );
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new ConflictException(
          'Conflicto al actualizar tarifas. Intente nuevamente.',
        );
      }

      throw error;
    }
  }
}
