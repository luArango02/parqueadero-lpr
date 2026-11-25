import { Injectable } from '@nestjs/common';
import { EventoRecienteRepositorio } from '../../application/eventos/evento-reciente.repositorio';
import { EventoReciente } from '../../domain/eventos/evento-reciente';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaEventoRecienteRepositorio implements EventoRecienteRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async accesos(limite: number): Promise<EventoReciente[]> {
    const eventos = await this.prisma.eventoAcceso.findMany({
      select: {
        id: true,
        tipo: true,
        placa: true,
        motivo: true,
        ocurridoEn: true,
        espacio: { select: { codigo: true } },
      },
      orderBy: { ocurridoEn: 'desc' },
      take: limite,
    });
    return eventos.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      placa: e.placa,
      // Los denegados traen su motivo; ingresos y salidas, el espacio.
      detalle: e.motivo ?? (e.espacio ? `Espacio ${e.espacio.codigo}` : ''),
      ocurridoEn: e.ocurridoEn,
    }));
  }

  async pagos(limite: number): Promise<EventoReciente[]> {
    const pagos = await this.prisma.pago.findMany({
      select: {
        id: true,
        medio: true,
        valor: true,
        pagadoEn: true,
        cobro: { select: { placa: true } },
      },
      orderBy: { pagadoEn: 'desc' },
      take: limite,
    });
    return pagos.map((p) => ({
      id: p.id,
      tipo: 'PAGO',
      placa: p.cobro.placa,
      detalle: `Pago ${p.medio} de $${p.valor.toNumber().toLocaleString('es-CO')}`,
      ocurridoEn: p.pagadoEn,
    }));
  }

  async alertas(limite: number): Promise<EventoReciente[]> {
    const alertas = await this.prisma.alerta.findMany({
      select: {
        id: true,
        tipo: true,
        placa: true,
        detalle: true,
        creadaEn: true,
      },
      orderBy: { creadaEn: 'desc' },
      take: limite,
    });
    return alertas.map((a) => ({
      id: a.id,
      tipo: 'ALERTA',
      placa: a.placa,
      detalle: `${a.tipo.replace(/_/g, ' ')}: ${a.detalle}`,
      ocurridoEn: a.creadaEn,
    }));
  }
}
