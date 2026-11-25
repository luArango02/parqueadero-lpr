import { EventoReciente, unirRecientes } from './evento-reciente';

const evento = (
  id: string,
  tipo: EventoReciente['tipo'],
  hora: string,
): EventoReciente => ({
  id,
  tipo,
  placa: 'ABC123',
  detalle: '',
  ocurridoEn: new Date(`2026-11-24T${hora}:00Z`),
});

describe('unirRecientes', () => {
  it('mezcla las fuentes y deja el más reciente primero', () => {
    const resultado = unirRecientes(
      [
        [evento('a1', 'INGRESO', '10:00'), evento('a2', 'SALIDA', '10:30')],
        [evento('p1', 'PAGO', '10:15')],
        [evento('l1', 'ALERTA', '10:45')],
      ],
      10,
    );

    expect(resultado.map((e) => e.id)).toEqual(['l1', 'a2', 'p1', 'a1']);
  });

  it('se queda solo con los `limite` más recientes', () => {
    const resultado = unirRecientes(
      [
        [evento('a1', 'INGRESO', '10:00'), evento('a2', 'SALIDA', '10:30')],
        [evento('p1', 'PAGO', '10:15')],
      ],
      2,
    );

    expect(resultado.map((e) => e.id)).toEqual(['a2', 'p1']);
  });

  it('si dos eventos tienen la misma hora, el orden es estable por id', () => {
    const resultado = unirRecientes(
      [[evento('b', 'INGRESO', '10:00')], [evento('a', 'PAGO', '10:00')]],
      10,
    );

    expect(resultado.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('devuelve una lista vacía si no hay eventos', () => {
    expect(unirRecientes([[], [], []], 10)).toEqual([]);
  });
});
