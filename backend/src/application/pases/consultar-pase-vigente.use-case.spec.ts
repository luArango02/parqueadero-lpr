import type {
  CobroDelDia,
  IngresoRepositorio,
  SedeOperativa,
} from '../accesos/ingreso.repositorio';
import type { Reloj } from '../../domain/tiempo/reloj';
import { ConsultarPaseVigenteUseCase } from './consultar-pase-vigente.use-case';

describe('ConsultarPaseVigenteUseCase', () => {
  const sede: SedeOperativa = {
    id: 'sede-1',
    zonaHoraria: 'America/Bogota',
    inicioDiaOperativo: '06:00',
    inicioFranjaDiurna: '06:00',
    inicioFranjaNocturna: '18:00',
    umbralConfianza: 0.8,
  };

  let repositorio: jest.Mocked<
    Pick<IngresoRepositorio, 'sedeOperativa' | 'cobroDelDia'>
  >;
  let reloj: Reloj;
  let casoDeUso: ConsultarPaseVigenteUseCase;

  const crearCobro = (
    estado: CobroDelDia['estado'],
  ): CobroDelDia => ({
    id: 'cobro-1',
    valor: 8000,
    franja: 'DIURNA',
    estado,
    diaOperativo: '2026-11-23',
  });

  beforeEach(() => {
    repositorio = {
      sedeOperativa: jest.fn().mockResolvedValue(sede),
      cobroDelDia: jest.fn().mockResolvedValue(null),
    };

    reloj = {
      ahora: jest.fn().mockReturnValue(
        new Date('2026-11-23T15:00:00Z'),
      ),
    };

    casoDeUso = new ConsultarPaseVigenteUseCase(
      repositorio as unknown as IngresoRepositorio,
      reloj,
    );
  });

  it('reconoce un pase pagado del día operativo actual', async () => {
    repositorio.cobroDelDia.mockResolvedValue(
      crearCobro('PAGADO'),
    );

    const resultado = await casoDeUso.ejecutar('abc123');

    expect(resultado).toMatchObject({
      placa: 'ABC123',
      sedeId: 'sede-1',
      diaOperativo: '2026-11-23',
      vigente: true,
      cobroId: 'cobro-1',
      estadoCobro: 'PAGADO',
      motivo: 'PASE VIGENTE',
    });

    expect(repositorio.cobroDelDia).toHaveBeenCalledWith(
      'ABC123',
      'sede-1',
      '2026-11-23',
    );
  });

  it('no considera vigente un cobro pendiente', async () => {
    repositorio.cobroDelDia.mockResolvedValue(
      crearCobro('PENDIENTE'),
    );

    const resultado = await casoDeUso.ejecutar('ABC123');

    expect(resultado.vigente).toBe(false);
    expect(resultado.estadoCobro).toBe('PENDIENTE');
  });

  it.each(['ANULADO', 'VENCIDO'] as const)(
    'no considera vigente un cobro %s',
    async (estado) => {
      repositorio.cobroDelDia.mockResolvedValue(
        crearCobro(estado),
      );

      const resultado = await casoDeUso.ejecutar('ABC123');

      expect(resultado.vigente).toBe(false);
      expect(resultado.estadoCobro).toBe(estado);
    },
  );

  it('informa cuando no existe cobro del día', async () => {
    const resultado = await casoDeUso.ejecutar('ABC123');

    expect(resultado).toMatchObject({
      vigente: false,
      cobroId: null,
      estadoCobro: null,
      motivo: 'SIN PASE PARA EL DIA OPERATIVO',
    });
  });

  it('antes de las 06:00 consulta el día operativo anterior', async () => {
    jest.spyOn(reloj, 'ahora').mockReturnValue(
      new Date('2026-11-24T10:59:00Z'),
    );

    await casoDeUso.ejecutar('ABC123');

    expect(repositorio.cobroDelDia).toHaveBeenCalledWith(
      'ABC123',
      'sede-1',
      '2026-11-23',
    );
  });

  it('a las 06:00 consulta el nuevo día operativo', async () => {
    jest.spyOn(reloj, 'ahora').mockReturnValue(
      new Date('2026-11-24T11:00:00Z'),
    );

    await casoDeUso.ejecutar('ABC123');

    expect(repositorio.cobroDelDia).toHaveBeenCalledWith(
      'ABC123',
      'sede-1',
      '2026-11-24',
    );
  });
});
