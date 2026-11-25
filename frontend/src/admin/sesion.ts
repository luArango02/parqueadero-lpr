import { computed, ref } from 'vue'

export type Rol = 'ADMINISTRADOR' | 'OPERADOR'

export interface UsuarioSesion {
  id: string
  nombre: string
  email: string
  rol: Rol
}

interface Sesion {
  token: string
  usuario: UsuarioSesion
}

const CLAVE = 'parqueadero-sesion'

// sessionStorage: la sesión se cierra al cerrar la pestaña, como en un puesto compartido.
function leerGuardada(): Sesion | null {
  try {
    const texto = sessionStorage.getItem(CLAVE)
    return texto ? (JSON.parse(texto) as Sesion) : null
  } catch {
    return null
  }
}

const sesion = ref<Sesion | null>(leerGuardada())

export const usuarioActual = computed(() => sesion.value?.usuario ?? null)
export const esAdministrador = computed(() => sesion.value?.usuario.rol === 'ADMINISTRADOR')

export function tokenActual(): string | null {
  return sesion.value?.token ?? null
}

export function guardarSesion(token: string, usuario: UsuarioSesion) {
  sesion.value = { token, usuario }
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion.value))
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar la página.
  }
}

export function cerrarSesion() {
  sesion.value = null
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // Nada que borrar.
  }
}
