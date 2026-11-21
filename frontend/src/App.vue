<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <strong>Parqueadero LPR</strong>
    <nav>
      <RouterLink to="/carril/entrada">Entrada</RouterLink>
      <RouterLink to="/carril/salida">Salida</RouterLink>
    </nav>
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
</style>
