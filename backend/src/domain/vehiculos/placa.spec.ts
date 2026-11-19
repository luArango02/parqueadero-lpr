import { clasificarPorFormato, normalizarPlaca } from './placa';

describe('normalizarPlaca', () => {
  it('pasa a mayúsculas y quita espacios y guiones', () => {
    expect(normalizarPlaca(' abc-123 ')).toBe('ABC123');
  });
});

describe('clasificarPorFormato', () => {
  it.each([
    ['ABC123', 'CARRO'],
    ['XYZ45A', 'MOTO'],
    ['XYZ45', 'MOTO'],
    ['AB1234', null],
    ['ABCD12', null],
  ])('%s se clasifica como %s', (placa, tipo) => {
    expect(clasificarPorFormato(placa)).toBe(tipo);
  });
});
