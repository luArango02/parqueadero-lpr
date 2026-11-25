import type { PrismaService } from '../../src/infrastructure/database/prisma.service';

export interface Escenario {
  sedeId: string;
  operadorId: string;
}

const codigo = (prefijo: string, numero: number) =>
  `${prefijo}-${String(numero).padStart(2, '0')}`;

/** Crea una sede mínima con carriles, espacios, tarifas y un operador, sobre una base ya vacía. */
export async function crearEscenario(
  prisma: PrismaService,
  cantidad: { carros: number; motos: number },
): Promise<Escenario> {
  const sede = await prisma.sede.create({
    data: { nombre: 'Sede de pruebas' },
  });

  await prisma.carril.createMany({
    data: [
      { sedeId: sede.id, nombre: 'Entrada 1', sentido: 'ENTRADA' },
      { sedeId: sede.id, nombre: 'Salida 1', sentido: 'SALIDA' },
    ],
  });

  await prisma.espacio.createMany({
    data: [
      ...Array.from({ length: cantidad.carros }, (_, i) => ({
        sedeId: sede.id,
        codigo: codigo('A', i + 1),
        zona: 'A',
        tipoCompatible: 'CARRO' as const,
      })),
      ...Array.from({ length: cantidad.motos }, (_, i) => ({
        sedeId: sede.id,
        codigo: codigo('M', i + 1),
        zona: 'M',
        tipoCompatible: 'MOTO' as const,
      })),
    ],
  });

  const vigenteDesde = new Date('2026-11-01T00:00:00.000Z');
  await prisma.tarifa.createMany({
    data: [
      { tipoVehiculo: 'CARRO', franja: 'DIURNA', valor: '8000.00' },
      { tipoVehiculo: 'CARRO', franja: 'NOCTURNA', valor: '5000.00' },
      { tipoVehiculo: 'MOTO', franja: 'DIURNA', valor: '0.00' },
      { tipoVehiculo: 'MOTO', franja: 'NOCTURNA', valor: '0.00' },
    ].map((tarifa) => ({
      ...tarifa,
      sedeId: sede.id,
      tipoVehiculo: tarifa.tipoVehiculo as 'CARRO' | 'MOTO',
      franja: tarifa.franja as 'DIURNA' | 'NOCTURNA',
      version: 1,
      vigenteDesde,
    })),
  });

  const operador = await prisma.usuario.create({
    data: {
      nombre: 'Operador de pruebas',
      email: 'operador.pruebas@parqueadero.test',
      passwordHash: 'no-se-usa-en-las-pruebas',
      rol: 'OPERADOR',
    },
  });

  return { sedeId: sede.id, operadorId: operador.id };
}
