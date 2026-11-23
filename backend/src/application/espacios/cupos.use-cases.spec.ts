import { NotFoundException } from '@nestjs/common';
import { ConteoPorEstado } from '../../domain/espacios/cupos';
import { ConsultarCuposUseCase } from './consultar-cupos.use-case';
import { ConsultarDisponibilidadUseCase } from './consultar-disponibilidad.use-case';
import { CupoRepositorio } from './cupo.repositorio';

// Doble en memoria: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements CupoRepositorio {
  conteos: ConteoPorEstado[] | null = [
    { zona: 'A', tipo: 'CARRO', estado: 'OCUPADO', cantidad: 10 },
    { zona: 'M', tipo: 'MOTO', estado: 'DISPONIBLE', cantidad: 4 },
    { zona: 'M', tipo: 'MOTO', estado: 'OCUPADO', cantidad: 1 },
  ];

  contarEspacios(): Promise<ConteoPorEstado[] | null> {
    return Promise.resolve(this.conteos);
  }
}

describe('ConsultarCuposUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: ConsultarCuposUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new ConsultarCuposUseCase(repositorio);
  });

  it('calcula los cupos de cada tipo a partir de los espacios', async () => {
    const cupos = await casoDeUso.ejecutar();

    expect(cupos.find((c) => c.tipo === 'CARRO')).toEqual({
      tipo: 'CARRO',
      total: 10,
      disponibles: 0,
      ocupados: 10,
      fueraDeServicio: 0,
      lleno: true,
    });
    expect(cupos.find((c) => c.tipo === 'MOTO')).toEqual({
      tipo: 'MOTO',
      total: 5,
      disponibles: 4,
      ocupados: 1,
      fueraDeServicio: 0,
      lleno: false,
    });
  });

  it('LLENO aparece solo en la categoría agotada', async () => {
    const cupos = await casoDeUso.ejecutar();

    expect(cupos.filter((c) => c.lleno).map((c) => c.tipo)).toEqual(['CARRO']);
  });

  it('se actualiza solo cuando cambian los espacios, sin contadores', async () => {
    repositorio.conteos?.push({
      zona: 'A',
      tipo: 'CARRO',
      estado: 'DISPONIBLE',
      cantidad: 1,
    });

    const cupos = await casoDeUso.ejecutar();

    expect(cupos.find((c) => c.tipo === 'CARRO')).toMatchObject({
      disponibles: 1,
      lleno: false,
    });
  });

  it('lanza 404 cuando no hay sede configurada', async () => {
    repositorio.conteos = null;

    await expect(casoDeUso.ejecutar()).rejects.toThrow(NotFoundException);
  });
});

describe('ConsultarDisponibilidadUseCase', () => {
  it('resume cada zona con su tipo', async () => {
    const casoDeUso = new ConsultarDisponibilidadUseCase(
      new RepositorioEnMemoria(),
    );

    const zonas = await casoDeUso.ejecutar();

    expect(zonas).toEqual([
      {
        zona: 'A',
        tipo: 'CARRO',
        total: 10,
        disponibles: 0,
        ocupados: 10,
        fueraDeServicio: 0,
        lleno: true,
      },
      {
        zona: 'M',
        tipo: 'MOTO',
        total: 5,
        disponibles: 4,
        ocupados: 1,
        fueraDeServicio: 0,
        lleno: false,
      },
    ]);
  });

  it('lanza 404 cuando no hay sede configurada', async () => {
    const repositorio = new RepositorioEnMemoria();
    repositorio.conteos = null;

    await expect(
      new ConsultarDisponibilidadUseCase(repositorio).ejecutar(),
    ).rejects.toThrow(NotFoundException);
  });
});
