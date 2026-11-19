import {
  ConfigHorario,
  calcularDiaOperativo,
  calcularFranja,
} from './reglas-horario';

const config: ConfigHorario = {
  zonaHoraria: 'America/Bogota',
  inicioDiaOperativo: '06:00',
  inicioFranjaDiurna: '06:00',
  inicioFranjaNocturna: '18:00',
};

// Bogotá es UTC-5: las 08:00 locales son las 13:00 UTC.
const local = (fechaHora: string) => new Date(`${fechaHora}:00-05:00`);

describe('calcularFranja', () => {
  it.each([
    ['2026-11-20T06:00', 'DIURNA'],
    ['2026-11-20T08:00', 'DIURNA'],
    ['2026-11-20T17:59', 'DIURNA'],
    ['2026-11-20T18:00', 'NOCTURNA'],
    ['2026-11-20T23:00', 'NOCTURNA'],
    ['2026-11-21T05:59', 'NOCTURNA'],
  ])('a las %s es %s', (hora, franja) => {
    expect(calcularFranja(local(hora), config)).toBe(franja);
  });
});

describe('calcularDiaOperativo', () => {
  it.each([
    ['2026-11-20T06:00', '2026-11-20'],
    ['2026-11-20T23:00', '2026-11-20'],
    ['2026-11-21T01:00', '2026-11-20'],
    ['2026-11-21T05:59', '2026-11-20'],
    ['2026-11-21T06:00', '2026-11-21'],
  ])('a las %s pertenece al día %s', (hora, dia) => {
    expect(calcularDiaOperativo(local(hora), config)).toBe(dia);
  });

  it('cambia de mes correctamente antes de las 06:00', () => {
    expect(calcularDiaOperativo(local('2026-12-01T03:00'), config)).toBe(
      '2026-11-30',
    );
  });
});
