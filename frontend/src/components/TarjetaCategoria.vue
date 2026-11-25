<script setup lang="ts">
import { computed } from 'vue'
import { ETIQUETAS_CATEGORIA, porcentajeOcupacion, type Cupo } from '../panel/ocupacion'

const props = defineProps<{ cupo: Cupo }>()
const porcentaje = computed(() => porcentajeOcupacion(props.cupo))
// La disponibilidad que se muestra nunca es negativa.
const libres = computed(() => Math.max(0, props.cupo.disponibles))
</script>

<template>
  <article class="tarjeta" :class="{ llena: cupo.lleno }" data-testid="categoria">
    <header>
      <h2>{{ ETIQUETAS_CATEGORIA[cupo.tipo] }}</h2>
      <span v-if="cupo.lleno" class="lleno">LLENO</span>
    </header>

    <p class="porcentaje">{{ porcentaje }}%</p>
    <div
      class="barra"
      role="progressbar"
      :aria-valuenow="porcentaje"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="relleno" :style="{ width: porcentaje + '%' }"></div>
    </div>
    <p class="nota">Ocupación sobre los espacios en servicio</p>

    <dl>
      <div>
        <dt>Total</dt>
        <dd>{{ cupo.total }}</dd>
      </div>
      <div>
        <dt>Ocupados</dt>
        <dd>{{ cupo.ocupados }}</dd>
      </div>
      <div>
        <dt>Libres</dt>
        <dd>{{ libres }}</dd>
      </div>
    </dl>
    <p v-if="cupo.fueraDeServicio" class="nota">{{ cupo.fueraDeServicio }} fuera de servicio</p>
  </article>
</template>

<style scoped>
.tarjeta {
  padding: 12px 16px;
  border: 2px solid #28a745;
  border-radius: 6px;
  background: #f6fbf7;
}
.tarjeta.llena {
  border-color: #dc3545;
  background: #fdf3f4;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  margin: 0;
}
.lleno {
  padding: 2px 10px;
  border-radius: 4px;
  background: #dc3545;
  color: #fff;
  font-weight: bold;
}
.porcentaje {
  margin: 8px 0 4px;
  font-size: 36px;
  font-weight: bold;
}
.barra {
  height: 12px;
  border-radius: 6px;
  background: #e9ecef;
  overflow: hidden;
}
.relleno {
  height: 100%;
  background: #28a745;
}
.llena .relleno {
  background: #dc3545;
}
.nota {
  margin: 4px 0;
  font-size: 12px;
  color: #6c757d;
}
dl {
  display: flex;
  gap: 24px;
  margin: 8px 0 0;
}
dt {
  font-size: 12px;
  color: #6c757d;
}
dd {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}
</style>