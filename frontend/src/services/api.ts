import type { Espacio } from '../mapa/espacios'
import type { Cupo, EventoReciente } from '../panel/ocupacion'
import type { TarifaVigente } from '../admin/tarifas'
import { cerrarSesion, tokenActual, type UsuarioSesion } from '../admin/sesion'

export interface Cobro {
  id: string
  valor: number
  franja: 'DIURNA' | 'NOCTURNA'
  estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO' | 'VENCIDO'
  diaOperativo: string
}

export interface ResultadoIngreso {
  autorizado: boolean
  barrera: 'ABIERTA' | 'CERRADA'
  motivo: string
  placa: string
  tipoVehiculo: 'CARRO' | 'MOTO' | null
  espacio: string | null
  cobro: Cobro | null
  reingreso: boolean
}

async function post<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const respuesta = await fetch(`/api${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const datos = await respuesta.json()
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos.message) ? datos.message.join(', ') : datos.message
    throw new Error(mensaje ?? 'Error de comunicación con el servidor')
  }
  return datos as T
}

export function registrarIngreso(placa: string, confianza: number): Promise<ResultadoIngreso> {
  return post<ResultadoIngreso>('/accesos/ingreso', { placa, confianza })
}

export interface ResultadoSalida {
  autorizado: boolean
  barrera: 'ABIERTA' | 'CERRADA'
  motivo: string
  placa: string
  tipoVehiculo: 'CARRO' | 'MOTO' | null
  espacioLiberado: string | null
  minutosDentro: number | null
  cobrosPendientes: Cobro[]
}

export function registrarSalida(placa: string, confianza: number): Promise<ResultadoSalida> {
  return post<ResultadoSalida>('/accesos/salida', { placa, confianza })
}

async function get<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`/api${ruta}`)
  const datos = await respuesta.json()
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos.message) ? datos.message.join(', ') : datos.message
    throw new Error(mensaje ?? 'Error de comunicación con el servidor')
  }
  return datos as T
}

export function obtenerEspacios(): Promise<Espacio[]> {
  return get<Espacio[]>('/espacios')
}


export function obtenerCupos(): Promise<Cupo[]> {
  return get<Cupo[]>('/cupos')
}

export function obtenerEventosRecientes(limite = 20): Promise<EventoReciente[]> {
  return get<EventoReciente[]>(`/eventos/recientes?limite=${limite}`)
}

// Peticiones de administración: llevan el token y, si el token venció (401), se cierra la sesión.
async function conToken<T>(metodo: 'GET' | 'POST' | 'PATCH', ruta: string, cuerpo?: unknown): Promise<T> {
  const token = tokenActual()
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const datos = await respuesta.json()
  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) cerrarSesion()
    const mensaje = Array.isArray(datos.message) ? datos.message.join(', ') : datos.message
    throw new Error(mensaje ?? 'Error de comunicación con el servidor')
  }
  return datos as T
}

export function iniciarSesion(
  email: string,
  password: string,
): Promise<{ accessToken: string; usuario: UsuarioSesion }> {
  return post('/auth/login', { email, password })
}

export function obtenerSedeActual(): Promise<{ id: string; nombre: string }> {
  return get('/sedes/actual')
}

export function obtenerTarifasVigentes(sedeId: string): Promise<TarifaVigente[]> {
  return get<TarifaVigente[]>(`/tarifas/vigentes?sedeId=${sedeId}`)
}

export function crearVersionTarifas(datos: {
  sedeId: string
  tipoVehiculo: 'CARRO' | 'MOTO'
  valorDiurno: number
  valorNocturno: number
}): Promise<unknown> {
  return conToken('POST', '/tarifas/versiones', datos)
}

export function cambiarEstadoEspacio(
  id: string,
  estado: 'DISPONIBLE' | 'FUERA_DE_SERVICIO',
): Promise<unknown> {
  return conToken('PATCH', `/espacios/${id}`, { estado })
}

export function crearEspacio(datos: {
  zona: string
  numero: number
  tipoCompatible: 'CARRO' | 'MOTO'
}): Promise<unknown> {
  return conToken('POST', '/espacios', datos)
}

