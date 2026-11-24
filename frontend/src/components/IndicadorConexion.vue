<script setup lang="ts">
import { useTiempoReal } from '../tiempoReal/useTiempoReal'

const { conectado } = useTiempoReal()
</script>

<template>
  <span class="conexion" :class="conectado ? 'en-vivo' : 'sin-conexion'" role="status">
    <span class="punto"></span>
    {{ conectado ? 'En vivo' : 'Reconectando...' }}
  </span>
</template>

<style scoped>
.conexion {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.punto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.en-vivo .punto {
  background: #28a745;
}
.sin-conexion .punto {
  background: #ffc107;
}
</style>