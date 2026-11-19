// Las reglas dependen de la hora; se inyecta un reloj para poder probarlas sin esperar horas reales.
export interface Reloj {
  ahora(): Date;
}

export const RELOJ = Symbol('RELOJ');
