<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { guardarSesion } from '../admin/sesion'
import { iniciarSesion } from '../services/api'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const enviando = ref(false)
const error = ref('')

async function entrar() {
  enviando.value = true
  error.value = ''
  try {
    const { accessToken, usuario } = await iniciarSesion(email.value, password.value)
    guardarSesion(accessToken, usuario)
    // Sin destino pedido: el administrador va a Admin y el operador a su carril.
    const destino =
      typeof route.query.volver === 'string' && !(route.query.motivo && usuario.rol !== 'ADMINISTRADOR')
        ? route.query.volver
        : usuario.rol === 'ADMINISTRADOR'
          ? '/admin'
          : '/carril/salida'
    await router.push(destino)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo iniciar sesión'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <h1>Iniciar sesión</h1>
  <p v-if="route.query.motivo === 'rol'" class="error">
    Esa pantalla es solo para administradores. Inicie sesión con una cuenta de administrador.
  </p>

  <form @submit.prevent="entrar">
    <label>
      Correo
      <input v-model="email" type="email" autocomplete="username" required />
    </label>
    <label>
      Contraseña
      <input v-model="password" type="password" autocomplete="current-password" required />
    </label>
    <button type="submit" :disabled="enviando">Entrar</button>
  </form>
  <p v-if="error" class="error">{{ error }}</p>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
