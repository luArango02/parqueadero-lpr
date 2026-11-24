import { createRouter, createWebHistory } from 'vue-router'
import CarrilEntrada from './views/CarrilEntrada.vue'
import CarrilSalida from './views/CarrilSalida.vue'
import MapaEspacios from './views/MapaEspacios.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/carril/entrada' },
    { path: '/carril/entrada', component: CarrilEntrada },
    { path: '/carril/salida', component: CarrilSalida },
    { path: '/mapa', component: MapaEspacios },
  ],
})