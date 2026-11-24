<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import TarjetaCategoria from '../components/TarjetaCategoria.vue'
import { EVENTOS_VISUALES, type Cupo, type EventoReciente } from '../panel/ocupacion'
import { obtenerCupos, obtenerEventosRecientes } from '../services/api'

// Los pagos y las alertas no emiten eventos de socket: este intervalo los recoge.
const INTERVALO_MS = 15000

const cupos = ref<Cupo[]>([])
const eventos = ref<EventoReciente[]>([])
const cargando = ref(true)
const error = ref('')
const actualizadoEn = ref('')

let socket: Socket | null = null
let temporizador: ReturnType<typeof setInterval> | undefined

async function refrescar() {
  try {
    const [nuevosCupos, nuevosEventos] = await Promise.all([
      obtenerCupos(),
      obtenerEventosRecientes(20),
    ])
    cupos.value = nuevosCupos
    eventos.value = nuevosEventos
    actualizadoEn.value = new Date().toLocaleTimeString('es-CO')
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el panel'
  } finally {
    cargando.value = false
  }
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO')
}

onMounted(() => {
  refrescar()
  temporizador = setInterval(refrescar, INTERVALO_MS)
  // Mismo origen: el proxy de Vite reenvía /socket.io al backend.
  socket = io()
  // Se emite en cada intento del carril (autorizado o denegado), ya guardado en la base de datos.
  socket.on('barrera:actualizada', refrescar)
  socket.io.on('reconnect', refrescar)
})

onUnmounted(() => {
  clearInterval(temporizador)
  socket?.disconnect()
})
</script>

<template>
  <h1>Panel de ocupación</h1>
  <p class="actualizado" v-if="actualizadoEn">Actualizado a las {{ actualizadoEn }}</p>

  <p v-if="cargando">Cargando panel...</p>
  <p v-if="error" class="error">{{ error }}</p>

  <div class="categorias">
    <TarjetaCategoria v-for="cupo in cupos" :key="cupo.tipo" :cupo="cupo" />
  </div>

  <h2>Eventos recientes</h2>
  <p v-if="!cargando && !eventos.length">Todavía no hay eventos.</p>
  <table v-else-if="eventos.length">
    <thead>
      <tr>
        <th>Hora</th>
        <th>Evento</th>
        <th>Placa</th>
        <th>Detalle</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="evento in eventos" :key="`${evento.tipo}-${evento.id}`">
        <td>{{ hora(evento.ocurridoEn) }}</td>
        <td>
          <span class="etiqueta" :class="EVENTOS_VISUALES[evento.tipo].clase">
            {{ EVENTOS_VISUALES[evento.tipo].etiqueta }}
          </span>
        </td>
        <td>{{ evento.placa ?? '-' }}</td>
        <td>{{ evento.detalle }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.actualizado {
  font-size: 14px;
  color: #6c757d;
}
.categorias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.etiqueta {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
}
.ok {
  background: #d4edda;
  color: #155724;
}
.denegado {
  background: #f8d7da;
  color: #721c24;
}
.info {
  background: #d1ecf1;
  color: #0c5460;
}
.alerta {
  background: #fff3cd;
  color: #856404;
}
</style>