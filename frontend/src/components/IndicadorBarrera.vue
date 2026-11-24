<script setup lang="ts">
defineProps<{
  estado: 'ABIERTA' | 'CERRADA' | null
  /** Última lectura del carril (placa y motivo), si la hay. */
  detalle?: string
}>()
</script>

<template>
  <div class="estado" :class="estado?.toLowerCase()" data-testid="barrera">
    {{ estado ? `Barrera ${estado.toLowerCase()}` : 'Esperando vehículo' }}
    <small v-if="detalle" class="detalle">{{ detalle }}</small>
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
.detalle {
  display: block;
  margin-top: 4px;
  font-size: 14px;
  font-weight: normal;
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