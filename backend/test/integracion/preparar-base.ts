import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { URL_BASE_PRUEBAS, verificarBaseDePruebas } from './base-pruebas';

// Se ejecuta una sola vez antes de todas las pruebas: deja la base de pruebas con las migraciones al día.
export default function prepararBase(): void {
  verificarBaseDePruebas(URL_BASE_PRUEBAS);
  try {
    execSync('npx prisma migrate deploy', {
      cwd: resolve(__dirname, '../..'),
      env: { ...process.env, DATABASE_URL: URL_BASE_PRUEBAS },
      stdio: 'inherit',
    });
  } catch {
    throw new Error(
      'No se pudo preparar la base de pruebas. ¿Está encendida? Ejecuta: docker compose -f docker-compose.test.yml up -d db-test',
    );
  }
}
