<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
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

const espacios = ref<Espacio[]>([])
const cargando = ref(true)
const error = ref('')
const enVivo = ref(false)
const zonas = computed(() => agruparPorZona(espacios.value))

let socket: Socket | null = null

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

onMounted(() => {
  cargar()
  // Mismo origen: el proxy de Vite reenvía /socket.io al backend.
  socket = io()
  socket.on('connect', () => (enVivo.value = true))
  socket.on('disconnect', () => (enVivo.value = false))
  // Si se perdieron eventos mientras no había conexión, se vuelve a pedir el estado real.
  socket.io.on('reconnect', cargar)
  socket.on('acceso:ingreso', (evento) => {
    espacios.value = aplicarIngreso(espacios.value, evento)
  })
  socket.on('acceso:salida', (evento) => {
    espacios.value = aplicarSalida(espacios.value, evento)
  })
})

onUnmounted(() => socket?.disconnect())
</script>

<template>
  <h1>Mapa de espacios</h1>

  <p class="conexion" :class="{ activa: enVivo }">
    {{ enVivo ? 'Actualización en vivo' : 'Sin conexión en vivo' }}
  </p>

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
.conexion {
  font-size: 14px;
  color: #6c757d;
}
.conexion.activa {
  color: #155724;
}
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