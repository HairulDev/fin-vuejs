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
  email: yup.string().email('Email tidak valid').required('Email wajib diisi'),
  password: yup.string().required('Password wajib diisi').min(6, 'Password minimal 6 karakter')
})

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    username: '',
    email: '',
    password: ''
  }
})

const onSubmit = handleSubmit(async (values) => {
  state.value.error = ''
  state.value.success = ''
  state.value.loading = true

  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/account/register`, {
      username: values.username,
      email: values.email,
      password: values.password
    })

    state.value.success = 'Registrasi berhasil!'
    router.push('/login')
  } catch (err) {
    state.value.error = err.response?.data?.message || 'Terjadi kesalahan'
    console.error(err)
  } finally {
    state.value.loading = false
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-4 text-center text-gray-300">Register</h1>
      
      <form @submit="onSubmit">
        <div class="mb-4">
          <label class="block text-gray-400 text-sm font-bold mb-2">Username</label>
          <Field
            name="username"
            type="text"
            placeholder="Username"
            class="w-full border p-2 rounded bg-gray-700 text-white"
          />
          <ErrorMessage name="username" v-slot="{ message }">
            <p class="text-red-500 text-sm">{{ message }}</p>
          </ErrorMessage>
        </div>

        <div class="mb-4">
          <label class="block text-gray-400 text-sm font-bold mb-2">Email</label>
          <Field
            name="email"
            type="email"
            placeholder="Email"
            class="w-full border p-2 rounded bg-gray-700 text-white"
          />
          <ErrorMessage name="email" v-slot="{ message }">
            <p class="text-red-500 text-sm">{{ message }}</p>
          </ErrorMessage>
        </div>

        <div class="mb-4">
          <label class="block text-gray-400 text-sm font-bold mb-2">Password</label>
          <Field
            name="password"
            type="password"
            placeholder="Password"
            class="w-full border p-2 rounded bg-gray-700 text-white"
          />
          <ErrorMessage name="password" v-slot="{ message }">
            <p class="text-red-500 text-sm">{{ message }}</p>
          </ErrorMessage>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || state.loading"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {{ isSubmitting || state.loading ? 'Loading...' : 'Register' }}
        </button>
      </form>

      <p v-if="state.error" class="text-red-600 mt-2">{{ state.error }}</p>
      <p v-if="state.success" class="text-green-600 mt-2">{{ state.success }}</p>

      <div class="mt-4 text-center text-sm text-gray-400">
        Sudah punya akun?
        <a href="#" @click.prevent="router.push('/login')" class="text-blue-400 hover:underline">Login di sini</a>
      </div>
    </div>
  </div>
</template>
