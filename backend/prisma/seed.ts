// Datos de desarrollo y demo. Usa upsert, así que se puede ejecutar varias veces sin duplicar.
import {
  Franja,
  PrismaClient,
  Rol,
  SentidoCarril,
  TipoVehiculo,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const NOMBRE_SEDE = 'Sede Principal';
const ESPACIOS_CARRO = 10;
const ESPACIOS_MOTO = 5;

// Nocturna menor que diurna (RN-02) y moto en $0 (RN-01).
const TARIFAS: { tipo: TipoVehiculo; franja: Franja; valor: number }[] = [
  { tipo: TipoVehiculo.CARRO, franja: Franja.DIURNA, valor: 8000 },
  { tipo: TipoVehiculo.CARRO, franja: Franja.NOCTURNA, valor: 5000 },
  { tipo: TipoVehiculo.MOTO, franja: Franja.DIURNA, valor: 0 },
  { tipo: TipoVehiculo.MOTO, franja: Franja.NOCTURNA, valor: 0 },
];

// Solo para pruebas locales.
const USUARIOS = [
  {
    nombre: 'Administrador',
    email: 'admin@parqueadero.local',
    password: 'Admin123*',
    rol: Rol.ADMINISTRADOR,
  },
  {
    nombre: 'Operador',
    email: 'operador@parqueadero.local',
    password: 'Operador123*',
    rol: Rol.OPERADOR,
  },
];

function codigo(prefijo: string, numero: number): string {
  return `${prefijo}-${String(numero).padStart(2, '0')}`;
}

async function main(): Promise<void> {
  const sede = await prisma.sede.upsert({
    where: { nombre: NOMBRE_SEDE },
    update: {},
    create: { nombre: NOMBRE_SEDE },
  });

  const carriles = [
    { nombre: 'Entrada 1', sentido: SentidoCarril.ENTRADA },
    { nombre: 'Salida 1', sentido: SentidoCarril.SALIDA },
  ];
  for (const carril of carriles) {
    await prisma.carril.upsert({
      where: { sedeId_nombre: { sedeId: sede.id, nombre: carril.nombre } },
      update: {},
      create: { ...carril, sedeId: sede.id },
    });
  }

  const espacios = [
    ...Array.from({ length: ESPACIOS_CARRO }, (_, i) => ({
      codigo: codigo('A', i + 1),
      zona: 'A',
      tipoCompatible: TipoVehiculo.CARRO,
    })),
    ...Array.from({ length: ESPACIOS_MOTO }, (_, i) => ({
      codigo: codigo('M', i + 1),
      zona: 'M',
      tipoCompatible: TipoVehiculo.MOTO,
    })),
  ];
  for (const espacio of espacios) {
    await prisma.espacio.upsert({
      where: { sedeId_codigo: { sedeId: sede.id, codigo: espacio.codigo } },
      update: {},
      create: { ...espacio, sedeId: sede.id },
    });
  }

  for (const tarifa of TARIFAS) {
    await prisma.tarifa.upsert({
      where: {
        sedeId_tipoVehiculo_franja_version: {
          sedeId: sede.id,
          tipoVehiculo: tarifa.tipo,
          franja: tarifa.franja,
          version: 1,
        },
      },
      update: {},
      create: {
        sedeId: sede.id,
        tipoVehiculo: tarifa.tipo,
        franja: tarifa.franja,
        valor: tarifa.valor,
        version: 1,
        vigenteDesde: new Date('2026-01-01T05:00:00Z'),
      },
    });
  }

  for (const usuario of USUARIOS) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        passwordHash: await hash(usuario.password, 10),
      },
    });
  }

  console.log(
    `Seed listo: sede "${NOMBRE_SEDE}", 2 carriles, ${espacios.length} espacios, ${TARIFAS.length} tarifas y ${USUARIOS.length} usuarios.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
