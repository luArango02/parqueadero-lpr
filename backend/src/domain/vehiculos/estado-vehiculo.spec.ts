import { estadoDe } from './estado-vehiculo';

describe('estadoDe', () => {
  it('es DENTRO cuando tiene una permanencia activa', () => {
    expect(estadoDe(true)).toBe('DENTRO');
  });

  it('es FUERA cuando no tiene permanencia activa', () => {
    expect(estadoDe(false)).toBe('FUERA');
  });
});
