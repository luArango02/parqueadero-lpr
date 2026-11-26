<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usuarioActual } from '../admin/sesion'
import CorreccionManual from '../components/CorreccionManual.vue'
import FormularioLectura from '../components/FormularioLectura.vue'
import IndicadorBarrera from '../components/IndicadorBarrera.vue'
import ResumenCupos from '../components/ResumenCupos.vue'
import { referenciaPagoEfectivo, requiereValidacionManual, totalPendiente } from '../carril/lectura'
import {
  registrarPagoEfectivo,
  registrarSalida,
  registrarSalidaManual,
  type ResultadoSalida,
} from '../services/api'
import { CARRIL_SIN_LECTURAS, aplicarBarrera, type EstadoCarril } from '../tiempoReal/barrera'
import { useTiempoReal } from '../tiempoReal/useTiempoReal'

const route = useRoute()
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

function mostrar(respuesta: ResultadoSalida) {
  resultado.value = respuesta
  barrera.value = {
    estado: respuesta.barrera,
    placa: respuesta.placa,
    motivo: respuesta.motivo,
    ocurridoEn: new Date().toISOString(),
  }
  historial.value.unshift({ ...respuesta, hora: new Date().toLocaleTimeString('es-CO') })
}

async function enviar(peticion: () => Promise<ResultadoSalida>, mensajeError: string) {
  enviando.value = true
  error.value = ''
  try {
    mostrar(await peticion())
  } catch (e) {
    error.value = e instanceof Error ? e.message : mensajeError
  } finally {
    enviando.value = false
  }
}

function registrar(placa: string, confianza: number) {
  return enviar(() => registrarSalida(placa, confianza), 'No se pudo registrar la salida')
}

function confirmarManual(placa: string) {
  return enviar(() => registrarSalidaManual(placa), 'No se pudo registrar la salida')
}

// El operador recibe el efectivo, se paga cada cobro pendiente y se vuelve a pedir la salida.
function pagarYSalir() {
  const actual = resultado.value
  if (!actual) return
  return enviar(async () => {
    for (const cobro of actual.cobrosPendientes) {
      await registrarPagoEfectivo(cobro.id, referenciaPagoEfectivo(cobro.id))
    }
    return registrarSalida(actual.placa, 1)
  }, 'No se pudo registrar el pago')
}

function tiempoDentro(minutos: number | null): string {
  if (minutos === null) return '-'
  return `${Math.floor(minutos / 60)} h ${minutos % 60} min`
}
</script>

<template>
  <h1>Carril de salida</h1>
  <ResumenCupos />

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
      <button v-if="usuarioActual" :disabled="enviando" @click="pagarYSalir">
        Registrar pago en efectivo (${{ totalPendiente(resultado.cobrosPendientes).toLocaleString('es-CO') }}) y abrir
      </button>
      <p v-else>
        Para registrar el pago,
        <RouterLink :to="{ path: '/login', query: { volver: route.fullPath } }">
          inicie sesión como operador</RouterLink
        >.
      </p>
    </div>
    <CorreccionManual
      v-if="requiereValidacionManual(resultado.motivo)"
      :key="historial.length"
      :placa="resultado.placa"
      :pedir-tipo="false"
      :enviando="enviando"
      @confirmar="confirmarManual"
    />
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
