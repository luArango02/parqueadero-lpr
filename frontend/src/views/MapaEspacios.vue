<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EspacioCelda from '../components/EspacioCelda.vue'
import {
  agruparPorZona,
  aplicarIngreso,
  aplicarSalida,
  ESTADOS_LEYENDA,
  ESTADOS_VISUALES,
  type Espacio,
} from '../mapa/espacios'
import { obtenerEspacios } from '../services/api'
import { useTiempoReal } from '../tiempoReal/useTiempoReal'

const espacios = ref<Espacio[]>([])
const cargando = ref(true)
const error = ref('')
const zonas = computed(() => agruparPorZona(espacios.value))

async function cargar() {
  try {
    espacios.value = await obtenerEspacios()
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el mapa'
  } finally {
    cargando.value = false
  }
}

const { alEvento, alReconectar } = useTiempoReal()

// Si la conexión se cae y vuelve, se piden de nuevo los espacios por si se perdió algún evento.
alReconectar(cargar)
alEvento('acceso:ingreso', (evento) => {
  espacios.value = aplicarIngreso(espacios.value, evento)
})
alEvento('acceso:salida', (evento) => {
  espacios.value = aplicarSalida(espacios.value, evento)
})

onMounted(cargar)
</script>

<template>
  <h1>Mapa de espacios</h1>
  <ul class="leyenda" aria-label="Leyenda">
    <li v-for="estado in ESTADOS_LEYENDA" :key="estado">
      <span class="muestra" :class="ESTADOS_VISUALES[estado].clase"></span>
      {{ ESTADOS_VISUALES[estado].etiqueta }}
    </li>
  </ul>

  <p v-if="cargando">Cargando espacios...</p>
  <p v-else-if="error" class="error">{{ error }}</p>
  <p v-else-if="!zonas.length">No hay espacios configurados.</p>

  <section v-for="zona in zonas" :key="zona.zona" class="zona">
    <h2>
      Zona {{ zona.zona }}
      <small>
        {{ zona.tipos.join(' / ') }} · {{ zona.libres }} libres de {{ zona.espacios.length }}
        <template v-if="zona.fueraDeServicio"> · {{ zona.fueraDeServicio }} fuera de servicio</template>
      </small>
    </h2>
    <div class="rejilla">
      <EspacioCelda v-for="espacio in zona.espacios" :key="espacio.id" :espacio="espacio" />
    </div>
  </section>
</template>

<style scoped>
.leyenda {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0;
  list-style: none;
}
.muestra {
  display: inline-block;
  width: 14px;
  height: 14px;
  vertical-align: middle;
  border: 2px solid;
  border-radius: 3px;
}
.zona small {
  font-weight: normal;
  color: #6c757d;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}
</style>