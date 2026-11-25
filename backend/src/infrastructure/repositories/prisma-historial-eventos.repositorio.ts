import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  EventoHistorial,
  FiltrosHistorial,
  HistorialEventosRepositorio,
  ResultadoHistorial,
} from '../../application/eventos/historial-eventos.repositorio';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaHistorialEventosRepositorio implements HistorialEventosRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrosHistorial): Promise<ResultadoHistorial> {
    const { placa, tipo, estado, desde, hasta, pagina, limite } = filtros;

    const desplazamiento = (pagina - 1) * limite;
    const cantidad = desplazamiento + limite;

    const fecha: Prisma.DateTimeFilter = {
      gte: desde,
      lte: hasta,
    };

    const filtroPlaca = placa
      ? { contains: placa, mode: 'insensitive' as const }
      : undefined;

    const tiposAcceso = [
      'INGRESO',
      'SALIDA',
      'INGRESO_DENEGADO',
      'SALIDA_DENEGADA',
    ] as const;

    const tiposSeleccionados = tiposAcceso.filter((actual) => {
      const estadoAcceso =
        actual === 'INGRESO' || actual === 'SALIDA' ? 'AUTORIZADO' : 'DENEGADO';

      return (!tipo || tipo === actual) && (!estado || estado === estadoAcceso);
    });

    const estadoCobro =
      estado === 'PENDIENTE' ||
      estado === 'PAGADO' ||
      estado === 'ANULADO' ||
      estado === 'VENCIDO'
        ? estado
        : undefined;

    const estadoAlerta =
      estado === 'ABIERTA' || estado === 'RESUELTA' ? estado : undefined;

    const consultarAccesos = tiposSeleccionados.length > 0;

    const consultarPagos =
      (!tipo || tipo === 'PAGO') && (!estado || estadoCobro !== undefined);

    const consultarAlertas =
      (!tipo || tipo === 'ALERTA') && (!estado || estadoAlerta !== undefined);

    const whereAccesos: Prisma.EventoAccesoWhereInput = {
      placa: filtroPlaca,
      tipo: { in: tiposSeleccionados },
      ocurridoEn: fecha,
    };

    const wherePagos: Prisma.PagoWhereInput = {
      pagadoEn: fecha,
      cobro: {
        placa: filtroPlaca,
        estado: estadoCobro,
      },
    };

    const whereAlertas: Prisma.AlertaWhereInput = {
      placa: filtroPlaca,
      estado: estadoAlerta,
      creadaEn: fecha,
    };

    const resultado = await this.prisma.$transaction(
      async (tx) => {
        const [
          accesos,
          pagos,
          alertas,
          totalAccesos,
          totalPagos,
          totalAlertas,
        ] = await Promise.all([
          consultarAccesos
            ? tx.eventoAcceso.findMany({
                where: whereAccesos,
                select: {
                  id: true,
                  tipo: true,
                  placa: true,
                  motivo: true,
                  ocurridoEn: true,
                  espacio: { select: { codigo: true } },
                },
                orderBy: [{ ocurridoEn: 'desc' }, { id: 'asc' }],
                take: cantidad,
              })
            : Promise.resolve([]),

          consultarPagos
            ? tx.pago.findMany({
                where: wherePagos,
                select: {
                  id: true,
                  medio: true,
                  valor: true,
                  pagadoEn: true,
                  cobro: {
                    select: {
                      placa: true,
                      estado: true,
                    },
                  },
                },
                orderBy: [{ pagadoEn: 'desc' }, { id: 'asc' }],
                take: cantidad,
              })
            : Promise.resolve([]),

          consultarAlertas
            ? tx.alerta.findMany({
                where: whereAlertas,
                select: {
                  id: true,
                  tipo: true,
                  estado: true,
                  placa: true,
                  detalle: true,
                  creadaEn: true,
                },
                orderBy: [{ creadaEn: 'desc' }, { id: 'asc' }],
                take: cantidad,
              })
            : Promise.resolve([]),

          consultarAccesos
            ? tx.eventoAcceso.count({ where: whereAccesos })
            : Promise.resolve(0),

          consultarPagos
            ? tx.pago.count({ where: wherePagos })
            : Promise.resolve(0),

          consultarAlertas
            ? tx.alerta.count({ where: whereAlertas })
            : Promise.resolve(0),
        ]);

        const eventos: EventoHistorial[] = [
          ...accesos.map((evento): EventoHistorial => ({
            id: evento.id,
            tipo: evento.tipo,
            placa: evento.placa,
            estado:
              evento.tipo === 'INGRESO' || evento.tipo === 'SALIDA'
                ? 'AUTORIZADO'
                : 'DENEGADO',
            detalle:
              evento.motivo ??
              (evento.espacio ? `Espacio ${evento.espacio.codigo}` : ''),
            ocurridoEn: evento.ocurridoEn,
          })),

          ...pagos.map((pago): EventoHistorial => ({
            id: pago.id,
            tipo: 'PAGO',
            placa: pago.cobro.placa,
            estado: pago.cobro.estado,
            detalle: `Pago ${pago.medio} de $${pago.valor.toNumber().toLocaleString('es-CO')}`,
            ocurridoEn: pago.pagadoEn,
          })),

          ...alertas.map((alerta): EventoHistorial => ({
            id: alerta.id,
            tipo: 'ALERTA',
            placa: alerta.placa,
            estado: alerta.estado,
            detalle: `${alerta.tipo.replace(/_/g, ' ')}: ${alerta.detalle}`,
            ocurridoEn: alerta.creadaEn,
          })),
        ];

        eventos.sort(
          (a, b) =>
            b.ocurridoEn.getTime() - a.ocurridoEn.getTime() ||
            a.id.localeCompare(b.id) ||
            a.tipo.localeCompare(b.tipo),
        );

        const total = totalAccesos + totalPagos + totalAlertas;

        return {
          datos: eventos.slice(desplazamiento, desplazamiento + limite),
          total,
          pagina,
          limite,
          totalPaginas: Math.ceil(total / limite),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );

    return resultado;
  }
}
