<script setup lang="ts">
import { computed, ref } from 'vue'
import FormularioLectura from '../components/FormularioLectura.vue'
import IndicadorBarrera from '../components/IndicadorBarrera.vue'
import { registrarIngreso, type ResultadoIngreso } from '../services/api'
import { CARRIL_SIN_LECTURAS, aplicarBarrera, type EstadoCarril } from '../tiempoReal/barrera'
import { useTiempoReal } from '../tiempoReal/useTiempoReal'

const enviando = ref(false)
const error = ref('')
const resultado = ref<ResultadoIngreso | null>(null)
const historial = ref<(ResultadoIngreso & { hora: string })[]>([])
const barrera = ref<EstadoCarril>(CARRIL_SIN_LECTURAS)
const detalleBarrera = computed(() =>
  barrera.value.placa ? `${barrera.value.placa} · ${barrera.value.motivo}` : '',
)

const { alEvento } = useTiempoReal()
alEvento('barrera:actualizada', (evento) => {
  barrera.value = aplicarBarrera(barrera.value, evento, 'ENTRADA')
})

async function registrar(placa: string, confianza: number) {
  enviando.value = true
  error.value = ''
  try {
    const respuesta = await registrarIngreso(placa, confianza)
    resultado.value = respuesta
    barrera.value = {
      estado: respuesta.barrera,
      placa: respuesta.placa,
      motivo: respuesta.motivo,
      ocurridoEn: new Date().toISOString(),
    }
    historial.value.unshift({ ...respuesta, hora: new Date().toLocaleTimeString('es-CO') })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo registrar el ingreso'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <h1>Carril de entrada</h1>

    <IndicadorBarrera :estado="barrera.estado" :detalle="detalleBarrera" />

  <FormularioLectura texto-boton="Registrar ingreso" :enviando="enviando" @leer="registrar" />
  <p v-if="error" class="error">{{ error }}</p>

  <div v-if="resultado" class="resultado">
    <p><strong>Placa:</strong> {{ resultado.placa }}</p>
    <p><strong>Motivo:</strong> {{ resultado.motivo }}</p>
    <p><strong>Tipo:</strong> {{ resultado.tipoVehiculo ?? '-' }}</p>
    <p><strong>Espacio:</strong> {{ resultado.espacio ?? '-' }}</p>
    <p>
      <strong>Cobro:</strong>
      {{
        resultado.cobro
          ? `$${resultado.cobro.valor.toLocaleString('es-CO')} (${resultado.cobro.franja}, ${resultado.cobro.estado})`
          : 'Sin cobro'
      }}
    </p>
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
