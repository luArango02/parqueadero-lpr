import { verificarBaseDePruebas } from './base-pruebas';

// No necesita base de datos: solo comprueba el seguro que impide tocar la base de desarrollo.
describe('verificarBaseDePruebas', () => {
  it('acepta la base de pruebas (localhost:5433/parqueadero_test)', () => {
    expect(() =>
      verificarBaseDePruebas(
        'postgresql://parqueadero:parqueadero@localhost:5433/parqueadero_test',
      ),
    ).not.toThrow();
  });

  it('rechaza la base de desarrollo (puerto 5432)', () => {
    expect(() =>
      verificarBaseDePruebas(
        'postgresql://parqueadero:clave@localhost:5432/parqueadero',
      ),
    ).toThrow('Prueba bloqueada');
  });

  it('rechaza una base de pruebas que no sea local', () => {
    expect(() =>
      verificarBaseDePruebas(
        'postgresql://u:p@servidor.remoto.com:5433/parqueadero_test',
      ),
    ).toThrow('Prueba bloqueada');
  });

  it('rechaza el puerto de pruebas con otro nombre de base', () => {
    expect(() =>
      verificarBaseDePruebas('postgresql://u:p@localhost:5433/parqueadero'),
    ).toThrow('Prueba bloqueada');
  });

  it('rechaza una URL vacía', () => {
    expect(() => verificarBaseDePruebas(undefined)).toThrow('DATABASE_URL');
  });
});
