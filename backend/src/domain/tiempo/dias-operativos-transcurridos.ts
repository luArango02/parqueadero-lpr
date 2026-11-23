import { calcularDiaOperativo, type ConfigHorario } from './reglas-horario';
/**
 * Devuelve los días operativos nuevos atravesados
 * desde el ingreso hasta el instante de verificación.
 *
 * No incluye el día operativo del ingreso.
 */
export function diasOperativosTranscurridos(
  ingresoEn: Date,
  verificadoEn: Date,
  horario: ConfigHorario,
): string[] {
  if (verificadoEn.getTime() <= ingresoEn.getTime()) {
    return [];
  }

  const primerDia = calcularDiaOperativo(ingresoEn, horario);
  const ultimoDia = calcularDiaOperativo(verificadoEn, horario);

  const dias: string[] = [];
  const cursor = new Date(`${primerDia}T00:00:00Z`);

  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor.toISOString().slice(0, 10) <= ultimoDia) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dias;
}
