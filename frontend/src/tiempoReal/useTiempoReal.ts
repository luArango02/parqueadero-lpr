import { onScopeDispose } from 'vue'
import { alReconectar, conectado, suscribir } from './cliente'
import type { EventosServidor, NombreEvento } from './eventos'

/**
 * Para usar dentro de un componente: las suscripciones se cancelan solas cuando el componente se destruye.
 * Todos los componentes comparten la misma conexión.
 */
export function useTiempoReal() {
  const cancelaciones: (() => void)[] = []
  onScopeDispose(() => cancelaciones.forEach((cancelar) => cancelar()))

  return {
    conectado,
    alEvento<E extends NombreEvento>(evento: E, manejador: (datos: EventosServidor[E]) => void) {
      cancelaciones.push(suscribir(evento, manejador))
    },
    alReconectar(accion: () => void) {
      cancelaciones.push(alReconectar(accion))
    },
  }
}