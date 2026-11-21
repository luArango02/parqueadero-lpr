import { estadoTrasValidacion } from './validacion';

describe('estadoTrasValidacion', () => {
  it('queda CORREGIDA cuando la placa cambió', () => {
    expect(estadoTrasValidacion('ABC123', 'ABC124')).toBe('CORREGIDA');
  });

  it('queda ACEPTADA cuando el operador confirma la misma placa', () => {
    expect(estadoTrasValidacion('ABC123', 'ABC123')).toBe('ACEPTADA');
  });
});
