import type { ResultadoIngreso } from './registrar-ingreso.use-case';
import type { ResultadoSalida } from './registrar-salida.use-case';

// Puerto para avisar en tiempo real lo que pasó en un carril.
// Se llama solo cuando el caso de uso ya guardó todo en la base de datos.
export interface NotificadorAccesos {
  ingresoRegistrado(resultado: ResultadoIngreso): Promise<void>;
  salidaRegistrada(resultado: ResultadoSalida): Promise<void>;
}

export const NOTIFICADOR_ACCESOS = Symbol('NOTIFICADOR_ACCESOS');
