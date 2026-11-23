import { OrigenLectura } from '../../domain/detecciones/deteccion';
import { Reloj } from '../../domain/tiempo/reloj';
import { TipoVehiculo } from '../../domain/vehiculos/placa';
import {
  DatosDeteccion,
  DatosDiscrepancia,
  DeteccionGuardada,
  DeteccionRegistrada,
  DeteccionRepositorio,
  SedeDeLectura,
} from './deteccion.repositorio';
import { LectorPlacas, LecturaPlaca } from './lector-placas';
import { RegistrarDeteccionUseCase } from './registrar-deteccion.use-case';

const AHORA = new Date('2026-11-20T15:00:00Z');
const reloj: Reloj = { ahora: () => AHORA };

// Lector de prueba: devuelve lo que recibe, declarando el origen que se le indique.
function crearLector(origen: OrigenLectura): LectorPlacas {
  return {
    leer: (captura): Promise<LecturaPlaca> =>
      Promise.resolve({
        placa: captura.placa,
        confianza: captura.confianza,
        tipoVisual: captura.tipoVisual ?? null,
        ocurridaEn: captura.ocurridaEn,
        origen,
      }),
  };
}

// Doble en memoria del repositorio: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements DeteccionRepositorio {
  umbral = 0.8;
  guardadas: DeteccionRegistrada[] = [];
  alertas: DatosDiscrepancia[] = [];
  registrados = new Map<string, TipoVehiculo>();

  sedeDeLectura(): Promise<SedeDeLectura> {
    return Promise.resolve({ id: 'sede-1', umbralConfianza: this.umbral });
  }

  carrilDeLectura(_sedeId: string, carrilId?: string): Promise<string> {
    return Promise.resolve(carrilId ?? 'carril-entrada');
  }

  tipoRegistrado(placa: string): Promise<TipoVehiculo | null> {
    return Promise.resolve(this.registrados.get(placa) ?? null);
  }

  guardar(
    datos: DatosDeteccion,
    discrepancia: DatosDiscrepancia | null,
  ): Promise<DeteccionGuardada> {
    const deteccion = { id: `det-${this.guardadas.length + 1}`, ...datos };
    this.guardadas.push(deteccion);
    if (discrepancia) this.alertas.push(discrepancia);
    return Promise.resolve({
      ...deteccion,
      alertaId: discrepancia ? `alerta-${this.alertas.length}` : null,
    });
  }
}

describe('RegistrarDeteccionUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: RegistrarDeteccionUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new RegistrarDeteccionUseCase(
      repositorio,
      crearLector('SIMULADOR'),
      reloj,
    );
  });

  it('acepta una lectura con confianza sobre el umbral', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.95,
    });

    expect(resultado.estado).toBe('ACEPTADA');
    expect(resultado.confianza).toBe(0.95);
    expect(repositorio.guardadas).toHaveLength(1);
  });

  it('deja pendiente de revisión una lectura bajo el umbral y la guarda', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.5,
    });

    expect(resultado.estado).toBe('PENDIENTE_REVISION');
    expect(repositorio.guardadas).toHaveLength(1);
  });

  it('usa el umbral configurado en la sede', async () => {
    repositorio.umbral = 0.95;
    const exigente = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.9,
    });
    expect(exigente.estado).toBe('PENDIENTE_REVISION');

    repositorio.umbral = 0.5;
    const permisivo = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.9,
    });
    expect(permisivo.estado).toBe('ACEPTADA');
  });

  it('informa el umbral que aplicó', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.9,
    });
    expect(resultado.umbralAplicado).toBe(0.8);
  });

  it('guarda el tipo visual, el carril y la hora indicados', async () => {
    const hora = new Date('2026-11-20T03:30:00Z');

    const resultado = await casoDeUso.ejecutar({
      placa: 'XYZ45A',
      confianza: 0.9,
      tipoVisual: 'MOTO',
      carrilId: 'carril-salida',
      ocurridaEn: hora,
    });

    expect(resultado.tipoVisual).toBe('MOTO');
    expect(resultado.carrilId).toBe('carril-salida');
    expect(resultado.ocurridaEn).toEqual(hora);
  });

  it('usa el carril de entrada y la hora del reloj cuando se omiten', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.9,
    });

    expect(resultado.carrilId).toBe('carril-entrada');
    expect(resultado.ocurridaEn).toEqual(AHORA);
    expect(resultado.tipoVisual).toBeNull();
  });

  it('guarda el origen que declara el lector: cambiar de lector no cambia el flujo', async () => {
    const conOcr = new RegistrarDeteccionUseCase(
      repositorio,
      crearLector('OCR'),
      reloj,
    );

    const simulada = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.9,
    });
    const real = await conOcr.ejecutar({ placa: 'ABC123', confianza: 0.9 });

    expect(simulada.origen).toBe('SIMULADOR');
    expect(real.origen).toBe('OCR');
  });

  it('una discrepancia entre la placa y el tipo visual guarda una alerta con la evidencia', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.95,
      tipoVisual: 'MOTO',
    });

    expect(resultado.alertaId).not.toBeNull();
    expect(repositorio.alertas).toHaveLength(1);
    expect(repositorio.alertas[0].placa).toBe('ABC123');
    expect(repositorio.alertas[0].detalle).toContain('CARRO');
    expect(repositorio.alertas[0].detalle).toContain('MOTO');
  });

  it('sin discrepancia no hay alerta, tenga o no tipo visual', async () => {
    const coincide = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.95,
      tipoVisual: 'CARRO',
    });
    const sinVisual = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.95,
    });

    expect(coincide.alertaId).toBeNull();
    expect(sinVisual.alertaId).toBeNull();
    expect(repositorio.alertas).toHaveLength(0);
  });

  it('el tipo registrado del vehículo prevalece sobre el formato de la placa', async () => {
    repositorio.registrados.set('ABC123', 'MOTO');

    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.95,
      tipoVisual: 'MOTO',
    });

    expect(resultado.alertaId).toBeNull();
  });

  it('no compara una lectura dudosa: primero la valida el operador', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'ABC123',
      confianza: 0.5,
      tipoVisual: 'MOTO',
    });

    expect(resultado.estado).toBe('PENDIENTE_REVISION');
    expect(resultado.alertaId).toBeNull();
  });

  it('si la placa no permite deducir el tipo, no hay alerta', async () => {
    const resultado = await casoDeUso.ejecutar({
      placa: 'AB1234',
      confianza: 0.95,
      tipoVisual: 'MOTO',
    });

    expect(resultado.alertaId).toBeNull();
  });
});
