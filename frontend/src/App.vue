<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { cerrarSesion, usuarioActual } from './admin/sesion'
import IndicadorConexion from './components/IndicadorConexion.vue'

const router = useRouter()

function salir() {
  cerrarSesion()
  router.push('/carril/entrada')
}
</script>

<template>
  <header>
    <strong>Parqueadero LPR</strong>
    <nav>
      <RouterLink to="/carril/entrada">Entrada</RouterLink>
      <RouterLink to="/carril/salida">Salida</RouterLink>
      <RouterLink to="/mapa">Mapa</RouterLink>
      <RouterLink to="/panel">Panel</RouterLink>
      <RouterLink to="/admin">Admin</RouterLink>
    </nav>
    <div class="derecha">
      <span v-if="usuarioActual">
        {{ usuarioActual.nombre }}
        <button class="salir" @click="salir">Salir</button>
      </span>
      <IndicadorConexion />
    </div>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #343a40;
  color: #fff;
}
nav {
  display: flex;
  gap: 16px;
}
nav a {
  color: #fff;
}
nav a.router-link-active {
  font-weight: bold;
}
main {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
.derecha {
  display: flex;
  gap: 16px;
  align-items: center;
}
.salir {
  font-size: 14px;
  padding: 2px 8px;
  margin-left: 6px;
}
</style>
