export type Franja = 'DIURNA' | 'NOCTURNA';

export interface ConfigHorario {
  zonaHoraria: string;
  inicioDiaOperativo: string;
  inicioFranjaDiurna: string;
  inicioFranjaNocturna: string;
}

interface HoraLocal {
  fecha: string;
  minutos: number;
}

function aMinutos(horaMinuto: string): number {
  const [h, m] = horaMinuto.split(':').map(Number);
  return h * 60 + m;
}

function horaLocal(instante: Date, zonaHoraria: string): HoraLocal {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)!.value;

  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
  };
}

function diaAnterior(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Día operativo (RN-08): antes de la hora de inicio (06:00) todavía cuenta como el día anterior.
 * Devuelve la fecha local en formato AAAA-MM-DD.
 */
export function calcularDiaOperativo(
  instante: Date,
  config: ConfigHorario,
): string {
  const local = horaLocal(instante, config.zonaHoraria);
  return local.minutos < aMinutos(config.inicioDiaOperativo)
    ? diaAnterior(local.fecha)
    : local.fecha;
}

/** Franja tarifaria (RN-05) según la hora local de la sede. */
export function calcularFranja(instante: Date, config: ConfigHorario): Franja {
  const { minutos } = horaLocal(instante, config.zonaHoraria);
  const esDiurna =
    minutos >= aMinutos(config.inicioFranjaDiurna) &&
    minutos < aMinutos(config.inicioFranjaNocturna);
  return esDiurna ? 'DIURNA' : 'NOCTURNA';
}

/**
 * Convierte la fecha y hora local de una sede en un instante UTC.
 *
 * Verifica que la hora local solicitada exista y sea única.
 */
export function instanteDesdeHoraLocal(
  fecha: string,
  hora: string,
  zonaHoraria: string,
): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);

  const objetivo = Date.UTC(anio, mes - 1, dia, horas, minutos);

  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const coincidencias: Date[] = [];

  // Buscar dentro del intervalo de offsets UTC habituales.
  for (let desplazamiento = -14 * 60; desplazamiento <= 14 * 60; desplazamiento += 15) {
    const candidato = new Date(
      objetivo - desplazamiento * 60_000,
    );

    const partes = formato.formatToParts(candidato);
    const valor = (tipo: string) =>
      partes.find((parte) => parte.type === tipo)?.value;

    if (
      Number(valor('year')) === anio &&
      Number(valor('month')) === mes &&
      Number(valor('day')) === dia &&
      Number(valor('hour')) === horas &&
      Number(valor('minute')) === minutos
    ) {
      coincidencias.push(candidato);
    }
  }

  if (coincidencias.length !== 1) {
    throw new Error(
      `La hora ${fecha} ${hora} no es única o no existe en ${zonaHoraria}`,
    );
  }

  return coincidencias[0];
}
