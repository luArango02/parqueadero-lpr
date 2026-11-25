import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { debeReconectarManualmente, type EventosServidor, type NombreEvento } from './eventos'

// UNA sola conexión para toda la aplicación (carriles, mapa y panel la comparten).
// Se crea la primera vez que alguien la usa y se mantiene mientras la página esté abierta.
let socket: Socket | null = null
let yaSeConectoAntes = false
const alReconectarse = new Set<() => void>()

/** true mientras hay conexión con el backend. Es reactivo: la interfaz se actualiza sola. */
export const conectado = ref(false)

function crearSocket(): Socket {
  // Mismo origen: el proxy de Vite reenvía /socket.io al backend.
  const nuevo = io({
    reconnection: true,
    reconnectionDelay: 1000, // primer reintento al segundo...
    reconnectionDelayMax: 5000, // ...y nunca espera más de 5 s entre intentos
  })

  nuevo.on('connect', () => {
    conectado.value = true
    // Al volver la conexión pudo haber eventos perdidos: se avisa para volver a pedir el estado real.
    if (yaSeConectoAntes) alReconectarse.forEach((avisar) => avisar())
    yaSeConectoAntes = true
  })

  nuevo.on('disconnect', (motivo) => {
    conectado.value = false
    if (debeReconectarManualmente(motivo)) nuevo.connect()
  })

  return nuevo
}

function obtenerSocket(): Socket {
  socket ??= crearSocket()
  return socket
}

/** Se suscribe a un evento del backend. Devuelve la función que cancela la suscripción. */
export function suscribir<E extends NombreEvento>(
  evento: E,
  manejador: (datos: EventosServidor[E]) => void,
): () => void {
  const conexion = obtenerSocket()
  const nombre: string = evento
  const escucha = manejador as (...argumentos: unknown[]) => void
  conexion.on(nombre, escucha)
  return () => {
    conexion.off(nombre, escucha)
  }
}

/** Ejecuta `accion` cada vez que la conexión se recupera tras una caída. Devuelve la función que lo cancela. */
export function alReconectar(accion: () => void): () => void {
  obtenerSocket()
  alReconectarse.add(accion)
  return () => {
    alReconectarse.delete(accion)
  }
}