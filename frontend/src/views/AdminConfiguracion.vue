<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Cupo } from '../panel/ocupacion'
import type { Espacio } from '../mapa/espacios'
import { agruparPorTipo, validarTarifas, type ErroresTarifa, type ParTarifas } from '../admin/tarifas'
import {
  cambiarEstadoEspacio,
  crearEspacio,
  crearVersionTarifas,
  obtenerCupos,
  obtenerEspacios,
  obtenerSedeActual,
  obtenerTarifasVigentes,
} from '../services/api'

const sedeId = ref('')
const cargando = ref(true)
const errorGeneral = ref('')

// ---- Tarifas ----
const tarifas = ref<ParTarifas[]>([])
const errores = reactive<Record<string, ErroresTarifa>>({})
const avisoTarifas = ref('')

async function cargarTarifas() {
  tarifas.value = agruparPorTipo(await obtenerTarifasVigentes(sedeId.value))
}

async function guardarTarifa(par: ParTarifas) {
  avisoTarifas.value = ''
  errores[par.tipoVehiculo] = validarTarifas(par)
  if (Object.keys(errores[par.tipoVehiculo]).length) return

  try {
    await crearVersionTarifas({
      sedeId: sedeId.value,
      tipoVehiculo: par.tipoVehiculo,
      valorDiurno: par.diurna,
      valorNocturno: par.nocturna,
    })
    await cargarTarifas()
    avisoTarifas.value = `Tarifas de ${par.tipoVehiculo} guardadas. Solo aplican a cobros nuevos.`
  } catch (e) {
    // El backend también valida; su mensaje se muestra junto al campo de la nocturna.
    errores[par.tipoVehiculo] = { nocturna: e instanceof Error ? e.message : 'No se pudo guardar' }
  }
}

// ---- Cupos y espacios ----
const cupos = ref<Cupo[]>([])
const espacios = ref<Espacio[]>([])
const errorEspacios = ref('')
const nuevo = reactive({ zona: 'A', numero: 11, tipoCompatible: 'CARRO' as 'CARRO' | 'MOTO' })

async function cargarEspacios() {
  ;[cupos.value, espacios.value] = await Promise.all([obtenerCupos(), obtenerEspacios()])
}

async function alternarServicio(espacio: Espacio) {
  errorEspacios.value = ''
  const estado = espacio.estado === 'FUERA_DE_SERVICIO' ? 'DISPONIBLE' : 'FUERA_DE_SERVICIO'
  try {
    await cambiarEstadoEspacio(espacio.id, estado)
    await cargarEspacios()
  } catch (e) {
    errorEspacios.value = e instanceof Error ? e.message : 'No se pudo cambiar el espacio'
  }
}

async function agregarEspacio() {
  errorEspacios.value = ''
  try {
    await crearEspacio({ ...nuevo, zona: nuevo.zona.trim().toUpperCase() })
    await cargarEspacios()
    nuevo.numero += 1
  } catch (e) {
    errorEspacios.value = e instanceof Error ? e.message : 'No se pudo crear el espacio'
  }
}

const textoEstado: Record<Espacio['estado'], string> = {
  DISPONIBLE: 'Disponible',
  OCUPADO: 'Ocupado',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
}

const espaciosOrdenados = computed(() =>
  [...espacios.value].sort((a, b) => a.codigo.localeCompare(b.codigo)),
)

onMounted(async () => {
  try {
    sedeId.value = (await obtenerSedeActual()).id
    await Promise.all([cargarTarifas(), cargarEspacios()])
  } catch (e) {
    errorGeneral.value = e instanceof Error ? e.message : 'No se pudo cargar la configuración'
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <h1>Administración</h1>
  <p v-if="cargando">Cargando...</p>
  <p v-if="errorGeneral" class="error">{{ errorGeneral }}</p>

  <section v-if="!cargando && !errorGeneral">
    <h2>Tarifas vigentes</h2>
    <p class="nota">Cada cambio crea una versión nueva; los cobros ya generados no cambian.</p>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Versión</th>
          <th>Diurna (06:00–17:59)</th>
          <th>Nocturna (18:00–05:59)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="par in tarifas" :key="par.tipoVehiculo">
          <td>{{ par.tipoVehiculo }}</td>
          <td>{{ par.version }}</td>
          <td>
            <input v-model.number="par.diurna" type="number" min="0" step="100" />
            <div v-if="errores[par.tipoVehiculo]?.diurna" class="error">
              {{ errores[par.tipoVehiculo]?.diurna }}
            </div>
          </td>
          <td>
            <input v-model.number="par.nocturna" type="number" min="0" step="100" />
            <div v-if="errores[par.tipoVehiculo]?.nocturna" class="error">
              {{ errores[par.tipoVehiculo]?.nocturna }}
            </div>
          </td>
          <td><button @click="guardarTarifa(par)">Guardar</button></td>
        </tr>
      </tbody>
    </table>
    <p v-if="avisoTarifas" class="ok">{{ avisoTarifas }}</p>

    <h2>Cupos</h2>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Total</th>
          <th>Disponibles</th>
          <th>Ocupados</th>
          <th>Fuera de servicio</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cupo in cupos" :key="cupo.tipo">
          <td>{{ cupo.tipo }} <strong v-if="cupo.lleno" class="error">LLENO</strong></td>
          <td>{{ cupo.total }}</td>
          <td>{{ cupo.disponibles }}</td>
          <td>{{ cupo.ocupados }}</td>
          <td>{{ cupo.fueraDeServicio }}</td>
        </tr>
      </tbody>
    </table>

    <h2>Espacios</h2>
    <p class="nota">
      Un espacio fuera de servicio no se asigna. Un espacio ocupado no se puede cambiar hasta que el
      vehículo salga.
    </p>
    <p v-if="errorEspacios" class="error">{{ errorEspacios }}</p>
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="espacio in espaciosOrdenados" :key="espacio.id">
          <td>{{ espacio.codigo }}</td>
          <td>{{ espacio.tipoCompatible }}</td>
          <td>
            {{ textoEstado[espacio.estado] }}
            <span v-if="espacio.placa">({{ espacio.placa }})</span>
          </td>
          <td>
            <button :disabled="espacio.estado === 'OCUPADO'" @click="alternarServicio(espacio)">
              {{ espacio.estado === 'FUERA_DE_SERVICIO' ? 'Habilitar' : 'Poner fuera de servicio' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <h3>Agregar espacio</h3>
    <form class="en-linea" @submit.prevent="agregarEspacio">
      <label>
        Zona
        <input v-model="nuevo.zona" maxlength="1" size="2" required />
      </label>
      <label>
        Número
        <input v-model.number="nuevo.numero" type="number" min="1" max="99" required />
      </label>
      <label>
        Tipo
        <select v-model="nuevo.tipoCompatible">
          <option value="CARRO">CARRO</option>
          <option value="MOTO">MOTO</option>
        </select>
      </label>
      <button type="submit">Agregar</button>
    </form>
  </section>
</template>

<style scoped>
.nota {
  color: #6c757d;
  margin-top: 0;
}
.ok {
  color: #155724;
}
td input {
  width: 110px;
}
.en-linea {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
.en-linea label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
