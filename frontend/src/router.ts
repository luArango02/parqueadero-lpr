import { createRouter, createWebHistory } from 'vue-router'
import CarrilEntrada from './views/CarrilEntrada.vue'
import CarrilSalida from './views/CarrilSalida.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/carril/entrada' },
    { path: '/carril/entrada', component: CarrilEntrada },
    { path: '/carril/salida', component: CarrilSalida },
  ],
})
