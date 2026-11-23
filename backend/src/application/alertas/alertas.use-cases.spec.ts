import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EstadoAlerta, TipoAlerta } from '../../domain/alertas/alerta';
import { Reloj } from '../../domain/tiempo/reloj';
import {
  AlertaRegistrada,
  AlertaRepositorio,
  DatosResolucion,
  FiltroAlertas,
} from './alerta.repositorio';
import { ListarAlertasUseCase } from './listar-alertas.use-case';
import { ResolverAlertaUseCase } from './resolver-alerta.use-case';

const AHORA = new Date('2026-11-22T15:00:00Z');
const reloj: Reloj = { ahora: () => AHORA };

function alerta(
  id: string,
  tipo: TipoAlerta,
  estado: EstadoAlerta = 'ABIERTA',
): AlertaRegistrada {
  return {
    id,
    tipo,
    estado,
    placa: 'ABC123',
    detalle: 'detalle de prueba',
    creadaEn: new Date('2026-11-22T14:00:00Z'),
    resueltaEn: null,
    resolucion: null,
    resueltaPor: null,
    deteccion: null,
  };
}

// Doble en memoria del repositorio: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements AlertaRepositorio {
  alertas = new Map<string, AlertaRegistrada>(
    [
      alerta('a-discrepancia', 'DISCREPANCIA_TIPO'),
      alerta('a-passback', 'ANTI_PASSBACK'),
      alerta('a-resuelta', 'DISCREPANCIA_TIPO', 'RESUELTA'),
    ].map((a): [string, AlertaRegistrada] => [a.id, a]),
  );
  resoluciones: DatosResolucion[] = [];
  ultimoFiltro: FiltroAlertas | null = null;
  otraResolucionSeAdelanta = false;

  listar(filtro: FiltroAlertas): Promise<AlertaRegistrada[]> {
    this.ultimoFiltro = filtro;
    return Promise.resolve([...this.alertas.values()]);
  }

  buscar(id: string): Promise<AlertaRegistrada | null> {
    return Promise.resolve(this.alertas.get(id) ?? null);
  }

  resolver(datos: DatosResolucion): Promise<AlertaRegistrada | null> {
    if (this.otraResolucionSeAdelanta) return Promise.resolve(null);
    this.resoluciones.push(datos);
    return Promise.resolve({
      ...datos.anterior,
      estado: 'RESUELTA',
      resolucion: datos.resolucion,
      resueltaEn: datos.resueltaEn,
      resueltaPor: { id: datos.usuarioId, nombre: 'Operador' },
    });
  }
}

describe('ResolverAlertaUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: ResolverAlertaUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new ResolverAlertaUseCase(repositorio, reloj);
  });

  it('resuelve una discrepancia: queda RESUELTA con quién la resolvió, cuándo y el motivo', async () => {
    const resuelta = await casoDeUso.ejecutar({
      alertaId: 'a-discrepancia',
      usuarioId: 'u-operador',
      resolucion: '  Es una moto con placa de carro  ',
      tipoConfirmado: 'MOTO',
    });

    expect(resuelta.estado).toBe('RESUELTA');
    expect(resuelta.resueltaPor).toEqual({
      id: 'u-operador',
      nombre: 'Operador',
    });
    expect(resuelta.resolucion).toBe('Es una moto con placa de carro');
    expect(resuelta.resueltaEn).toEqual(AHORA);
  });

  it('envía el tipo confirmado y el estado anterior para registrarlos', async () => {
    await casoDeUso.ejecutar({
      alertaId: 'a-discrepancia',
      usuarioId: 'u-operador',
      resolucion: 'Es una moto con placa de carro',
      tipoConfirmado: 'MOTO',
    });

    expect(repositorio.resoluciones[0].tipoConfirmado).toBe('MOTO');
    expect(repositorio.resoluciones[0].anterior.estado).toBe('ABIERTA');
  });

  it('exige el tipo confirmado en una discrepancia y no resuelve nada', async () => {
    await expect(
      casoDeUso.ejecutar({
        alertaId: 'a-discrepancia',
        usuarioId: 'u-operador',
        resolucion: 'Revisada a simple vista',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repositorio.resoluciones).toHaveLength(0);
  });

  it('rechaza un tipo confirmado en una alerta que no es discrepancia', async () => {
    await expect(
      casoDeUso.ejecutar({
        alertaId: 'a-passback',
        usuarioId: 'u-operador',
        resolucion: 'Revisada a simple vista',
        tipoConfirmado: 'CARRO',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('resuelve una alerta anti-passback sin tipo', async () => {
    const resuelta = await casoDeUso.ejecutar({
      alertaId: 'a-passback',
      usuarioId: 'u-operador',
      resolucion: 'Falla del lector, el vehículo ya salió',
    });

    expect(resuelta.estado).toBe('RESUELTA');
  });

  it('lanza 404 con una alerta inexistente', async () => {
    await expect(
      casoDeUso.ejecutar({
        alertaId: 'no-existe',
        usuarioId: 'u-operador',
        resolucion: 'Revisada a simple vista',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza 409 con una alerta que ya estaba resuelta', async () => {
    await expect(
      casoDeUso.ejecutar({
        alertaId: 'a-resuelta',
        usuarioId: 'u-operador',
        resolucion: 'Revisada a simple vista',
        tipoConfirmado: 'CARRO',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lanza 409 cuando otra resolución se adelantó', async () => {
    repositorio.otraResolucionSeAdelanta = true;

    await expect(
      casoDeUso.ejecutar({
        alertaId: 'a-discrepancia',
        usuarioId: 'u-operador',
        resolucion: 'Revisada a simple vista',
        tipoConfirmado: 'CARRO',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('ListarAlertasUseCase', () => {
  it('normaliza la placa del filtro y aplica un límite por defecto', async () => {
    const repositorio = new RepositorioEnMemoria();

    await new ListarAlertasUseCase(repositorio).ejecutar({
      placa: 'abc 12',
      estado: 'ABIERTA',
    });

    expect(repositorio.ultimoFiltro).toEqual({
      placa: 'ABC12',
      estado: 'ABIERTA',
      limite: 50,
    });
  });
});
