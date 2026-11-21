import { codigoDeEspacio, esZonaValida, normalizarZona } from './espacio';

describe('normalizarZona', () => {
  it('pasa a mayúsculas y quita espacios', () => {
    expect(normalizarZona(' a ')).toBe('A');
  });
});

describe('esZonaValida', () => {
  it.each([
    ['A', true],
    ['M', true],
    ['Z', true],
    ['AB', false],
    ['1', false],
    ['a', false],
    ['', false],
  ])('%s es válida: %s', (zona, esperado) => {
    expect(esZonaValida(zona)).toBe(esperado);
  });
});

describe('codigoDeEspacio', () => {
  it.each([
    ['A', 1, 'A-01'],
    ['M', 5, 'M-05'],
    ['A', 10, 'A-10'],
    ['B', 99, 'B-99'],
  ])('zona %s número %s da %s', (zona, numero, esperado) => {
    expect(codigoDeEspacio(zona, numero)).toBe(esperado);
  });
});
