<script setup>
import { ref } from 'vue'
import { useForm, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const state = ref({
  loading: false,
  error: '',
  success: ''
})

const schema = yup.object({
  username: yup.string().required('Username wajib diisi'),
  password: yup.string().required('Password wajib diisi')
})

const { handleSubmit, isSubmitting, errors } = useForm({
  validationSchema: schema,
  initialValues: {
    username: '',
    password: ''
  }
})

const onSubmit = handleSubmit(async (values) => {
  console.log('onSubmit called with values:', values)
  state.value.error = ''
  state.value.success = ''
  state.value.loading = true

  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/account/login`, {
      username: values.username,
      password: values.password
    })

    state.value.success = 'Login berhasil!'
    localStorage.setItem('token', res.data.token)

    const userObj = {
      userName: res.data.userName,
      email: res.data.email
    }
    localStorage.setItem('user', JSON.stringify(userObj))

    router.push('/home')
  } catch (err) {
    state.value.error = err.response?.data?.message || 'Terjadi kesalahan'
  } finally {
    state.value.loading = false
  }
})
</script>

<template>
  <!-- <pre class="text-xs text-yellow-400 mt-2">[debug] Errors: {{ errors }}</pre> -->
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-4 text-center text-gray-300">Login</h1>
      
      <form @submit="onSubmit">
        <div class="mb-4">
          <label class="block text-gray-400 text-sm font-bold mb-2">Username</label>
          <Field
            name="username"
            type="text"
            class="w-full border p-2 rounded bg-gray-700 text-white"
          />
          <ErrorMessage name="username" v-slot="{ message }">
            <p class="text-red-500 text-sm">{{ message }}</p>
          </ErrorMessage>
        </div>

        <div class="mb-4">
          <label class="block text-gray-400 text-sm font-bold mb-2">Password</label>
          <Field
            name="password"
            type="password"
            class="w-full border p-2 rounded bg-gray-700 text-white"
          />
          <ErrorMessage name="password" v-slot="{ message }">
            <p class="text-red-500 text-sm">{{ message }}</p>
          </ErrorMessage>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Loading...' : 'Login' }}
        </button>
      </form>

      <p v-if="state.error" class="text-red-600 mt-2">{{ state.error }}</p>
      <p v-if="state.success" class="text-green-600 mt-2">{{ state.success }}</p>

      <div class="mt-4 text-center text-sm text-gray-400">
        Belum punya akun?
        <a href="#" @click.prevent="router.push('/register')" class="text-blue-400 hover:underline">Daftar di sini</a>
      </div>
    </div>
  </div>
</template>