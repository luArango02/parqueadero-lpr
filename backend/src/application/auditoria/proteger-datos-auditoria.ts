type ValorAuditable = string | number | boolean | null;

const CAMPOS_PERMITIDOS: Readonly<Record<string, readonly string[]>> = {
  Usuario: ['id', 'nombre', 'email', 'rol', 'activo', 'creadoEn', 'clave'],
  Alerta: ['estado', 'tipo', 'placa', 'resolucion', 'tipoConfirmado'],
  Pago: ['cobroId', 'medio', 'valor', 'estadoCobro'],
  Cobro: [
    'placa',
    'sedeId',
    'diaOperativo',
    'franja',
    'tarifaId',
    'valor',
    'estado',
  ],
  Deteccion: ['placaLeida', 'placaFinal', 'estado', 'lecturaManual', 'motivo'],
  Tarifa: [
    'id',
    'version',
    'idDiurna',
    'idNocturna',
    'versionDiurna',
    'versionNocturna',
    'sedeId',
    'tipoVehiculo',
    'franja',
    'valor',
    'valorDiurno',
    'valorNocturno',
    'vigenteDesde',
    'vigenteHasta',
    'activo',
  ],
  Espacio: [
    'zona',
    'numero',
    'tipoCompatible',
    'sedeId',
    'codigo',
    'tipo',
    'tipoVehiculo',
    'estado',
    'activo',
  ],
};

export function protegerDatosAuditoria(
  entidad: string,
  datos: unknown,
): Record<string, ValorAuditable> | null {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    return null;
  }

  const campos = CAMPOS_PERMITIDOS[entidad];

  if (
    !Object.prototype.hasOwnProperty.call(CAMPOS_PERMITIDOS, entidad) ||
    !campos
  ) {
    return null;
  }

  const origen = datos as Record<string, unknown>;
  const resultado: Record<string, ValorAuditable> = {};

  for (const campo of campos) {
    if (!Object.prototype.hasOwnProperty.call(origen, campo)) {
      continue;
    }

    const valor = origen[campo];

    if (campo === 'clave') {
      if (valor === 'cambiada') {
        resultado[campo] = valor;
      }
      continue;
    }

    if (
      valor === null ||
      typeof valor === 'string' ||
      typeof valor === 'number' ||
      typeof valor === 'boolean'
    ) {
      resultado[campo] = valor;
    }
  }

  return resultado;
}
