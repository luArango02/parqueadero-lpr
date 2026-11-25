import type { PrismaService } from '../../src/infrastructure/database/prisma.service';

/** Única base a la que se conectan estas pruebas: el PostgreSQL de docker-compose.test.yml. */
export const URL_BASE_PRUEBAS =
  'postgresql://parqueadero:parqueadero@localhost:5433/parqueadero_test';

/** Corta en seco si la URL no es la base de pruebas: así nunca se toca la base de desarrollo. */
export function verificarBaseDePruebas(url: string | undefined): void {
  if (!url) {
    throw new Error(
      'Las pruebas de integración requieren DATABASE_URL apuntando a la base de pruebas',
    );
  }
  const destino = new URL(url);
  const esLocal = ['localhost', '127.0.0.1'].includes(destino.hostname);
  if (
    !esLocal ||
    destino.port !== '5433' ||
    destino.pathname !== '/parqueadero_test'
  ) {
    throw new Error(
      'Prueba bloqueada: solo se permite PostgreSQL de pruebas en localhost:5433/parqueadero_test',
    );
  }
}

/** Vacía todas las tablas (menos el historial de migraciones). Solo funciona en la base de pruebas. */
export async function limpiarBase(prisma: PrismaService): Promise<void> {
  verificarBaseDePruebas(process.env.DATABASE_URL);
  const tablas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tablas.length === 0) return;
  const lista = tablas.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`,
  );
}
