<script setup lang="ts">
import { computed } from 'vue'
import { ESTADOS_VISUALES, type Espacio } from '../mapa/espacios'

const props = defineProps<{ espacio: Espacio }>()
const visual = computed(() => ESTADOS_VISUALES[props.espacio.estado])
</script>

<template>
  <div class="celda" :class="visual.clase" data-testid="espacio">
    <strong>{{ espacio.codigo }}</strong>
    <span class="tipo">{{ espacio.tipoCompatible }}</span>
    <span class="estado">{{ visual.etiqueta }}</span>
    <span v-if="espacio.placa" class="placa">{{ espacio.placa }}</span>
  </div>
</template>

<style scoped>
.celda {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 92px;
  padding: 8px;
  border: 2px solid;
  border-radius: 6px;
  text-align: center;
}
.tipo {
  font-size: 12px;
}
.estado {
  font-size: 12px;
  font-weight: bold;
}
.placa {
  margin-top: 2px;
  padding: 2px 4px;
  background: #fff;
  border: 1px solid #212529;
  border-radius: 3px;
  color: #212529;
  font-family: monospace;
  font-weight: bold;
}
</style>