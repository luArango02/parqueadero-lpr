import { estadoSegunConfianza } from './deteccion';

describe('estadoSegunConfianza', () => {
  it.each([
    [0.95, 0.8, 'ACEPTADA'],
    [0.8, 0.8, 'ACEPTADA'],
    [0.79, 0.8, 'PENDIENTE_REVISION'],
    [0, 0.8, 'PENDIENTE_REVISION'],
    [1, 1, 'ACEPTADA'],
    [0.9, 0.95, 'PENDIENTE_REVISION'],
  ])('confianza %s con umbral %s es %s', (confianza, umbral, esperado) => {
    expect(estadoSegunConfianza(confianza, umbral)).toBe(esperado);
  });
});
