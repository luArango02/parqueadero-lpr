import { diasOperativosTranscurridos } from './dias-operativos-transcurridos';
import type { ConfigHorario } from './reglas-horario';

const horario: ConfigHorario = {
  zonaHoraria: 'America/Bogota',
  inicioDiaOperativo: '06:00',
  inicioFranjaDiurna: '06:00',
  inicioFranjaNocturna: '18:00',
};

const local = (fecha: string): Date => new Date(`${fecha}-05:00`);

describe('Días operativos transcurridos', () => {
  it('no genera otro día si sale antes de las 06:00', () => {
    expect(
      diasOperativosTranscurridos(
        local('2026-11-20T05:20:00'),
        local('2026-11-20T05:50:00'),
        horario,
      ),
    ).toEqual([]);
  });

  it('detecta el nuevo día si permanece hasta las 06:10', () => {
    expect(
      diasOperativosTranscurridos(
        local('2026-11-20T05:20:00'),
        local('2026-11-20T06:10:00'),
        horario,
      ),
    ).toEqual(['2026-11-20']);
  });

  it('respeta el límite 05:59:59', () => {
    expect(
      diasOperativosTranscurridos(
        local('2026-11-20T05:20:00'),
        local('2026-11-20T05:59:59'),
        horario,
      ),
    ).toEqual([]);
  });

  it('detecta el límite exacto 06:00:00', () => {
    expect(
      diasOperativosTranscurridos(
        local('2026-11-20T05:20:00'),
        local('2026-11-20T06:00:00'),
        horario,
      ),
    ).toEqual(['2026-11-20']);
  });

  it('detecta varios días operativos', () => {
    expect(
      diasOperativosTranscurridos(
        local('2026-11-20T05:20:00'),
        local('2026-11-22T07:00:00'),
        horario,
      ),
    ).toEqual(['2026-11-20', '2026-11-21', '2026-11-22']);
  });

  it('no devuelve días cuando la verificación es anterior al ingreso', () => {
    expect(
      diasOperativosTranscurridos(
        local('2026-11-20T08:00:00'),
        local('2026-11-20T07:00:00'),
        horario,
      ),
    ).toEqual([]);
  });
});
