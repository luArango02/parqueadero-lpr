import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DatosValidacion,
  DeteccionPorValidar,
  DeteccionValidada,
  ValidacionDeteccionRepositorio,
} from './validacion-deteccion.repositorio';
import {
  SolicitudValidacion,
  ValidarDeteccionUseCase,
} from './validar-deteccion.use-case';

const PENDIENTE: DeteccionPorValidar = {
  id: 'det-1',
  placaLeida: 'ABC123',
  placaFinal: null,
  confianza: 0.5,
  estado: 'PENDIENTE_REVISION',
};
const ACEPTADA: DeteccionPorValidar = {
  id: 'det-2',
  placaLeida: 'XYZ45A',
  placaFinal: null,
  confianza: 0.95,
  estado: 'ACEPTADA',
};

// Doble en memoria del repositorio: permite probar las reglas sin base de datos.
class RepositorioEnMemoria implements ValidacionDeteccionRepositorio {
  detecciones = new Map<string, DeteccionPorValidar>(
    [PENDIENTE, ACEPTADA].map((d): [string, DeteccionPorValidar] => [d.id, d]),
  );
  validaciones: DatosValidacion[] = [];
  otraValidacionSeAdelanta = false;

  buscarDeteccion(id: string): Promise<DeteccionPorValidar | null> {
    return Promise.resolve(this.detecciones.get(id) ?? null);
  }

  registrarValidacion(
    datos: DatosValidacion,
  ): Promise<DeteccionValidada | null> {
    if (this.otraValidacionSeAdelanta) return Promise.resolve(null);
    this.validaciones.push(datos);
    return Promise.resolve({
      id: datos.deteccionId,
      placaLeida: datos.anterior.placaLeida,
      placaFinal: datos.placaFinal,
      confianza: datos.anterior.confianza,
      estado: datos.estado,
      lecturaManual: true,
      corregidaPorId: datos.usuarioId,
      motivoCorreccion: datos.motivo,
    });
  }
}

function solicitud(
  cambios: Partial<SolicitudValidacion> = {},
): SolicitudValidacion {
  return {
    deteccionId: 'det-1',
    usuarioId: 'u-operador',
    placa: 'ABC124',
    motivo: 'La cámara confundió el 3 con el 4',
    ...cambios,
  };
}

describe('ValidarDeteccionUseCase', () => {
  let repositorio: RepositorioEnMemoria;
  let casoDeUso: ValidarDeteccionUseCase;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoria();
    casoDeUso = new ValidarDeteccionUseCase(repositorio);
  });

  it('corrige la lectura: queda CORREGIDA, manual, con usuario y motivo', async () => {
    const resultado = await casoDeUso.ejecutar(
      solicitud({ placa: ' abc-124 ' }),
    );

    expect(resultado.placaFinal).toBe('ABC124');
    expect(resultado.estado).toBe('CORREGIDA');
    expect(resultado.lecturaManual).toBe(true);
    expect(resultado.corregidaPorId).toBe('u-operador');
    expect(resultado.motivoCorreccion).toBe(
      'La cámara confundió el 3 con el 4',
    );
  });

  it('conserva la lectura original y envía el valor anterior a la trazabilidad', async () => {
    const resultado = await casoDeUso.ejecutar(solicitud());

    expect(resultado.placaLeida).toBe('ABC123');
    expect(repositorio.validaciones[0].anterior).toEqual(PENDIENTE);
  });

  it('si el operador confirma la misma placa queda ACEPTADA y marcada como manual', async () => {
    const resultado = await casoDeUso.ejecutar(
      solicitud({
        placa: 'abc 123',
        motivo: 'Placa confirmada a simple vista',
      }),
    );

    expect(resultado.estado).toBe('ACEPTADA');
    expect(resultado.lecturaManual).toBe(true);
  });

  it('rechaza con 400 una placa inválida y no registra nada', async () => {
    await expect(
      casoDeUso.ejecutar(solicitud({ placa: 'AB@1' })),
    ).rejects.toThrow(BadRequestException);
    expect(repositorio.validaciones).toHaveLength(0);
  });

  it('rechaza con 404 una detección inexistente', async () => {
    await expect(
      casoDeUso.ejecutar(solicitud({ deteccionId: 'no-existe' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 409 una lectura que no está pendiente de revisión', async () => {
    await expect(
      casoDeUso.ejecutar(solicitud({ deteccionId: 'det-2' })),
    ).rejects.toThrow(ConflictException);
    expect(repositorio.validaciones).toHaveLength(0);
  });

  it('rechaza con 409 cuando otra validación se adelantó', async () => {
    repositorio.otraValidacionSeAdelanta = true;
    await expect(casoDeUso.ejecutar(solicitud())).rejects.toThrow(
      ConflictException,
    );
  });
});
