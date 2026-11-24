export type TipoEventoReciente =
  | 'INGRESO'
  | 'SALIDA'
  | 'INGRESO_DENEGADO'
  | 'SALIDA_DENEGADA'
  | 'PAGO'
  | 'ALERTA';

/** Una línea del historial del panel, venga de accesos, pagos o alertas. */
export interface EventoReciente {
  id: string;
  tipo: TipoEventoReciente;
  placa: string | null;
  detalle: string;
  ocurridoEn: Date;
}

/** Junta varias fuentes en un solo historial: el más reciente primero, con un máximo de `limite`. */
export function unirRecientes(
  fuentes: EventoReciente[][],
  limite: number,
): EventoReciente[] {
  return fuentes
    .flat()
    .sort(
      (a, b) =>
        b.ocurridoEn.getTime() - a.ocurridoEn.getTime() ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limite);
}
