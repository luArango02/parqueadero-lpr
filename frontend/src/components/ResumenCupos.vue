<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { obtenerCupos } from '../services/api'
import { useTiempoReal } from '../tiempoReal/useTiempoReal'

interface Linea {
  tipo: 'CARRO' | 'MOTO'
  disponibles: number
  total: number
}

const lineas = ref<Linea[]>([])
const ETIQUETA = { CARRO: 'Carros', MOTO: 'Motos' } as const

async function cargar() {
  try {
    lineas.value = (await obtenerCupos()).map(({ tipo, disponibles, total }) => ({
      tipo,
      disponibles,
      total,
    }))
  } catch {
    // Si falla, la pantalla del carril sigue sirviendo; los cupos se reintentan con el próximo evento.
  }
}

const { alEvento, alReconectar } = useTiempoReal()
alEvento('ocupacion:actualizada', (ocupacion) => {
  lineas.value = (['CARRO', 'MOTO'] as const).map((tipo) => ({
    tipo,
    disponibles: ocupacion.porTipo[tipo].disponibles,
    total: ocupacion.porTipo[tipo].total,
  }))
})
alReconectar(cargar)
onMounted(cargar)
</script>

<template>
  <p v-if="lineas.length" class="cupos">
    <span v-for="linea in lineas" :key="linea.tipo">
      {{ ETIQUETA[linea.tipo] }}: {{ linea.disponibles }} libres de {{ linea.total }}
      <strong v-if="linea.disponibles === 0" class="error">LLENO</strong>
    </span>
  </p>
</template>

<style scoped>
.cupos {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin: 0 0 12px;
  color: #495057;
}
</style>
