import { NotFoundException } from '@nestjs/common';
import { Cobro, SentidoCarril } from '@prisma/client';
import {
  CobroDelDia,
  SedeOperativa,
} from '../../application/accesos/ingreso.repositorio';
import { PrismaService } from '../database/prisma.service';

// Consultas que usan tanto el repositorio de ingreso como el de salida.

// En la base de datos el día operativo es una columna DATE.
export function aFecha(dia: string): Date {
  return new Date(`${dia}T00:00:00Z`);
}

export function aCobroDelDia(cobro: Cobro): CobroDelDia {
  return {
    id: cobro.id,
    valor: cobro.valor.toNumber(),
    franja: cobro.franja,
    estado: cobro.estado,
    diaOperativo: cobro.diaOperativo.toISOString().slice(0, 10),
  };
}

export async function buscarSedeOperativa(
  prisma: PrismaService,
): Promise<SedeOperativa> {
  const sede = await prisma.sede.findFirst({ orderBy: { nombre: 'asc' } });
  if (!sede) {
    throw new NotFoundException('No hay sede configurada: ejecute el seed');
  }
  return sede;
}

export async function buscarCarril(
  prisma: PrismaService,
  sedeId: string,
  sentido: SentidoCarril,
  carrilId?: string,
): Promise<string> {
  const carril = await prisma.carril.findFirst({
    where: { sedeId, sentido, ...(carrilId ? { id: carrilId } : {}) },
    orderBy: { nombre: 'asc' },
  });
  if (!carril) {
    throw new NotFoundException(
      `Carril de ${sentido.toLowerCase()} no encontrado`,
    );
  }
  return carril.id;
}
