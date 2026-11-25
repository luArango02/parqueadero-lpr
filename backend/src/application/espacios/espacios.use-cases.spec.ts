import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ActualizarEspacioUseCase } from './actualizar-espacio.use-case';
import { ConsultarSedeActualUseCase } from './consultar-sede-actual.use-case';
import { CrearEspacioUseCase } from './crear-espacio.use-case';
import {
  CambiosEspacio,
  DatosEspacio,
  EspacioConPlaca,
  EspacioRegistrado,
  EspacioRepositorio,
  FiltroEspacios,
  SedeActual,
} from './espacio.repositorio';
import { ListarEspaciosUseCase } from './listar-espacios.use-case';

const SEDE: SedeActual = {
  id: 'sede-1',
  nombre: 'Sede Principal',
  zonaHoraria: 'America/Bogota',
  inicioDiaOperativo: '06:00',
  inicioFranjaDiurna: '06:00',
  inicioFranjaNocturna: '18:00',
  umbralConfianza: 0.8,
  carriles: [
    { id: 'c-1', nombre: 'Entrada 1', sentido: 'ENTRADA' },
    { id: 'c-2', nombre: 'Salida 1', sentido: 'SALIDA' },
  ],
  resumenEspacios: {
    total: 15,
    disponibles: 14,
    ocupados: 1,
    fueraDeServicio: 0,
  },
};

function espacio(
  id: string,
  codigo: string,
  estado: EspacioRegistrado['estado'] = 'DISPONIBLE',
): EspacioRegistrado {
  return { id, codigo, zona: codigo[0], tipoCompatible: 'CARRO', estado };
}

// Doble en memoria del repositorio: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements EspacioRepositorio {
  sede: SedeActual | null = SEDE;
  espacios = new Map<string, EspacioRegistrado>();
  ultimoFiltro: FiltroEspacios | null = null;
  seOcupaDuranteLaEscritura = false;
  placas = new Map<string, string>();

  sedeActual(): Promise<SedeActual | null> {
    return Promise.resolve(this.sede);
  }

  idSedeActual(): Promise<string | null> {
    return Promise.resolve(this.sede?.id ?? null);
  }

  listar(_sedeId: string, filtro: FiltroEspacios): Promise<EspacioConPlaca[]> {
    this.ultimoFiltro = filtro;
    return Promise.resolve(
      [...this.espacios.values()].map((e) => ({
        ...e,
        placa: this.placas.get(e.id) ?? null,
      })),
    );
  }

  crear(
    _sedeId: string,
    datos: DatosEspacio,
  ): Promise<EspacioRegistrado | null> {
    const repetido = [...this.espacios.values()].some(
      (e) => e.codigo === datos.codigo,
    );
    if (repetido) return Promise.resolve(null);
    const nuevo: EspacioRegistrado = {
      id: `esp-${this.espacios.size + 1}`,
      estado: 'DISPONIBLE',
      ...datos,
    };
    this.espacios.set(nuevo.id, nuevo);
    return Promise.resolve(nuevo);
  }

  buscar(id: string): Promise<EspacioRegistrado | null> {
    return Promise.resolve(this.espacios.get(id) ?? null);
  }

  actualizar(
    id: string,
    cambios: CambiosEspacio,
  ): Promise<EspacioRegistrado | null> {
    const actual = this.espacios.get(id);
    if (!actual || this.seOcupaDuranteLaEscritura) return Promise.resolve(null);
    const actualizado: EspacioRegistrado = {
      ...actual,
      estado: cambios.estado ?? actual.estado,
      tipoCompatible: cambios.tipoCompatible ?? actual.tipoCompatible,
    };
    this.espacios.set(id, actualizado);
    return Promise.resolve(actualizado);
  }
}

describe('ConsultarSedeActualUseCase', () => {
  it('devuelve la sede con su carril de entrada y su carril de salida', async () => {
    const casoDeUso = new ConsultarSedeActualUseCase(
      new RepositorioEnMemoria(),
    );

    const sede = await casoDeUso.ejecutar();

    expect(sede.carriles.map((c) => c.sentido)).toEqual(['ENTRADA', 'SALIDA']);
    expect(sede.resumenEspacios.total).toBe(15);
  });

  it('lanza 404 cuando no hay sede configurada', async () => {
    const repositorio = new RepositorioEnMemoria();
    repositorio.sede = null;

    await expect(
      new ConsultarSedeActualUseCase(repositorio).ejecutar(),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ListarEspaciosUseCase', () => {
  it('normaliza la zona del filtro y pasa tipo y estado', async () => {
    const repositorio = new RepositorioEnMemoria();
    const casoDeUso = new ListarEspaciosUseCase(repositorio);

    await casoDeUso.ejecutar({
      zona: ' m ',
      tipo: 'MOTO',
      estado: 'DISPONIBLE',
    });

    expect(repositorio.ultimoFiltro).toEqual({
      zona: 'M',
      tipo: 'MOTO',
      estado: 'DISPONIBLE',
    });
  });

  it('devuelve la placa del vehículo en los espacios ocupados y null en el resto', async () => {
    const repositorio = new RepositorioEnMemoria();
    repositorio.espacios.set('e1', espacio('e1', 'A-01', 'OCUPADO'));
    repositorio.espacios.set('e2', espacio('e2', 'A-02'));
    repositorio.placas.set('e1', 'ABC123');

    const lista = await new ListarEspaciosUseCase(repositorio).ejecutar({});

    expect(lista.map((e) => [e.codigo, e.placa])).toEqual([
      ['A-01', 'ABC123'],
      ['A-02', null],
    ]);
  });

  it('lanza 404 cuando no hay sede configurada', async () => {
    const repositorio = new RepositorioEnMemoria();
    repositorio.sede = null;

    await expect(
      new ListarEspaciosUseCase(repositorio).ejecutar({}),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('CrearEspacioUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: CrearEspacioUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new CrearEspacioUseCase(repositorio);
  });

  it('arma el código a partir de la zona y el número, y queda disponible', async () => {
    const creado = await casoDeUso.ejecutar({
      zona: 'A',
      numero: 11,
      tipoCompatible: 'CARRO',
    });

    expect(creado.codigo).toBe('A-11');
    expect(creado.zona).toBe('A');
    expect(creado.estado).toBe('DISPONIBLE');
  });

  it('normaliza la zona escrita en minúscula', async () => {
    const creado = await casoDeUso.ejecutar({
      zona: ' m ',
      numero: 6,
      tipoCompatible: 'MOTO',
    });

    expect(creado.codigo).toBe('M-06');
  });

  it('no permite repetir el código dentro de la sede', async () => {
    await casoDeUso.ejecutar({ zona: 'A', numero: 1, tipoCompatible: 'CARRO' });

    await expect(
      casoDeUso.ejecutar({ zona: 'a', numero: 1, tipoCompatible: 'CARRO' }),
    ).rejects.toThrow(ConflictException);
    expect(repositorio.espacios.size).toBe(1);
  });

  it('permite el mismo número en otra zona', async () => {
    await casoDeUso.ejecutar({ zona: 'A', numero: 1, tipoCompatible: 'CARRO' });
    const moto = await casoDeUso.ejecutar({
      zona: 'M',
      numero: 1,
      tipoCompatible: 'MOTO',
    });

    expect(moto.codigo).toBe('M-01');
    expect(repositorio.espacios.size).toBe(2);
  });

  it('rechaza con 400 una zona que no es una letra', async () => {
    await expect(
      casoDeUso.ejecutar({ zona: 'AB', numero: 1, tipoCompatible: 'CARRO' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza 404 cuando no hay sede configurada', async () => {
    repositorio.sede = null;

    await expect(
      casoDeUso.ejecutar({ zona: 'A', numero: 1, tipoCompatible: 'CARRO' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ActualizarEspacioUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: ActualizarEspacioUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    repositorio.espacios.set('e-1', espacio('e-1', 'A-01'));
    repositorio.espacios.set('e-2', espacio('e-2', 'A-02', 'OCUPADO'));
    casoDeUso = new ActualizarEspacioUseCase(repositorio);
  });

  it('puede poner un espacio fuera de servicio', async () => {
    const actualizado = await casoDeUso.ejecutar({
      id: 'e-1',
      estado: 'FUERA_DE_SERVICIO',
    });

    expect(actualizado.estado).toBe('FUERA_DE_SERVICIO');
    expect(actualizado.codigo).toBe('A-01');
  });

  it('puede cambiar el tipo compatible sin tocar el estado', async () => {
    const actualizado = await casoDeUso.ejecutar({
      id: 'e-1',
      tipoCompatible: 'MOTO',
    });

    expect(actualizado.tipoCompatible).toBe('MOTO');
    expect(actualizado.estado).toBe('DISPONIBLE');
  });

  it('rechaza con 400 una petición sin cambios', async () => {
    await expect(casoDeUso.ejecutar({ id: 'e-1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza con 404 un espacio inexistente', async () => {
    await expect(
      casoDeUso.ejecutar({ id: 'no-existe', estado: 'FUERA_DE_SERVICIO' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 409 un espacio ocupado y no lo modifica', async () => {
    await expect(
      casoDeUso.ejecutar({ id: 'e-2', estado: 'FUERA_DE_SERVICIO' }),
    ).rejects.toThrow(ConflictException);
    expect(repositorio.espacios.get('e-2')?.estado).toBe('OCUPADO');
  });

  it('rechaza con 409 cuando un ingreso ocupa el espacio durante la escritura', async () => {
    repositorio.seOcupaDuranteLaEscritura = true;

    await expect(
      casoDeUso.ejecutar({ id: 'e-1', estado: 'FUERA_DE_SERVICIO' }),
    ).rejects.toThrow(ConflictException);
  });
});
