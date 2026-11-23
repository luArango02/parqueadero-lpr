import { detalleDiscrepancia, hayDiscrepancia } from './alerta';

describe('hayDiscrepancia', () => {
  it.each([
    ['CARRO', 'MOTO', true],
    ['MOTO', 'CARRO', true],
    ['CARRO', 'CARRO', false],
    ['MOTO', 'MOTO', false],
    [null, 'MOTO', false],
    ['CARRO', null, false],
    [null, null, false],
  ] as const)('placa %s y visual %s: %s', (porPlaca, visual, esperado) => {
    expect(hayDiscrepancia(porPlaca, visual)).toBe(esperado);
  });
});

describe('detalleDiscrepancia', () => {
  it('incluye la placa, los dos tipos y la confianza como evidencia', () => {
    const detalle = detalleDiscrepancia('ABC123', 'CARRO', 'MOTO', 0.92);

    expect(detalle).toContain('ABC123');
    expect(detalle).toContain('CARRO');
    expect(detalle).toContain('MOTO');
    expect(detalle).toContain('0.92');
  });
});
