<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { usuarioActual } from '../admin/sesion'

const props = defineProps<{ placa: string; pedirTipo: boolean; enviando: boolean }>()
const emit = defineEmits<{ confirmar: [placa: string, tipo?: 'CARRO' | 'MOTO'] }>()

const route = useRoute()
const placa = ref(props.placa)
const tipo = ref<'CARRO' | 'MOTO'>('CARRO')

function confirmar() {
  if (!placa.value.trim()) return
  emit('confirmar', placa.value, props.pedirTipo ? tipo.value : undefined)
}
</script>

<template>
  <div class="correccion">
    <strong>Validación manual</strong>
    <p v-if="!usuarioActual">
      Para confirmar la placa,
      <RouterLink :to="{ path: '/login', query: { volver: route.fullPath } }">
        inicie sesión como operador</RouterLink
      >.
    </p>
    <form v-else @submit.prevent="confirmar">
      <label>
        Placa correcta
        <input v-model="placa" maxlength="8" />
      </label>
      <label v-if="pedirTipo">
        Tipo
        <select v-model="tipo">
          <option value="CARRO">CARRO</option>
          <option value="MOTO">MOTO</option>
        </select>
      </label>
      <button type="submit" :disabled="enviando">Confirmar lectura manual</button>
    </form>
  </div>
</template>

<style scoped>
.correccion {
  border: 1px solid #ffc107;
  background: #fff8e1;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 12px;
}
form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin-top: 8px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
