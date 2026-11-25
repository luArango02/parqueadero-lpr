import { createRouter, createWebHistory } from 'vue-router'
import { esAdministrador, usuarioActual } from './admin/sesion'
import AdminConfiguracion from './views/AdminConfiguracion.vue'
import CarrilEntrada from './views/CarrilEntrada.vue'
import CarrilSalida from './views/CarrilSalida.vue'
import IniciarSesion from './views/IniciarSesion.vue'
import MapaEspacios from './views/MapaEspacios.vue'
import PanelOcupacion from './views/PanelOcupacion.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/carril/entrada' },
    { path: '/carril/entrada', component: CarrilEntrada },
    { path: '/carril/salida', component: CarrilSalida },
    { path: '/mapa', component: MapaEspacios },
    { path: '/panel', component: PanelOcupacion },
    { path: '/login', component: IniciarSesion },
    { path: '/admin', component: AdminConfiguracion, meta: { soloAdministrador: true } },
  ],
})

// Solo oculta la pantalla: la protección real está en el backend (401/403).
router.beforeEach((destino) => {
  if (!destino.meta.soloAdministrador || esAdministrador.value) return true
  return {
    path: '/login',
    query: { volver: destino.fullPath, ...(usuarioActual.value ? { motivo: 'rol' } : {}) },
  }
})
