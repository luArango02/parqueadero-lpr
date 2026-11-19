<script setup lang="ts">
defineProps<{ estado: 'ABIERTA' | 'CERRADA' | null }>()
</script>

<template>
  <div class="estado" :class="estado?.toLowerCase()">
    {{ estado ? `Barrera ${estado.toLowerCase()}` : 'Esperando vehículo' }}
  </div>
</template>

<style scoped>
.estado {
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  background: #f2f2f2;
}
.abierta {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}
.cerrada {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}
</style>
