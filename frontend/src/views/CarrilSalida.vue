<script setup lang="ts">
import { computed, ref } from 'vue'
import FormularioLectura from '../components/FormularioLectura.vue'
import IndicadorBarrera from '../components/IndicadorBarrera.vue'
import { registrarSalida, type ResultadoSalida } from '../services/api'
import { CARRIL_SIN_LECTURAS, aplicarBarrera, type EstadoCarril } from '../tiempoReal/barrera'
import { useTiempoReal } from '../tiempoReal/useTiempoReal'

const enviando = ref(false)
const error = ref('')
const resultado = ref<ResultadoSalida | null>(null)
const historial = ref<(ResultadoSalida & { hora: string })[]>([])
const barrera = ref<EstadoCarril>(CARRIL_SIN_LECTURAS)
const detalleBarrera = computed(() =>
  barrera.value.placa ? `${barrera.value.placa} · ${barrera.value.motivo}` : '',
)

const { alEvento } = useTiempoReal()
alEvento('barrera:actualizada', (evento) => {
    barrera.value = aplicarBarrera(barrera.value, evento, 'SALIDA')
})

async function registrar(placa: string, confianza: number) {
  enviando.value = true
  error.value = ''
  try {
    const respuesta = await registrarSalida(placa, confianza)
    resultado.value = respuesta
    barrera.value = {
      estado: respuesta.barrera,
      placa: respuesta.placa,
      motivo: respuesta.motivo,
      ocurridoEn: new Date().toISOString(),
    }
    historial.value.unshift({ ...respuesta, hora: new Date().toLocaleTimeString('es-CO') })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo registrar la salida'
  } finally {
    enviando.value = false
  }
}

function tiempoDentro(minutos: number | null): string {
  if (minutos === null) return '-'
  return `${Math.floor(minutos / 60)} h ${minutos % 60} min`
}
</script>

<template>
  <h1>Carril de salida</h1>

  <IndicadorBarrera :estado="barrera.estado" :detalle="detalleBarrera" />

  <FormularioLectura texto-boton="Registrar salida" :enviando="enviando" @leer="registrar" />
  <p v-if="error" class="error">{{ error }}</p>

  <div v-if="resultado" class="resultado">
    <p><strong>Placa:</strong> {{ resultado.placa }}</p>
    <p><strong>Motivo:</strong> {{ resultado.motivo }}</p>
    <p><strong>Tipo:</strong> {{ resultado.tipoVehiculo ?? '-' }}</p>
    <p><strong>Espacio liberado:</strong> {{ resultado.espacioLiberado ?? '-' }}</p>
    <p><strong>Tiempo dentro:</strong> {{ tiempoDentro(resultado.minutosDentro) }}</p>
    <div v-if="resultado.cobrosPendientes.length">
      <strong>Cobros pendientes:</strong>
      <ul>
        <li v-for="cobro in resultado.cobrosPendientes" :key="cobro.id">
          {{ cobro.diaOperativo }}: ${{ cobro.valor.toLocaleString('es-CO') }} ({{ cobro.franja }})
        </li>
      </ul>
    </div>
  </div>

  <h2 v-if="historial.length">Historial</h2>
  <table v-if="historial.length">
    <thead>
      <tr>
        <th>Hora</th>
        <th>Placa</th>
        <th>Barrera</th>
        <th>Motivo</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, i) in historial" :key="i">
        <td>{{ item.hora }}</td>
        <td>{{ item.placa }}</td>
        <td>{{ item.barrera }}</td>
        <td>{{ item.motivo }}</td>
      </tr>
    </tbody>
  </table>
</template>
