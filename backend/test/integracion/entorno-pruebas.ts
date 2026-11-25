import { URL_BASE_PRUEBAS } from './base-pruebas';

// Se ejecuta antes de cada archivo de pruebas. Aunque el .env apunte a la base de desarrollo,
// las pruebas de integración usan siempre la base de pruebas.
process.env.DATABASE_URL = URL_BASE_PRUEBAS;
