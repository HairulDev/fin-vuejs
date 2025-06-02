<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleRegister = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;

  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/account/register`, {
      username: username.value,
      email: email.value,
      password: password.value
    });

    success.value = 'Registrasi berhasil!';
    router.push('/login');
  } catch (err) {
    error.value = err.response?.data?.message || 'Terjadi kesalahan';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-4 text-center text-gray-300">Register</h1>

      <div class="mb-4">
        <label class="block text-gray-400 text-sm font-bold mb-2">Username</label>
        <input v-model="username" type="text" placeholder="Username" class="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:border-blue-300" />
      </div>

      <div class="mb-4">
        <label class="block text-gray-400 text-sm font-bold mb-2">Email</label>
        <input v-model="email" type="email" placeholder="Email" class="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:border-blue-300" />
      </div>

      <div class="mb-4">
        <label class="block text-gray-400 text-sm font-bold mb-2">Password</label>
        <input v-model="password" type="password" placeholder="Password" class="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:border-blue-300" />
      </div>

      <button
        @click="handleRegister"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
      >
        {{ loading ? 'Loading...' : 'Register' }}
      </button>

      <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
      <p v-if="success" class="text-green-600 mt-2">{{ success }}</p>

      <div class="mt-4 text-center">
        <p class="text-gray-400 text-sm">
          Sudah punya akun?
          <a @click.prevent="router.push('/login')" href="#" class="text-blue-400 hover:underline">Login di sini</a>
        </p>
      </div>
    </div>
  </div>
</template>
