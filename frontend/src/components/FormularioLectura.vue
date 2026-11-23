<script setup lang="ts">
import { ref } from 'vue'

// Formulario que simula la lectura de la cámara; lo usan el carril de entrada y el de salida.
defineProps<{ textoBoton: string; enviando: boolean }>()
const emit = defineEmits<{ leer: [placa: string, confianza: number] }>()

const placa = ref('')
const confianza = ref(95)

function enviar() {
  if (!placa.value.trim()) return
  emit('leer', placa.value, confianza.value / 100)
  placa.value = ''
}
</script>

<template>
  <form @submit.prevent="enviar">
    <label>
      Placa
      <input v-model="placa" placeholder="ABC123" maxlength="8" />
    </label>
    <label>
      Confianza de la lectura (%)
      <input v-model.number="confianza" type="number" min="0" max="100" />
    </label>
    <button type="submit" :disabled="enviando">{{ textoBoton }}</button>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin: 16px 0;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
