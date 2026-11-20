import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { estadoDe } from '../../domain/vehiculos/estado-vehiculo';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import { BuscarVehiculoUseCase } from './buscar-vehiculo.use-case';
import { ListarVehiculosUseCase } from './listar-vehiculos.use-case';
import { RegistrarVehiculoUseCase } from './registrar-vehiculo.use-case';
import {
  FiltroVehiculos,
  PermanenciaActiva,
  VehiculoConsultado,
  VehiculoRepositorio,
} from './vehiculo.repositorio';

function crearVehiculo(
  placa: string,
  tipo: TipoVehiculo,
  permanenciaActiva: PermanenciaActiva | null = null,
): VehiculoConsultado {
  return {
    id: `id-${placa}`,
    placa,
    tipo,
    creadoEn: new Date('2026-11-20T12:00:00Z'),
    estado: estadoDe(permanenciaActiva !== null),
    permanenciaActiva,
  };
}

// Doble en memoria del repositorio: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements VehiculoRepositorio {
  vehiculos = new Map<string, VehiculoConsultado>();
  ultimoFiltro: FiltroVehiculos | null = null;

  buscarPorPlaca(placa: string): Promise<VehiculoConsultado | null> {
    return Promise.resolve(this.vehiculos.get(placa) ?? null);
  }

  listar(filtro: FiltroVehiculos): Promise<VehiculoConsultado[]> {
    this.ultimoFiltro = filtro;
    return Promise.resolve([...this.vehiculos.values()]);
  }

  crear(placa: string, tipo: TipoVehiculo): Promise<VehiculoConsultado | null> {
    if (this.vehiculos.has(placa)) return Promise.resolve(null);
    const vehiculo = crearVehiculo(placa, tipo);
    this.vehiculos.set(placa, vehiculo);
    return Promise.resolve(vehiculo);
  }
}

describe('RegistrarVehiculoUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: RegistrarVehiculoUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new RegistrarVehiculoUseCase(repositorio);
  });

  it('normaliza la placa y deduce el tipo CARRO por el formato', async () => {
    const vehiculo = await casoDeUso.ejecutar({ placa: ' abc-123 ' });
    expect(vehiculo.placa).toBe('ABC123');
    expect(vehiculo.tipo).toBe('CARRO');
    expect(vehiculo.estado).toBe('FUERA');
  });

  it('deduce el tipo MOTO por el formato', async () => {
    const vehiculo = await casoDeUso.ejecutar({ placa: 'xyz45a' });
    expect(vehiculo.tipo).toBe('MOTO');
  });

  it('usa el tipo indicado cuando el formato no se reconoce', async () => {
    const vehiculo = await casoDeUso.ejecutar({
      placa: 'AB1234',
      tipo: 'CARRO',
    });
    expect(vehiculo.tipo).toBe('CARRO');
  });

  it('rechaza una placa con caracteres inválidos', async () => {
    await expect(casoDeUso.ejecutar({ placa: 'AB@123' })).rejects.toThrow(
      BadRequestException,
    );
    expect(repositorio.vehiculos.size).toBe(0);
  });

  it('pide el tipo cuando el formato no se reconoce y no viene', async () => {
    await expect(casoDeUso.ejecutar({ placa: 'AB1234' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza un tipo que contradice el formato de la placa', async () => {
    await expect(
      casoDeUso.ejecutar({ placa: 'ABC123', tipo: 'MOTO' }),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(repositorio.vehiculos.size).toBe(0);
  });

  it('no permite registrar dos veces la misma placa, aunque se escriba distinto', async () => {
    await casoDeUso.ejecutar({ placa: 'ABC123' });
    await expect(casoDeUso.ejecutar({ placa: 'abc 123' })).rejects.toThrow(
      ConflictException,
    );
    expect(repositorio.vehiculos.size).toBe(1);
  });
});

describe('BuscarVehiculoUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: BuscarVehiculoUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new BuscarVehiculoUseCase(repositorio);
  });

  it('devuelve la permanencia activa cuando el vehículo está dentro', async () => {
    const permanencia: PermanenciaActiva = {
      id: 'perm-1',
      espacio: 'A-01',
      ingresoEn: new Date('2026-11-20T15:00:00Z'),
    };
    repositorio.vehiculos.set(
      'ABC123',
      crearVehiculo('ABC123', 'CARRO', permanencia),
    );

    const vehiculo = await casoDeUso.ejecutar('abc-123');

    expect(vehiculo.estado).toBe('DENTRO');
    expect(vehiculo.permanenciaActiva).toEqual(permanencia);
  });

  it('devuelve permanenciaActiva null cuando el vehículo está fuera', async () => {
    repositorio.vehiculos.set('XYZ45A', crearVehiculo('XYZ45A', 'MOTO'));

    const vehiculo = await casoDeUso.ejecutar('XYZ45A');

    expect(vehiculo.estado).toBe('FUERA');
    expect(vehiculo.permanenciaActiva).toBeNull();
  });

  it('lanza 404 cuando la placa no está registrada', async () => {
    await expect(casoDeUso.ejecutar('ZZZ999')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('ListarVehiculosUseCase', () => {
  it('normaliza la placa del filtro y aplica un límite por defecto', async () => {
    const repositorio = new RepositorioEnMemoria();
    const casoDeUso = new ListarVehiculosUseCase(repositorio);

    await casoDeUso.ejecutar({ placa: 'abc 1', estado: 'DENTRO' });

    expect(repositorio.ultimoFiltro).toEqual({
      placa: 'ABC1',
      estado: 'DENTRO',
      limite: 50,
    });
  });
});
